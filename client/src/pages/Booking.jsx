import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";
import serviceRequestService from "../services/serviceRequestService";

function Booking() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: user?.city || "",
    budget: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Please enter a request title.";
    }

    if (!formData.description.trim()) {
      return "Please describe the service you need.";
    }

    if (!formData.category.trim()) {
      return "Please select a category.";
    }

    if (!formData.location.trim()) {
      return "Please enter the service location.";
    }

    if (!formData.budget) {
      return "Please enter your budget.";
    }

    const numericBudget = Number(formData.budget);

    if (
      Number.isNaN(numericBudget) ||
      numericBudget <= 0
    ) {
      return "Budget must be greater than zero.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const result =
        await serviceRequestService.createServiceRequest({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          location: formData.location.trim(),
          budget: Number(formData.budget),
        });

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to create your service request.",
        );
        return;
      }

      setSuccessMessage(
        result.message ||
          "Service request created successfully.",
      );

      setFormData({
        title: "",
        description: "",
        category: "",
        location: user?.city || "",
        budget: "",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to create your service request. Please try again.";

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              Service Request
            </p>

            <h1 style={styles.heading}>
              Book a service
            </h1>

            <p style={styles.subheading}>
              Tell us what you need, where you need it,
              and your preferred budget.
            </p>
          </div>

          <Link
            to="/dashboard"
            style={styles.backLink}
          >
            Back to dashboard
          </Link>
        </header>

        <section style={styles.card}>
          {errorMessage && (
            <div
              role="alert"
              style={styles.errorMessage}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              style={styles.successMessage}
            >
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            <div style={styles.field}>
              <label
                htmlFor="title"
                style={styles.label}
              >
                Request title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Repair leaking kitchen tap"
                disabled={submitting}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label
                htmlFor="category"
                style={styles.label}
              >
                Category
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={submitting}
                style={styles.input}
              >
                <option value="">
                  Select a category
                </option>
                <option value="Plumbing">
                  Plumbing
                </option>
                <option value="Electrical">
                  Electrical
                </option>
                <option value="Mechanical">
                  Mechanical
                </option>
                <option value="Welding">
                  Welding
                </option>
                <option value="Carpentry">
                  Carpentry
                </option>
                <option value="Painting">
                  Painting
                </option>
                <option value="Cleaning">
                  Cleaning
                </option>
                <option value="Appliance Repair">
                  Appliance Repair
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div style={styles.field}>
              <label
                htmlFor="description"
                style={styles.label}
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the problem, preferred timing, and any important details."
                rows={6}
                disabled={submitting}
                style={styles.textarea}
              />
            </div>

            <div style={styles.twoColumnGrid}>
              <div style={styles.field}>
                <label
                  htmlFor="location"
                  style={styles.label}
                >
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Bloemfontein"
                  disabled={submitting}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label
                  htmlFor="budget"
                  style={styles.label}
                >
                  Budget in ZAR
                </label>

                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="500"
                  disabled={submitting}
                  style={styles.input}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.button,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {submitting
                ? "Creating request..."
                : "Create service request"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#f8fafc",
  },

  container: {
    width: "100%",
    maxWidth: "860px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  heading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "36px",
  },

  subheading: {
    margin: 0,
    maxWidth: "600px",
    color: "#64748b",
    lineHeight: "1.7",
  },

  backLink: {
    padding: "11px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  card: {
    padding: "32px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 18px 50px rgba(15, 23, 42, 0.08)",
  },

  form: {
    display: "grid",
    gap: "22px",
  },

  field: {
    display: "grid",
    gap: "8px",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  label: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
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

  button: {
    width: "100%",
    padding: "14px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  errorMessage: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
  },

  successMessage: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
  },
};

export default Booking;