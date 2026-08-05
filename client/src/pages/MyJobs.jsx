


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import serviceRequestService from "../services/serviceRequestService";

function MyJobs() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result =
          await serviceRequestService.getMyJobs();

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load your jobs.",
          );
          return;
        }

        setJobs(result.jobs || []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load your jobs. Please try again.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateJobInState = (updatedJob) => {
    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.id === updatedJob.id
          ? updatedJob
          : job,
      ),
    );
  };

  const handleStartJob = async (jobId) => {
    try {
      setUpdatingId(jobId);
      setErrorMessage("");
      setSuccessMessage("");

      const result =
        await serviceRequestService.startServiceRequest(
          jobId,
        );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to start this job.",
        );
        return;
      }

      updateJobInState(result.service_request);

      setSuccessMessage(
        result.message ||
          "Job started successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to start this job. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteJob = async (jobId) => {
    try {
      setUpdatingId(jobId);
      setErrorMessage("");
      setSuccessMessage("");

      const result =
        await serviceRequestService.completeServiceRequest(
          jobId,
        );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to complete this job.",
        );
        return;
      }

      updateJobInState(result.service_request);

      setSuccessMessage(
        result.message ||
          "Job completed successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to complete this job. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading your jobs...
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
            Only artisan accounts can manage assigned jobs.
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
              Artisan Jobs
            </p>

            <h1 style={styles.heading}>
              My jobs
            </h1>

            <p style={styles.subheading}>
              Manage accepted work, communicate with customers,
              and move each job through its service lifecycle.
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
              to="/marketplace"
              style={styles.primaryButton}
            >
              Browse open jobs
            </Link>
          </div>
        </header>

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

        <section style={styles.summaryCard}>
          <span style={styles.summaryLabel}>
            Assigned jobs
          </span>

          <strong style={styles.summaryValue}>
            {jobs.length}
          </strong>
        </section>

        {jobs.length === 0 ? (
          <section style={styles.emptyCard}>
            <h2 style={styles.emptyHeading}>
              No assigned jobs yet
            </h2>

            <p style={styles.emptyText}>
              Visit the marketplace and accept an available
              service request.
            </p>

            <Link
              to="/marketplace"
              style={styles.primaryButton}
            >
              Browse marketplace
            </Link>
          </section>
        ) : (
          <section style={styles.jobsGrid}>
            {jobs.map((job) => {
              const messagingAvailable =
                Boolean(job.customer_id) &&
                [
                  "accepted",
                  "in_progress",
                  "completed",
                  "confirmed",
                ].includes(job.status);

              return (
                <article
                  key={job.id}
                  style={styles.jobCard}
                >
                  <div style={styles.cardTopRow}>
                    <div>
                      <p style={styles.category}>
                        {job.category}
                      </p>

                      <h2 style={styles.jobTitle}>
                        {job.title}
                      </h2>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(job.status),
                      }}
                    >
                      {formatStatus(job.status)}
                    </span>
                  </div>

                  <p style={styles.description}>
                    {job.description}
                  </p>

                  <div style={styles.detailsGrid}>
                    <div>
                      <span style={styles.detailLabel}>
                        Location
                      </span>

                      <strong style={styles.detailValue}>
                        {job.location}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.detailLabel}>
                        Budget
                      </span>

                      <strong style={styles.detailValue}>
                        {formatCurrency(job.budget)}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.detailLabel}>
                        Request ID
                      </span>

                      <strong style={styles.detailValue}>
                        #{job.id}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.detailLabel}>
                        Customer
                      </span>

                      <strong style={styles.detailValue}>
                        {job.customer_id
                          ? `#${job.customer_id}`
                          : "Not available"}
                      </strong>
                    </div>
                  </div>

                  <div style={styles.actionsSection}>
                    {messagingAvailable && (
                      <>
                        <Link
                          to={`/customer-profiles/${job.customer_id}`}
                          style={styles.profileButton}
                        >
                          View customer profile
                        </Link>

                        <Link
                          to={`/messages/${job.id}`}
                          style={styles.messageButton}
                        >
                          Message customer
                        </Link>
                      </>
                    )}

                    <div style={styles.lifecycleActions}>
                      {job.status === "accepted" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStartJob(job.id)
                          }
                          disabled={
                            updatingId === job.id
                          }
                          style={{
                            ...styles.primaryActionButton,
                            opacity:
                              updatingId === job.id
                                ? 0.7
                                : 1,
                            cursor:
                              updatingId === job.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {updatingId === job.id
                            ? "Starting job..."
                            : "Start job"}
                        </button>
                      )}

                      {job.status === "in_progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCompleteJob(job.id)
                          }
                          disabled={
                            updatingId === job.id
                          }
                          style={{
                            ...styles.completeButton,
                            opacity:
                              updatingId === job.id
                                ? 0.7
                                : 1,
                            cursor:
                              updatingId === job.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {updatingId === job.id
                            ? "Completing job..."
                            : "Mark as completed"}
                        </button>
                      )}

                      {job.status === "completed" && (
                        <p style={styles.waitingText}>
                          Waiting for the customer to confirm
                          completion.
                        </p>
                      )}

                      {job.status === "confirmed" && (
                        <p style={styles.confirmedText}>
                          Job completed and confirmed.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(value || 0));
}

function getStatusStyle(status) {
  const statusStyles = {
    accepted: {
      backgroundColor: "#fff7ed",
      color: "#c2410c",
    },

    in_progress: {
      backgroundColor: "#fefce8",
      color: "#a16207",
    },

    completed: {
      backgroundColor: "#f0fdf4",
      color: "#15803d",
    },

    confirmed: {
      backgroundColor: "#ecfdf5",
      color: "#047857",
    },
  };

  return (
    statusStyles[status] || {
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
    maxWidth: "1100px",
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
    maxWidth: "650px",
    color: "#64748b",
    lineHeight: "1.7",
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

  summaryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    padding: "18px 22px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
  },

  summaryLabel: {
    color: "#64748b",
    fontWeight: "700",
  },

  summaryValue: {
    color: "#0f172a",
    fontSize: "24px",
  },

  jobsGrid: {
    display: "grid",
    gap: "18px",
  },

  jobCard: {
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "14px",
  },

  category: {
    margin: "0 0 6px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  jobTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
  },

  statusBadge: {
    alignSelf: "flex-start",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  description: {
    margin: "0 0 22px",
    color: "#475569",
    lineHeight: "1.7",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
  },

  detailLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  detailValue: {
    color: "#0f172a",
    fontSize: "14px",
  },

  actionsSection: {
    display: "grid",
    gap: "12px",
  },

  lifecycleActions: {
    display: "grid",
    gap: "12px",
  },

  profileButton: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 18px",
    border: "1px solid #16a34a",
    borderRadius: "10px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    fontSize: "15px",
    fontWeight: "800",
    textAlign: "center",
    textDecoration: "none",
  },

  messageButton: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 18px",
    border: "1px solid #2563eb",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "15px",
    fontWeight: "800",
    textAlign: "center",
    textDecoration: "none",
  },

  primaryActionButton: {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  completeButton: {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#15803d",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  waitingText: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#fff7ed",
    color: "#9a3412",
    fontWeight: "700",
  },

  confirmedText: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#ecfdf5",
    color: "#047857",
    fontWeight: "700",
  },

  emptyCard: {
    padding: "48px 24px",
    border: "1px dashed #cbd5e1",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    textAlign: "center",
  },

  emptyHeading: {
    margin: "0 0 10px",
    color: "#0f172a",
  },

  emptyText: {
    margin: "0 0 22px",
    color: "#64748b",
  },

  restrictedCard: {
    width: "100%",
    maxWidth: "480px",
    padding: "36px",
    borderRadius: "16px",
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
  },

  errorCard: {
    marginBottom: "18px",
    padding: "16px",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    margin: 0,
    color: "#b91c1c",
  },

  successCard: {
    marginBottom: "18px",
    padding: "16px",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    backgroundColor: "#f0fdf4",
  },

  successText: {
    margin: 0,
    color: "#166534",
  },
};

export default MyJobs;