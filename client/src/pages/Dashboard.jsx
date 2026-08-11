import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import dashboardService from "../services/dashboardService";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result =
          await dashboardService.getDashboard();

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load dashboard.",
          );

          return;
        }

        setDashboard(result.dashboard);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error.response?.data?.message ||
          "Unable to load your dashboard. Please try again.";

        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    if (dashboard.role === "artisan") {
      return [
        {
          label: "Jobs accepted",
          value:
            dashboard.jobs_accepted ?? 0,
        },
        {
          label: "Jobs in progress",
          value:
            dashboard.jobs_in_progress ?? 0,
        },
        {
          label: "Jobs completed",
          value:
            dashboard.jobs_completed ?? 0,
        },
        {
          label: "Average rating",
          value:
            dashboard.average_rating ?? 0,
        },
        {
          label: "Total reviews",
          value:
            dashboard.total_reviews ?? 0,
        },
        {
          label: "Unread notifications",
          value:
            dashboard.unread_notifications ??
            0,
        },
      ];
    }

    return [
      {
        label: "Total requests",
        value:
          dashboard.total_requests ?? 0,
      },
      {
        label: "Pending requests",
        value:
          dashboard.pending_requests ?? 0,
      },
      {
        label: "In progress",
        value:
          dashboard.in_progress ?? 0,
      },
      {
        label: "Completed",
        value:
          dashboard.completed ?? 0,
      },
      {
        label: "Unread notifications",
        value:
          dashboard.unread_notifications ?? 0,
      },
    ];
  }, [dashboard]);

  const unreadNotificationCount =
    dashboard?.unread_notifications ?? 0;

  const dashboardRole =
    dashboard?.role || user?.role;

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading your dashboard...
        </p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              ServiceFlow Dashboard
            </p>

            <h1 style={styles.heading}>
              Welcome back,{" "}
              {user?.full_name || "User"} 👋
            </h1>

            <p style={styles.subheading}>
              Manage your account, service
              activity, and updates from one
              place.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Log out
          </button>
        </header>

        <section style={styles.profileCard}>
          <div>
            <span style={styles.profileLabel}>
              Role
            </span>

            <strong style={styles.profileValue}>
              {user?.role ||
                dashboard?.role ||
                "User"}
            </strong>
          </div>

          <div>
            <span style={styles.profileLabel}>
              Email
            </span>

            <strong style={styles.profileValue}>
              {user?.email ||
                "Not available"}
            </strong>
          </div>

          <div>
            <span style={styles.profileLabel}>
              City
            </span>

            <strong style={styles.profileValue}>
              {user?.city || "Not provided"}
            </strong>
          </div>
        </section>

        {errorMessage ? (
          <section style={styles.errorCard}>
            <p style={styles.errorText}>
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              style={styles.retryButton}
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <section style={styles.statsGrid}>
              {statCards.map((card) => (
                <article
                  key={card.label}
                  style={styles.statCard}
                >
                  <p style={styles.statLabel}>
                    {card.label}
                  </p>

                  <strong style={styles.statValue}>
                    {card.value}
                  </strong>
                </article>
              ))}
            </section>

            <section
              style={styles.actionsSection}
            >
              <h2 style={styles.sectionHeading}>
                Quick actions
              </h2>

              <div style={styles.actionsGrid}>
                {dashboardRole ===
                  "customer" && (
                  <>
                    <Link
                      to="/booking"
                      style={styles.primaryAction}
                    >
                      Create service request
                    </Link>

                    <Link
                      to="/my-requests"
                      style={
                        styles.secondaryAction
                      }
                    >
                      View my requests
                    </Link>

                    <Link
                      to="/customer-profile"
                      style={
                        styles.profileAction
                      }
                    >
                      My profile
                    </Link>
                  </>
                )}

                {dashboardRole ===
                  "artisan" && (
                  <>
                    <Link
                      to="/marketplace"
                      style={styles.primaryAction}
                    >
                      Browse open jobs
                    </Link>

                    <Link
                      to="/my-jobs"
                      style={
                        styles.secondaryAction
                      }
                    >
                      View my jobs
                    </Link>

                    <Link
                      to="/wallet"
                      style={
                        styles.notificationAction
                      }
                    >
                      Wallet & payouts
                    </Link>

                    <Link
                      to="/artisan-profile"
                      style={
                        styles.profileAction
                      }
                    >
                      My profile
                    </Link>
                  </>
                )}

                <Link
                  to="/notifications"
                  style={
                    styles.notificationAction
                  }
                >
                  <span>Notifications</span>

                  {unreadNotificationCount >
                    0 && (
                    <span
                      style={
                        styles.notificationBadge
                      }
                    >
                      {unreadNotificationCount >
                      99
                        ? "99+"
                        : unreadNotificationCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/services"
                  style={styles.secondaryAction}
                >
                  Browse services
                </Link>

                <Link
                  to="/contact"
                  style={styles.secondaryAction}
                >
                  Contact support
                </Link>
              </div>
            </section>
          </>
        )}
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

  centeredPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
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
    lineHeight: "1.2",
  },

  subheading: {
    margin: 0,
    maxWidth: "650px",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: "1.7",
  },

  logoutButton: {
    padding: "11px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  profileCard: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "28px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
  },

  profileLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  profileValue: {
    color: "#0f172a",
    fontSize: "16px",
    textTransform: "capitalize",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "34px",
  },

  statCard: {
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.06)",
  },

  statLabel: {
    margin: "0 0 12px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
  },

  statValue: {
    color: "#0f172a",
    fontSize: "34px",
    lineHeight: "1",
  },

  actionsSection: {
    padding: "26px",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
  },

  sectionHeading: {
    margin: "0 0 18px",
    color: "#0f172a",
    fontSize: "22px",
  },

  actionsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
  },

  primaryAction: {
    padding: "12px 18px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    textDecoration: "none",
  },

  secondaryAction: {
    padding: "12px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    textDecoration: "none",
  },

  profileAction: {
    padding: "12px 18px",
    border: "1px solid #16a34a",
    borderRadius: "10px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    fontWeight: "800",
    textDecoration: "none",
  },

  notificationAction: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    padding: "12px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    textDecoration: "none",
  },

  notificationBadge: {
    display: "inline-grid",
    placeItems: "center",
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    borderRadius: "999px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
    lineHeight: "1",
  },

  errorCard: {
    padding: "24px",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    margin: "0 0 14px",
    color: "#b91c1c",
  },

  retryButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#b91c1c",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default Dashboard;