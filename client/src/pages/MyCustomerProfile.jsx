import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import customerProfileService from "../services/customerProfileService";


const EMPTY_FORM = {
  bio: "",
  preferred_contact_method:
    "ServiceFlow Messages",
  profile_image: "",
};


function MyCustomerProfile() {
  const { user } = useAuth();

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [profile, setProfile] =
    useState(null);

  const [profileExists, setProfileExists] =
    useState(false);

  const [imageFailed, setImageFailed] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");


  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (user?.role !== "customer") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const result =
          await customerProfileService.getMyProfile();

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setProfileExists(false);
          setProfile(null);
          setFormData(EMPTY_FORM);
          return;
        }

        const loadedProfile =
          result.profile;

        setProfileExists(true);
        setProfile(loadedProfile);

        setFormData({
          bio: loadedProfile.bio || "",
          preferred_contact_method:
            loadedProfile
              .preferred_contact_method ||
            "ServiceFlow Messages",
          profile_image:
            loadedProfile.profile_image ||
            "",
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
            "Unable to load your customer profile.",
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


  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (name === "profile_image") {
      setImageFailed(false);
    }

    setErrorMessage("");
    setSuccessMessage("");
  };


  const validateForm = () => {
    if (formData.bio.length > 2000) {
      return (
        "Bio cannot exceed 2000 characters."
      );
    }

    if (
      formData.profile_image.length > 255
    ) {
      return (
        "Profile image URL cannot exceed " +
        "255 characters."
      );
    }

    const allowedContactMethods = [
      "ServiceFlow Messages",
      "Phone",
      "Email",
    ];

    if (
      !allowedContactMethods.includes(
        formData.preferred_contact_method,
      )
    ) {
      return (
        "Please select a valid preferred " +
        "contact method."
      );
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
        preferred_contact_method:
          formData.preferred_contact_method,
        profile_image:
          formData.profile_image.trim(),
      };

      const result =
        await customerProfileService.saveProfile(
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
        preferred_contact_method:
          result.profile
            .preferred_contact_method ||
          "ServiceFlow Messages",
        profile_image:
          result.profile.profile_image ||
          "",
      });

      setSuccessMessage(
        result.message ||
          "Customer profile saved successfully.",
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
          Loading your customer profile...
        </p>
      </main>
    );
  }


  if (user?.role !== "customer") {
    return (
      <main style={styles.centeredPage}>
        <section
          style={styles.restrictedCard}
        >
          <h1
            style={styles.restrictedHeading}
          >
            Customer access only
          </h1>

          <p
            style={styles.restrictedText}
          >
            Only customer accounts can
            create and manage customer
            profiles.
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
              Customer Profile
            </p>

            <h1 style={styles.heading}>
              {profileExists
                ? "Edit your public profile"
                : "Create your public profile"}
            </h1>

            <p style={styles.subheading}>
              Introduce yourself to artisans,
              show your ServiceFlow activity,
              and choose how you prefer to
              communicate.
            </p>
          </div>

          <div
            style={styles.headerActions}
          >
            <Link
              to="/dashboard"
              style={styles.secondaryButton}
            >
              Back to dashboard
            </Link>

            <Link
              to="/my-requests"
              style={styles.secondaryButton}
            >
              My requests
            </Link>

            {profileExists && (
              <Link
                to={`/customer-profiles/${user.id}`}
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
              <h2
                style={styles.sectionHeading}
              >
                Profile information
              </h2>

              <p
                style={styles.sectionText}
              >
                You can update these details
                at any time.
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
                Use a direct image URL or leave
                this blank to display your
                initials.
              </p>
            </div>


            <div style={styles.fieldGroup}>
              <label
                htmlFor="bio"
                style={styles.label}
              >
                About you
              </label>

              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={7}
                maxLength={2000}
                placeholder="Tell artisans a little about yourself and what you value when hiring someone."
                disabled={saving}
                style={styles.textarea}
              />

              <p
                style={styles.characterCount}
              >
                {formData.bio.length}/2000
              </p>
            </div>


            <div style={styles.fieldGroup}>
              <label
                htmlFor="preferred-contact-method"
                style={styles.label}
              >
                Preferred contact method
              </label>

              <select
                id="preferred-contact-method"
                name="preferred_contact_method"
                value={
                  formData
                    .preferred_contact_method
                }
                onChange={handleChange}
                disabled={saving}
                style={styles.input}
              >
                <option
                  value="ServiceFlow Messages"
                >
                  ServiceFlow Messages
                </option>

                <option value="Phone">
                  Phone
                </option>

                <option value="Email">
                  Email
                </option>
              </select>

              <p style={styles.helpText}>
                Your email and phone number are
                not shown on the public profile.
              </p>
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

            <div
              style={
                styles.profileImageWrapper
              }
            >
              {formData.profile_image &&
              !imageFailed ? (
                <img
                  src={
                    formData.profile_image
                  }
                  alt={`${
                    user?.full_name ||
                    "Customer"
                  } profile`}
                  style={styles.profileImage}
                  onError={() =>
                    setImageFailed(true)
                  }
                />
              ) : (
                <div
                  style={
                    styles.imagePlaceholder
                  }
                >
                  {getInitials(
                    user?.full_name,
                  )}
                </div>
              )}
            </div>


            <h2 style={styles.previewName}>
              {user?.full_name ||
                "Customer name"}
            </h2>

            <p
              style={styles.previewLocation}
            >
              {user?.city ||
                "City not provided"}
            </p>


            <span
              style={styles.contactBadge}
            >
              Prefers{" "}
              {
                formData
                  .preferred_contact_method
              }
            </span>


            <div style={styles.previewStats}>
              <div style={styles.statItem}>
                <span
                  style={styles.statLabel}
                >
                  Jobs posted
                </span>

                <strong
                  style={styles.statValue}
                >
                  {profile
                    ?.total_jobs_posted ?? 0}
                </strong>
              </div>

              <div style={styles.statItem}>
                <span
                  style={styles.statLabel}
                >
                  Active jobs
                </span>

                <strong
                  style={styles.statValue}
                >
                  {profile?.active_jobs ?? 0}
                </strong>
              </div>

              <div style={styles.statItem}>
                <span
                  style={styles.statLabel}
                >
                  Confirmed jobs
                </span>

                <strong
                  style={styles.statValue}
                >
                  {profile
                    ?.confirmed_jobs ?? 0}
                </strong>
              </div>

              <div style={styles.statItem}>
                <span
                  style={styles.statLabel}
                >
                  Member since
                </span>

                <strong
                  style={styles.statValue}
                >
                  {formatMemberSince(
                    profile?.member_since ||
                      user?.created_at,
                  )}
                </strong>
              </div>
            </div>


            <section
              style={styles.previewSection}
            >
              <h3
                style={styles.previewHeading}
              >
                About
              </h3>

              <p style={styles.previewText}>
                {formData.bio.trim() ||
                  "Your public customer bio will appear here."}
              </p>
            </section>


            <section
              style={styles.previewNotice}
            >
              <strong
                style={
                  styles.previewNoticeHeading
                }
              >
                Public information
              </strong>

              <p
                style={
                  styles.previewNoticeText
                }
              >
                Artisans can see your name,
                city, bio, preferred contact
                method, membership date, and
                job statistics. Your private
                contact details remain hidden.
              </p>
            </section>
          </aside>
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
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();
}


function formatMemberSince(value) {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(value);

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString(
    "en-ZA",
    {
      month: "short",
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

  contactBadge: {
    display: "block",
    width: "fit-content",
    margin: "0 auto 22px",
    padding: "7px 12px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
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

  statItem: {
    padding: "13px",
    border: "1px solid #e2e8f0",
    borderRadius: "11px",
    backgroundColor: "#f8fafc",
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

  previewNotice: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "#f0fdf4",
  },

  previewNoticeHeading: {
    display: "block",
    marginBottom: "5px",
    color: "#166534",
    fontSize: "13px",
  },

  previewNoticeText: {
    margin: 0,
    color: "#15803d",
    fontSize: "12px",
    lineHeight: "1.6",
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


export default MyCustomerProfile;