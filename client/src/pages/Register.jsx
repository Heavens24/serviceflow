import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

function Register() {
  const navigate = useNavigate();

  const {
    register,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    city: "",
    role: "customer",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const validateForm = () => {
    const fullName = formData.full_name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirm_password;

    if (!fullName) {
      return "Please enter your full name.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    if (!password) {
      return "Please enter a password.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    if (!["customer", "artisan"].includes(formData.role)) {
      return "Please select a valid account type.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);

      await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        role: formData.role,
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to create your account. Please try again.";

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main style={styles.loadingPage}>
        <p>Checking your account...</p>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.headingSection}>
          <Link
            to="/"
            style={styles.brand}
          >
            ServiceFlow
          </Link>

          <h1 style={styles.heading}>
            Create your account
          </h1>

          <p style={styles.subheading}>
            Join ServiceFlow as a customer or artisan and
            manage your services in one place.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={styles.errorMessage}
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={styles.form}
        >
          <div style={styles.field}>
            <label
              htmlFor="full_name"
              style={styles.label}
            >
              Full name
            </label>

            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="John Smith"
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="email"
              style={styles.label}
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="john@example.com"
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="phone"
              style={styles.label}
            >
              Phone number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              placeholder="0712345678"
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="city"
              style={styles.label}
            >
              City
            </label>

            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              autoComplete="address-level2"
              placeholder="Bloemfontein"
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="role"
              style={styles.label}
            >
              Account type
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={submitting}
              style={styles.input}
            >
              <option value="customer">
                Customer
              </option>

              <option value="artisan">
                Artisan
              </option>
            </select>
          </div>

          <div style={styles.field}>
            <label
              htmlFor="password"
              style={styles.label}
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={submitting}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="confirm_password"
              style={styles.label}
            >
              Confirm password
            </label>

            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Enter the password again"
              disabled={submitting}
              style={styles.input}
            />
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
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={styles.loginLink}
          >
            Log in
          </Link>
        </p>

        <Link
          to="/"
          style={styles.homeLink}
        >
          Return to home
        </Link>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px 20px",
    background:
      "linear-gradient(135deg, #f4f7fb 0%, #eef2f7 100%)",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: "540px",
    padding: "40px",
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 20px 60px rgba(15, 23, 42, 0.12)",
  },

  headingSection: {
    marginBottom: "28px",
  },

  brand: {
    display: "inline-block",
    marginBottom: "24px",
    color: "#2563eb",
    fontSize: "20px",
    fontWeight: "800",
    textDecoration: "none",
  },

  heading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "32px",
    lineHeight: "1.2",
  },

  subheading: {
    margin: 0,
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.6",
  },

  errorMessage: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
  },

  form: {
    display: "grid",
    gap: "20px",
  },

  field: {
    display: "grid",
    gap: "8px",
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

  loginText: {
    margin: "24px 0 12px",
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
  },

  loginLink: {
    color: "#2563eb",
    fontWeight: "700",
    textDecoration: "none",
  },

  homeLink: {
    display: "block",
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    textDecoration: "none",
  },
};

export default Register;