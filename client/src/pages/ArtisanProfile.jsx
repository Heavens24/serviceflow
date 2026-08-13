


import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";
import artisanProfileService from "../services/artisanProfileService";

function ArtisanProfile() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [imageFailed, setImageFailed] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const numericUserId = Number(userId);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (
        !Number.isInteger(numericUserId) ||
        numericUserId <= 0
      ) {
        setErrorMessage(
          "The artisan profile ID is invalid.",
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        setImageFailed(false);

        const result =
          await artisanProfileService.getProfile(
            numericUserId,
          );

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load this artisan profile.",
          );
          return;
        }

        setProfile(result.profile || null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load this artisan profile. Please try again.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [numericUserId]);

  const skills = profile?.skills
    ? profile.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  const isOwnProfile =
    user?.role === "artisan" &&
    Number(user?.id) ===
      Number(profile?.user_id);

  const backRoute =
    user?.role === "artisan"
      ? "/dashboard"
      : "/my-requests";

  const backLabel =
    user?.role === "artisan"
      ? "Back to dashboard"
      : "Back to my requests";

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading artisan profile...
        </p>
      </main>
    );
  }

  if (errorMessage || !profile) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.errorPageCard}>
          <div style={styles.errorIcon}>
            !
          </div>

          <h1 style={styles.errorHeading}>
            Artisan profile unavailable
          </h1>

          <p style={styles.errorPageText}>
            {errorMessage ||
              "This artisan profile could not be found."}
          </p>

          <div style={styles.errorActions}>
            <Link
              to={backRoute}
              style={styles.primaryButton}
            >
              {backLabel}
            </Link>

            <Link
              to="/dashboard"
              style={styles.secondaryButton}
            >
              Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              ServiceFlow Artisan
            </p>

            <h1 style={styles.pageHeading}>
              Professional profile
            </h1>

            <p style={styles.pageSubheading}>
              View this artisan&apos;s experience,
              skills, availability, pricing, and
              service history.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to={backRoute}
              style={styles.secondaryButton}
            >
              {backLabel}
            </Link>

            <Link
              to="/dashboard"
              style={styles.secondaryButton}
            >
              Dashboard
            </Link>

            {isOwnProfile && (
              <Link
                to="/artisan-profile"
                style={styles.primaryButton}
              >
                Edit profile
              </Link>
            )}
          </div>
        </header>

        <section style={styles.profileCard}>
          <div style={styles.profileTopSection}>
            <div style={styles.avatarSection}>
              {profile.profile_image &&
              !imageFailed ? (
                <img
                  src={profile.profile_image}
                  alt={`${profile.full_name} profile`}
                  style={styles.profileImage}
                  onError={() =>
                    setImageFailed(true)
                  }
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {getInitials(
                    profile.full_name,
                  )}
                </div>
              )}
            </div>

            <div style={styles.identitySection}>
              <div style={styles.nameRow}>
                <div>
                  <h2 style={styles.name}>
                    {profile.full_name ||
                      "ServiceFlow Artisan"}
                  </h2>

                  <p style={styles.location}>
                    {profile.city ||
                      "Location not provided"}
                  </p>
                </div>

                <span
                  style={{
                    ...styles.availabilityBadge,
                    ...getAvailabilityStyle(
                      profile.availability,
                    ),
                  }}
                >
                  {profile.availability ||
                    "Availability unknown"}
                </span>
              </div>

              <div style={styles.ratingRow}>
                <span style={styles.stars}>
                  {renderStars(
                    profile.average_rating,
                  )}
                </span>

                <strong style={styles.ratingValue}>
                  {formatRating(
                    profile.average_rating,
                  )}
                </strong>

                <span style={styles.reviewCount}>
                  {formatReviewCount(
                    profile.total_reviews,
                  )}
                </span>
              </div>

              <p style={styles.bio}>
                {profile.bio ||
                  "This artisan has not added a professional bio yet."}
              </p>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Experience
              </span>

              <strong style={styles.statValue}>
                {formatExperience(
                  profile.experience_years,
                )}
              </strong>
            </article>

            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Hourly rate
              </span>

              <strong style={styles.statValue}>
                {profile.hourly_rate === null ||
                profile.hourly_rate ===
                  undefined
                  ? "Not provided"
                  : formatCurrency(
                      profile.hourly_rate,
                    )}
              </strong>
            </article>

            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Completed jobs
              </span>

              <strong style={styles.statValue}>
                {Number(
                  profile.completed_jobs || 0,
                )}
              </strong>
            </article>

            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Total reviews
              </span>

              <strong style={styles.statValue}>
                {Number(
                  profile.total_reviews || 0,
                )}
              </strong>
            </article>
          </div>

          <div style={styles.contentGrid}>
            <section style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                Skills and services
              </h3>

              {skills.length > 0 ? (
                <div style={styles.skillsList}>
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      style={styles.skillBadge}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>
                  No skills have been added to
                  this profile yet.
                </p>
              )}
            </section>

            <section style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                Professional summary
              </h3>

              <p style={styles.summaryText}>
                {profile.bio ||
                  "No professional summary is available yet."}
              </p>
            </section>
          </div>

          <section style={styles.trustSection}>
            <div>
              <p style={styles.trustEyebrow}>
                Service history
              </p>

              <h3 style={styles.trustHeading}>
                Customer trust indicators
              </h3>

              <p style={styles.trustText}>
                Ratings and completed-job figures are
                calculated from confirmed ServiceFlow
                activity.
              </p>
            </div>

            <div style={styles.trustGrid}>
              <div style={styles.trustItem}>
                <strong style={styles.trustValue}>
                  {formatRating(
                    profile.average_rating,
                  )}
                </strong>

                <span style={styles.trustLabel}>
                  Average rating
                </span>
              </div>

              <div style={styles.trustItem}>
                <strong style={styles.trustValue}>
                  {Number(
                    profile.completed_jobs || 0,
                  )}
                </strong>

                <span style={styles.trustLabel}>
                  Confirmed jobs
                </span>
              </div>

              <div style={styles.trustItem}>
                <strong style={styles.trustValue}>
                  {Number(
                    profile.total_reviews || 0,
                  )}
                </strong>

                <span style={styles.trustLabel}>
                  Customer reviews
                </span>
              </div>
            </div>
          </section>

          {isOwnProfile && (
            <section style={styles.ownerSection}>
              <div>
                <h3 style={styles.ownerHeading}>
                  This is your public profile
                </h3>

                <p style={styles.ownerText}>
                  Customers will see this information
                  when viewing your artisan profile.
                </p>
              </div>

              <Link
                to="/artisan-profile"
                style={styles.primaryButton}
              >
                Update profile
              </Link>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

function getInitials(fullName) {
  if (!fullName) {
    return "A";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();
}

function renderStars(rating) {
  const normalizedRating = Math.max(
    0,
    Math.min(
      5,
      Math.round(Number(rating || 0)),
    ),
  );

  return `${"★".repeat(
    normalizedRating,
  )}${"☆".repeat(5 - normalizedRating)}`;
}

function formatRating(rating) {
  const numericRating = Number(rating || 0);

  if (Number.isInteger(numericRating)) {
    return numericRating.toFixed(0);
  }

  return numericRating.toFixed(1);
}

function formatReviewCount(count) {
  const numericCount = Number(count || 0);

  if (numericCount === 1) {
    return "1 review";
  }

  return `${numericCount} reviews`;
}

function formatExperience(years) {
  const numericYears = Number(years || 0);

  if (numericYears === 1) {
    return "1 year";
  }

  return `${numericYears} years`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(value || 0));
}

function getAvailabilityStyle(
  availability,
) {
  const availabilityStyles = {
    Available: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },

    Busy: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },

    Unavailable: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
  };

  return (
    availabilityStyles[availability] || {
      backgroundColor: "#f1f5f9",
      color: "#475569",
    }
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
  },

  centeredPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    color: "#475569",
    fontSize: "16px",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  headerActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  pageHeading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "36px",
    lineHeight: "1.2",
  },

  pageSubheading: {
    margin: 0,
    maxWidth: "650px",
    color: "#64748b",
    lineHeight: "1.7",
  },

  primaryButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    textDecoration: "none",
  },

  secondaryButton: {
    display: "inline-block",
    padding: "12px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    textDecoration: "none",
  },

  profileCard: {
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 18px 50px rgba(15, 23, 42, 0.07)",
  },

  profileTopSection: {
    display: "grid",
    gridTemplateColumns: "180px minmax(0, 1fr)",
    gap: "28px",
    padding: "32px",
    borderBottom: "1px solid #e2e8f0",
  },

  avatarSection: {
    display: "grid",
    placeItems: "start center",
  },

  profileImage: {
    width: "150px",
    height: "150px",
    borderRadius: "999px",
    objectFit: "cover",
    border: "5px solid #eff6ff",
    boxShadow:
      "0 10px 25px rgba(37, 99, 235, 0.12)",
  },

  avatarPlaceholder: {
    display: "grid",
    placeItems: "center",
    width: "150px",
    height: "150px",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "46px",
    fontWeight: "900",
    border: "5px solid #eff6ff",
  },

  identitySection: {
    minWidth: 0,
  },

  nameRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },

  name: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "31px",
    lineHeight: "1.2",
  },

  location: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
  },

  availabilityBadge: {
    display: "inline-block",
    padding: "8px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  stars: {
    color: "#f59e0b",
    fontSize: "23px",
    letterSpacing: "2px",
  },

  ratingValue: {
    color: "#0f172a",
    fontSize: "16px",
  },

  reviewCount: {
    color: "#64748b",
    fontSize: "14px",
  },

  bio: {
    margin: 0,
    maxWidth: "720px",
    color: "#475569",
    fontSize: "16px",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0",
    borderBottom: "1px solid #e2e8f0",
  },

  statCard: {
    padding: "24px",
    borderRight: "1px solid #e2e8f0",
  },

  statLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  statValue: {
    color: "#0f172a",
    fontSize: "22px",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "22px",
    padding: "30px 32px",
    borderBottom: "1px solid #e2e8f0",
  },

  sectionCard: {
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    backgroundColor: "#f8fafc",
  },

  sectionHeading: {
    margin: "0 0 15px",
    color: "#0f172a",
    fontSize: "20px",
  },

  skillsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },

  skillBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "800",
  },

  summaryText: {
    margin: 0,
    color: "#475569",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
    lineHeight: "1.7",
  },

  trustSection: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(300px, 0.8fr)",
    gap: "26px",
    padding: "30px 32px",
    borderBottom: "1px solid #e2e8f0",
  },

  trustEyebrow: {
    margin: "0 0 7px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  trustHeading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "22px",
  },

  trustText: {
    margin: 0,
    color: "#64748b",
    lineHeight: "1.7",
  },

  trustGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  trustItem: {
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    backgroundColor: "#f8fafc",
    textAlign: "center",
  },

  trustValue: {
    display: "block",
    marginBottom: "5px",
    color: "#0f172a",
    fontSize: "23px",
  },

  trustLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
  },

  ownerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "22px",
    padding: "25px 32px",
    backgroundColor: "#eff6ff",
    flexWrap: "wrap",
  },

  ownerHeading: {
    margin: "0 0 6px",
    color: "#1e3a8a",
    fontSize: "19px",
  },

  ownerText: {
    margin: 0,
    color: "#1d4ed8",
  },

  errorPageCard: {
    width: "100%",
    maxWidth: "580px",
    padding: "38px",
    border: "1px solid #fecaca",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    textAlign: "center",
    boxShadow:
      "0 18px 50px rgba(15, 23, 42, 0.08)",
  },

  errorIcon: {
    display: "grid",
    placeItems: "center",
    width: "58px",
    height: "58px",
    margin: "0 auto 18px",
    borderRadius: "999px",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    fontSize: "27px",
    fontWeight: "900",
  },

  errorHeading: {
    margin: "0 0 11px",
    color: "#0f172a",
    fontSize: "28px",
  },

  errorPageText: {
    margin: "0 0 24px",
    color: "#b91c1c",
    lineHeight: "1.7",
  },

  errorActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
};

export default ArtisanProfile;