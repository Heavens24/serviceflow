import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import serviceRequestService from "../services/serviceRequestService";

const ALL_FILTERS = {
  search: "",
  category: "all",
  location: "all",
  budget: "all",
};

function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(ALL_FILTERS);

  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result =
          await serviceRequestService.getMarketplaceJobs();

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load marketplace jobs.",
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
            "Unable to load marketplace jobs. Please try again.",
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

  const categories = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.category?.trim())
          .filter(Boolean),
      ),
    ].sort((first, second) =>
      first.localeCompare(second),
    );
  }, [jobs]);

  const locations = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.location?.trim())
          .filter(Boolean),
      ),
    ].sort((first, second) =>
      first.localeCompare(second),
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch =
      filters.search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          job.title,
          job.description,
          job.category,
          job.location,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesCategory =
        filters.category === "all" ||
        job.category === filters.category;

      const matchesLocation =
        filters.location === "all" ||
        job.location === filters.location;

      const budget = Number(job.budget || 0);

      let matchesBudget = true;

      if (filters.budget === "under-500") {
        matchesBudget = budget < 500;
      }

      if (filters.budget === "500-1000") {
        matchesBudget =
          budget >= 500 && budget <= 1000;
      }

      if (filters.budget === "over-1000") {
        matchesBudget = budget > 1000;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation &&
        matchesBudget
      );
    });
  }, [jobs, filters]);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.location !== "all" ||
    filters.budget !== "all";

  const resultLabel =
    filteredJobs.length === 1
      ? "1 matching opportunity"
      : `${filteredJobs.length} matching opportunities`;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(ALL_FILTERS);
  };

  const handleAcceptJob = async (jobId) => {
    try {
      setAcceptingId(jobId);
      setErrorMessage("");
      setSuccessMessage("");

      const result =
        await serviceRequestService.acceptServiceRequest(
          jobId,
        );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to accept this job.",
        );
        return;
      }

      setJobs((currentJobs) =>
        currentJobs.filter(
          (job) => job.id !== jobId,
        ),
      );

      setSuccessMessage(
        result.message ||
          "Job accepted successfully.",
      );

      setTimeout(() => {
        navigate("/my-jobs");
      }, 1200);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to accept this job. Please try again.",
      );
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading available jobs...
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
            Only artisan accounts can browse and accept jobs.
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
              Artisan Marketplace
            </p>

            <h1 style={styles.heading}>
              Available service requests
            </h1>

            <p style={styles.subheading}>
              Search open opportunities and filter them by
              category, location, and budget.
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
              to="/my-jobs"
              style={styles.primaryButton}
            >
              View my jobs
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

        <section style={styles.filtersCard}>
          <div style={styles.filtersHeader}>
            <div>
              <h2 style={styles.filtersHeading}>
                Find the right opportunity
              </h2>

              <p style={styles.filtersText}>
                Results update immediately as you change
                the filters.
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={styles.clearButton}
              >
                Clear filters
              </button>
            )}
          </div>

          <div style={styles.filtersGrid}>
            <div style={styles.fieldGroup}>
              <label
                htmlFor="marketplace-search"
                style={styles.filterLabel}
              >
                Search
              </label>

              <input
                id="marketplace-search"
                name="search"
                type="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by title, service, or location"
                style={styles.filterControl}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="marketplace-category"
                style={styles.filterLabel}
              >
                Category
              </label>

              <select
                id="marketplace-category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                style={styles.filterControl}
              >
                <option value="all">
                  All categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="marketplace-location"
                style={styles.filterLabel}
              >
                Location
              </label>

              <select
                id="marketplace-location"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                style={styles.filterControl}
              >
                <option value="all">
                  All locations
                </option>

                {locations.map((location) => (
                  <option
                    key={location}
                    value={location}
                  >
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label
                htmlFor="marketplace-budget"
                style={styles.filterLabel}
              >
                Budget
              </label>

              <select
                id="marketplace-budget"
                name="budget"
                value={filters.budget}
                onChange={handleFilterChange}
                style={styles.filterControl}
              >
                <option value="all">
                  Any budget
                </option>

                <option value="under-500">
                  Under R500
                </option>

                <option value="500-1000">
                  R500 – R1,000
                </option>

                <option value="over-1000">
                  Above R1,000
                </option>
              </select>
            </div>
          </div>
        </section>

        <section style={styles.summaryCard}>
          <div>
            <span style={styles.summaryLabel}>
              {hasActiveFilters
                ? "Filtered results"
                : "Open opportunities"}
            </span>

            <p style={styles.summaryText}>
              {resultLabel}
            </p>
          </div>

          <strong style={styles.summaryValue}>
            {filteredJobs.length}
          </strong>
        </section>

        {jobs.length === 0 ? (
          <section style={styles.emptyCard}>
            <h2 style={styles.emptyHeading}>
              No open jobs right now
            </h2>

            <p style={styles.emptyText}>
              Check back later for new service requests.
            </p>
          </section>
        ) : filteredJobs.length === 0 ? (
          <section style={styles.emptyCard}>
            <h2 style={styles.emptyHeading}>
              No jobs match your filters
            </h2>

            <p style={styles.emptyText}>
              Try changing your search, category,
              location, or budget selection.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              style={styles.emptyActionButton}
            >
              Clear filters
            </button>
          </section>
        ) : (
          <section style={styles.jobsGrid}>
            {filteredJobs.map((job) => (
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

                  <span style={styles.statusBadge}>
                    Open
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
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleAcceptJob(job.id)
                  }
                  disabled={acceptingId === job.id}
                  style={{
                    ...styles.acceptButton,
                    opacity:
                      acceptingId === job.id
                        ? 0.7
                        : 1,
                    cursor:
                      acceptingId === job.id
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {acceptingId === job.id
                    ? "Accepting job..."
                    : "Accept job"}
                </button>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(Number(value || 0));
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

  filtersCard: {
    marginBottom: "22px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
  },

  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  filtersHeading: {
    margin: "0 0 6px",
    color: "#0f172a",
    fontSize: "20px",
  },

  filtersText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },

  clearButton: {
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontWeight: "700",
    cursor: "pointer",
  },

  filtersGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },

  fieldGroup: {
    minWidth: 0,
  },

  filterLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
  },

  filterControl: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
  },

  summaryCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    marginBottom: "24px",
    padding: "18px 22px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
  },

  summaryLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#64748b",
    fontWeight: "700",
  },

  summaryText: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
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
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "800",
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

  acceptButton: {
    width: "100%",
    padding: "13px 18px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
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
    margin: "0 0 18px",
    color: "#64748b",
  },

  emptyActionButton: {
    padding: "11px 17px",
    border: "none",
    borderRadius: "9px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
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

export default Marketplace;