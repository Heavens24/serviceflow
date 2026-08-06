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
  status: "all",
  category: "all",
  location: "all",
  min_budget: "",
  max_budget: "",
  sort: "newest",
};

const JOB_STATUSES = [
  "open",
  "accepted",
  "in_progress",
  "completed",
  "confirmed",
  "cancelled",
];

function AdminJobs() {
  const { user: currentAdmin } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(
    INITIAL_FILTERS,
  );

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(INITIAL_FILTERS);

  const [filterOptions, setFilterOptions] =
    useState({
      statuses: [],
      categories: [],
      locations: [],
      sorts: [],
    });

  const [summary, setSummary] = useState({
    matching_jobs: 0,
    matching_value: 0,
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

  const [actionJobId, setActionJobId] =
    useState(null);

  const [selectedJob, setSelectedJob] =
    useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadJobs = useCallback(
    async (
      page = 1,
      nextFilters = appliedFilters,
    ) => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await adminService.getJobs({
            ...normaliseFilters(
              nextFilters,
            ),
            page,
            per_page:
              pagination.per_page,
          });

        setJobs(response.jobs || []);

        setSummary(
          response.summary || {
            matching_jobs: 0,
            matching_value: 0,
          },
        );

        setPagination((current) => ({
          ...current,
          ...(response.pagination || {}),
        }));

        setFilterOptions(
          response.filter_options || {
            statuses: [],
            categories: [],
            locations: [],
            sorts: [],
          },
        );
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load jobs.",
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
    loadJobs(
      1,
      appliedFilters,
    );
  }, [
    appliedFilters,
    loadJobs,
  ]);

  const refreshCurrentPage = async () => {
    await loadJobs(
      pagination.page,
      appliedFilters,
    );
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

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

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(
      INITIAL_FILTERS,
    );
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleViewJob = async (jobId) => {
    try {
      setDetailsLoading(true);
      setErrorMessage("");

      const response =
        await adminService.getJob(
          jobId,
        );

      setSelectedJob(
        response.job || null,
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load job details.",
        ),
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    if (actionJobId) {
      return;
    }

    setSelectedJob(null);
  };

  const handleStatusChange = async (
    job,
    status,
  ) => {
    if (job.status === status) {
      return;
    }

    const confirmed = window.confirm(
      `Change job #${job.id} from ${formatLabel(
        job.status,
      )} to ${formatLabel(status)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionJobId(job.id);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminService.updateJobStatus(
          job.id,
          status,
        );

      setSuccessMessage(
        response.message ||
          "Job status updated successfully.",
      );

      if (
        selectedJob?.id === job.id
      ) {
        setSelectedJob(
          response.job || null,
        );
      }

      await refreshCurrentPage();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to update the job status.",
        ),
      );
    } finally {
      setActionJobId(null);
    }
  };

  const handleDeleteJob = async (job) => {
    if (
      !["open", "cancelled"].includes(
        job.status,
      )
    ) {
      setErrorMessage(
        "Only open or cancelled jobs can be deleted.",
      );

      return;
    }

    const confirmed = window.confirm(
      [
        `Permanently delete job #${job.id}?`,
        "",
        `"${job.title}"`,
        "",
        "This action cannot be undone.",
      ].join("\n"),
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionJobId(job.id);
      setErrorMessage("");
      setSuccessMessage("");

      const response =
        await adminService.deleteJob(
          job.id,
        );

      setSuccessMessage(
        response.message ||
          "Job deleted successfully.",
      );

      if (
        selectedJob?.id === job.id
      ) {
        setSelectedJob(null);
      }

      const nextPage =
        jobs.length === 1 &&
        pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadJobs(
        nextPage,
        appliedFilters,
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to delete the job.",
        ),
      );
    } finally {
      setActionJobId(null);
    }
  };

  const handlePreviousPage = () => {
    if (
      loading ||
      !pagination.has_previous
    ) {
      return;
    }

    loadJobs(
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

    loadJobs(
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
              Job Management
            </h1>

            <p style={styles.subtitle}>
              Monitor service requests,
              inspect marketplace activity,
              moderate statuses, and remove
              fraudulent or inappropriate
              listings.
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
                : "Refresh jobs"}
            </button>
          </div>
        </header>

        <section style={styles.summaryGrid}>
          <SummaryCard
            label="Matching jobs"
            value={summary.matching_jobs}
          />

          <SummaryCard
            label="Matching value"
            value={formatCurrency(
              summary.matching_value,
            )}
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
                Filter jobs by marketplace
                details, budget, and workflow
                state.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleFilterSubmit}
            className="serviceflow-admin-jobs-filter-grid"
            style={styles.filterGrid}
          >
            <FilterField
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Title, description, category or location"
            />

            <SelectField
              label="Status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              options={[
                {
                  value: "all",
                  label: "All statuses",
                },
                ...mergeOptions(
                  filterOptions.statuses,
                  JOB_STATUSES,
                ).map((status) => ({
                  value: status,
                  label:
                    formatLabel(status),
                })),
              ]}
            />

            <SelectField
              label="Category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              options={[
                {
                  value: "all",
                  label: "All categories",
                },
                ...filterOptions.categories.map(
                  (category) => ({
                    value: category,
                    label: category,
                  }),
                ),
              ]}
            />

            <SelectField
              label="Location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              options={[
                {
                  value: "all",
                  label: "All locations",
                },
                ...filterOptions.locations.map(
                  (location) => ({
                    value: location,
                    label: location,
                  }),
                ),
              ]}
            />

            <FilterField
              label="Minimum budget"
              name="min_budget"
              value={filters.min_budget}
              onChange={handleFilterChange}
              placeholder="0"
              type="number"
              min="0"
            />

            <FilterField
              label="Maximum budget"
              name="max_budget"
              value={filters.max_budget}
              onChange={handleFilterChange}
              placeholder="5000"
              type="number"
              min="0"
            />

            <SelectField
              label="Sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
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
                  value: "budget_high",
                  label:
                    "Highest budget first",
                },
                {
                  value: "budget_low",
                  label:
                    "Lowest budget first",
                },
              ]}
            />

            <div style={styles.filterButtons}>
              <button
                type="submit"
                style={styles.primaryButton}
              >
                Apply filters
              </button>

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                style={styles.clearButton}
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
                Marketplace jobs
              </h2>

              <p style={styles.panelText}>
                Showing {jobs.length} of{" "}
                {pagination.total} matching
                service requests.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : jobs.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={styles.tableWrapper}>
              <table
                className="serviceflow-admin-jobs-table"
                style={styles.table}
              >
                <thead>
                  <tr>
                    <TableHeading>
                      Job
                    </TableHeading>

                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Artisan
                    </TableHeading>

                    <TableHeading>
                      Budget
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Activity
                    </TableHeading>

                    <TableHeading>
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job) => (
                    <JobRow
                      key={job.id}
                      job={job}
                      busy={
                        actionJobId === job.id
                      }
                      onView={handleViewJob}
                      onStatusChange={
                        handleStatusChange
                      }
                      onDelete={
                        handleDeleteJob
                      }
                    />
                  ))}
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
              onClick={handleNextPage}
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

      {(selectedJob || detailsLoading) && (
        <JobDetailsModal
          job={selectedJob}
          loading={detailsLoading}
          busy={
            selectedJob
              ? actionJobId ===
                selectedJob.id
              : false
          }
          onClose={handleCloseDetails}
          onStatusChange={
            handleStatusChange
          }
          onDelete={handleDeleteJob}
        />
      )}
    </main>
  );
}

function JobRow({
  job,
  busy,
  onView,
  onStatusChange,
  onDelete,
}) {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>
        <strong style={styles.jobTitle}>
          {job.title}
        </strong>

        <span style={styles.metaText}>
          Request #{job.id}
        </span>

        <span style={styles.metaText}>
          {job.category}
        </span>

        <span style={styles.metaText}>
          {job.location}
        </span>

        <span style={styles.metaText}>
          Created{" "}
          {formatDate(job.created_at)}
        </span>
      </td>

      <td style={styles.tableCell}>
        <PersonSummary
          person={job.customer}
          fallback={`Customer #${job.customer_id}`}
        />
      </td>

      <td style={styles.tableCell}>
        <PersonSummary
          person={job.artisan}
          fallback="Not assigned"
        />
      </td>

      <td style={styles.tableCell}>
        <strong style={styles.budgetText}>
          {formatCurrency(job.budget)}
        </strong>
      </td>

      <td style={styles.tableCell}>
        <StatusBadge
          status={job.status}
        />

        <select
          value={job.status}
          disabled={busy}
          onChange={(event) =>
            onStatusChange(
              job,
              event.target.value,
            )
          }
          aria-label={`Status for job ${job.id}`}
          style={styles.statusSelect}
        >
          {JOB_STATUSES.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {formatLabel(status)}
              </option>
            ),
          )}
        </select>
      </td>

      <td style={styles.tableCell}>
        <span style={styles.metaText}>
          {job.message_count || 0} messages
        </span>

        <span style={styles.metaText}>
          {job.has_review
            ? "Review submitted"
            : "No review"}
        </span>
      </td>

      <td style={styles.tableCell}>
        <div style={styles.actionStack}>
          <button
            type="button"
            onClick={() =>
              onView(job.id)
            }
            disabled={busy}
            style={styles.smallButton}
          >
            View details
          </button>

          <button
            type="button"
            onClick={() =>
              onDelete(job)
            }
            disabled={
              busy ||
              ![
                "open",
                "cancelled",
              ].includes(job.status)
            }
            style={{
              ...styles.deleteButton,
              opacity:
                busy ||
                ![
                  "open",
                  "cancelled",
                ].includes(job.status)
                  ? 0.5
                  : 1,
            }}
          >
            Delete job
          </button>

          {busy && (
            <span style={styles.busyText}>
              Updating...
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

function JobDetailsModal({
  job,
  loading,
  busy,
  onClose,
  onStatusChange,
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
        aria-labelledby="job-details-title"
        style={styles.modal}
      >
        {loading ? (
          <LoadingState />
        ) : job ? (
          <>
            <header style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>
                  Job #{job.id}
                </p>

                <h2
                  id="job-details-title"
                  style={styles.modalTitle}
                >
                  {job.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={styles.closeButton}
                aria-label="Close job details"
              >
                ×
              </button>
            </header>

            <div style={styles.modalBody}>
              <div style={styles.detailGrid}>
                <DetailItem
                  label="Category"
                  value={job.category}
                />

                <DetailItem
                  label="Location"
                  value={job.location}
                />

                <DetailItem
                  label="Budget"
                  value={formatCurrency(
                    job.budget,
                  )}
                />

                <DetailItem
                  label="Status"
                  value={formatLabel(
                    job.status,
                  )}
                />

                <DetailItem
                  label="Messages"
                  value={
                    job.message_count || 0
                  }
                />

                <DetailItem
                  label="Review"
                  value={
                    job.has_review
                      ? "Submitted"
                      : "Not submitted"
                  }
                />
              </div>

              <div style={styles.descriptionCard}>
                <h3 style={styles.sectionTitle}>
                  Description
                </h3>

                <p style={styles.description}>
                  {job.description}
                </p>
              </div>

              <div style={styles.peopleGrid}>
                <PersonCard
                  title="Customer"
                  person={job.customer}
                  fallback={`Customer #${job.customer_id}`}
                />

                <PersonCard
                  title="Artisan"
                  person={job.artisan}
                  fallback="No artisan has accepted this job."
                />
              </div>

              <div style={styles.timelineCard}>
                <h3 style={styles.sectionTitle}>
                  Job timeline
                </h3>

                <TimelineItem
                  label="Created"
                  value={job.created_at}
                />

                <TimelineItem
                  label="Accepted"
                  value={job.accepted_at}
                />

                <TimelineItem
                  label="Started"
                  value={job.started_at}
                />

                <TimelineItem
                  label="Completed"
                  value={job.completed_at}
                />

                <TimelineItem
                  label="Confirmed"
                  value={job.confirmed_at}
                />
              </div>
            </div>

            <footer style={styles.modalFooter}>
              <label style={styles.modalStatusField}>
                <span style={styles.label}>
                  Moderation status
                </span>

                <select
                  value={job.status}
                  disabled={busy}
                  onChange={(event) =>
                    onStatusChange(
                      job,
                      event.target.value,
                    )
                  }
                  style={styles.input}
                >
                  {JOB_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatLabel(
                          status,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() =>
                    onDelete(job)
                  }
                  disabled={
                    busy ||
                    ![
                      "open",
                      "cancelled",
                    ].includes(job.status)
                  }
                  style={{
                    ...styles.deleteButton,
                    opacity:
                      busy ||
                      ![
                        "open",
                        "cancelled",
                      ].includes(job.status)
                        ? 0.5
                        : 1,
                  }}
                >
                  Delete job
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  style={styles.primaryButton}
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
            {person.phone ||
              "No phone number"}
          </span>

          <span style={styles.metaText}>
            {person.city ||
              "No city provided"}
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
        <p style={styles.description}>
          {fallback}
        </p>
      )}
    </article>
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

function TimelineItem({
  label,
  value,
}) {
  return (
    <div style={styles.timelineItem}>
      <span style={styles.timelineDot} />

      <div>
        <strong style={styles.personName}>
          {label}
        </strong>

        <span style={styles.metaText}>
          {value
            ? formatDateTime(value)
            : "Not reached"}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusStyles = {
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

  return (
    <span
      style={{
        ...styles.badge,
        ...(statusStyles[status] ||
          statusStyles.open),
      }}
    >
      {formatLabel(status)}
    </span>
  );
}

function TableHeading({ children }) {
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
        Loading ServiceFlow jobs...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.stateBox}>
      <h3 style={styles.emptyTitle}>
        No jobs found
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

function mergeOptions(
  currentOptions = [],
  requiredOptions = [],
) {
  return [
    ...new Set([
      ...currentOptions,
      ...requiredOptions,
    ]),
  ];
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
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    },
  ).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
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
    return "Not reached";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
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
    backgroundColor:
      "var(--sf-background, #f6f8fc)",
    color:
      "var(--sf-text, #172033)",
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
      "repeat(auto-fit, minmax(210px, 1fr))",
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

  jobTitle: {
    display: "block",
    maxWidth: "240px",
    marginBottom: "6px",
    color: "#0f172a",
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

  budgetText: {
    color: "#0f172a",
    whiteSpace: "nowrap",
  },

  badge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  statusSelect: {
    display: "block",
    minWidth: "145px",
    marginTop: "10px",
    padding: "9px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#334155",
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
      "serviceflow-admin-jobs-spin 0.8s linear infinite",
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

  descriptionCard: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },

  sectionTitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "16px",
  },

  description: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.7,
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

  timelineCard: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
  },

  timelineItem: {
    display: "flex",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
  },

  timelineDot: {
    width: "11px",
    height: "11px",
    marginTop: "5px",
    flexShrink: 0,
    borderRadius: "999px",
    backgroundColor: "#2563eb",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },

  modalStatusField: {
    display: "grid",
    minWidth: "220px",
    gap: "7px",
  },

  modalActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
};

const responsiveStyles = `
  @keyframes serviceflow-admin-jobs-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1100px) {
    .serviceflow-admin-jobs-filter-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 650px) {
    .serviceflow-admin-jobs-filter-grid {
      grid-template-columns:
        1fr !important;
    }

    .serviceflow-admin-jobs-table {
      min-width: 1180px !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-admin-jobs-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-admin-jobs-styles";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default AdminJobs;