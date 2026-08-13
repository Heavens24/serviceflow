import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import notificationService from "../services/notificationService";

function Notifications() {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  // ==========================
  // Initial Load
  // ==========================

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications =
      async () => {
        try {
          const result =
            await notificationService.getNotifications();

          if (cancelled) {
            return;
          }

          if (result.success) {
            setNotifications(
              result.notifications || [],
            );
          }
        } catch (error) {
          console.error(error);

          if (!cancelled) {
            setMessage(
              "Unable to load notifications.",
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    void fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================
  // Mark One As Read
  // ==========================

  const markAsRead = async (
    notificationId,
  ) => {
    try {
      const result =
        await notificationService.markAsRead(
          notificationId,
        );

      if (result.success) {
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  is_read: true,
                }
              : notification,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================
  // Mark All As Read
  // ==========================

  const markAllAsRead = async () => {
    try {
      const result =
        await notificationService.markAllAsRead();

      if (result.success) {
        setNotifications((previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              is_read: true,
            }),
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ==========================
  // Loading State
  // ==========================

  if (loading) {
    return (
      <main style={styles.loading}>
        Loading notifications...
      </main>
    );
  }

  // ==========================
  // Page
  // ==========================

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Notifications
            </h1>

            <p style={styles.subtitle}>
              Stay updated with everything
              happening in your ServiceFlow
              account.
            </p>
          </div>

          <div style={styles.actions}>
            <Link
              to="/dashboard"
              style={styles.secondaryButton}
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={markAllAsRead}
              style={styles.primaryButton}
              disabled={
                notifications.length === 0
              }
            >
              Mark all as read
            </button>
          </div>
        </div>

        {message && (
          <div style={styles.error}>
            {message}
          </div>
        )}

        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <h3>No notifications</h3>

            <p>
              New updates about your jobs
              will appear here.
            </p>
          </div>
        ) : (
          notifications.map(
            (notification) => (
              <div
                key={notification.id}
                style={{
                  ...styles.card,
                  backgroundColor:
                    notification.is_read
                      ? "#ffffff"
                      : "#eff6ff",
                }}
              >
                <div>
                  <h3
                    style={
                      styles.cardTitle
                    }
                  >
                    {notification.title}
                  </h3>

                  <p
                    style={
                      styles.cardMessage
                    }
                  >
                    {notification.message}
                  </p>

                  <small
                    style={styles.date}
                  >
                    {new Date(
                      notification.created_at,
                    ).toLocaleString()}
                  </small>
                </div>

                {!notification.is_read && (
                  <button
                    type="button"
                    style={
                      styles.readButton
                    }
                    onClick={() =>
                      markAsRead(
                        notification.id,
                      )
                    }
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ),
          )
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 20px",
  },

  loading: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    fontSize: "18px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  primaryButton: {
    padding: "12px 18px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },

  secondaryButton: {
    padding: "12px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: "700",
    background: "#fff",
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    marginBottom: "16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  cardTitle: {
    margin: "0 0 8px",
  },

  cardMessage: {
    margin: "0 0 10px",
    color: "#475569",
  },

  date: {
    color: "#94a3b8",
  },

  readButton: {
    padding: "10px 16px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },

  empty: {
    textAlign: "center",
    padding: "60px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default Notifications;