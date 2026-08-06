import { useEffect, useState } from "react";

import adminService from "../../services/adminService";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

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
        <h2>Loading admin dashboard...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.center}>
        <h2>{error}</h2>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>
        ServiceFlow Admin Dashboard
      </h1>

      <p style={styles.subtitle}>
        Welcome back,
        {" "}
        {dashboard.admin.full_name}
      </p>

      <section style={styles.grid}>
        <StatCard
          title="Total Users"
          value={dashboard.stats.users.total}
        />

        <StatCard
          title="Customers"
          value={dashboard.stats.users.customers}
        />

        <StatCard
          title="Artisans"
          value={dashboard.stats.users.artisans}
        />

        <StatCard
          title="Admins"
          value={dashboard.stats.users.admins}
        />

        <StatCard
          title="Open Jobs"
          value={dashboard.stats.jobs.open}
        />

        <StatCard
          title="In Progress"
          value={
            dashboard.stats.jobs.in_progress
          }
        />

        <StatCard
          title="Confirmed"
          value={
            dashboard.stats.jobs.confirmed
          }
        />

        <StatCard
          title="Accepted"
          value={
            dashboard.stats.jobs.accepted
          }
        />

        <StatCard
          title="Total Job Value"
          value={`R${dashboard.stats.jobs.total_value}`}
        />

        <StatCard
          title="Confirmed Value"
          value={`R${dashboard.stats.jobs.confirmed_value}`}
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
            dashboard.stats.reviews.average_rating
          }
        />
      </section>

      <section style={styles.section}>
        <h2>Recent Users</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {dashboard.recent_users.map(
              (user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>

                  <td>{user.email}</td>

                  <td>{user.role}</td>

                  <td>{user.status}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>

      <section style={styles.section}>
        <h2>Recent Jobs</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Budget</th>
            </tr>
          </thead>

          <tbody>
            {dashboard.recent_jobs.map(
              (job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>

                  <td>{job.category}</td>

                  <td>{job.status}</td>

                  <td>R{job.budget}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
}) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>

      <h2>{value}</h2>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px",
    background: "#f8fafc",
    minHeight: "100vh",
  },

  center: {
    display: "grid",
    placeItems: "center",
    minHeight: "70vh",
  },

  title: {
    marginBottom: "8px",
  },

  subtitle: {
    color: "#64748b",
    marginBottom: "30px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "20px",
  },

  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    boxShadow:
      "0 2px 8px rgba(0,0,0,.08)",
  },

  section: {
    marginTop: "50px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "15px",
  },
};

export default AdminDashboard;