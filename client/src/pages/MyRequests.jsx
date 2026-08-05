import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import reviewService from "../services/reviewService";
import serviceRequestService from "../services/serviceRequestService";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [reviewForms, setReviewForms] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const result =
          await serviceRequestService.getMyRequests();

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load your requests.",
          );
          return;
        }

        setRequests(result.service_requests || []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load your requests. Please try again.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestCountLabel = useMemo(() => {
    if (requests.length === 1) {
      return "1 request";
    }

    return `${requests.length} requests`;
  }, [requests.length]);

  const updateRequestInState = (updatedRequest) => {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === updatedRequest.id
          ? updatedRequest
          : request,
      ),
    );
  };

  const handleConfirmCompletion = async (requestId) => {
    try {
      setUpdatingId(requestId);
      setErrorMessage("");
      setSuccessMessage("");

      const result =
        await serviceRequestService.confirmServiceRequest(
          requestId,
        );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to confirm completion.",
        );
        return;
      }

      updateRequestInState(result.service_request);

      setSuccessMessage(
        result.message ||
          "Job confirmed successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to confirm completion. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getReviewForm = (requestId) => {
    return (
      reviewForms[requestId] || {
        rating: 0,
        comment: "",
      }
    );
  };

  const handleRatingChange = (requestId, rating) => {
    setReviewForms((currentForms) => ({
      ...currentForms,
      [requestId]: {
        ...getReviewForm(requestId),
        rating,
      },
    }));

    setErrorMessage("");
  };

  const handleReviewCommentChange = (
    requestId,
    comment,
  ) => {
    setReviewForms((currentForms) => ({
      ...currentForms,
      [requestId]: {
        ...getReviewForm(requestId),
        comment,
      },
    }));

    setErrorMessage("");
  };

  const handleSubmitReview = async (requestId) => {
    const reviewForm = getReviewForm(requestId);

    if (
      reviewForm.rating < 1 ||
      reviewForm.rating > 5
    ) {
      setErrorMessage(
        "Please select a rating between 1 and 5 stars.",
      );
      return;
    }

    try {
      setReviewingId(requestId);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await reviewService.createReview({
        service_request_id: requestId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to submit your review.",
        );
        return;
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                review: result.review,
              }
            : request,
        ),
      );

      setReviewForms((currentForms) => {
        const updatedForms = {
          ...currentForms,
        };

        delete updatedForms[requestId];

        return updatedForms;
      });

      setSuccessMessage(
        result.message ||
          "Review submitted successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to submit your review. Please try again.",
      );
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading your service requests...
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
              Customer Requests
            </p>

            <h1 style={styles.heading}>
              My service requests
            </h1>

            <p style={styles.subheading}>
              Track every service request you have created,
              communicate with your artisan, and follow its
              current progress.
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
              to="/booking"
              style={styles.primaryButton}
            >
              Create request
            </Link>
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

            {requests.length === 0 && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={styles.retryButton}
              >
                Try again
              </button>
            )}
          </section>
        )}

        <section style={styles.summaryCard}>
          <span style={styles.summaryLabel}>
            Total requests
          </span>

          <strong style={styles.summaryValue}>
            {requestCountLabel}
          </strong>
        </section>

        {requests.length === 0 && !errorMessage ? (
          <section style={styles.emptyCard}>
            <h2 style={styles.emptyHeading}>
              No service requests yet
            </h2>

            <p style={styles.emptyText}>
              Create your first request and connect with an
              artisan.
            </p>

            <Link
              to="/booking"
              style={styles.primaryButton}
            >
              Create service request
            </Link>
          </section>
        ) : (
          <section style={styles.requestsGrid}>
            {requests.map((request) => {
              const reviewForm = getReviewForm(
                request.id,
              );

              const messagingAvailable =
                Boolean(request.artisan_id) &&
                [
                  "accepted",
                  "in_progress",
                  "completed",
                  "confirmed",
                ].includes(request.status);

              return (
                <article
                  key={request.id}
                  style={styles.requestCard}
                >
                  <div style={styles.cardTopRow}>
                    <div>
                      <p style={styles.category}>
                        {request.category}
                      </p>

                      <h2 style={styles.requestTitle}>
                        {request.title}
                      </h2>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(
                          request.status,
                        ),
                      }}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </div>

                  <p style={styles.description}>
                    {request.description}
                  </p>

                  <div style={styles.detailsGrid}>
                    <div>
                      <span style={styles.detailLabel}>
                        Location
                      </span>

                      <strong style={styles.detailValue}>
                        {request.location}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.detailLabel}>
                        Budget
                      </span>

                      <strong style={styles.detailValue}>
                        {formatCurrency(
                          request.budget,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.detailLabel}>
                        Request ID
                      </span>

                      <strong style={styles.detailValue}>
                        #{request.id}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.detailLabel}>
                        Artisan
                      </span>

                      <strong style={styles.detailValue}>
                        {request.artisan_id
                          ? `Assigned #${request.artisan_id}`
                          : "Not assigned"}
                      </strong>
                    </div>
                  </div>

                  <div style={styles.requestActions}>
                    {messagingAvailable && (
                      <>
                        <Link
                          to={`/artisans/${request.artisan_id}`}
                          style={styles.profileButton}
                        >
                          View artisan profile
                        </Link>

                        <Link
                          to={`/messages/${request.id}`}
                          style={styles.messageButton}
                        >
                          Message artisan
                        </Link>
                      </>
                    )}

                    {request.status === "open" && (
                      <p style={styles.openMessage}>
                        Waiting for an artisan to accept
                        this request.
                      </p>
                    )}

                    {request.status === "accepted" && (
                      <p style={styles.acceptedMessage}>
                        An artisan has accepted this
                        request.
                      </p>
                    )}

                    {request.status ===
                      "in_progress" && (
                      <p style={styles.progressMessage}>
                        The artisan is currently working
                        on this request.
                      </p>
                    )}

                    {request.status === "completed" && (
                      <>
                        <p style={styles.completedMessage}>
                          The artisan marked this job as
                          completed. Confirm only after you
                          are satisfied with the work.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            handleConfirmCompletion(
                              request.id,
                            )
                          }
                          disabled={
                            updatingId === request.id
                          }
                          style={{
                            ...styles.confirmButton,
                            opacity:
                              updatingId === request.id
                                ? 0.7
                                : 1,
                            cursor:
                              updatingId === request.id
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {updatingId === request.id
                            ? "Confirming completion..."
                            : "Confirm completion"}
                        </button>
                      </>
                    )}

                    {request.status === "confirmed" &&
                      !request.review && (
                        <section
                          style={styles.reviewForm}
                        >
                          <p
                            style={
                              styles.confirmedMessage
                            }
                          >
                            ✓ Service completed and
                            confirmed.
                          </p>

                          <h3
                            style={
                              styles.reviewHeading
                            }
                          >
                            Rate this artisan
                          </h3>

                          <p
                            style={
                              styles.reviewHelpText
                            }
                          >
                            Select a rating from 1 to 5
                            stars.
                          </p>

                          <div
                            style={styles.ratingRow}
                            aria-label="Select rating"
                          >
                            {[1, 2, 3, 4, 5].map(
                              (ratingValue) => (
                                <button
                                  key={ratingValue}
                                  type="button"
                                  onClick={() =>
                                    handleRatingChange(
                                      request.id,
                                      ratingValue,
                                    )
                                  }
                                  disabled={
                                    reviewingId ===
                                    request.id
                                  }
                                  aria-label={`${ratingValue} star${
                                    ratingValue === 1
                                      ? ""
                                      : "s"
                                  }`}
                                  style={{
                                    ...styles.starButton,
                                    color:
                                      ratingValue <=
                                      reviewForm.rating
                                        ? "#f59e0b"
                                        : "#cbd5e1",
                                  }}
                                >
                                  ★
                                </button>
                              ),
                            )}
                          </div>

                          <label
                            htmlFor={`review-comment-${request.id}`}
                            style={styles.reviewLabel}
                          >
                            Comment
                          </label>

                          <textarea
                            id={`review-comment-${request.id}`}
                            value={reviewForm.comment}
                            onChange={(event) =>
                              handleReviewCommentChange(
                                request.id,
                                event.target.value,
                              )
                            }
                            rows={4}
                            maxLength={1000}
                            placeholder="Share your experience with this artisan."
                            disabled={
                              reviewingId === request.id
                            }
                            style={
                              styles.reviewTextarea
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleSubmitReview(
                                request.id,
                              )
                            }
                            disabled={
                              reviewingId === request.id
                            }
                            style={{
                              ...styles.reviewButton,
                              opacity:
                                reviewingId ===
                                request.id
                                  ? 0.7
                                  : 1,
                              cursor:
                                reviewingId ===
                                request.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {reviewingId === request.id
                              ? "Submitting review..."
                              : "Submit review"}
                          </button>
                        </section>
                      )}

                    {request.status === "confirmed" &&
                      request.review && (
                        <section
                          style={styles.reviewResult}
                        >
                          <p
                            style={
                              styles.confirmedMessage
                            }
                          >
                            ✓ Service completed and
                            confirmed.
                          </p>

                          <h3
                            style={
                              styles.reviewHeading
                            }
                          >
                            Your review
                          </h3>

                          <p
                            style={styles.reviewStars}
                          >
                            {renderStars(
                              request.review.rating,
                            )}
                          </p>

                          {request.review.comment ? (
                            <p
                              style={
                                styles.reviewComment
                              }
                            >
                              “
                              {
                                request.review
                                  .comment
                              }
                              ”
                            </p>
                          ) : (
                            <p
                              style={
                                styles.noCommentText
                              }
                            >
                              No written comment was
                              provided.
                            </p>
                          )}
                        </section>
                      )}
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

function renderStars(rating) {
  const normalizedRating = Math.max(
    0,
    Math.min(5, Number(rating || 0)),
  );

  return `${"★".repeat(
    normalizedRating,
  )}${"☆".repeat(5 - normalizedRating)}`;
}

function getStatusStyle(status) {
  const stylesByStatus = {
    open: {
      backgroundColor: "#eff6ff",
      color: "#1d4ed8",
    },

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
    stylesByStatus[status] || {
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
    maxWidth: "620px",
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

  successCard: {
    marginBottom: "20px",
    padding: "18px",
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
    padding: "18px",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    margin: "0 0 14px",
    color: "#b91c1c",
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
    fontSize: "14px",
    fontWeight: "700",
  },

  summaryValue: {
    color: "#0f172a",
    fontSize: "18px",
  },

  requestsGrid: {
    display: "grid",
    gap: "18px",
  },

  requestCard: {
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

  requestTitle: {
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

  requestActions: {
    display: "grid",
    gap: "14px",
    marginTop: "22px",
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

  openMessage: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "700",
  },

  acceptedMessage: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    fontWeight: "700",
  },

  progressMessage: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#fefce8",
    color: "#a16207",
    fontWeight: "700",
  },

  completedMessage: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    lineHeight: "1.6",
    fontWeight: "700",
  },

  confirmedMessage: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    backgroundColor: "#ecfdf5",
    color: "#047857",
    fontWeight: "700",
  },

  confirmButton: {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#15803d",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  reviewForm: {
    padding: "20px",
    border: "1px solid #fde68a",
    borderRadius: "14px",
    backgroundColor: "#fffbeb",
  },

  reviewResult: {
    padding: "20px",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    backgroundColor: "#f0fdf4",
  },

  reviewHeading: {
    margin: "20px 0 6px",
    color: "#0f172a",
    fontSize: "19px",
  },

  reviewHelpText: {
    margin: "0 0 12px",
    color: "#64748b",
    fontSize: "14px",
  },

  ratingRow: {
    display: "flex",
    gap: "6px",
    marginBottom: "18px",
  },

  starButton: {
    padding: 0,
    border: "none",
    backgroundColor: "transparent",
    fontSize: "34px",
    lineHeight: "1",
    cursor: "pointer",
  },

  reviewLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
  },

  reviewTextarea: {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "14px",
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

  reviewButton: {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  reviewStars: {
    margin: "10px 0",
    color: "#f59e0b",
    fontSize: "28px",
    letterSpacing: "2px",
  },

  reviewComment: {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    fontStyle: "italic",
    lineHeight: "1.7",
  },

  noCommentText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
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

export default MyRequests;