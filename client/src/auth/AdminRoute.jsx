import PropTypes from "prop-types";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import useAuth from "../hooks/useAuth";

function AdminRoute({ children }) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.loadingCard}>
          <div
            aria-hidden="true"
            style={styles.spinner}
          />

          <p style={styles.loadingText}>
            Verifying administrator access...
          </p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (user?.status !== "active") {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          accountUnavailable: true,
          from: location,
        }}
      />
    );
  }

  if (user?.role !== "admin") {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          adminAccessDenied: true,
        }}
      />
    );
  }

  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = {
  centeredPage: {
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
    padding: "32px",
    border:
      "1px solid var(--sf-border, #e2e8f0)",
    borderRadius:
      "var(--sf-radius-lg, 18px)",
    backgroundColor:
      "var(--sf-surface, #ffffff)",
    boxShadow:
      "var(--sf-shadow-md, 0 12px 35px rgba(15, 23, 42, 0.08))",
  },

  spinner: {
    width: "38px",
    height: "38px",
    border:
      "4px solid var(--sf-primary-soft, #eff6ff)",
    borderTopColor:
      "var(--sf-primary, #2563eb)",
    borderRadius: "999px",
    animation:
      "serviceflow-admin-spin 0.8s linear infinite",
  },

  loadingText: {
    margin: 0,
    color:
      "var(--sf-text-muted, #64748b)",
    fontWeight: "700",
  },
};

const animationStyles = `
  @keyframes serviceflow-admin-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-admin-route-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-admin-route-styles";

  styleElement.textContent =
    animationStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default AdminRoute;