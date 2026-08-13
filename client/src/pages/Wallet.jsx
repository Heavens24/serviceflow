import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import walletService from "../services/walletService";

const MINIMUM_WITHDRAWAL = 50;

function Wallet() {
  const { user } = useAuth();

  const [wallet, setWallet] =
    useState(null);

  const [payoutAccount, setPayoutAccount] =
    useState(null);

  const [banks, setBanks] =
    useState([]);

  const [withdrawals, setWithdrawals] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [showBankForm, setShowBankForm] =
    useState(false);

  const [savingBank, setSavingBank] =
    useState(false);

  const [requestingWithdrawal, setRequestingWithdrawal] =
    useState(false);

  const [withdrawalAmount, setWithdrawalAmount] =
    useState("");

  const [bankForm, setBankForm] =
    useState({
      bank_name: "",
      bank_code: "",
      account_number: "",
      account_name: "",
      account_type: "personal",
      document_type: "identityNumber",
      document_number: "",
      currency: "ZAR",
    });

  const isArtisan =
    user?.role === "artisan";

  const loadWalletData =
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

          setPageError("");

          const [
            walletResult,
            payoutResult,
            withdrawalResult,
          ] = await Promise.all([
            walletService.getWallet(),
            walletService.getPayoutAccount(),
            walletService.getWithdrawals({
              perPage: 50,
            }),
          ]);

          setWallet(
            walletResult.wallet || null,
          );

          setPayoutAccount(
            payoutResult.payout_account ||
              null,
          );

          setWithdrawals(
            withdrawalResult.withdrawals ||
              [],
          );
        } catch (error) {
          setPageError(
            getErrorMessage(
              error,
              "Unable to load your wallet.",
            ),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    if (!isArtisan) {
      return undefined;
    }

    let cancelled = false;

    const loadInitialWalletData =
      async () => {
        try {
          const [
            walletResult,
            payoutResult,
            withdrawalResult,
          ] = await Promise.all([
            walletService.getWallet(),
            walletService.getPayoutAccount(),
            walletService.getWithdrawals({
              perPage: 50,
            }),
          ]);

          if (cancelled) {
            return;
          }

          setWallet(
            walletResult.wallet || null,
          );

          setPayoutAccount(
            payoutResult.payout_account ||
              null,
          );

          setWithdrawals(
            withdrawalResult.withdrawals ||
              [],
          );
        } catch (error) {
          if (!cancelled) {
            setPageError(
              getErrorMessage(
                error,
                "Unable to load your wallet.",
              ),
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      };

    void loadInitialWalletData();

    return () => {
      cancelled = true;
    };
  }, [isArtisan]);

  useEffect(() => {
    if (
      !showBankForm ||
      !isArtisan ||
      banks.length > 0
    ) {
      return undefined;
    }

    let cancelled = false;

    const fetchBanks = async () => {
      try {
        const result =
          await walletService.getPayoutBanks();

        if (!cancelled) {
          setBanks(
            result.banks || [],
          );
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            getErrorMessage(
              error,
              "Unable to load supported banks.",
            ),
          );
        }
      }
    };

    void fetchBanks();

    return () => {
      cancelled = true;
    };
  }, [
    banks.length,
    isArtisan,
    showBankForm,
  ]);

  const selectedBank =
    useMemo(
      () =>
        banks.find(
          (bank) =>
            String(bank.code) ===
            String(
              bankForm.bank_code,
            ),
        ) || null,
      [
        banks,
        bankForm.bank_code,
      ],
    );

  const availableBalance =
    Number(
      wallet?.available_balance || 0,
    );

  const canWithdraw =
    Boolean(
      payoutAccount?.is_active &&
      payoutAccount?.is_verified,
    );

  const handleBankChange = (
    event,
  ) => {
    const bankCode =
      event.target.value;

    const bank =
      banks.find(
        (item) =>
          String(item.code) ===
          String(bankCode),
      );

    setBankForm(
      (current) => ({
        ...current,
        bank_code: bankCode,
        bank_name:
          bank?.name || "",
      }),
    );
  };

  const handleBankFieldChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setBankForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  };

  const handleSavePayoutAccount =
    async (event) => {
      event.preventDefault();

      setSavingBank(true);
      setPageError("");
      setSuccessMessage("");

      try {
        const payload = {
          ...bankForm,
          bank_name:
            selectedBank?.name ||
            bankForm.bank_name,
        };

        const result =
          await walletService.savePayoutAccount(
            payload,
          );

        setPayoutAccount(
          result.payout_account ||
            null,
        );

        setSuccessMessage(
          result.message ||
            "Payout account saved successfully.",
        );

        setShowBankForm(false);

        setBankForm({
          bank_name: "",
          bank_code: "",
          account_number: "",
          account_name: "",
          account_type: "personal",
          document_type: "identityNumber",
          document_number: "",
          currency: "ZAR",
        });
      } catch (error) {
        setPageError(
          getErrorMessage(
            error,
            "Unable to save payout account.",
          ),
        );
      } finally {
        setSavingBank(false);
      }
    };

  const handleWithdrawalSubmit =
    async (event) => {
      event.preventDefault();

      setPageError("");
      setSuccessMessage("");

      const amount =
        Number(withdrawalAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setPageError(
          "Enter a valid withdrawal amount.",
        );
        return;
      }

      if (
        amount <
        MINIMUM_WITHDRAWAL
      ) {
        setPageError(
          `The minimum withdrawal is ${formatCurrency(
            MINIMUM_WITHDRAWAL,
          )}.`,
        );
        return;
      }

      if (
        amount >
        availableBalance
      ) {
        setPageError(
          "The withdrawal amount is greater than your available balance.",
        );
        return;
      }

      if (!canWithdraw) {
        setPageError(
          "Add and verify a payout account before requesting a withdrawal.",
        );
        return;
      }

      setRequestingWithdrawal(
        true,
      );

      try {
        const result =
          await walletService.requestWithdrawal(
            amount,
          );

        setWallet(
          result.wallet ||
            wallet,
        );

        if (result.withdrawal) {
          setWithdrawals(
            (current) => [
              result.withdrawal,
              ...current.filter(
                (item) =>
                  item.id !==
                  result.withdrawal.id,
              ),
            ],
          );
        }

        setWithdrawalAmount("");

        setSuccessMessage(
          result.message ||
            "Withdrawal request created successfully.",
        );
      } catch (error) {
        setPageError(
          getErrorMessage(
            error,
            "Unable to request withdrawal.",
          ),
        );
      } finally {
        setRequestingWithdrawal(
          false,
        );
      }
    };

  if (!isArtisan) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.restrictedCard}>
          <p style={styles.eyebrow}>
            ServiceFlow Wallet
          </p>

          <h1 style={styles.restrictedTitle}>
            Artisan wallet only
          </h1>

          <p style={styles.restrictedText}>
            Wallet earnings and payouts are
            available to artisan accounts.
          </p>

          <Link
            to="/dashboard"
            style={styles.primaryLink}
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading your wallet...
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
              ServiceFlow Wallet
            </p>

            <h1 style={styles.title}>
              Your earnings and payouts
            </h1>

            <p style={styles.subtitle}>
              Track earnings, manage your
              verified payout account, and
              request withdrawals securely.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to="/dashboard"
              style={styles.secondaryLink}
            >
              Dashboard
            </Link>

            <button
              type="button"
              onClick={() =>
                loadWalletData({
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

        {pageError && (
          <div
            role="alert"
            style={styles.errorBox}
          >
            {pageError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            style={styles.successBox}
          >
            {successMessage}
          </div>
        )}

        <section style={styles.balanceGrid}>
          <BalanceCard
            label="Available balance"
            value={wallet?.available_balance}
            highlight
          />

          <BalanceCard
            label="Pending earnings"
            value={wallet?.pending_balance}
          />

          <BalanceCard
            label="Total earned"
            value={wallet?.total_earned}
          />

          <BalanceCard
            label="Total withdrawn"
            value={wallet?.total_withdrawn}
          />
        </section>

        <section style={styles.twoColumnGrid}>
          <article style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>
                  Payout account
                </p>

                <h2 style={styles.cardTitle}>
                  Bank destination
                </h2>
              </div>

              {payoutAccount && (
                <StatusPill
                  status={
                    payoutAccount.is_verified
                      ? "verified"
                      : "unverified"
                  }
                />
              )}
            </div>

            {payoutAccount ? (
              <>
                <div style={styles.bankSummary}>
                  <div>
                    <span style={styles.metaLabel}>
                      Bank
                    </span>

                    <strong style={styles.metaValue}>
                      {payoutAccount.bank_name}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>
                      Account
                    </span>

                    <strong style={styles.metaValue}>
                      {payoutAccount.account_number}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>
                      Account holder
                    </span>

                    <strong style={styles.metaValue}>
                      {payoutAccount.account_name}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.metaLabel}>
                      Currency
                    </span>

                    <strong style={styles.metaValue}>
                      {payoutAccount.currency}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowBankForm(
                      (current) =>
                        !current,
                    )
                  }
                  style={styles.secondaryButton}
                >
                  {showBankForm
                    ? "Cancel bank update"
                    : "Change payout account"}
                </button>
              </>
            ) : (
              <>
                <p style={styles.mutedText}>
                  Add a verified South African
                  bank account before requesting
                  withdrawals.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowBankForm(true)
                  }
                  style={styles.primaryButton}
                >
                  Add payout account
                </button>
              </>
            )}
          </article>

          <article style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>
                  Withdraw funds
                </p>

                <h2 style={styles.cardTitle}>
                  Request a payout
                </h2>
              </div>
            </div>

            <p style={styles.mutedText}>
              Available now:{" "}
              <strong>
                {formatCurrency(
                  availableBalance,
                )}
              </strong>
            </p>

            <form
              onSubmit={
                handleWithdrawalSubmit
              }
              style={styles.withdrawalForm}
            >
              <label style={styles.label}>
                Withdrawal amount
              </label>

              <div style={styles.amountInputRow}>
                <span style={styles.currencyPrefix}>
                  R
                </span>

                <input
                  type="number"
                  min={MINIMUM_WITHDRAWAL}
                  step="0.01"
                  value={withdrawalAmount}
                  onChange={(event) =>
                    setWithdrawalAmount(
                      event.target.value,
                    )
                  }
                  placeholder="100.00"
                  style={styles.amountInput}
                />
              </div>

              <div style={styles.quickAmounts}>
                {[50, 100, 250].map(
                  (amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setWithdrawalAmount(
                          String(
                            Math.min(
                              amount,
                              availableBalance,
                            ),
                          ),
                        )
                      }
                      disabled={
                        availableBalance <= 0
                      }
                      style={styles.quickAmountButton}
                    >
                      {formatCurrency(
                        Math.min(
                          amount,
                          availableBalance,
                        ),
                      )}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    setWithdrawalAmount(
                      availableBalance > 0
                        ? String(
                            availableBalance,
                          )
                        : "",
                    )
                  }
                  disabled={
                    availableBalance <= 0
                  }
                  style={styles.quickAmountButton}
                >
                  Max
                </button>
              </div>

              <p style={styles.helperText}>
                Minimum withdrawal:{" "}
                {formatCurrency(
                  MINIMUM_WITHDRAWAL,
                )}. ServiceFlow uses your
                verified payout account
                automatically.
              </p>

              <button
                type="submit"
                disabled={
                  requestingWithdrawal ||
                  !canWithdraw ||
                  availableBalance <= 0
                }
                style={{
                  ...styles.primaryButton,
                  ...((requestingWithdrawal ||
                    !canWithdraw ||
                    availableBalance <= 0)
                    ? styles.disabledButton
                    : {}),
                }}
              >
                {requestingWithdrawal
                  ? "Requesting..."
                  : "Request withdrawal"}
              </button>
            </form>
          </article>
        </section>

        {showBankForm && (
          <section style={styles.bankFormCard}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.cardEyebrow}>
                  Secure payout setup
                </p>

                <h2 style={styles.cardTitle}>
                  Verify your bank account
                </h2>
              </div>
            </div>

            <p style={styles.securityNote}>
              Your bank account is validated
              through the payment provider.
              Never enter a bank-card number,
              CVV, PIN, OTP, or online-banking
              password here.
            </p>

            <form
              onSubmit={
                handleSavePayoutAccount
              }
              style={styles.formGrid}
            >
              <Field
                label="Bank"
                fullWidth
              >
                <select
                  name="bank_code"
                  value={
                    bankForm.bank_code
                  }
                  onChange={
                    handleBankChange
                  }
                  required
                  style={styles.input}
                >
                  <option value="">
                    Select your bank
                  </option>

                  {banks.map((bank) => (
                    <option
                      key={bank.code}
                      value={bank.code}
                    >
                      {bank.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Account holder name">
                <input
                  name="account_name"
                  value={
                    bankForm.account_name
                  }
                  onChange={
                    handleBankFieldChange
                  }
                  required
                  autoComplete="name"
                  style={styles.input}
                />
              </Field>

              <Field label="Bank account number">
                <input
                  name="account_number"
                  value={
                    bankForm.account_number
                  }
                  onChange={
                    handleBankFieldChange
                  }
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  style={styles.input}
                />
              </Field>

              <Field label="Account type">
                <select
                  name="account_type"
                  value={
                    bankForm.account_type
                  }
                  onChange={
                    handleBankFieldChange
                  }
                  style={styles.input}
                >
                  <option value="personal">
                    Personal
                  </option>

                  <option value="business">
                    Business
                  </option>
                </select>
              </Field>

              <Field label="Identification type">
                <select
                  name="document_type"
                  value={
                    bankForm.document_type
                  }
                  onChange={
                    handleBankFieldChange
                  }
                  style={styles.input}
                >
                  {bankForm.account_type ===
                  "business" ? (
                    <option value="businessRegistrationNumber">
                      Business registration number
                    </option>
                  ) : (
                    <>
                      <option value="identityNumber">
                        South African ID
                      </option>

                      <option value="passportNumber">
                        Passport
                      </option>
                    </>
                  )}
                </select>
              </Field>

              <Field
                label={
                  bankForm.account_type ===
                  "business"
                    ? "Business registration number"
                    : bankForm.document_type ===
                        "passportNumber"
                      ? "Passport number"
                      : "South African ID number"
                }
                fullWidth
              >
                <input
                  name="document_number"
                  value={
                    bankForm.document_number
                  }
                  onChange={
                    handleBankFieldChange
                  }
                  required
                  autoComplete="off"
                  style={styles.input}
                />
              </Field>

              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={() =>
                    setShowBankForm(false)
                  }
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingBank}
                  style={{
                    ...styles.primaryButton,
                    ...(savingBank
                      ? styles.disabledButton
                      : {}),
                  }}
                >
                  {savingBank
                    ? "Verifying..."
                    : "Verify & save account"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <div>
              <p style={styles.cardEyebrow}>
                Withdrawal history
              </p>

              <h2 style={styles.cardTitle}>
                Your payout requests
              </h2>
            </div>

            <span style={styles.historyCount}>
              {withdrawals.length} shown
            </span>
          </div>

          {withdrawals.length === 0 ? (
            <div style={styles.emptyState}>
              <strong>
                No withdrawals yet
              </strong>

              <p style={styles.mutedText}>
                Your withdrawal requests will
                appear here.
              </p>
            </div>
          ) : (
            <div style={styles.withdrawalList}>
              {withdrawals.map(
                (withdrawal) => (
                  <article
                    key={withdrawal.id}
                    style={styles.withdrawalRow}
                  >
                    <div>
                      <strong style={styles.withdrawalAmount}>
                        {formatCurrency(
                          withdrawal.amount,
                        )}
                      </strong>

                      <p style={styles.withdrawalMeta}>
                        Requested{" "}
                        {formatDate(
                          withdrawal.requested_at,
                        )}
                      </p>
                    </div>

                    <div style={styles.withdrawalStatusArea}>
                      <StatusPill
                        status={
                          withdrawal.status
                        }
                      />

                      <span style={styles.withdrawalReference}>
                        #{withdrawal.id}
                      </span>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function BalanceCard({
  label,
  value,
  highlight = false,
}) {
  return (
    <article
      style={{
        ...styles.balanceCard,
        ...(highlight
          ? styles.balanceCardHighlight
          : {}),
      }}
    >
      <p
        style={{
          ...styles.balanceLabel,
          ...(highlight
            ? styles.balanceLabelHighlight
            : {}),
        }}
      >
        {label}
      </p>

      <strong
        style={{
          ...styles.balanceValue,
          ...(highlight
            ? styles.balanceValueHighlight
            : {}),
        }}
      >
        {formatCurrency(value)}
      </strong>
    </article>
  );
}

function StatusPill({ status }) {
  const normalized =
    String(status || "")
      .trim()
      .toLowerCase();

  const style =
    statusStyles[normalized] ||
    statusStyles.default;

  return (
    <span
      style={{
        ...styles.statusPill,
        ...style,
      }}
    >
      {formatStatus(normalized)}
    </span>
  );
}

function Field({
  label,
  children,
  fullWidth = false,
}) {
  return (
    <label
      style={{
        ...styles.field,
        ...(fullWidth
          ? styles.fullWidthField
          : {}),
      }}
    >
      <span style={styles.label}>
        {label}
      </span>

      {children}
    </label>
  );
}

function formatCurrency(value) {
  const amount =
    Number(value || 0);

  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
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

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  if (status === "verified") {
    return "Verified";
  }

  if (status === "unverified") {
    return "Not verified";
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

const statusStyles = {
  pending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  approved: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  processing: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
  },
  paid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  successful: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  failed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  rejected: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  reversed: {
    backgroundColor: "#ffedd5",
    color: "#9a3412",
  },
  verified: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  unverified: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },
  default: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px 70px",
    backgroundColor: "#f8fafc",
  },

  centeredPage: {
    minHeight: "70vh",
    display: "grid",
    placeItems: "center",
    padding: "30px 20px",
    backgroundColor: "#f8fafc",
  },

  container: {
    width: "100%",
    maxWidth: "1180px",
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
    gap: "10px",
    flexWrap: "wrap",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.09em",
  },

  title: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "clamp(30px, 5vw, 42px)",
    lineHeight: 1.15,
  },

  subtitle: {
    maxWidth: "680px",
    margin: 0,
    color: "#64748b",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  loadingText: {
    color: "#475569",
    fontSize: "16px",
  },

  errorBox: {
    marginBottom: "20px",
    padding: "14px 16px",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    fontWeight: "700",
  },

  successBox: {
    marginBottom: "20px",
    padding: "14px 16px",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    fontWeight: "700",
  },

  balanceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  balanceCard: {
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  balanceCardHighlight: {
    background:
      "linear-gradient(135deg, #1d4ed8, #2563eb)",
    borderColor: "#2563eb",
  },

  balanceLabel: {
    margin: "0 0 10px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  balanceLabelHighlight: {
    color: "#dbeafe",
  },

  balanceValue: {
    color: "#0f172a",
    fontSize: "30px",
    letterSpacing: "-0.03em",
  },

  balanceValueHighlight: {
    color: "#ffffff",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  card: {
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  bankFormCard: {
    marginBottom: "20px",
    padding: "24px",
    border: "1px solid #bfdbfe",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },

  cardEyebrow: {
    margin: "0 0 5px",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },

  cardTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
  },

  mutedText: {
    margin: "0 0 18px",
    color: "#64748b",
    lineHeight: 1.7,
  },

  bankSummary: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
  },

  metaLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  metaValue: {
    color: "#0f172a",
    fontSize: "14px",
  },

  withdrawalForm: {
    display: "grid",
    gap: "12px",
  },

  label: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "800",
  },

  amountInputRow: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },

  currencyPrefix: {
    padding: "13px 14px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "900",
    borderRight: "1px solid #e2e8f0",
  },

  amountInput: {
    width: "100%",
    padding: "13px 14px",
    border: 0,
    outline: 0,
    color: "#0f172a",
    fontSize: "16px",
  },

  quickAmounts: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  quickAmountButton: {
    padding: "8px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: "999px",
    backgroundColor: "#ffffff",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },

  helperText: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  securityNote: {
    margin: "0 0 20px",
    padding: "14px 16px",
    borderRadius: "12px",
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: 1.6,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  field: {
    display: "grid",
    gap: "7px",
  },

  fullWidthField: {
    gridColumn: "1 / -1",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "11px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    outline: "none",
  },

  formActions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "4px",
  },

  primaryButton: {
    padding: "11px 16px",
    border: 0,
    borderRadius: "11px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "11px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "11px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "800",
    cursor: "pointer",
  },

  refreshButton: {
    padding: "10px 15px",
    border: 0,
    borderRadius: "10px",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  primaryLink: {
    display: "inline-block",
    padding: "11px 16px",
    borderRadius: "11px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    textDecoration: "none",
  },

  secondaryLink: {
    display: "inline-block",
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "800",
    textDecoration: "none",
  },

  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  historyCard: {
    padding: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  historyCount: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
  },

  withdrawalList: {
    display: "grid",
  },

  withdrawalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 0",
    borderTop: "1px solid #e2e8f0",
  },

  withdrawalAmount: {
    display: "block",
    color: "#0f172a",
    fontSize: "17px",
  },

  withdrawalMeta: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },

  withdrawalStatusArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  withdrawalReference: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "800",
  },

  emptyState: {
    padding: "30px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
  },

  restrictedCard: {
    width: "100%",
    maxWidth: "520px",
    padding: "30px",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    textAlign: "center",
    boxShadow:
      "0 14px 36px rgba(15, 23, 42, 0.08)",
  },

  restrictedTitle: {
    margin: "0 0 10px",
    color: "#0f172a",
  },

  restrictedText: {
    margin: "0 0 20px",
    color: "#64748b",
    lineHeight: 1.7,
  },
};

export default Wallet;