import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";
import customerProfileService from "../services/customerProfileService";


function CustomerProfile() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] =
    useState(null);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

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
          "The customer profile ID is invalid.",
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        setImageFailed(false);

        const result =
          await customerProfileService.getProfile(
            numericUserId,
          );

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load this customer profile.",
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
            "Unable to load this customer profile. Please try again.",
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


  const isOwnProfile =
    user?.role === "customer" &&
    Number(user?.id) ===
      Number(profile?.user_id);


  const backRoute =
    user?.role === "artisan"
      ? "/my-jobs"
      : "/my-requests";


  const backLabel =
    user?.role === "artisan"
      ? "Back to my jobs"
      : "Back to my requests";


  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading customer profile...
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
            Customer profile unavailable
          </h1>

          <p style={styles.errorPageText}>
            {errorMessage ||
              "This customer profile could not be found."}
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
              ServiceFlow Customer
            </p>

            <h1 style={styles.pageHeading}>
              Customer profile
            </h1>

            <p style={styles.pageSubheading}>
              View this customer&apos;s background,
              communication preference, membership
              information, and ServiceFlow activity.
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
                to="/customer-profile"
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
                <div
                  style={styles.avatarPlaceholder}
                >
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
                      "ServiceFlow Customer"}
                  </h2>

                  <p style={styles.location}>
                    {profile.city ||
                      "Location not provided"}
                  </p>
                </div>

                <span style={styles.contactBadge}>
                  Prefers{" "}
                  {profile.preferred_contact_method ||
                    "ServiceFlow Messages"}
                </span>
              </div>


              <p style={styles.memberSince}>
                Member since{" "}
                {formatMemberSince(
                  profile.member_since,
                )}
              </p>


              <p style={styles.bio}>
                {profile.bio ||
                  "This customer has not added a public bio yet."}
              </p>
            </div>
          </div>


          <div style={styles.statsGrid}>
            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Jobs posted
              </span>

              <strong style={styles.statValue}>
                {Number(
                  profile.total_jobs_posted || 0,
                )}
              </strong>
            </article>


            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Open jobs
              </span>

              <strong style={styles.statValue}>
                {Number(
                  profile.open_jobs || 0,
                )}
              </strong>
            </article>


            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Active jobs
              </span>

              <strong style={styles.statValue}>
                {Number(
                  profile.active_jobs || 0,
                )}
              </strong>
            </article>


            <article style={styles.statCard}>
              <span style={styles.statLabel}>
                Confirmed jobs
              </span>

              <strong style={styles.statValue}>
                {Number(
                  profile.confirmed_jobs || 0,
                )}
              </strong>
            </article>
          </div>


          <div style={styles.contentGrid}>
            <section style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                About this customer
              </h3>

              <p style={styles.summaryText}>
                {profile.bio ||
                  "No public customer introduction is available yet."}
              </p>
            </section>


            <section style={styles.sectionCard}>
              <h3 style={styles.sectionHeading}>
                Communication preference
              </h3>

              <div style={styles.contactPreference}>
                <span
                  style={
                    styles.contactPreferenceLabel
                  }
                >
                  Preferred method
                </span>

                <strong
                  style={
                    styles.contactPreferenceValue
                  }
                >
                  {profile.preferred_contact_method ||
                    "ServiceFlow Messages"}
                </strong>
              </div>

              <p style={styles.contactNotice}>
                Private phone and email details are
                not displayed on public customer
                profiles. Communication should take
                place through authorised ServiceFlow
                features.
              </p>
            </section>
          </div>


          <section style={styles.activitySection}>
            <div>
              <p style={styles.activityEyebrow}>
                Service history
              </p>

              <h3 style={styles.activityHeading}>
                Customer activity overview
              </h3>

              <p style={styles.activityText}>
                These figures are calculated from
                service requests created through
                ServiceFlow.
              </p>
            </div>


            <div style={styles.activityGrid}>
              <div style={styles.activityItem}>
                <strong style={styles.activityValue}>
                  {Number(
                    profile.total_jobs_posted || 0,
                  )}
                </strong>

                <span style={styles.activityLabel}>
                  Total requests
                </span>
              </div>


              <div style={styles.activityItem}>
                <strong style={styles.activityValue}>
                  {Number(
                    profile.active_jobs || 0,
                  )}
                </strong>

                <span style={styles.activityLabel}>
                  Active services
                </span>
              </div>


              <div style={styles.activityItem}>
                <strong style={styles.activityValue}>
                  {Number(
                    profile.confirmed_jobs || 0,
                  )}
                </strong>

                <span style={styles.activityLabel}>
                  Confirmed services
                </span>
              </div>
            </div>
          </section>


          <section style={styles.privacySection}>
            <div style={styles.privacyIcon}>
              ✓
            </div>

            <div>
              <h3 style={styles.privacyHeading}>
                Public profile privacy
              </h3>

              <p style={styles.privacyText}>
                This page displays only public-safe
                customer information. Email addresses,
                telephone numbers, passwords, and other
                private account information are not
                exposed.
              </p>
            </div>
          </section>


          {isOwnProfile && (
            <section style={styles.ownerSection}>
              <div>
                <h3 style={styles.ownerHeading}>
                  This is your public profile
                </h3>

                <p style={styles.ownerText}>
                  Artisans assigned to your service
                  requests may use this page to learn
                  more about you.
                </p>
              </div>

              <Link
                to="/customer-profile"
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
    return "C";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) =>
      name.charAt(0),
    )
    .join("")
    .toUpperCase();
}


function formatMemberSince(value) {
  if (!value) {
    return "date unavailable";
  }

  const parsedDate = new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "date unavailable";
  }

  return parsedDate.toLocaleDateString(
    "en-ZA",
    {
      month: "long",
      year: "numeric",
    },
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

  contactBadge: {
    display: "inline-block",
    padding: "8px 13px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "800",
  },

  memberSince: {
    margin: "0 0 16px",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
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

  summaryText: {
    margin: 0,
    color: "#475569",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },

  contactPreference: {
    marginBottom: "14px",
    padding: "14px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
  },

  contactPreferenceLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  contactPreferenceValue: {
    color: "#0f172a",
    fontSize: "16px",
  },

  contactNotice: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.7",
  },

  activitySection: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) minmax(300px, 0.8fr)",
    gap: "26px",
    padding: "30px 32px",
    borderBottom: "1px solid #e2e8f0",
  },

  activityEyebrow: {
    margin: "0 0 7px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  activityHeading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "22px",
  },

  activityText: {
    margin: 0,
    color: "#64748b",
    lineHeight: "1.7",
  },

  activityGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },

  activityItem: {
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "13px",
    backgroundColor: "#f8fafc",
    textAlign: "center",
  },

  activityValue: {
    display: "block",
    marginBottom: "5px",
    color: "#0f172a",
    fontSize: "23px",
  },

  activityLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
  },

  privacySection: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "26px 32px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f0fdf4",
  },

  privacyIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "42px",
    height: "42px",
    borderRadius: "999px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: "20px",
    fontWeight: "900",
  },

  privacyHeading: {
    margin: "0 0 6px",
    color: "#166534",
    fontSize: "18px",
  },

  privacyText: {
    margin: 0,
    color: "#15803d",
    lineHeight: "1.7",
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

export default CustomerProfile;