import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import artisanProfileService from "../services/artisanProfileService";

const EMPTY_FORM = {
  bio: "",
  skills: "",
  experience_years: "",
  hourly_rate: "",
  availability: "Available",
  profile_image: "",
};

function MyArtisanProfile() {
  const { user } = useAuth();

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [profile, setProfile] = useState(null);
  const [profileExists, setProfileExists] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (user?.role !== "artisan") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const result =
          await artisanProfileService.getMyProfile();

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setProfileExists(false);
          setProfile(null);
          setFormData(EMPTY_FORM);
          return;
        }

        const loadedProfile = result.profile;

        setProfileExists(true);
        setProfile(loadedProfile);

        setFormData({
          bio: loadedProfile.bio || "",
          skills: loadedProfile.skills || "",
          experience_years:
            loadedProfile.experience_years ?? "",
          hourly_rate:
            loadedProfile.hourly_rate ?? "",
          availability:
            loadedProfile.availability ||
            "Available",
          profile_image:
            loadedProfile.profile_image || "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.response?.status === 404) {
          setProfileExists(false);
          setProfile(null);
          setFormData(EMPTY_FORM);
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load your artisan profile.",
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
  }, [user?.role]);

  const skillList = useMemo(() => {
    return formData.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [formData.skills]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    if (
      formData.bio.trim().length > 2000
    ) {
      return "Bio cannot exceed 2000 characters.";
    }

    if (
      formData.skills.trim().length > 1000
    ) {
      return "Skills cannot exceed 1000 characters.";
    }

    if (
      formData.profile_image.trim().length > 255
    ) {
      return (
        "Profile image URL cannot exceed " +
        "255 characters."
      );
    }

    if (
      formData.experience_years !== ""
    ) {
      const experienceYears = Number(
        formData.experience_years,
      );

      if (
        !Number.isInteger(experienceYears)
      ) {
        return (
          "Experience years must be a whole number."
        );
      }

      if (
        experienceYears < 0 ||
        experienceYears > 80
      ) {
        return (
          "Experience years must be between 0 and 80."
        );
      }
    }

    if (formData.hourly_rate !== "") {
      const hourlyRate = Number(
        formData.hourly_rate,
      );

      if (
        Number.isNaN(hourlyRate) ||
        hourlyRate < 0
      ) {
        return (
          "Hourly rate must be a valid positive number."
        );
      }

      if (hourlyRate > 100000) {
        return (
          "Hourly rate cannot exceed R100,000."
        );
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        bio: formData.bio.trim(),
        skills: formData.skills.trim(),
        experience_years:
          formData.experience_years === ""
            ? 0
            : Number(
                formData.experience_years,
              ),
        hourly_rate:
          formData.hourly_rate === ""
            ? null
            : Number(
                formData.hourly_rate,
              ),
        availability:
          formData.availability,
        profile_image:
          formData.profile_image.trim(),
      };

      const result =
        await artisanProfileService.saveProfile(
          payload,
        );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to save your profile.",
        );
        return;
      }

      setProfile(result.profile);
      setProfileExists(true);

      setFormData({
        bio: result.profile.bio || "",
        skills:
          result.profile.skills || "",
        experience_years:
          result.profile
            .experience_years ?? "",
        hourly_rate:
          result.profile.hourly_rate ?? "",
        availability:
          result.profile.availability ||
          "Available",
        profile_image:
          result.profile.profile_image ||
          "",
      });

      setSuccessMessage(
        result.message ||
          "Artisan profile saved successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading your artisan profile...
        </p>
      </main>
    );
  }

  if (user?.role !== "artisan") {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.restrictedCard}>
          <h1 style={styles.restrictedHeading}>
            Artisan access only
          </h1>

          <p style={styles.restrictedText}>
            Only artisan accounts can create
            and manage artisan profiles.
          </p>

          <Link
            to="/dashboard"
            style={styles.primaryButton}
          >
            Return to dashboard
          </Link>
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
              Artisan Profile
            </p>

            <h1 style={styles.heading}>
              {profileExists
                ? "Edit your professional profile"
                : "Create your professional profile"}
            </h1>

            <p style={styles.subheading}>
              Showcase your skills, experience,
              availability, pricing, and completed
              work to ServiceFlow customers.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to="/dashboard"
              style={styles.secondaryButton}
            >
              Back to dashboard
            </Link>

            <Link
              to="/my-jobs"
              style={styles.secondaryButton}
            >
              My jobs
            </Link>

            {profileExists && (
              <Link
                to={`/artisans/${user.id}`}
                style={styles.primaryButton}
              >
                View public profile
              </Link>
            )}
          </div>
        </header>

        {successMessage && (
          <section
            role="status"
            style={styles.successCard}
          >
            <p style={styles.successText}>
              {successMessage}
            </p>
          </section>
        )}

        {errorMessage && (
          <section
            role="alert"
            style={styles.errorCard}
          >
            <p style={styles.errorText}>
              {errorMessage}
            </p>
          </section>
        )}

        <section style={styles.contentGrid}>
          <form
            onSubmit={handleSubmit}
            style={styles.formCard}
          >
            <div style={styles.formHeader}>
              <h2 style={styles.sectionHeading}>
                Profile information
              </h2>

              <p style={styles.sectionText}>
                Fields may be updated at any
                time.
              </p>
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="profile-image"
                style={styles.label}
              >
                Profile image URL
              </label>

              <input
                id="profile-image"
                name="profile_image"
                type="url"
                value={
                  formData.profile_image
                }
                onChange={handleChange}
                maxLength={255}
                placeholder="https://example.com/profile.jpg"
                disabled={saving}
                style={styles.input}
              />

              <p style={styles.helpText}>
                Use a direct image URL. Image
                uploads can be added later.
              </p>
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="bio"
                style={styles.label}
              >
                Professional bio
              </label>

              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={6}
                maxLength={2000}
                placeholder="Tell customers about your background, work quality, and services."
                disabled={saving}
                style={styles.textarea}
              />

              <p style={styles.characterCount}>
                {formData.bio.length}/2000
              </p>
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="skills"
                style={styles.label}
              >
                Skills
              </label>

              <textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                placeholder="Plumbing, Electrical, Welding, Carpentry"
                disabled={saving}
                style={styles.textarea}
              />

              <p style={styles.helpText}>
                Separate each skill with a
                comma.
              </p>
            </div>

            <div style={styles.twoColumnGrid}>
              <div style={styles.fieldGroup}>
                <label
                  htmlFor="experience-years"
                  style={styles.label}
                >
                  Years of experience
                </label>

                <input
                  id="experience-years"
                  name="experience_years"
                  type="number"
                  min="0"
                  max="80"
                  step="1"
                  value={
                    formData.experience_years
                  }
                  onChange={handleChange}
                  placeholder="5"
                  disabled={saving}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label
                  htmlFor="hourly-rate"
                  style={styles.label}
                >
                  Hourly rate
                </label>

                <input
                  id="hourly-rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  value={
                    formData.hourly_rate
                  }
                  onChange={handleChange}
                  placeholder="350"
                  disabled={saving}
                  style={styles.input}
                />

                <p style={styles.helpText}>
                  Enter the amount in South
                  African rand.
                </p>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="availability"
                style={styles.label}
              >
                Availability
              </label>

              <select
                id="availability"
                name="availability"
                value={
                  formData.availability
                }
                onChange={handleChange}
                disabled={saving}
                style={styles.input}
              >
                <option value="Available">
                  Available
                </option>

                <option value="Busy">
                  Busy
                </option>

                <option value="Unavailable">
                  Unavailable
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Saving profile..."
                : profileExists
                  ? "Update profile"
                  : "Create profile"}
            </button>
          </form>

          <aside style={styles.previewCard}>
            <p style={styles.previewEyebrow}>
              Live preview
            </p>

            <div style={styles.profileImageWrapper}>
              {formData.profile_image ? (
                <img
                  src={formData.profile_image}
                  alt={`${user?.full_name || "Artisan"} profile`}
                  style={styles.profileImage}
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div style={styles.imagePlaceholder}>
                  {getInitials(
                    user?.full_name,
                  )}
                </div>
              )}
            </div>

            <h2 style={styles.previewName}>
              {user?.full_name ||
                "Artisan name"}
            </h2>

            <p style={styles.previewLocation}>
              {user?.city ||
                "City not provided"}
            </p>

            <span
              style={{
                ...styles.availabilityBadge,
                ...getAvailabilityStyle(
                  formData.availability,
                ),
              }}
            >
              {formData.availability}
            </span>

            <div style={styles.previewStats}>
              <div>
                <span style={styles.statLabel}>
                  Experience
                </span>

                <strong style={styles.statValue}>
                  {formData.experience_years ||
                    0}{" "}
                  years
                </strong>
              </div>

              <div>
                <span style={styles.statLabel}>
                  Hourly rate
                </span>

                <strong style={styles.statValue}>
                  {formData.hourly_rate === ""
                    ? "Not set"
                    : formatCurrency(
                        formData.hourly_rate,
                      )}
                </strong>
              </div>

              <div>
                <span style={styles.statLabel}>
                  Rating
                </span>

                <strong style={styles.statValue}>
                  {profile?.average_rating ??
                    0}{" "}
                  / 5
                </strong>
              </div>

              <div>
                <span style={styles.statLabel}>
                  Completed jobs
                </span>

                <strong style={styles.statValue}>
                  {profile?.completed_jobs ??
                    0}
                </strong>
              </div>
            </div>

            <section style={styles.previewSection}>
              <h3 style={styles.previewHeading}>
                About
              </h3>

              <p style={styles.previewText}>
                {formData.bio.trim() ||
                  "Your professional bio will appear here."}
              </p>
            </section>

            <section style={styles.previewSection}>
              <h3 style={styles.previewHeading}>
                Skills
              </h3>

              {skillList.length > 0 ? (
                <div style={styles.skillsList}>
                  {skillList.map((skill) => (
                    <span
                      key={skill}
                      style={styles.skillBadge}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={styles.previewText}>
                  Your skills will appear
                  here.
                </p>
              )}
            </section>
          </aside>
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
    maxWidth: "1180px",
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
    fontSize: "14px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  heading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "36px",
    lineHeight: "1.2",
  },

  subheading: {
    margin: 0,
    maxWidth: "650px",
    color: "#64748b",
    lineHeight: "1.7",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.35fr) minmax(300px, 0.65fr)",
    gap: "24px",
    alignItems: "start",
  },

  formCard: {
    padding: "26px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.05)",
  },

  formHeader: {
    marginBottom: "24px",
  },

  sectionHeading: {
    margin: "0 0 7px",
    color: "#0f172a",
    fontSize: "23px",
  },

  sectionText: {
    margin: 0,
    color: "#64748b",
  },

  fieldGroup: {
    marginBottom: "20px",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "inherit",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "inherit",
    fontSize: "15px",
    lineHeight: "1.6",
    resize: "vertical",
    outline: "none",
  },

  helpText: {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },

  characterCount: {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    textAlign: "right",
  },

  saveButton: {
    width: "100%",
    padding: "14px 20px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  previewCard: {
    position: "sticky",
    top: "24px",
    padding: "26px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.05)",
  },

  previewEyebrow: {
    margin: "0 0 18px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  profileImageWrapper: {
    display: "grid",
    placeItems: "center",
    marginBottom: "18px",
  },

  profileImage: {
    width: "120px",
    height: "120px",
    borderRadius: "999px",
    objectFit: "cover",
    border: "4px solid #eff6ff",
  },

  imagePlaceholder: {
    display: "grid",
    placeItems: "center",
    width: "120px",
    height: "120px",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "38px",
    fontWeight: "800",
  },

  previewName: {
    margin: "0 0 5px",
    color: "#0f172a",
    fontSize: "25px",
    textAlign: "center",
  },

  previewLocation: {
    margin: "0 0 13px",
    color: "#64748b",
    textAlign: "center",
  },

  availabilityBadge: {
    display: "block",
    width: "fit-content",
    margin: "0 auto 22px",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  previewStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },

  statLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  statValue: {
    color: "#0f172a",
    fontSize: "14px",
  },

  previewSection: {
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
    marginTop: "20px",
  },

  previewHeading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "17px",
  },

  previewText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },

  skillsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  skillBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
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

  successCard: {
    marginBottom: "20px",
    padding: "17px",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    backgroundColor: "#f0fdf4",
  },

  successText: {
    margin: 0,
    color: "#166534",
    fontWeight: "700",
  },

  errorCard: {
    marginBottom: "20px",
    padding: "17px",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    margin: 0,
    color: "#b91c1c",
    fontWeight: "700",
  },

  restrictedCard: {
    width: "100%",
    maxWidth: "500px",
    padding: "36px",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    textAlign: "center",
    boxShadow:
      "0 18px 50px rgba(15, 23, 42, 0.08)",
  },

  restrictedHeading: {
    margin: "0 0 10px",
    color: "#0f172a",
  },

  restrictedText: {
    margin: "0 0 22px",
    color: "#64748b",
    lineHeight: "1.7",
  },
};

export default MyArtisanProfile;