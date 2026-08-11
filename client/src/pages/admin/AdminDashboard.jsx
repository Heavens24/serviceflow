import {
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import adminService from "../../services/adminService";

function AdminDashboard() {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const data =
        await adminService.getDashboard();

      setDashboard(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.center}>
        <p style={styles.loadingText}>
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.center}>
        <div style={styles.errorBox}>
          <h2 style={styles.errorTitle}>
            Unable to load dashboard
          </h2>

          <p style={styles.errorText}>
            {error}
          </p>

          <button
            type="button"
            onClick={loadDashboard}
            style={styles.retryButton}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            ServiceFlow Administration
          </p>

          <h1 style={styles.title}>
            ServiceFlow Admin Dashboard
          </h1>

          <p style={styles.subtitle}>
            Welcome back,{" "}
            {dashboard.admin.full_name}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          style={styles.refreshButton}
        >
          Refresh dashboard
        </button>
      </header>

      {/* ==========================
          Admin Navigation
      ========================== */}
      <section style={styles.navigationSection}>
        <h2 style={styles.sectionTitle}>
          Administration
        </h2>

        <p style={styles.sectionDescription}>
          Manage users, marketplace jobs,
          reviews, and platform activity.
        </p>

        <div style={styles.navigationGrid}>
          <AdminNavigationCard
            title="User Management"
            description="Search users, verify accounts, manage roles, and control account status."
            to="/admin/users"
          />

          <AdminNavigationCard
            title="Job Management"
            description="Monitor service requests, moderate job status, and remove inappropriate listings."
            to="/admin/jobs"
          />

          <AdminNavigationCard
            title="Review Management"
            description="Inspect customer feedback, ratings, linked jobs, and remove inappropriate reviews."
            to="/admin/reviews"
          />

          <AdminNavigationCard
            title="Withdrawal Management"
            description="Review artisan payout requests, approve or reject withdrawals, initiate Paystack transfers, and verify payout status."
            to="/admin/withdrawals"
          />
        </div>
      </section>

      {/* ==========================
          Statistics
      ========================== */}
      <section style={styles.grid}>
        <StatCard
          title="Total Users"
          value={
            dashboard.stats.users.total
          }
        />

        <StatCard
          title="Customers"
          value={
            dashboard.stats.users
              .customers
          }
        />

        <StatCard
          title="Artisans"
          value={
            dashboard.stats.users
              .artisans
          }
        />

        <StatCard
          title="Admins"
          value={
            dashboard.stats.users.admins
          }
        />

        <StatCard
          title="Open Jobs"
          value={
            dashboard.stats.jobs.open
          }
        />

        <StatCard
          title="Accepted"
          value={
            dashboard.stats.jobs.accepted
          }
        />

        <StatCard
          title="In Progress"
          value={
            dashboard.stats.jobs
              .in_progress
          }
        />

        <StatCard
          title="Confirmed"
          value={
            dashboard.stats.jobs
              .confirmed
          }
        />

        <StatCard
          title="Total Job Value"
          value={formatCurrency(
            dashboard.stats.jobs
              .total_value,
          )}
        />

        <StatCard
          title="Confirmed Value"
          value={formatCurrency(
            dashboard.stats.jobs
              .confirmed_value,
          )}
        />

        <StatCard
          title="Reviews"
          value={
            dashboard.stats.reviews.total
          }
        />

        <StatCard
          title="Average Rating"
          value={
            dashboard.stats.reviews
              .average_rating
          }
        />
      </section>

      {/* ==========================
          Recent Users
      ========================== */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Recent Users
            </h2>

            <p style={styles.sectionDescription}>
              Latest accounts registered on
              ServiceFlow.
            </p>
          </div>

          <Link
            to="/admin/users"
            style={styles.viewAllLink}
          >
            Manage users
          </Link>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <TableHeading>
                  Name
                </TableHeading>

                <TableHeading>
                  Email
                </TableHeading>

                <TableHeading>
                  Role
                </TableHeading>

                <TableHeading>
                  Status
                </TableHeading>
              </tr>
            </thead>

            <tbody>
              {dashboard.recent_users.map(
                (user) => (
                  <tr
                    key={user.id}
                    style={styles.tableRow}
                  >
                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      {user.full_name}
                    </td>

                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      {user.email}
                    </td>

                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      <span
                        style={
                          styles.roleBadge
                        }
                      >
                        {formatLabel(
                          user.role,
                        )}
                      </span>
                    </td>

                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      <StatusBadge
                        status={
                          user.status
                        }
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==========================
          Recent Jobs
      ========================== */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Recent Jobs
            </h2>

            <p style={styles.sectionDescription}>
              Latest service requests created
              across the marketplace.
            </p>
          </div>

          <Link
            to="/admin/jobs"
            style={styles.viewAllLink}
          >
            Manage jobs
          </Link>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <TableHeading>
                  Title
                </TableHeading>

                <TableHeading>
                  Category
                </TableHeading>

                <TableHeading>
                  Status
                </TableHeading>

                <TableHeading>
                  Budget
                </TableHeading>
              </tr>
            </thead>

            <tbody>
              {dashboard.recent_jobs.map(
                (job) => (
                  <tr
                    key={job.id}
                    style={styles.tableRow}
                  >
                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      {job.title}
                    </td>

                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      {job.category}
                    </td>

                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      <StatusBadge
                        status={
                          job.status
                        }
                      />
                    </td>

                    <td
                      style={
                        styles.tableCell
                      }
                    >
                      {formatCurrency(
                        job.budget,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==========================
          Review Management Shortcut
      ========================== */}
      <section style={styles.reviewSection}>
        <div>
          <h2 style={styles.sectionTitle}>
            Review Management
          </h2>

          <p style={styles.sectionDescription}>
            The platform currently has{" "}
            <strong>
              {
                dashboard.stats.reviews
                  .total
              }
            </strong>{" "}
            reviews with an average rating
            of{" "}
            <strong>
              {
                dashboard.stats.reviews
                  .average_rating
              }
            </strong>
            .
          </p>
        </div>

        <Link
          to="/admin/reviews"
          style={styles.primaryLink}
        >
          Manage reviews
        </Link>
      </section>
    </main>
  );
}

function AdminNavigationCard({
  title,
  description,
  to,
}) {
  return (
    <Link
      to={to}
      style={styles.navigationCard}
    >
      <h3 style={styles.navigationTitle}>
        {title}
      </h3>

      <p
        style={
          styles.navigationDescription
        }
      >
        {description}
      </p>

      <span style={styles.navigationAction}>
        Open management →
      </span>
    </Link>
  );
}

function StatCard({
  title,
  value,
}) {
  return (
    <article style={styles.card}>
      <p style={styles.cardTitle}>
        {title}
      </p>

      <h2 style={styles.cardValue}>
        {value}
      </h2>
    </article>
  );
}

function TableHeading({
  children,
}) {
  return (
    <th style={styles.tableHeading}>
      {children}
    </th>
  );
}

function StatusBadge({ status }) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  const statusStyles = {
    active: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    suspended: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    banned: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    open: {
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
    },
    accepted: {
      backgroundColor: "#ede9fe",
      color: "#6d28d9",
    },
    in_progress: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    completed: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    confirmed: {
      backgroundColor: "#ccfbf1",
      color: "#115e59",
    },
    cancelled: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
  };

  const selectedStyle =
    statusStyles[normalized] || {
      backgroundColor: "#f1f5f9",
      color: "#475569",
    };

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...selectedStyle,
      }}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    },
  ).format(
    Number(value || 0),
  );
}

function formatLabel(value = "") {
  if (!value) {
    return "Unknown";
  }

  const formatted = String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  return (
    formatted.charAt(0).toUpperCase() +
    formatted.slice(1)
  );
}

const styles = {
  page: {
    padding: "40px 24px",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    color: "#0f172a",
  },

  center: {
    display: "grid",
    placeItems: "center",
    minHeight: "70vh",
    padding: "24px",
    backgroundColor: "#f8fafc",
  },

  loadingText: {
    color: "#64748b",
    fontWeight: "700",
  },

  errorBox: {
    width: "100%",
    maxWidth: "460px",
    padding: "28px",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    textAlign: "center",
  },

  errorTitle: {
    margin: "0 0 10px",
    color: "#991b1b",
  },

  errorText: {
    margin: "0 0 20px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  retryButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
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
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 8px",
    fontSize: "34px",
    lineHeight: 1.2,
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "16px",
  },

  refreshButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  navigationSection: {
    marginBottom: "32px",
  },

  navigationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },

  navigationCard: {
    display: "block",
    padding: "22px",
    border: "1px solid #dbeafe",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 8px 24px rgba(15, 23, 42, 0.05)",
    color: "#0f172a",
    textDecoration: "none",
  },

  navigationTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
  },

  navigationDescription: {
    margin: "0 0 18px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  navigationAction: {
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "18px",
  },

  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "22px",
    textAlign: "center",
    boxShadow:
      "0 6px 20px rgba(15, 23, 42, 0.05)",
  },

  cardTitle: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },

  cardValue: {
    margin: 0,
    color: "#0f172a",
    fontSize: "25px",
  },

  section: {
    marginTop: "42px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
  },

  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "21px",
  },

  sectionDescription: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },

  viewAllLink: {
    display: "inline-flex",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
    textDecoration: "none",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: "18px",
  },

  table: {
    width: "100%",
    minWidth: "680px",
    borderCollapse: "collapse",
  },

  tableHeading: {
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "900",
    textAlign: "left",
    textTransform: "uppercase",
  },

  tableRow: {
    borderBottom: "1px solid #e2e8f0",
  },

  tableCell: {
    padding: "14px",
    color: "#334155",
    fontSize: "14px",
  },

  roleBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "800",
  },

  statusBadge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  reviewSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginTop: "42px",
    padding: "24px",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    backgroundColor: "#eff6ff",
    flexWrap: "wrap",
  },

  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    textDecoration: "none",
  },
};

export default AdminDashboard;