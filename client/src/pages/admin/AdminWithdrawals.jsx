import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import adminService from "../../services/adminService";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "approved",
  "processing",
  "paid",
  "failed",
  "rejected",
];

function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] =
    useState([]);

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState(null);

  const [activeAction, setActiveAction] =
    useState("");

  const [rejectingId, setRejectingId] =
    useState(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [otpWithdrawalId, setOtpWithdrawalId] =
    useState(null);

  const [otp, setOtp] =
    useState("");

  const [auditOpenId, setAuditOpenId] =
    useState(null);

  const [auditEvents, setAuditEvents] =
    useState({});

  const [auditLoadingId, setAuditLoadingId] =
    useState(null);

  const [auditErrors, setAuditErrors] =
    useState({});

  const loadWithdrawals =
    useCallback(
      async ({
        quiet = false,
      } = {}) => {
        try {
          if (quiet) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setErrorMessage("");

          const result =
            await adminService.getWithdrawals({
              status: statusFilter,
              per_page: 100,
            });

          setWithdrawals(
            result.withdrawals || [],
          );
        } catch (error) {
          setErrorMessage(
            getErrorMessage(
              error,
              "Unable to load withdrawals.",
            ),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [statusFilter],
    );

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const stats =
    useMemo(() => {
      const values = {
        total: withdrawals.length,
        pending: 0,
        approved: 0,
        processing: 0,
        paid: 0,
      };

      withdrawals.forEach((entry) => {
        const status =
          entry?.withdrawal?.status;

        if (
          Object.prototype.hasOwnProperty.call(
            values,
            status,
          )
        ) {
          values[status] += 1;
        }
      });

      return values;
    }, [withdrawals]);

  const runAction =
    async (
      withdrawalId,
      actionName,
      action,
    ) => {
      const actionKey =
        `${actionName}-${withdrawalId}`;

      setActiveAction(actionKey);
      setErrorMessage("");
      setSuccessMessage("");
      setActionMessage(null);

      try {
        const result = await action();

        setSuccessMessage(
          result.message ||
            "Action completed successfully.",
        );

        if (
          result.code ||
          result.action_required ||
          result.provider_status
        ) {
          setActionMessage(result);
        }

        setAuditEvents(
          (current) => {
            const next = {
              ...current,
            };

            delete next[withdrawalId];

            return next;
          },
        );

        await loadWithdrawals({
          quiet: true,
        });

        return result;
      } catch (error) {
        const providerData =
          error.response?.data || null;

        if (providerData) {
          setActionMessage(
            providerData,
          );
        }

        setAuditEvents(
          (current) => {
            const next = {
              ...current,
            };

            delete next[withdrawalId];

            return next;
          },
        );

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to complete this withdrawal action.",
          ),
        );

        return null;
      } finally {
        setActiveAction("");
      }
    };

  const handleApprove =
    async (withdrawalId) => {
      await runAction(
        withdrawalId,
        "approve",
        () =>
          adminService.approveWithdrawal(
            withdrawalId,
          ),
      );
    };

  const handlePay =
    async (withdrawalId) => {
      const result =
        await runAction(
          withdrawalId,
          "pay",
          () =>
            adminService.payWithdrawal(
              withdrawalId,
            ),
        );

      if (result?.requires_otp) {
        setOtpWithdrawalId(
          withdrawalId,
        );
      }
    };

  const handleVerify =
    async (withdrawalId) => {
      await runAction(
        withdrawalId,
        "verify",
        () =>
          adminService.verifyWithdrawal(
            withdrawalId,
          ),
      );
    };

  const handleReject =
    async (withdrawalId) => {
      const result =
        await runAction(
          withdrawalId,
          "reject",
          () =>
            adminService.rejectWithdrawal(
              withdrawalId,
              rejectReason,
            ),
        );

      if (result) {
        setRejectingId(null);
        setRejectReason("");
      }
    };

  const handleFinalize =
    async (withdrawalId) => {
      const normalizedOtp =
        otp.trim();

      if (!normalizedOtp) {
        setErrorMessage(
          "Enter the transfer OTP first.",
        );

        return;
      }

      const result =
        await runAction(
          withdrawalId,
          "finalize",
          () =>
            adminService.finalizeWithdrawal(
              withdrawalId,
              normalizedOtp,
            ),
        );

      if (result) {
        setOtp("");
        setOtpWithdrawalId(null);
      }
    };

  const toggleAuditTrail =
    async (withdrawalId) => {
      if (
        auditOpenId ===
        withdrawalId
      ) {
        setAuditOpenId(null);

        return;
      }

      setAuditOpenId(
        withdrawalId,
      );

      setAuditErrors(
        (current) => ({
          ...current,
          [withdrawalId]: "",
        }),
      );

      if (
        auditEvents[
          withdrawalId
        ]
      ) {
        return;
      }

      setAuditLoadingId(
        withdrawalId,
      );

      try {
        const result =
          await adminService.getWithdrawalAudit(
            withdrawalId,
          );

        setAuditEvents(
          (current) => ({
            ...current,
            [withdrawalId]:
              result.audit_events ||
              [],
          }),
        );
      } catch (error) {
        setAuditErrors(
          (current) => ({
            ...current,
            [withdrawalId]:
              getErrorMessage(
                error,
                "Unable to load audit trail.",
              ),
          }),
        );
      } finally {
        setAuditLoadingId(
          null,
        );
      }
    };

  if (loading) {
    return (
      <main style={styles.center}>
        <p style={styles.loadingText}>
          Loading withdrawals...
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
              ServiceFlow Administration
            </p>

            <h1 style={styles.title}>
              Withdrawal Management
            </h1>

            <p style={styles.subtitle}>
              Review artisan withdrawal
              requests, approve or reject
              them, initiate provider
              payouts, and verify final
              transfer status.
            </p>
          </div>

          <div
            style={
              styles.headerActions
            }
          >
            <Link
              to="/admin/dashboard"
              style={
                styles.secondaryLink
              }
            >
              Admin dashboard
            </Link>

            <button
              type="button"
              onClick={() =>
                loadWithdrawals({
                  quiet: true,
                })
              }
              disabled={refreshing}
              style={{
                ...styles.refreshButton,

                ...(refreshing
                  ? styles.disabledButton
                  : {}),
              }}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div
            role="alert"
            style={styles.errorBox}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            style={
              styles.successBox
            }
          >
            {successMessage}
          </div>
        )}

        {actionMessage && (
          <ProviderMessage
            data={actionMessage}
          />
        )}

        <section
          style={styles.statsGrid}
        >
          <StatCard
            label="Shown"
            value={stats.total}
          />

          <StatCard
            label="Pending"
            value={stats.pending}
          />

          <StatCard
            label="Approved"
            value={stats.approved}
          />

          <StatCard
            label="Processing"
            value={stats.processing}
          />

          <StatCard
            label="Paid"
            value={stats.paid}
          />
        </section>

        <section
          style={styles.toolbar}
        >
          <div>
            <label
              style={styles.label}
            >
              Filter by status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              style={styles.select}
            >
              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatStatus(
                      status,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>

          <p
            style={
              styles.toolbarNote
            }
          >
            Funds remain reserved
            while a withdrawal is
            pending, approved, or
            processing.
          </p>
        </section>

        {withdrawals.length ===
        0 ? (
          <section
            style={styles.emptyCard}
          >
            <h2
              style={
                styles.emptyTitle
              }
            >
              No withdrawals found
            </h2>

            <p
              style={
                styles.mutedText
              }
            >
              No withdrawal requests
              match the selected
              status.
            </p>
          </section>
        ) : (
          <section
            style={styles.list}
          >
            {withdrawals.map(
              (entry) => {
                const withdrawal =
                  entry.withdrawal ||
                  {};

                const artisan =
                  entry.artisan ||
                  {};

                const transaction =
                  entry.transaction ||
                  {};

                const status =
                  String(
                    withdrawal.status ||
                      "",
                  ).toLowerCase();

                const isApproving =
                  activeAction ===
                  `approve-${withdrawal.id}`;

                const isPaying =
                  activeAction ===
                  `pay-${withdrawal.id}`;

                const isVerifying =
                  activeAction ===
                  `verify-${withdrawal.id}`;

                const isRejecting =
                  activeAction ===
                  `reject-${withdrawal.id}`;

                const isFinalizing =
                  activeAction ===
                  `finalize-${withdrawal.id}`;

                const canApprove =
                  status === "pending";

                const canReject =
                  status ===
                    "pending" ||
                  status ===
                    "approved";

                const canPay =
                  status ===
                    "approved" &&
                  !withdrawal.transfer_code;

                const canVerify =
                  status ===
                    "processing" ||
                  Boolean(
                    withdrawal.transfer_code,
                  );

                const canFinalize =
                  status ===
                    "approved" &&
                  Boolean(
                    withdrawal.transfer_code,
                  );

                return (
                  <article
                    key={
                      withdrawal.id
                    }
                    style={
                      styles.withdrawalCard
                    }
                  >
                    <div
                      style={
                        styles.cardTop
                      }
                    >
                      <div>
                        <div
                          style={
                            styles.titleRow
                          }
                        >
                          <h2
                            style={
                              styles.withdrawalTitle
                            }
                          >
                            Withdrawal #
                            {
                              withdrawal.id
                            }
                          </h2>

                          <StatusBadge
                            status={
                              status
                            }
                          />
                        </div>

                        <p
                          style={
                            styles.amount
                          }
                        >
                          {formatCurrency(
                            withdrawal.amount,
                          )}
                        </p>

                        <p
                          style={
                            styles.requestedText
                          }
                        >
                          Requested{" "}
                          {formatDate(
                            withdrawal.requested_at,
                          )}
                        </p>
                      </div>

                      <div
                        style={
                          styles.artisanBox
                        }
                      >
                        <span
                          style={
                            styles.metaLabel
                          }
                        >
                          Artisan
                        </span>

                        <strong
                          style={
                            styles.metaValue
                          }
                        >
                          {artisan.full_name ||
                            `User #${withdrawal.artisan_id}`}
                        </strong>

                        <span
                          style={
                            styles.metaSubValue
                          }
                        >
                          {artisan.email ||
                            "Email unavailable"}
                        </span>
                      </div>
                    </div>

                    <div
                      style={
                        styles.detailsGrid
                      }
                    >
                      <Detail
                        label="Currency"
                        value={
                          withdrawal.currency ||
                          "ZAR"
                        }
                      />

                      <Detail
                        label="Transaction"
                        value={
                          transaction.status ||
                          "Not available"
                        }
                      />

                      <Detail
                        label={
                          status ===
                            "rejected" &&
                          withdrawal.approved_at
                            ? "Originally approved by"
                            : "Approved by"
                        }
                        value={
                          withdrawal.approved_by
                            ? `Admin #${withdrawal.approved_by}`
                            : "Not approved"
                        }
                      />

                      <Detail
                        label={
                          status ===
                            "rejected" &&
                          withdrawal.approved_at
                            ? "Originally approved at"
                            : "Approved at"
                        }
                        value={formatDate(
                          withdrawal.approved_at,
                        )}
                      />

                      <Detail
                        label="Transfer code"
                        value={
                          withdrawal.transfer_code ||
                          "Not created"
                        }
                        mono
                      />

                      <Detail
                        label="Provider reference"
                        value={
                          transaction.provider_reference ||
                          "Not created"
                        }
                        mono
                      />
                    </div>

                    {withdrawal.failure_reason && (
                      <div
                        style={
                          styles.failureBox
                        }
                      >
                        <strong>
                          Failure reason:
                        </strong>{" "}
                        {
                          withdrawal.failure_reason
                        }
                      </div>
                    )}

                    <div
                      style={
                        styles.actions
                      }
                    >
                      {canApprove && (
                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(
                              withdrawal.id,
                            )
                          }
                          disabled={
                            isApproving
                          }
                          style={
                            styles.primaryButton
                          }
                        >
                          {isApproving
                            ? "Approving..."
                            : "Approve"}
                        </button>
                      )}

                      {canPay && (
                        <button
                          type="button"
                          onClick={() =>
                            handlePay(
                              withdrawal.id,
                            )
                          }
                          disabled={
                            isPaying
                          }
                          style={
                            styles.payButton
                          }
                        >
                          {isPaying
                            ? "Sending..."
                            : "Pay with Paystack"}
                        </button>
                      )}

                      {canVerify && (
                        <button
                          type="button"
                          onClick={() =>
                            handleVerify(
                              withdrawal.id,
                            )
                          }
                          disabled={
                            isVerifying
                          }
                          style={
                            styles.verifyButton
                          }
                        >
                          {isVerifying
                            ? "Verifying..."
                            : "Verify transfer"}
                        </button>
                      )}

                      {canFinalize && (
                        <button
                          type="button"
                          onClick={() =>
                            setOtpWithdrawalId(
                              withdrawal.id,
                            )
                          }
                          style={
                            styles.otpButton
                          }
                        >
                          Finalize OTP
                        </button>
                      )}

                      {canReject && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(
                              withdrawal.id,
                            );

                            setRejectReason(
                              "",
                            );
                          }}
                          style={
                            styles.rejectButton
                          }
                        >
                          {status ===
                          "approved"
                            ? "Cancel & return funds"
                            : "Reject"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          toggleAuditTrail(
                            withdrawal.id,
                          )
                        }
                        style={
                          styles.auditButton
                        }
                      >
                        {auditOpenId ===
                        withdrawal.id
                          ? "Hide audit trail"
                          : "View audit trail"}
                      </button>
                    </div>

                    {auditOpenId ===
                      withdrawal.id && (
                      <AuditTrail
                        events={
                          auditEvents[
                            withdrawal.id
                          ] || []
                        }
                        loading={
                          auditLoadingId ===
                          withdrawal.id
                        }
                        error={
                          auditErrors[
                            withdrawal.id
                          ] || ""
                        }
                      />
                    )}

                    {rejectingId ===
                      withdrawal.id && (
                      <div
                        style={
                          styles.inlinePanel
                        }
                      >
                        <label
                          style={
                            styles.label
                          }
                        >
                          {status ===
                          "approved"
                            ? "Cancellation reason"
                            : "Rejection reason"}
                        </label>

                        <textarea
                          value={
                            rejectReason
                          }
                          onChange={(
                            event,
                          ) =>
                            setRejectReason(
                              event.target
                                .value,
                            )
                          }
                          rows={3}
                          placeholder={
                            status ===
                            "approved"
                              ? "Reason for cancelling this approved withdrawal"
                              : "Optional reason for rejecting this withdrawal"
                          }
                          style={
                            styles.textarea
                          }
                        />

                        <div
                          style={
                            styles.panelActions
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(
                                null,
                              );

                              setRejectReason(
                                "",
                              );
                            }}
                            style={
                              styles.secondaryButton
                            }
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleReject(
                                withdrawal.id,
                              )
                            }
                            disabled={
                              isRejecting
                            }
                            style={
                              styles.rejectConfirmButton
                            }
                          >
                            {isRejecting
                              ? status ===
                                "approved"
                                ? "Cancelling..."
                                : "Rejecting..."
                              : status ===
                                  "approved"
                                ? "Confirm cancellation"
                                : "Confirm rejection"}
                          </button>
                        </div>
                      </div>
                    )}

                    {otpWithdrawalId ===
                      withdrawal.id && (
                      <div
                        style={
                          styles.inlinePanel
                        }
                      >
                        <label
                          style={
                            styles.label
                          }
                        >
                          Paystack transfer
                          OTP
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={otp}
                          onChange={(
                            event,
                          ) =>
                            setOtp(
                              event.target
                                .value,
                            )
                          }
                          placeholder="Enter OTP"
                          autoComplete="one-time-code"
                          style={
                            styles.input
                          }
                        />

                        <p
                          style={
                            styles.helperText
                          }
                        >
                          Only use an OTP
                          generated for the
                          Paystack transfer
                          workflow. Never ask
                          the artisan for their
                          bank PIN, card CVV,
                          or online-banking
                          password.
                        </p>

                        <div
                          style={
                            styles.panelActions
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOtpWithdrawalId(
                                null,
                              );

                              setOtp("");
                            }}
                            style={
                              styles.secondaryButton
                            }
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleFinalize(
                                withdrawal.id,
                              )
                            }
                            disabled={
                              isFinalizing
                            }
                            style={
                              styles.otpButton
                            }
                          >
                            {isFinalizing
                              ? "Finalizing..."
                              : "Finalize transfer"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </section>
        )}
      </section>
    </main>
  );
}

function AuditTrail({
  events,
  loading,
  error,
}) {
  return (
    <section style={styles.auditPanel}>
      <div style={styles.auditHeader}>
        <div>
          <p style={styles.auditEyebrow}>
            Financial history
          </p>

          <h3 style={styles.auditTitle}>
            Withdrawal audit trail
          </h3>
        </div>

        {!loading && !error && (
          <span
            style={styles.auditCount}
          >
            {events.length}{" "}
            {events.length === 1
              ? "event"
              : "events"}
          </span>
        )}
      </div>

      {loading ? (
        <p
          style={styles.auditLoading}
        >
          Loading audit trail...
        </p>
      ) : error ? (
        <div
          style={styles.auditError}
        >
          {error}
        </div>
      ) : events.length === 0 ? (
        <p
          style={styles.auditEmpty}
        >
          No audit events have been
          recorded for this withdrawal
          yet.
        </p>
      ) : (
        <div style={styles.timeline}>
          {events.map(
            (event, index) => (
              <article
                key={event.id}
                style={
                  styles.timelineItem
                }
              >
                <div
                  style={
                    styles.timelineRail
                  }
                >
                  <span
                    style={{
                      ...styles.timelineDot,
                      ...getAuditDotStyle(
                        event.event_type,
                      ),
                    }}
                  />

                  {index <
                    events.length -
                      1 && (
                    <span
                      style={
                        styles.timelineLine
                      }
                    />
                  )}
                </div>

                <div
                  style={
                    styles.timelineContent
                  }
                >
                  <div
                    style={
                      styles.timelineTop
                    }
                  >
                    <strong
                      style={
                        styles.timelineEvent
                      }
                    >
                      {formatAuditEvent(
                        event.event_type,
                      )}
                    </strong>

                    <span
                      style={
                        styles.timelineDate
                      }
                    >
                      {formatDate(
                        event.created_at,
                      )}
                    </span>
                  </div>

                  <p
                    style={
                      styles.timelineSummary
                    }
                  >
                    {buildAuditSummary(
                      event,
                    )}
                  </p>

                  <div
                    style={
                      styles.auditMetaGrid
                    }
                  >
                    <AuditMeta
                      label="Actor"
                      value={formatAuditActor(
                        event,
                      )}
                    />

                    <AuditMeta
                      label="Status"
                      value={formatAuditStatusChange(
                        event,
                      )}
                    />

                    <AuditMeta
                      label="Amount"
                      value={formatCurrency(
                        event.amount,
                      )}
                    />

                    <AuditMeta
                      label="Provider"
                      value={
                        event.provider ||
                        "ServiceFlow"
                      }
                    />
                  </div>

                  {event.reason && (
                    <div
                      style={
                        styles.auditReason
                      }
                    >
                      <strong>
                        Reason:
                      </strong>{" "}
                      {event.reason}
                    </div>
                  )}

                  {event.provider_reference && (
                    <div
                      style={
                        styles.auditReference
                      }
                    >
                      <span>
                        Provider
                        reference
                      </span>

                      <code>
                        {
                          event.provider_reference
                        }
                      </code>
                    </div>
                  )}

                  {event.transfer_code && (
                    <div
                      style={
                        styles.auditReference
                      }
                    >
                      <span>
                        Transfer code
                      </span>

                      <code>
                        {
                          event.transfer_code
                        }
                      </code>
                    </div>
                  )}

                  {renderAuditMetadata(
                    event.event_metadata,
                  )}
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function AuditMeta({
  label,
  value,
}) {
  return (
    <div>
      <span
        style={
          styles.auditMetaLabel
        }
      >
        {label}
      </span>

      <strong
        style={
          styles.auditMetaValue
        }
      >
        {value || "—"}
      </strong>
    </div>
  );
}

function renderAuditMetadata(
  metadata,
) {
  if (
    !metadata ||
    typeof metadata !== "object"
  ) {
    return null;
  }

  const items = [];

  if (
    metadata.wallet_balance_after_reservation !==
    undefined
  ) {
    items.push({
      label:
        "Balance after reservation",

      value: formatCurrency(
        metadata.wallet_balance_after_reservation,
      ),
    });
  }

  if (
    metadata.wallet_balance_after_refund !==
    undefined
  ) {
    items.push({
      label:
        "Balance after refund",

      value: formatCurrency(
        metadata.wallet_balance_after_refund,
      ),
    });
  }

  if (
    metadata.funds_returned !==
    undefined
  ) {
    items.push({
      label:
        "Funds returned",

      value:
        metadata.funds_returned
          ? "Yes"
          : "No",
    });
  }

  if (metadata.error_code) {
    items.push({
      label:
        "Provider error code",

      value:
        metadata.error_code,
    });
  }

  if (
    metadata.action_required
  ) {
    items.push({
      label:
        "Required action",

      value: formatStatus(
        metadata.action_required,
      ),
    });
  }

  if (
    metadata.retryable !==
    undefined
  ) {
    items.push({
      label: "Retryable",

      value:
        metadata.retryable
          ? "Yes"
          : "No",
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      style={
        styles.auditMetadataBox
      }
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={
            styles.auditMetadataItem
          }
        >
          <span>
            {item.label}
          </span>

          <strong>
            {item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

function formatAuditEvent(
  eventType,
) {
  const labels = {
    withdrawal_requested:
      "Withdrawal requested",

    withdrawal_approved:
      "Withdrawal approved",

    payout_transfer_created:
      "Payout transfer created",

    payout_processing:
      "Payout processing",

    payout_provider_rejected:
      "Payout provider rejected transfer",

    withdrawal_rejected:
      "Withdrawal rejected",

    withdrawal_cancelled:
      "Withdrawal cancelled",

    withdrawal_failed:
      "Withdrawal failed",

    withdrawal_paid:
      "Withdrawal paid",
  };

  return (
    labels[eventType] ||
    formatStatus(eventType)
  );
}

function formatAuditActor(
  event,
) {
  const role =
    formatStatus(
      event.actor_role ||
        "system",
    );

  if (event.actor_user_id) {
    return `${role} #${event.actor_user_id}`;
  }

  return role;
}

function formatAuditStatusChange(
  event,
) {
  const previous =
    event.previous_status
      ? formatStatus(
          event.previous_status,
        )
      : "Created";

  const next =
    event.new_status
      ? formatStatus(
          event.new_status,
        )
      : "—";

  return `${previous} → ${next}`;
}

function buildAuditSummary(
  event,
) {
  switch (event.event_type) {
    case "withdrawal_requested":
      return (
        "The artisan requested a withdrawal " +
        "and ServiceFlow reserved the funds."
      );

    case "withdrawal_approved":
      return (
        "An administrator approved the " +
        "withdrawal for payout."
      );

    case "payout_provider_rejected":
      return (
        "The payout provider refused the " +
        "transfer. The withdrawal remained " +
        "reserved and was not marked paid."
      );

    case "withdrawal_cancelled":
      return (
        "The approved withdrawal was safely " +
        "cancelled and its reserved funds " +
        "were returned to the artisan wallet."
      );

    case "withdrawal_rejected":
      return (
        "The withdrawal was rejected and " +
        "its reserved funds were returned."
      );

    case "payout_transfer_created":
      return (
        "A payout transfer was created with " +
        "the payment provider."
      );

    case "payout_processing":
      return (
        "The payout is being processed by " +
        "the payment provider."
      );

    case "withdrawal_paid":
      return (
        "The payout completed successfully " +
        "and ServiceFlow marked the withdrawal paid."
      );

    case "withdrawal_failed":
      return (
        "The payout failed and ServiceFlow " +
        "returned the reserved funds."
      );

    default:
      return (
        "A withdrawal lifecycle event was recorded."
      );
  }
}

function getAuditDotStyle(
  eventType,
) {
  if (
    eventType ===
    "withdrawal_paid"
  ) {
    return {
      backgroundColor:
        "#16a34a",
    };
  }

  if (
    eventType ===
      "payout_provider_rejected" ||
    eventType ===
      "withdrawal_failed" ||
    eventType ===
      "withdrawal_rejected" ||
    eventType ===
      "withdrawal_cancelled"
  ) {
    return {
      backgroundColor:
        "#dc2626",
    };
  }

  if (
    eventType ===
      "payout_processing" ||
    eventType ===
      "payout_transfer_created"
  ) {
    return {
      backgroundColor:
        "#7c3aed",
    };
  }

  return {
    backgroundColor:
      "#2563eb",
  };
}

function ProviderMessage({
  data,
}) {
  const isRestriction =
    data.code ===
    "PAYOUT_PROVIDER_RESTRICTED";

  return (
    <section
      style={{
        ...styles.providerBox,

        ...(isRestriction
          ? styles.providerWarning
          : {}),
      }}
    >
      <strong
        style={
          styles.providerTitle
        }
      >
        {isRestriction
          ? "Paystack business upgrade required"
          : "Payout provider update"}
      </strong>

      <p
        style={
          styles.providerText
        }
      >
        {data.message ||
          data.provider_message ||
          "The payout provider returned an update."}
      </p>

      {data.funds_reserved && (
        <p
          style={
            styles.providerSmall
          }
        >
          The artisan&apos;s
          withdrawal funds remain
          reserved while this payout
          is unresolved.
        </p>
      )}

      {data.reference && (
        <p
          style={
            styles.providerSmall
          }
        >
          Reference:{" "}
          <code>
            {data.reference}
          </code>
        </p>
      )}

      {data.action_required && (
        <p
          style={
            styles.providerSmall
          }
        >
          Required action:{" "}
          {formatStatus(
            data.action_required,
          )}
        </p>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <article
      style={styles.statCard}
    >
      <p
        style={styles.statLabel}
      >
        {label}
      </p>

      <strong
        style={styles.statValue}
      >
        {value}
      </strong>
    </article>
  );
}

function Detail({
  label,
  value,
  mono = false,
}) {
  return (
    <div>
      <span
        style={styles.metaLabel}
      >
        {label}
      </span>

      <strong
        style={{
          ...styles.metaValue,

          ...(mono
            ? styles.monoValue
            : {}),
        }}
      >
        {value || "—"}
      </strong>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  const badgeStyle =
    statusStyles[
      normalized
    ] ||
    statusStyles.default;

  return (
    <span
      style={{
        ...styles.badge,
        ...badgeStyle,
      }}
    >
      {formatStatus(
        normalized,
      )}
    </span>
  );
}

function formatCurrency(
  value,
) {
  const amount =
    Number(value || 0);

  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits:
        2,
    },
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0,
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return String(value);
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

function formatStatus(value) {
  if (!value) {
    return "Unknown";
  }

  if (value === "all") {
    return "All statuses";
  }

  return String(value)
    .split("_")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getErrorMessage(
  error,
  fallback,
) {
  return (
    error.response?.data
      ?.message ||
    error.message ||
    fallback
  );
}

const statusStyles = {
  pending: {
    backgroundColor:
      "#fef3c7",
    color: "#92400e",
  },

  approved: {
    backgroundColor:
      "#dbeafe",
    color: "#1d4ed8",
  },

  processing: {
    backgroundColor:
      "#e0e7ff",
    color: "#4338ca",
  },

  paid: {
    backgroundColor:
      "#dcfce7",
    color: "#166534",
  },

  failed: {
    backgroundColor:
      "#fee2e2",
    color: "#991b1b",
  },

  rejected: {
    backgroundColor:
      "#fee2e2",
    color: "#991b1b",
  },

  default: {
    backgroundColor:
      "#f1f5f9",
    color: "#475569",
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    padding:
      "40px 20px 70px",
    backgroundColor:
      "#f8fafc",
  },

  center: {
    minHeight: "70vh",
    display: "grid",
    placeItems: "center",
    backgroundColor:
      "#f8fafc",
  },

  loadingText: {
    color: "#475569",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "24px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "900",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.08em",
  },

  title: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize:
      "clamp(30px, 5vw, 42px)",
  },

  subtitle: {
    maxWidth: "720px",
    margin: 0,
    color: "#64748b",
    lineHeight: 1.7,
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  secondaryLink: {
    padding:
      "10px 14px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor:
      "#ffffff",
    color: "#0f172a",
    textDecoration:
      "none",
    fontWeight: "800",
  },

  refreshButton: {
    padding:
      "10px 14px",
    border: 0,
    borderRadius: "10px",
    backgroundColor:
      "#0f172a",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.55,
    cursor:
      "not-allowed",
  },

  errorBox: {
    marginBottom: "16px",
    padding:
      "14px 16px",
    border:
      "1px solid #fecaca",
    borderRadius: "12px",
    backgroundColor:
      "#fef2f2",
    color: "#991b1b",
    fontWeight: "700",
  },

  successBox: {
    marginBottom: "16px",
    padding:
      "14px 16px",
    border:
      "1px solid #bbf7d0",
    borderRadius: "12px",
    backgroundColor:
      "#f0fdf4",
    color: "#166534",
    fontWeight: "700",
  },

  providerBox: {
    marginBottom: "18px",
    padding: "16px",
    border:
      "1px solid #bfdbfe",
    borderRadius: "14px",
    backgroundColor:
      "#eff6ff",
  },

  providerWarning: {
    borderColor:
      "#fed7aa",
    backgroundColor:
      "#fff7ed",
  },

  providerTitle: {
    display: "block",
    marginBottom: "6px",
    color: "#0f172a",
  },

  providerText: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6,
  },

  providerSmall: {
    margin:
      "8px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },

  statCard: {
    padding: "18px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor:
      "#ffffff",
  },

  statLabel: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    textTransform:
      "uppercase",
  },

  statValue: {
    color: "#0f172a",
    fontSize: "24px",
  },

  toolbar: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "end",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor:
      "#ffffff",
    flexWrap: "wrap",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
  },

  select: {
    minWidth: "190px",
    padding:
      "10px 12px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor:
      "#ffffff",
    color: "#0f172a",
  },

  toolbarNote: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
  },

  list: {
    display: "grid",
    gap: "18px",
  },

  withdrawalCard: {
    padding: "22px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor:
      "#ffffff",
    boxShadow:
      "0 10px 28px rgba(15, 23, 42, 0.05)",
  },

  cardTop: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  withdrawalTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "20px",
  },

  amount: {
    margin:
      "10px 0 4px",
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: "900",
  },

  requestedText: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
  },

  artisanBox: {
    minWidth: "220px",
    padding: "14px",
    borderRadius: "12px",
    backgroundColor:
      "#f8fafc",
  },

  metaLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "800",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.05em",
  },

  metaValue: {
    display: "block",
    color: "#0f172a",
    fontSize: "13px",
  },

  metaSubValue: {
    display: "block",
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
  },

  monoValue: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    wordBreak:
      "break-all",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "16px",
    padding: "16px",
    borderRadius: "14px",
    backgroundColor:
      "#f8fafc",
  },

  failureBox: {
    marginTop: "14px",
    padding:
      "12px 14px",
    border:
      "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor:
      "#fef2f2",
    color: "#991b1b",
    fontSize: "13px",
  },

  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  primaryButton: {
    padding:
      "10px 14px",
    border: 0,
    borderRadius: "10px",
    backgroundColor:
      "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  payButton: {
    padding:
      "10px 14px",
    border: 0,
    borderRadius: "10px",
    backgroundColor:
      "#16a34a",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  verifyButton: {
    padding:
      "10px 14px",
    border: 0,
    borderRadius: "10px",
    backgroundColor:
      "#4f46e5",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  otpButton: {
    padding:
      "10px 14px",
    border: 0,
    borderRadius: "10px",
    backgroundColor:
      "#7c3aed",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  rejectButton: {
    padding:
      "10px 14px",
    border:
      "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor:
      "#ffffff",
    color: "#b91c1c",
    fontWeight: "800",
    cursor: "pointer",
  },

  rejectConfirmButton: {
    padding:
      "10px 14px",
    border: 0,
    borderRadius: "10px",
    backgroundColor:
      "#dc2626",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  secondaryButton: {
    padding:
      "10px 14px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor:
      "#ffffff",
    color: "#0f172a",
    fontWeight: "800",
    cursor: "pointer",
  },

  inlinePanel: {
    marginTop: "16px",
    padding: "16px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor:
      "#f8fafc",
  },

  textarea: {
    width: "100%",
    boxSizing:
      "border-box",
    padding: "11px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "10px",
    resize: "vertical",
  },

  input: {
    width: "100%",
    boxSizing:
      "border-box",
    padding: "11px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "10px",
  },

  helperText: {
    margin:
      "9px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  panelActions: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
    marginTop: "12px",
    flexWrap: "wrap",
  },

  badge: {
    display:
      "inline-flex",
    padding:
      "6px 10px",
    borderRadius:
      "999px",
    fontSize: "11px",
    fontWeight: "900",
  },

  auditButton: {
    padding:
      "10px 14px",
    border:
      "1px solid #bfdbfe",
    borderRadius: "10px",
    backgroundColor:
      "#eff6ff",
    color: "#1d4ed8",
    fontWeight: "800",
    cursor: "pointer",
  },

  auditPanel: {
    marginTop: "18px",
    padding: "20px",
    border:
      "1px solid #dbeafe",
    borderRadius: "16px",
    backgroundColor:
      "#f8fbff",
  },

  auditHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "14px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },

  auditEyebrow: {
    margin: "0 0 4px",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "900",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.06em",
  },

  auditTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
  },

  auditCount: {
    padding:
      "5px 9px",
    borderRadius:
      "999px",
    backgroundColor:
      "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "900",
  },

  auditLoading: {
    margin: 0,
    color: "#64748b",
  },

  auditEmpty: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  auditError: {
    padding:
      "12px 14px",
    border:
      "1px solid #fecaca",
    borderRadius: "10px",
    backgroundColor:
      "#fef2f2",
    color: "#991b1b",
    fontSize: "13px",
    fontWeight: "700",
  },

  timeline: {
    display: "grid",
  },

  timelineItem: {
    display: "grid",
    gridTemplateColumns:
      "26px minmax(0, 1fr)",
    gap: "12px",
  },

  timelineRail: {
    position: "relative",
    display: "flex",
    justifyContent:
      "center",
  },

  timelineDot: {
    position: "relative",
    zIndex: 2,
    width: "12px",
    height: "12px",
    marginTop: "5px",
    border:
      "3px solid #ffffff",
    borderRadius:
      "999px",
    boxShadow:
      "0 0 0 1px rgba(15, 23, 42, 0.10)",
  },

  timelineLine: {
    position:
      "absolute",
    top: "20px",
    bottom: "-4px",
    width: "2px",
    backgroundColor:
      "#cbd5e1",
  },

  timelineContent: {
    minWidth: 0,
    paddingBottom: "24px",
  },

  timelineTop: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "12px",
    alignItems:
      "flex-start",
    flexWrap: "wrap",
  },

  timelineEvent: {
    color: "#0f172a",
    fontSize: "14px",
  },

  timelineDate: {
    color: "#94a3b8",
    fontSize: "11px",
  },

  timelineSummary: {
    margin:
      "7px 0 12px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  auditMetaGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
    padding: "12px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    backgroundColor:
      "#ffffff",
  },

  auditMetaLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "900",
    textTransform:
      "uppercase",
    letterSpacing:
      "0.04em",
  },

  auditMetaValue: {
    display: "block",
    color: "#334155",
    fontSize: "12px",
    wordBreak:
      "break-word",
  },

  auditReason: {
    marginTop: "10px",
    padding:
      "10px 12px",
    borderRadius: "10px",
    backgroundColor:
      "#fff7ed",
    color: "#9a3412",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  auditReference: {
    display: "grid",
    gap: "5px",
    marginTop: "10px",
    color: "#64748b",
    fontSize: "11px",
    wordBreak:
      "break-all",
  },

  auditMetadataBox: {
    display: "grid",
    gap: "8px",
    marginTop: "10px",
    padding:
      "11px 12px",
    borderRadius: "10px",
    backgroundColor:
      "#eef2ff",
  },

  auditMetadataItem: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "14px",
    color: "#475569",
    fontSize: "11px",
    flexWrap: "wrap",
  },

  emptyCard: {
    padding: "34px",
    border:
      "1px dashed #cbd5e1",
    borderRadius: "16px",
    backgroundColor:
      "#ffffff",
    textAlign: "center",
  },

  emptyTitle: {
    margin: "0 0 8px",
    color: "#0f172a",
  },

  mutedText: {
    margin: 0,
    color: "#64748b",
  },
};

export default AdminWithdrawals;