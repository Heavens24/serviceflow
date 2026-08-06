import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    login,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const requestedPath =
    location.state?.from?.pathname || "";

  const accountUnavailable =
    Boolean(
      location.state?.accountUnavailable,
    );

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const email =
      formData.email.trim().toLowerCase();

    const password =
      formData.password;

    if (!email) {
      setErrorMessage(
        "Please enter your email address.",
      );

      return;
    }

    if (!password) {
      setErrorMessage(
        "Please enter your password.",
      );

      return;
    }

    try {
      setSubmitting(true);

      const result = await login({
        email,
        password,
      });

      const authenticatedUser =
        result?.user ||
        result?.data?.user ||
        getStoredUser();

      const destination =
        getDestinationPath(
          authenticatedUser,
          requestedPath,
        );

      navigate(
        destination,
        {
          replace: true,
        },
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        (
          "Unable to log in. Please check " +
          "your details and try again."
        );

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main style={styles.loadingPage}>
        <section style={styles.loadingCard}>
          <div
            aria-hidden="true"
            style={styles.spinner}
          />

          <p style={styles.loadingText}>
            Checking your account...
          </p>
        </section>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getDestinationPath(
          user,
          requestedPath,
        )}
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
            <span style={styles.brandMark}>
              SF
            </span>

            <span>
              ServiceFlow
            </span>
          </Link>

          <h1 style={styles.heading}>
            Welcome back
          </h1>

          <p style={styles.subheading}>
            Log in to manage your service
            requests, jobs, messages,
            notifications, and account.
          </p>
        </div>

        {accountUnavailable &&
          !errorMessage && (
            <div
              role="alert"
              style={styles.warningMessage}
            >
              This account is not currently
              active. Please contact ServiceFlow
              support for assistance.
            </div>
          )}

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
          noValidate
        >
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
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <div style={styles.passwordHeader}>
              <label
                htmlFor="password"
                style={styles.label}
              >
                Password
              </label>

              <span style={styles.comingSoon}>
                Password reset coming soon
              </span>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={submitting}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              opacity:
                submitting ? 0.7 : 1,
              cursor:
                submitting
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting
              ? "Logging in..."
              : "Log in"}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />

          <span style={styles.dividerText}>
            New to ServiceFlow?
          </span>

          <span style={styles.dividerLine} />
        </div>

        <Link
          to="/register"
          style={styles.registerButton}
        >
          Create an account
        </Link>

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

function getDestinationPath(
  authenticatedUser,
  requestedPath,
) {
  const role =
    authenticatedUser?.role;

  if (role === "admin") {
    if (
      requestedPath &&
      requestedPath.startsWith("/admin")
    ) {
      return requestedPath;
    }

    return "/admin";
  }

  if (
    requestedPath &&
    !requestedPath.startsWith("/admin")
  ) {
    return requestedPath;
  }

  return "/dashboard";
}

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem(
        "serviceflow_user",
      );

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    return null;
  }
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
    padding: "24px",
    backgroundColor:
      "var(--sf-background, #f6f8fc)",
  },

  loadingCard: {
    display: "grid",
    justifyItems: "center",
    gap: "16px",
    padding: "30px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.08)",
  },

  spinner: {
    width: "38px",
    height: "38px",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "999px",
    animation:
      "serviceflow-login-spin 0.8s linear infinite",
  },

  loadingText: {
    margin: 0,
    color: "#64748b",
    fontWeight: "700",
  },

  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "40px",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 20px 60px rgba(15, 23, 42, 0.12)",
  },

  headingSection: {
    marginBottom: "28px",
  },

  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
    color: "#2563eb",
    fontSize: "20px",
    fontWeight: "800",
    textDecoration: "none",
  },

  brandMark: {
    display: "grid",
    placeItems: "center",
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "900",
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
    lineHeight: "1.7",
  },

  errorMessage: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  warningMessage: {
    marginBottom: "20px",
    padding: "12px 14px",
    border: "1px solid #fde68a",
    borderRadius: "10px",
    backgroundColor: "#fffbeb",
    color: "#92400e",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  form: {
    display: "grid",
    gap: "20px",
  },

  field: {
    display: "grid",
    gap: "8px",
  },

  passwordHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  label: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
  },

  comingSoon: {
    color: "#94a3b8",
    fontSize: "11px",
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

  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "26px 0 18px",
  },

  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#e2e8f0",
  },

  dividerText: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "700",
  },

  registerButton: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 18px",
    border: "1px solid #2563eb",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "800",
    textAlign: "center",
    textDecoration: "none",
  },

  homeLink: {
    display: "block",
    marginTop: "18px",
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    textDecoration: "none",
  },
};

const animationStyles = `
  @keyframes serviceflow-login-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-login-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-login-styles";

  styleElement.textContent =
    animationStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default Login;