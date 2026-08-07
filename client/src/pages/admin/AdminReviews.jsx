import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import adminService from "../../services/adminService";


const INITIAL_FILTERS = {
  search: "",
  rating: "all",
  customer_id: "",
  artisan_id: "",
  service_request_id: "",
  sort: "newest",
};


function AdminReviews() {
  const { user: currentAdmin } = useAuth();

  const [reviews, setReviews] = useState([]);

  const [filters, setFilters] = useState(
    INITIAL_FILTERS,
  );

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(INITIAL_FILTERS);

  const [summary, setSummary] = useState({
    matching_reviews: 0,
    average_rating: 0,
    rating_breakdown: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  });

  const [pagination, setPagination] =
    useState({
      page: 1,
      per_page: 20,
      total: 0,
      pages: 1,
      has_next: false,
      has_previous: false,
    });

  const [loading, setLoading] =
    useState(true);

  const [actionReviewId, setActionReviewId] =
    useState(null);

  const [selectedReview, setSelectedReview] =
    useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");


  const loadReviews = useCallback(
    async (
      page = 1,
      nextFilters = appliedFilters,
    ) => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await adminService.getReviews({
            ...normaliseFilters(
              nextFilters,
            ),
            page,
            per_page:
              pagination.per_page,
          });

        setReviews(
          response.reviews || [],
        );

        setSummary(
          response.summary || {
            matching_reviews: 0,
            average_rating: 0,
            rating_breakdown: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
          },
        );

        setPagination((current) => ({
          ...current,
          ...(response.pagination || {}),
        }));
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load reviews.",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      appliedFilters,
      pagination.per_page,
    ],
  );


  useEffect(() => {
    loadReviews(
      1,
      appliedFilters,
    );
  }, [
    appliedFilters,
    loadReviews,
  ]);


  const refreshCurrentPage = async () => {
    await loadReviews(
      pagination.page,
      appliedFilters,
    );
  };


  const handleFilterChange = (event) => {
    const { name, value } =
      event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };


  const handleFilterSubmit = (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    setAppliedFilters(filters);
  };


  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);

    setAppliedFilters(
      INITIAL_FILTERS,
    );

    setSuccessMessage("");
    setErrorMessage("");
  };


  const handleViewReview = async (
    reviewId,
  ) => {
    try {
      setDetailsLoading(true);
      setErrorMessage("");

      const response =
        await adminService.getReview(
          reviewId,
        );

      setSelectedReview(
        response.review || null,
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load review details.",
        ),
      );
    } finally {
      setDetailsLoading(false);
    }
  };


  const handleCloseDetails = () => {
    if (actionReviewId) {
      return;
    }

    setSelectedReview(null);
  };


  const handleDeleteReview = async (
    review,
  ) => {
    const confirmed =
      window.confirm(
        [
          `Permanently delete review #${review.id}?`,
          "",
          `Rating: ${review.rating}/5`,
          "",
          review.comment ||
            "No written comment.",
          "",
          "Only the review will be deleted.",
          "The customer, artisan, and job will remain.",
          "",
          "This action cannot be undone.",
        ].join("\n"),
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionReviewId(
        review.id,
      );

      setSuccessMessage("");
      setErrorMessage("");

      const response =
        await adminService.deleteReview(
          review.id,
        );

      setSuccessMessage(
        response.message ||
          "Review deleted successfully.",
      );

      if (
        selectedReview?.id ===
        review.id
      ) {
        setSelectedReview(null);
      }

      const nextPage =
        reviews.length === 1 &&
        pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadReviews(
        nextPage,
        appliedFilters,
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to delete the review.",
        ),
      );
    } finally {
      setActionReviewId(null);
    }
  };


  const handlePreviousPage = () => {
    if (
      loading ||
      !pagination.has_previous
    ) {
      return;
    }

    loadReviews(
      pagination.page - 1,
      appliedFilters,
    );
  };


  const handleNextPage = () => {
    if (
      loading ||
      !pagination.has_next
    ) {
      return;
    }

    loadReviews(
      pagination.page + 1,
      appliedFilters,
    );
  };


  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              ServiceFlow Administration
            </p>

            <h1 style={styles.title}>
              Review Management
            </h1>

            <p style={styles.subtitle}>
              Monitor marketplace feedback,
              inspect customer ratings, review
              linked jobs, and remove abusive,
              fraudulent, or inappropriate
              reviews.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to="/admin"
              style={styles.secondaryLink}
            >
              Admin dashboard
            </Link>

            <Link
              to="/admin/users"
              style={styles.secondaryLink}
            >
              User management
            </Link>

            <Link
              to="/admin/jobs"
              style={styles.secondaryLink}
            >
              Job management
            </Link>

            <button
              type="button"
              onClick={refreshCurrentPage}
              disabled={loading}
              style={{
                ...styles.refreshButton,
                opacity:
                  loading ? 0.65 : 1,
              }}
            >
              {loading
                ? "Refreshing..."
                : "Refresh reviews"}
            </button>
          </div>
        </header>


        <section style={styles.summaryGrid}>
          <SummaryCard
            label="Reviews found"
            value={
              summary.matching_reviews
            }
          />

          <SummaryCard
            label="Average rating"
            value={`${Number(
              summary.average_rating || 0,
            ).toFixed(1)} / 5`}
          />

          <SummaryCard
            label="5-star reviews"
            value={
              summary.rating_breakdown?.[
                "5"
              ] || 0
            }
          />

          <SummaryCard
            label="1-star reviews"
            value={
              summary.rating_breakdown?.[
                "1"
              ] || 0
            }
          />

          <SummaryCard
            label="Current page"
            value={`${pagination.page} of ${
              pagination.pages || 1
            }`}
          />

          <SummaryCard
            label="Signed-in admin"
            value={
              currentAdmin?.full_name ||
              "Administrator"
            }
          />
        </section>


        {successMessage && (
          <div
            role="status"
            style={styles.successAlert}
          >
            {successMessage}
          </div>
        )}


        {errorMessage && (
          <div
            role="alert"
            style={styles.errorAlert}
          >
            {errorMessage}
          </div>
        )}


        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                Search and filters
              </h2>

              <p style={styles.panelText}>
                Search comments, users, and
                jobs or filter reviews using
                marketplace details.
              </p>
            </div>
          </div>


          <form
            onSubmit={
              handleFilterSubmit
            }
            className="serviceflow-admin-reviews-filter-grid"
            style={styles.filterGrid}
          >
            <FilterField
              label="Search"
              name="search"
              value={filters.search}
              onChange={
                handleFilterChange
              }
              placeholder="Comment, customer, artisan or job"
            />

            <SelectField
              label="Rating"
              name="rating"
              value={filters.rating}
              onChange={
                handleFilterChange
              }
              options={[
                {
                  value: "all",
                  label: "All ratings",
                },
                {
                  value: "5",
                  label: "5 stars",
                },
                {
                  value: "4",
                  label: "4 stars",
                },
                {
                  value: "3",
                  label: "3 stars",
                },
                {
                  value: "2",
                  label: "2 stars",
                },
                {
                  value: "1",
                  label: "1 star",
                },
              ]}
            />

            <FilterField
              label="Customer ID"
              name="customer_id"
              value={
                filters.customer_id
              }
              onChange={
                handleFilterChange
              }
              placeholder="Customer ID"
              type="number"
              min="1"
            />

            <FilterField
              label="Artisan ID"
              name="artisan_id"
              value={
                filters.artisan_id
              }
              onChange={
                handleFilterChange
              }
              placeholder="Artisan ID"
              type="number"
              min="1"
            />

            <FilterField
              label="Service Request ID"
              name="service_request_id"
              value={
                filters.service_request_id
              }
              onChange={
                handleFilterChange
              }
              placeholder="Job ID"
              type="number"
              min="1"
            />

            <SelectField
              label="Sort"
              name="sort"
              value={filters.sort}
              onChange={
                handleFilterChange
              }
              options={[
                {
                  value: "newest",
                  label: "Newest first",
                },
                {
                  value: "oldest",
                  label: "Oldest first",
                },
                {
                  value:
                    "rating_high",
                  label:
                    "Highest rating first",
                },
                {
                  value:
                    "rating_low",
                  label:
                    "Lowest rating first",
                },
              ]}
            />

            <div
              style={
                styles.filterButtons
              }
            >
              <button
                type="submit"
                style={
                  styles.primaryButton
                }
              >
                Apply filters
              </button>

              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                style={
                  styles.clearButton
                }
              >
                Clear
              </button>
            </div>
          </form>
        </section>


        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>
                ServiceFlow reviews
              </h2>

              <p style={styles.panelText}>
                Showing {reviews.length} of{" "}
                {pagination.total} matching
                reviews.
              </p>
            </div>
          </div>


          {loading ? (
            <LoadingState />
          ) : reviews.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              style={
                styles.tableWrapper
              }
            >
              <table
                className="serviceflow-admin-reviews-table"
                style={styles.table}
              >
                <thead>
                  <tr>
                    <TableHeading>
                      Review
                    </TableHeading>

                    <TableHeading>
                      Rating
                    </TableHeading>

                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Artisan
                    </TableHeading>

                    <TableHeading>
                      Job
                    </TableHeading>

                    <TableHeading>
                      Date
                    </TableHeading>

                    <TableHeading>
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {reviews.map(
                    (review) => (
                      <ReviewRow
                        key={review.id}
                        review={review}
                        busy={
                          actionReviewId ===
                          review.id
                        }
                        onView={
                          handleViewReview
                        }
                        onDelete={
                          handleDeleteReview
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}


          <div style={styles.pagination}>
            <button
              type="button"
              onClick={
                handlePreviousPage
              }
              disabled={
                loading ||
                !pagination.has_previous
              }
              style={{
                ...styles.paginationButton,
                opacity:
                  loading ||
                  !pagination.has_previous
                    ? 0.5
                    : 1,
              }}
            >
              Previous
            </button>

            <span style={styles.pageText}>
              Page {pagination.page} of{" "}
              {pagination.pages || 1}
            </span>

            <button
              type="button"
              onClick={
                handleNextPage
              }
              disabled={
                loading ||
                !pagination.has_next
              }
              style={{
                ...styles.paginationButton,
                opacity:
                  loading ||
                  !pagination.has_next
                    ? 0.5
                    : 1,
              }}
            >
              Next
            </button>
          </div>
        </section>
      </div>


      {(selectedReview ||
        detailsLoading) && (
        <ReviewDetailsModal
          review={selectedReview}
          loading={detailsLoading}
          busy={
            selectedReview
              ? actionReviewId ===
                selectedReview.id
              : false
          }
          onClose={
            handleCloseDetails
          }
          onDelete={
            handleDeleteReview
          }
        />
      )}
    </main>
  );
}


function ReviewRow({
  review,
  busy,
  onView,
  onDelete,
}) {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>
        <strong style={styles.reviewId}>
          Review #{review.id}
        </strong>

        <p style={styles.commentPreview}>
          {review.comment?.trim()
            ? review.comment
            : "No written comment."}
        </p>
      </td>


      <td style={styles.tableCell}>
        <RatingStars
          rating={review.rating}
        />

        <span style={styles.ratingNumber}>
          {review.rating}/5
        </span>
      </td>


      <td style={styles.tableCell}>
        <PersonSummary
          person={review.customer}
          fallback={`Customer #${review.customer_id}`}
        />
      </td>


      <td style={styles.tableCell}>
        <PersonSummary
          person={review.artisan}
          fallback={`Artisan #${review.artisan_id}`}
        />
      </td>


      <td style={styles.tableCell}>
        {review.job ? (
          <>
            <strong
              style={styles.personName}
            >
              {review.job.title}
            </strong>

            <span
              style={styles.metaText}
            >
              Request #
              {review.job.id}
            </span>

            <span
              style={styles.metaText}
            >
              {review.job.category}
            </span>

            <span
              style={styles.metaText}
            >
              {formatLabel(
                review.job.status,
              )}
            </span>
          </>
        ) : (
          <span style={styles.metaText}>
            Job unavailable
          </span>
        )}
      </td>


      <td style={styles.tableCell}>
        <span style={styles.metaText}>
          {formatDate(
            review.created_at,
          )}
        </span>
      </td>


      <td style={styles.tableCell}>
        <div style={styles.actionStack}>
          <button
            type="button"
            onClick={() =>
              onView(review.id)
            }
            disabled={busy}
            style={styles.smallButton}
          >
            View details
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(review)
            }
            disabled={busy}
            style={{
              ...styles.deleteButton,
              opacity: busy
                ? 0.5
                : 1,
            }}
          >
            Delete review
          </button>

          {busy && (
            <span
              style={styles.busyText}
            >
              Deleting...
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}


function ReviewDetailsModal({
  review,
  loading,
  busy,
  onClose,
  onDelete,
}) {
  return (
    <div
      role="presentation"
      style={styles.modalBackdrop}
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-details-title"
        style={styles.modal}
      >
        {loading ? (
          <LoadingState />
        ) : review ? (
          <>
            <header
              style={styles.modalHeader}
            >
              <div>
                <p style={styles.eyebrow}>
                  Review #{review.id}
                </p>

                <h2
                  id="review-details-title"
                  style={styles.modalTitle}
                >
                  Marketplace Review
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={
                  styles.closeButton
                }
                aria-label="Close review details"
              >
                ×
              </button>
            </header>


            <div style={styles.modalBody}>
              <div style={styles.ratingPanel}>
                <RatingStars
                  rating={
                    review.rating
                  }
                  large
                />

                <strong
                  style={
                    styles.largeRating
                  }
                >
                  {review.rating} / 5
                </strong>

                <span
                  style={styles.metaText}
                >
                  Submitted{" "}
                  {formatDateTime(
                    review.created_at,
                  )}
                </span>
              </div>


              <div
                style={
                  styles.commentCard
                }
              >
                <h3
                  style={
                    styles.sectionTitle
                  }
                >
                  Review comment
                </h3>

                <p
                  style={
                    styles.fullComment
                  }
                >
                  {review.comment?.trim()
                    ? review.comment
                    : "No written comment was provided."}
                </p>
              </div>


              <div
                style={
                  styles.peopleGrid
                }
              >
                <PersonCard
                  title="Customer"
                  person={
                    review.customer
                  }
                  fallback={`Customer #${review.customer_id}`}
                />

                <PersonCard
                  title="Artisan"
                  person={
                    review.artisan
                  }
                  fallback={`Artisan #${review.artisan_id}`}
                />
              </div>


              <div style={styles.jobCard}>
                <h3
                  style={
                    styles.sectionTitle
                  }
                >
                  Linked service request
                </h3>

                {review.job ? (
                  <div
                    style={
                      styles.detailGrid
                    }
                  >
                    <DetailItem
                      label="Request"
                      value={`#${review.job.id}`}
                    />

                    <DetailItem
                      label="Title"
                      value={
                        review.job.title
                      }
                    />

                    <DetailItem
                      label="Category"
                      value={
                        review.job
                          .category
                      }
                    />

                    <DetailItem
                      label="Location"
                      value={
                        review.job
                          .location
                      }
                    />

                    <DetailItem
                      label="Budget"
                      value={formatCurrency(
                        review.job.budget,
                      )}
                    />

                    <DetailItem
                      label="Status"
                      value={formatLabel(
                        review.job.status,
                      )}
                    />

                    <DetailItem
                      label="Created"
                      value={formatDateTime(
                        review.job
                          .created_at,
                      )}
                    />

                    <DetailItem
                      label="Confirmed"
                      value={
                        review.job
                          .confirmed_at
                          ? formatDateTime(
                              review.job
                                .confirmed_at,
                            )
                          : "Not confirmed"
                      }
                    />
                  </div>
                ) : (
                  <p
                    style={
                      styles.fullComment
                    }
                  >
                    Linked service request
                    is unavailable.
                  </p>
                )}

                {review.job?.description && (
                  <p
                    style={
                      styles.jobDescription
                    }
                  >
                    {
                      review.job
                        .description
                    }
                  </p>
                )}
              </div>
            </div>


            <footer
              style={styles.modalFooter}
            >
              <p
                style={
                  styles.moderationNote
                }
              >
                Deleting this review
                removes only the feedback
                record. The customer,
                artisan, and service request
                remain intact.
              </p>

              <div
                style={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    onDelete(review)
                  }
                  disabled={busy}
                  style={{
                    ...styles.deleteButton,
                    opacity: busy
                      ? 0.5
                      : 1,
                  }}
                >
                  {busy
                    ? "Deleting..."
                    : "Delete review"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  style={
                    styles.primaryButton
                  }
                >
                  Close
                </button>
              </div>
            </footer>
          </>
        ) : null}
      </section>
    </div>
  );
}


function PersonSummary({
  person,
  fallback,
}) {
  if (!person) {
    return (
      <span style={styles.metaText}>
        {fallback}
      </span>
    );
  }

  return (
    <div>
      <strong style={styles.personName}>
        {person.full_name}
      </strong>

      <span style={styles.metaText}>
        ID #{person.id}
      </span>

      <span style={styles.metaText}>
        {person.email}
      </span>

      <span style={styles.metaText}>
        {person.city || "No city"}
      </span>
    </div>
  );
}


function PersonCard({
  title,
  person,
  fallback,
}) {
  return (
    <article style={styles.personCard}>
      <h3 style={styles.sectionTitle}>
        {title}
      </h3>

      {person ? (
        <>
          <strong
            style={styles.personName}
          >
            {person.full_name}
          </strong>

          <span style={styles.metaText}>
            ID #{person.id}
          </span>

          <span style={styles.metaText}>
            {person.email}
          </span>

          <span style={styles.metaText}>
            {person.phone ||
              "No phone number"}
          </span>

          <span style={styles.metaText}>
            {person.city ||
              "No city provided"}
          </span>

          <span style={styles.metaText}>
            Role:{" "}
            {formatLabel(
              person.role,
            )}
          </span>

          <span style={styles.metaText}>
            Account:{" "}
            {formatLabel(
              person.status,
            )}
          </span>

          <span style={styles.metaText}>
            {person.verified
              ? "Verified profile"
              : "Unverified profile"}
          </span>
        </>
      ) : (
        <p style={styles.fullComment}>
          {fallback}
        </p>
      )}
    </article>
  );
}


function RatingStars({
  rating,
  large = false,
}) {
  const safeRating = Math.max(
    0,
    Math.min(
      5,
      Number(rating || 0),
    ),
  );

  return (
    <span
      aria-label={`${safeRating} out of 5 stars`}
      style={{
        ...styles.stars,
        fontSize: large
          ? "28px"
          : "18px",
      }}
    >
      {"★".repeat(safeRating)}
      {"☆".repeat(5 - safeRating)}
    </span>
  );
}


function SummaryCard({
  label,
  value,
}) {
  return (
    <article style={styles.summaryCard}>
      <span style={styles.summaryLabel}>
        {label}
      </span>

      <strong style={styles.summaryValue}>
        {value}
      </strong>
    </article>
  );
}


function FilterField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
      </span>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        min={min}
        style={styles.input}
      />
    </label>
  );
}


function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        style={styles.input}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}


function DetailItem({
  label,
  value,
}) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>
        {label}
      </span>

      <strong style={styles.detailValue}>
        {value}
      </strong>
    </div>
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


function LoadingState() {
  return (
    <div style={styles.stateBox}>
      <div
        aria-hidden="true"
        style={styles.spinner}
      />

      <p style={styles.stateText}>
        Loading ServiceFlow reviews...
      </p>
    </div>
  );
}


function EmptyState() {
  return (
    <div style={styles.stateBox}>
      <h3 style={styles.emptyTitle}>
        No reviews found
      </h3>

      <p style={styles.stateText}>
        Try adjusting or clearing the
        current filters.
      </p>
    </div>
  );
}


function normaliseFilters(filters) {
  const payload = {};

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value === "" ||
        value === "all"
      ) {
        return;
      }

      payload[key] = value;
    },
  );

  return payload;
}


function getErrorMessage(
  error,
  fallback,
) {
  return (
    error.response?.data?.message ||
    error.message ||
    fallback
  );
}


function formatLabel(value = "") {
  if (!value) {
    return "Unknown";
  }

  const formatted = value
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  return (
    formatted.charAt(0).toUpperCase() +
    formatted.slice(1)
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


function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}


function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}


const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#f6f8fc",
    color: "#172033",
  },

  container: {
    width: "100%",
    maxWidth: "1480px",
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
    fontSize: "13px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 10px",
    fontSize: "36px",
    lineHeight: 1.15,
  },

  subtitle: {
    maxWidth: "760px",
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
  },

  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontWeight: "700",
    textDecoration: "none",
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

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  summaryCard: {
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 8px 24px rgba(15, 23, 42, 0.05)",
  },

  summaryLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },

  summaryValue: {
    color: "#0f172a",
    fontSize: "24px",
  },

  successAlert: {
    marginBottom: "20px",
    padding: "14px 16px",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    fontWeight: "700",
  },

  errorAlert: {
    marginBottom: "20px",
    padding: "14px 16px",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontWeight: "700",
  },

  panel: {
    marginBottom: "24px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
  },

  panelTitle: {
    margin: "0 0 6px",
    fontSize: "22px",
  },

  panelText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "16px",
  },

  field: {
    display: "grid",
    gap: "7px",
  },

  label: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "44px",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    outline: "none",
  },

  filterButtons: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },

  primaryButton: {
    minHeight: "44px",
    padding: "10px 16px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  clearButton: {
    minHeight: "44px",
    padding: "10px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontWeight: "800",
    cursor: "pointer",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1320px",
    borderCollapse: "collapse",
  },

  tableHeading: {
    padding: "13px 14px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "900",
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  tableRow: {
    borderBottom: "1px solid #e2e8f0",
  },

  tableCell: {
    padding: "16px 14px",
    verticalAlign: "top",
  },

  reviewId: {
    display: "block",
    marginBottom: "8px",
    color: "#0f172a",
  },

  commentPreview: {
    maxWidth: "280px",
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  stars: {
    color: "#f59e0b",
    letterSpacing: "2px",
    whiteSpace: "nowrap",
  },

  ratingNumber: {
    display: "block",
    marginTop: "6px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
  },

  personName: {
    display: "block",
    marginBottom: "4px",
    color: "#0f172a",
  },

  metaText: {
    display: "block",
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  actionStack: {
    display: "grid",
    gap: "8px",
    minWidth: "135px",
  },

  smallButton: {
    padding: "9px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "9px 11px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  busyText: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "800",
  },

  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px",
    marginTop: "24px",
  },

  paginationButton: {
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontWeight: "800",
    cursor: "pointer",
  },

  pageText: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },

  stateBox: {
    display: "grid",
    justifyItems: "center",
    gap: "12px",
    padding: "60px 20px",
    textAlign: "center",
  },

  spinner: {
    width: "38px",
    height: "38px",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    borderRadius: "999px",
    animation:
      "serviceflow-admin-reviews-spin 0.8s linear infinite",
  },

  stateText: {
    margin: 0,
    color: "#64748b",
  },

  emptyTitle: {
    margin: 0,
    color: "#0f172a",
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    backgroundColor:
      "rgba(15, 23, 42, 0.72)",
    overflowY: "auto",
  },

  modal: {
    width: "100%",
    maxWidth: "920px",
    maxHeight: "92vh",
    overflowY: "auto",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 30px 80px rgba(15, 23, 42, 0.3)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
  },

  modalTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "26px",
  },

  closeButton: {
    width: "40px",
    height: "40px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "24px",
    cursor: "pointer",
  },

  modalBody: {
    display: "grid",
    gap: "20px",
    padding: "24px",
  },

  ratingPanel: {
    padding: "18px",
    border: "1px solid #fde68a",
    borderRadius: "14px",
    backgroundColor: "#fffbeb",
  },

  largeRating: {
    display: "block",
    marginTop: "8px",
    color: "#92400e",
    fontSize: "22px",
  },

  commentCard: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },

  sectionTitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "16px",
  },

  fullComment: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.75,
  },

  peopleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },

  personCard: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
  },

  jobCard: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },

  detailItem: {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
  },

  detailLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
  },

  detailValue: {
    color: "#0f172a",
  },

  jobDescription: {
    margin: "18px 0 0",
    paddingTop: "16px",
    borderTop: "1px solid #e2e8f0",
    color: "#475569",
    lineHeight: 1.7,
  },

  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },

  moderationNote: {
    maxWidth: "520px",
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  modalActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
};


const responsiveStyles = `
  @keyframes serviceflow-admin-reviews-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1100px) {
    .serviceflow-admin-reviews-filter-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 650px) {
    .serviceflow-admin-reviews-filter-grid {
      grid-template-columns:
        1fr !important;
    }

    .serviceflow-admin-reviews-table {
      min-width: 1180px !important;
    }
  }
`;


if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-admin-reviews-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-admin-reviews-styles";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}


export default AdminReviews;