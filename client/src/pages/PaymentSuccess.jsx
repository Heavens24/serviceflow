import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import paymentService from "../services/paymentService";


function PaymentSuccess() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState(
    "loading",
  );

  const [message, setMessage] = useState(
    "Verifying your payment...",
  );

  const [payment, setPayment] = useState(
    null,
  );

  const hasVerified = useRef(false);

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    "";

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    verifyPayment();
  }, []);

  async function verifyPayment() {
    if (!reference) {
      setStatus("error");

      setMessage(
        "No payment reference was provided.",
      );

      return;
    }

    try {
      setStatus("loading");

      setMessage(
        "Verifying your payment with Paystack...",
      );

      const data =
        await paymentService.verifyPayment(
          reference,
        );

      if (!data?.success) {
        setStatus("error");

        setMessage(
          data?.message ||
            "Payment verification failed.",
        );

        return;
      }

      setPayment(data);

      setStatus("success");

      setMessage(
        data?.already_processed
          ? "This payment was already verified successfully."
          : "Your payment was verified successfully.",
      );
    } catch (error) {
      const response =
        error?.response?.data;

      setStatus("error");

      setMessage(
        response?.message ||
          "Unable to verify your payment.",
      );
    }
  }

  const transaction =
    payment?.transaction || null;

  const wallet =
    payment?.wallet || null;

  const provider =
    payment?.provider || null;

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div
          style={{
            ...styles.icon,
            ...(status === "success"
              ? styles.successIcon
              : status === "error"
                ? styles.errorIcon
                : styles.loadingIcon),
          }}
        >
          {status === "success"
            ? "✓"
            : status === "error"
              ? "!"
              : "…"}
        </div>

        <p style={styles.eyebrow}>
          ServiceFlow Payments
        </p>

        <h1 style={styles.title}>
          {status === "loading" &&
            "Verifying payment"}

          {status === "success" &&
            "Payment successful"}

          {status === "error" &&
            "Payment verification issue"}
        </h1>

        <p style={styles.message}>
          {message}
        </p>

        {reference && (
          <div style={styles.referenceBox}>
            <span
              style={styles.referenceLabel}
            >
              Payment reference
            </span>

            <strong
              style={styles.referenceValue}
            >
              {reference}
            </strong>
          </div>
        )}

        {status === "loading" && (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />

            <span>
              Please wait while ServiceFlow
              confirms the transaction.
            </span>
          </div>
        )}

        {status === "success" && (
          <>
            <div style={styles.successNotice}>
              Your payment has been secured.
              The artisan's earnings remain
              pending until the job is
              completed and confirmed.
            </div>

            {(transaction ||
              provider ||
              wallet) && (
              <section style={styles.details}>
                <h2 style={styles.detailsTitle}>
                  Payment details
                </h2>

                {transaction && (
                  <>
                    <DetailRow
                      label="Amount"
                      value={formatMoney(
                        transaction.amount,
                        transaction.currency,
                      )}
                    />

                    <DetailRow
                      label="Status"
                      value={formatStatus(
                        transaction.status,
                      )}
                    />

                    <DetailRow
                      label="ServiceFlow fee"
                      value={formatMoney(
                        transaction.platform_fee,
                        transaction.currency,
                      )}
                    />

                    <DetailRow
                      label="Artisan amount"
                      value={formatMoney(
                        transaction.artisan_amount,
                        transaction.currency,
                      )}
                    />

                    {transaction.service_request_id && (
                      <DetailRow
                        label="Service request"
                        value={`#${transaction.service_request_id}`}
                      />
                    )}
                  </>
                )}

                {provider?.channel && (
                  <DetailRow
                    label="Payment channel"
                    value={formatStatus(
                      provider.channel,
                    )}
                  />
                )}

                {wallet && (
                  <DetailRow
                    label="Artisan pending balance"
                    value={formatMoney(
                      wallet.pending_balance,
                      wallet.currency,
                    )}
                  />
                )}
              </section>
            )}

            <div style={styles.actions}>
              <Link
                to="/my-requests"
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                }}
              >
                View my requests
              </Link>

              <Link
                to="/dashboard"
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                }}
              >
                Back to dashboard
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div style={styles.errorNotice}>
              Do not make another payment
              immediately. If money was
              deducted, ServiceFlow may still
              be able to verify the existing
              transaction using its reference.
            </div>

            <div style={styles.actions}>
              {reference && (
                <button
                  type="button"
                  onClick={() => {
                    hasVerified.current =
                      false;

                    verifyPayment();

                    hasVerified.current =
                      true;
                  }}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Try verification again
                </button>
              )}

              <Link
                to="/my-requests"
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                }}
              >
                View my requests
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}


function DetailRow({
  label,
  value,
}) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>
        {label}
      </span>

      <strong style={styles.detailValue}>
        {value ?? "—"}
      </strong>
    </div>
  );
}


function formatMoney(
  amount,
  currency = "ZAR",
) {
  const numericAmount = Number(
    amount || 0,
  );

  try {
    return new Intl.NumberFormat(
      "en-ZA",
      {
        style: "currency",
        currency: currency || "ZAR",
      },
    ).format(numericAmount);
  } catch {
    return `R ${numericAmount.toFixed(2)}`;
  }
}


function formatStatus(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}


const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "48px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },

  card: {
    width: "100%",
    maxWidth: "680px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    boxShadow:
      "0 12px 36px rgba(15, 23, 42, 0.10)",
    border: "1px solid #e2e8f0",
  },

  icon: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    fontSize: "30px",
    fontWeight: "800",
    marginBottom: "24px",
  },

  successIcon: {
    background: "#dcfce7",
    color: "#15803d",
  },

  errorIcon: {
    background: "#fee2e2",
    color: "#b91c1c",
  },

  loadingIcon: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  eyebrow: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  title: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "32px",
    lineHeight: "1.2",
  },

  message: {
    margin: "0 0 24px",
    color: "#64748b",
    lineHeight: "1.7",
    fontSize: "16px",
  },

  referenceBox: {
    padding: "16px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    overflowWrap: "anywhere",
  },

  referenceLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "6px",
  },

  referenceValue: {
    color: "#0f172a",
    fontSize: "14px",
  },

  loadingBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "#eff6ff",
    color: "#1e40af",
    padding: "18px",
    borderRadius: "12px",
  },

  spinner: {
    width: "20px",
    height: "20px",
    border: "3px solid #bfdbfe",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
  },

  successNotice: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "18px",
    borderRadius: "12px",
    lineHeight: "1.6",
    marginBottom: "24px",
  },

  errorNotice: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "18px",
    borderRadius: "12px",
    lineHeight: "1.6",
    marginBottom: "24px",
  },

  details: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "24px",
  },

  detailsTitle: {
    margin: "0 0 16px",
    color: "#0f172a",
    fontSize: "18px",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "12px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  detailLabel: {
    color: "#64748b",
  },

  detailValue: {
    color: "#0f172a",
    textAlign: "right",
  },

  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
  },

  button: {
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "14px",
  },

  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
  },

  secondaryButton: {
    background: "#f1f5f9",
    color: "#0f172a",
  },
};


export default PaymentSuccess;