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
  role: "all",
  status: "all",
  city: "",
  verified: "all",
  email_verified: "all",
  is_pro: "all",
};

function AdminUsers() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(
    INITIAL_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] =
    useState(INITIAL_FILTERS);

  const [filterOptions, setFilterOptions] =
    useState({
      roles: [],
      statuses: [],
      cities: [],
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
  const [actionUserId, setActionUserId] =
    useState(null);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadUsers = useCallback(
    async (
      page = 1,
      nextFilters = appliedFilters,
    ) => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await adminService.getUsers({
            ...normaliseFilters(
              nextFilters,
            ),
            page,
            per_page:
              pagination.per_page,
          });

        setUsers(response.users || []);

        setPagination((current) => ({
          ...current,
          ...(response.pagination || {}),
        }));

        setFilterOptions(
          response.filter_options || {
            roles: [],
            statuses: [],
            cities: [],
          },
        );
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load users.",
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
    let cancelled = false;

    const loadInitialUsers = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await adminService.getUsers({
            ...normaliseFilters(
              appliedFilters,
            ),
            page: 1,
            per_page:
              pagination.per_page,
          });

        if (cancelled) {
          return;
        }

        setUsers(
          response.users || [],
        );

        setPagination((current) => ({
          ...current,
          ...(response.pagination || {}),
        }));

        setFilterOptions(
          response.filter_options || {
            roles: [],
            statuses: [],
            cities: [],
          },
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load users.",
          ),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, [
    appliedFilters,
    pagination.per_page,
  ]);

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

  const refreshCurrentPage = async () => {
    await loadUsers(
      pagination.page,
      appliedFilters,
    );
  };

  const runUserAction = async (
    userId,
    action,
  ) => {
    try {
      setActionUserId(userId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await action();

      setSuccessMessage(
        response.message ||
          "User updated successfully.",
      );

      await refreshCurrentPage();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to update the user.",
        ),
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handleStatusChange = (
    selectedUser,
    status,
  ) => {
    if (
      selectedUser.id ===
        currentAdmin?.id &&
      status !== "active"
    ) {
      setErrorMessage(
        "You cannot suspend or ban your own administrator account.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Change ${selectedUser.full_name}'s account status to ${status}?`,
    );

    if (!confirmed) {
      return;
    }

    runUserAction(
      selectedUser.id,
      () =>
        adminService.updateUserStatus(
          selectedUser.id,
          status,
        ),
    );
  };

  const handleRoleChange = (
    selectedUser,
    role,
  ) => {
    if (
      selectedUser.id ===
      currentAdmin?.id
    ) {
      setErrorMessage(
        "You cannot change your own administrator role.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Change ${selectedUser.full_name}'s role to ${role}?`,
    );

    if (!confirmed) {
      return;
    }

    runUserAction(
      selectedUser.id,
      () =>
        adminService.updateUserRole(
          selectedUser.id,
          role,
        ),
    );
  };

  const handleProfileVerification =
    (selectedUser) => {
      const nextValue =
        !selectedUser.verified;

      runUserAction(
        selectedUser.id,
        () =>
          adminService
            .updateUserVerification(
              selectedUser.id,
              {
                verified: nextValue,
              },
            ),
      );
    };

  const handleEmailVerification =
    (selectedUser) => {
      const nextValue =
        !selectedUser.email_verified;

      runUserAction(
        selectedUser.id,
        () =>
          adminService
            .updateUserVerification(
              selectedUser.id,
              {
                email_verified:
                  nextValue,
              },
            ),
      );
    };

  const handlePreviousPage = () => {
    if (
      loading ||
      !pagination.has_previous
    ) {
      return;
    }

    loadUsers(
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

    loadUsers(
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
              User Management
            </h1>

            <p style={styles.subtitle}>
              Search, verify, suspend,
              activate, ban, and manage
              account roles across the
              marketplace.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to="/admin"
              style={styles.secondaryLink}
            >
              Admin dashboard
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
                : "Refresh users"}
            </button>
          </div>
        </header>

        <section style={styles.summaryGrid}>
          <SummaryCard
            label="Users found"
            value={pagination.total}
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
                Narrow the user list using
                account and verification
                details.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleFilterSubmit}
            className="serviceflow-admin-filter-grid"
            style={styles.filterGrid}
          >
            <FilterField
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Name, email, phone or city"
            />

            <SelectField
              label="Role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              options={[
                {
                  value: "all",
                  label: "All roles",
                },
                ...filterOptions.roles.map(
                  (role) => ({
                    value: role,
                    label:
                      capitalise(role),
                  }),
                ),
              ]}
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
                ...filterOptions.statuses.map(
                  (status) => ({
                    value: status,
                    label:
                      capitalise(status),
                  }),
                ),
              ]}
            />

            <SelectField
              label="City"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              options={[
                {
                  value: "",
                  label: "All cities",
                },
                ...filterOptions.cities.map(
                  (city) => ({
                    value: city,
                    label: city,
                  }),
                ),
              ]}
            />

            <SelectField
              label="Profile verified"
              name="verified"
              value={filters.verified}
              onChange={handleFilterChange}
              options={
                BOOLEAN_FILTER_OPTIONS
              }
            />

            <SelectField
              label="Email verified"
              name="email_verified"
              value={
                filters.email_verified
              }
              onChange={handleFilterChange}
              options={
                BOOLEAN_FILTER_OPTIONS
              }
            />

            <SelectField
              label="Pro account"
              name="is_pro"
              value={filters.is_pro}
              onChange={handleFilterChange}
              options={
                BOOLEAN_FILTER_OPTIONS
              }
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
                ServiceFlow users
              </h2>

              <p style={styles.panelText}>
                Showing {users.length} of{" "}
                {pagination.total} matching
                accounts.
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : users.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={styles.tableWrapper}>
              <table
                className="serviceflow-admin-users-table"
                style={styles.table}
              >
                <thead>
                  <tr>
                    <TableHeading>
                      User
                    </TableHeading>

                    <TableHeading>
                      Contact
                    </TableHeading>

                    <TableHeading>
                      Role
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Verification
                    </TableHeading>

                    <TableHeading>
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {users.map(
                    (selectedUser) => (
                      <UserRow
                        key={
                          selectedUser.id
                        }
                        user={selectedUser}
                        currentAdminId={
                          currentAdmin?.id
                        }
                        busy={
                          actionUserId ===
                          selectedUser.id
                        }
                        onStatusChange={
                          handleStatusChange
                        }
                        onRoleChange={
                          handleRoleChange
                        }
                        onProfileVerification={
                          handleProfileVerification
                        }
                        onEmailVerification={
                          handleEmailVerification
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
    </main>
  );
}

function UserRow({
  user,
  currentAdminId,
  busy,
  onStatusChange,
  onRoleChange,
  onProfileVerification,
  onEmailVerification,
}) {
  const isCurrentAdmin =
    user.id === currentAdminId;

  return (
    <tr style={styles.tableRow}>
      <td style={styles.tableCell}>
        <div style={styles.userIdentity}>
          <div style={styles.avatar}>
            {getInitials(
              user.full_name,
            )}
          </div>

          <div>
            <strong style={styles.userName}>
              {user.full_name}
            </strong>

            <span style={styles.userMeta}>
              ID #{user.id}
              {isCurrentAdmin
                ? " • You"
                : ""}
            </span>

            <span style={styles.userMeta}>
              Joined{" "}
              {formatDate(
                user.created_at,
              )}
            </span>
          </div>
        </div>
      </td>

      <td style={styles.tableCell}>
        <span style={styles.contactValue}>
          {user.email}
        </span>

        <span style={styles.userMeta}>
          {user.phone ||
            "No phone number"}
        </span>

        <span style={styles.userMeta}>
          {user.city ||
            "No city provided"}
        </span>
      </td>

      <td style={styles.tableCell}>
        <select
          value={user.role}
          disabled={busy || isCurrentAdmin}
          onChange={(event) =>
            onRoleChange(
              user,
              event.target.value,
            )
          }
          aria-label={`Role for ${user.full_name}`}
          style={styles.inlineSelect}
        >
          <option value="customer">
            Customer
          </option>

          <option value="artisan">
            Artisan
          </option>

          <option value="admin">
            Admin
          </option>
        </select>
      </td>

      <td style={styles.tableCell}>
        <StatusBadge
          status={user.status}
        />

        <select
          value={user.status}
          disabled={
            busy || isCurrentAdmin
          }
          onChange={(event) =>
            onStatusChange(
              user,
              event.target.value,
            )
          }
          aria-label={`Status for ${user.full_name}`}
          style={{
            ...styles.inlineSelect,
            marginTop: "10px",
          }}
        >
          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>

          <option value="banned">
            Banned
          </option>
        </select>
      </td>

      <td style={styles.tableCell}>
        <VerificationBadge
          label="Profile"
          verified={user.verified}
        />

        <VerificationBadge
          label="Email"
          verified={
            user.email_verified
          }
        />

        <VerificationBadge
          label="Pro"
          verified={user.is_pro}
        />
      </td>

      <td style={styles.tableCell}>
        <div style={styles.actionStack}>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onProfileVerification(
                user,
              )
            }
            style={styles.smallButton}
          >
            {user.verified
              ? "Remove profile verification"
              : "Verify profile"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onEmailVerification(
                user,
              )
            }
            style={styles.smallButton}
          >
            {user.email_verified
              ? "Mark email unverified"
              : "Verify email"}
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

function StatusBadge({ status }) {
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
  };

  return (
    <span
      style={{
        ...styles.badge,
        ...(statusStyles[status] ||
          statusStyles.suspended),
      }}
    >
      {capitalise(status)}
    </span>
  );
}

function VerificationBadge({
  label,
  verified,
}) {
  return (
    <span
      style={{
        ...styles.verificationBadge,
        backgroundColor: verified
          ? "#dcfce7"
          : "#f1f5f9",
        color: verified
          ? "#166534"
          : "#64748b",
      }}
    >
      {verified ? "✓" : "–"} {label}
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
        Loading ServiceFlow users...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.stateBox}>
      <h3 style={styles.emptyTitle}>
        No users found
      </h3>

      <p style={styles.stateText}>
        Try changing or clearing the
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

function capitalise(value = "") {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value
      .slice(1)
      .replaceAll("_", " ")
  );
}

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "SF";
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

const BOOLEAN_FILTER_OPTIONS = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "true",
    label: "Yes",
  },
  {
    value: "false",
    label: "No",
  },
];

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
    maxWidth: "1380px",
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
    maxWidth: "700px",
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
      "repeat(auto-fit, minmax(200px, 1fr))",
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
    minWidth: "1100px",
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

  userIdentity: {
    display: "flex",
    gap: "12px",
  },

  avatar: {
    display: "grid",
    placeItems: "center",
    width: "42px",
    height: "42px",
    flexShrink: 0,
    borderRadius: "12px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "900",
  },

  userName: {
    display: "block",
    marginBottom: "4px",
    color: "#0f172a",
  },

  userMeta: {
    display: "block",
    marginTop: "3px",
    color: "#64748b",
    fontSize: "12px",
  },

  contactValue: {
    display: "block",
    marginBottom: "5px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },

  inlineSelect: {
    minWidth: "130px",
    padding: "9px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#334155",
  },

  badge: {
    display: "inline-flex",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },

  verificationBadge: {
    display: "flex",
    width: "fit-content",
    marginBottom: "6px",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
  },

  actionStack: {
    display: "grid",
    gap: "8px",
    minWidth: "180px",
  },

  smallButton: {
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    color: "#334155",
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
      "serviceflow-admin-users-spin 0.8s linear infinite",
  },

  stateText: {
    margin: 0,
    color: "#64748b",
  },

  emptyTitle: {
    margin: 0,
    color: "#0f172a",
  },
};

const responsiveStyles = `
  @keyframes serviceflow-admin-users-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1100px) {
    .serviceflow-admin-filter-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 650px) {
    .serviceflow-admin-filter-grid {
      grid-template-columns:
        1fr !important;
    }

    .serviceflow-admin-users-table {
      min-width: 980px !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-admin-users-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-admin-users-styles";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default AdminUsers;