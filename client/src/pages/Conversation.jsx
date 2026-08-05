import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import messageService from "../services/messageService";

const REFRESH_INTERVAL_MS = 5000;
const MAX_MESSAGE_LENGTH = 2000;

function Conversation() {
  const { serviceRequestId } = useParams();
  const { user } = useAuth();

  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const numericServiceRequestId = Number(serviceRequestId);

  const loadConversation = useCallback(
    async ({ silent = false } = {}) => {
      if (
        !Number.isInteger(numericServiceRequestId) ||
        numericServiceRequestId <= 0
      ) {
        setErrorMessage(
          "The service request ID is invalid.",
        );
        setLoading(false);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const result =
          await messageService.getConversation(
            numericServiceRequestId,
          );

        if (!result.success) {
          setErrorMessage(
            result.message ||
              "Unable to load this conversation.",
          );
          return;
        }

        setConversation(result.conversation || null);
        setMessages(result.messages || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
            "Unable to load this conversation. Please try again.",
        );
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [numericServiceRequestId],
  );

  useEffect(() => {
    let isMounted = true;

    const loadInitialConversation = async () => {
      if (!isMounted) {
        return;
      }

      await loadConversation();
    };

    loadInitialConversation();

    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        isMounted
      ) {
        loadConversation({
          silent: true,
        });
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [loadConversation]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

    shouldAutoScrollRef.current = false;
  }, [messages]);

  const currentUserId = useMemo(() => {
    const conversationUserId =
      conversation?.current_user?.id;

    return Number(conversationUserId || user?.id || 0);
  }, [conversation, user]);

  const otherParticipant = conversation?.other_user;
  const serviceRequest =
    conversation?.service_request;

  const backRoute =
    user?.role === "artisan"
      ? "/my-jobs"
      : "/my-requests";

  const backLabel =
    user?.role === "artisan"
      ? "Back to my jobs"
      : "Back to my requests";

  const remainingCharacters =
    MAX_MESSAGE_LENGTH - messageText.length;

  const canSend =
    messageText.trim().length > 0 &&
    messageText.length <= MAX_MESSAGE_LENGTH &&
    !sending;

  const handleMessageChange = (event) => {
    const nextValue = event.target.value;

    if (nextValue.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setMessageText(nextValue);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = messageText.trim();

    if (!trimmedMessage) {
      setErrorMessage(
        "Please enter a message before sending.",
      );
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(
        `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
      );
      return;
    }

    try {
      setSending(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await messageService.sendMessage(
        numericServiceRequestId,
        trimmedMessage,
      );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            "Unable to send your message.",
        );
        return;
      }

      if (result.data) {
        setMessages((currentMessages) => {
          const messageAlreadyExists =
            currentMessages.some(
              (message) =>
                message.id === result.data.id,
            );

          if (messageAlreadyExists) {
            return currentMessages;
          }

          return [
            ...currentMessages,
            result.data,
          ];
        });
      }

      setMessageText("");
      setSuccessMessage(
        result.message ||
          "Message sent successfully.",
      );

      shouldAutoScrollRef.current = true;

      await loadConversation({
        silent: true,
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (canSend) {
        handleSendMessage(event);
      }
    }
  };

  if (loading) {
    return (
      <main style={styles.centeredPage}>
        <p style={styles.loadingText}>
          Loading conversation...
        </p>
      </main>
    );
  }

  if (errorMessage && !conversation) {
    return (
      <main style={styles.centeredPage}>
        <section style={styles.blockingErrorCard}>
          <h1 style={styles.blockingErrorHeading}>
            Conversation unavailable
          </h1>

          <p style={styles.blockingErrorText}>
            {errorMessage}
          </p>

          <Link
            to={backRoute}
            style={styles.primaryLink}
          >
            {backLabel}
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
              ServiceFlow Messages
            </p>

            <h1 style={styles.heading}>
              {serviceRequest?.title ||
                "Conversation"}
            </h1>

            <p style={styles.subheading}>
              Chat with{" "}
              <strong>
                {otherParticipant?.full_name ||
                  "the other participant"}
              </strong>{" "}
              about service request #
              {serviceRequest?.id ||
                numericServiceRequestId}.
            </p>
          </div>

          <div style={styles.headerActions}>
            <Link
              to={backRoute}
              style={styles.secondaryLink}
            >
              {backLabel}
            </Link>

            <Link
              to="/dashboard"
              style={styles.secondaryLink}
            >
              Dashboard
            </Link>
          </div>
        </header>

        <section style={styles.conversationMeta}>
          <div>
            <span style={styles.metaLabel}>
              Participant
            </span>

            <strong style={styles.metaValue}>
              {otherParticipant?.full_name ||
                "Not available"}
            </strong>
          </div>

          <div>
            <span style={styles.metaLabel}>
              Role
            </span>

            <strong style={styles.metaValue}>
              {formatStatus(
                otherParticipant?.role,
              )}
            </strong>
          </div>

          <div>
            <span style={styles.metaLabel}>
              Request status
            </span>

            <strong style={styles.metaValue}>
              {formatStatus(
                serviceRequest?.status,
              )}
            </strong>
          </div>

          <div>
            <span style={styles.metaLabel}>
              Messages
            </span>

            <strong style={styles.metaValue}>
              {messages.length}
            </strong>
          </div>
        </section>

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
          </section>
        )}

        <section style={styles.chatCard}>
          <div style={styles.chatHeader}>
            <div>
              <h2 style={styles.chatHeading}>
                Conversation
              </h2>

              <p style={styles.chatStatus}>
                {refreshing
                  ? "Checking for new messages..."
                  : "Messages refresh automatically every 5 seconds."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                shouldAutoScrollRef.current = true;

                loadConversation({
                  silent: true,
                });
              }}
              disabled={refreshing}
              style={{
                ...styles.refreshButton,
                opacity: refreshing ? 0.7 : 1,
                cursor: refreshing
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          <div
            style={styles.messagesArea}
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <section style={styles.emptyConversation}>
                <h3 style={styles.emptyHeading}>
                  No messages yet
                </h3>

                <p style={styles.emptyText}>
                  Start the conversation by sending
                  the first message.
                </p>
              </section>
            ) : (
              messages.map((message) => {
                const isCurrentUser =
                  Number(message.sender_id) ===
                  currentUserId;

                return (
                  <article
                    key={message.id}
                    style={{
                      ...styles.messageRow,
                      justifyContent:
                        isCurrentUser
                          ? "flex-end"
                          : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(isCurrentUser
                          ? styles.sentBubble
                          : styles.receivedBubble),
                      }}
                    >
                      <p style={styles.senderName}>
                        {isCurrentUser
                          ? "You"
                          : message.sender
                              ?.full_name ||
                            otherParticipant
                              ?.full_name ||
                            "Participant"}
                      </p>

                      <p style={styles.messageText}>
                        {message.message}
                      </p>

                      <time
                        dateTime={
                          message.created_at || ""
                        }
                        style={{
                          ...styles.timestamp,
                          color: isCurrentUser
                            ? "#dbeafe"
                            : "#64748b",
                        }}
                      >
                        {formatDateTime(
                          message.created_at,
                        )}
                      </time>
                    </div>
                  </article>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            style={styles.composer}
          >
            <label
              htmlFor="conversation-message"
              style={styles.composerLabel}
            >
              Message
            </label>

            <textarea
              id="conversation-message"
              value={messageText}
              onChange={handleMessageChange}
              onKeyDown={handleComposerKeyDown}
              rows={4}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={`Write a message to ${
                otherParticipant?.full_name ||
                "the other participant"
              }...`}
              disabled={sending}
              style={styles.textarea}
            />

            <div style={styles.composerFooter}>
              <div>
                <p style={styles.composerHelp}>
                  Press Enter to send. Use
                  Shift + Enter for a new line.
                </p>

                <p
                  style={{
                    ...styles.characterCount,
                    color:
                      remainingCharacters < 100
                        ? "#b45309"
                        : "#94a3b8",
                  }}
                >
                  {remainingCharacters} characters
                  remaining
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSend}
                style={{
                  ...styles.sendButton,
                  opacity: canSend ? 1 : 0.6,
                  cursor: canSend
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                {sending
                  ? "Sending..."
                  : "Send message"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function formatStatus(value) {
  if (!value) {
    return "Not available";
  }

  return String(value)
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDateTime(value) {
  if (!value) {
    return "Time unavailable";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Time unavailable";
  }

  return parsedDate.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "24px",
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
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  heading: {
    margin: "0 0 10px",
    color: "#0f172a",
    fontSize: "34px",
    lineHeight: "1.2",
  },

  subheading: {
    margin: 0,
    maxWidth: "650px",
    color: "#64748b",
    fontSize: "16px",
    lineHeight: "1.7",
  },

  primaryLink: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: "800",
    textDecoration: "none",
  },

  secondaryLink: {
    display: "inline-block",
    padding: "12px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
    textDecoration: "none",
  },

  conversationMeta: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "18px",
    marginBottom: "22px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
  },

  metaLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  metaValue: {
    color: "#0f172a",
    fontSize: "15px",
  },

  successCard: {
    marginBottom: "18px",
    padding: "15px 17px",
    border: "1px solid #bbf7d0",
    borderRadius: "11px",
    backgroundColor: "#f0fdf4",
  },

  successText: {
    margin: 0,
    color: "#166534",
    fontWeight: "700",
  },

  errorCard: {
    marginBottom: "18px",
    padding: "15px 17px",
    border: "1px solid #fecaca",
    borderRadius: "11px",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    margin: 0,
    color: "#b91c1c",
    fontWeight: "700",
  },

  blockingErrorCard: {
    width: "100%",
    maxWidth: "560px",
    padding: "34px",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    textAlign: "center",
  },

  blockingErrorHeading: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: "28px",
  },

  blockingErrorText: {
    margin: "0 0 22px",
    color: "#b91c1c",
    lineHeight: "1.7",
  },

  chatCard: {
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    backgroundColor: "#ffffff",
    boxShadow:
      "0 12px 35px rgba(15, 23, 42, 0.07)",
  },

  chatHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    padding: "20px 22px",
    borderBottom: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },

  chatHeading: {
    margin: "0 0 5px",
    color: "#0f172a",
    fontSize: "21px",
  },

  chatStatus: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
  },

  refreshButton: {
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontWeight: "700",
  },

  messagesArea: {
    minHeight: "380px",
    maxHeight: "560px",
    overflowY: "auto",
    padding: "24px",
    backgroundColor: "#f8fafc",
  },

  emptyConversation: {
    display: "grid",
    minHeight: "330px",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
  },

  emptyHeading: {
    margin: "0 0 8px",
    color: "#0f172a",
    fontSize: "21px",
  },

  emptyText: {
    margin: 0,
    color: "#64748b",
  },

  messageRow: {
    display: "flex",
    marginBottom: "14px",
  },

  messageBubble: {
    width: "fit-content",
    maxWidth: "75%",
    padding: "13px 15px",
    borderRadius: "15px",
    wordBreak: "break-word",
  },

  sentBubble: {
    borderBottomRightRadius: "4px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
  },

  receivedBubble: {
    border: "1px solid #e2e8f0",
    borderBottomLeftRadius: "4px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },

  senderName: {
    margin: "0 0 5px",
    fontSize: "12px",
    fontWeight: "800",
    opacity: 0.9,
  },

  messageText: {
    margin: "0 0 7px",
    fontSize: "15px",
    lineHeight: "1.55",
    whiteSpace: "pre-wrap",
  },

  timestamp: {
    display: "block",
    fontSize: "11px",
    textAlign: "right",
  },

  composer: {
    padding: "20px 22px",
    borderTop: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },

  composerLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "800",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "11px",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "inherit",
    fontSize: "15px",
    lineHeight: "1.6",
    resize: "vertical",
    outline: "none",
  },

  composerFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "18px",
    marginTop: "12px",
    flexWrap: "wrap",
  },

  composerHelp: {
    margin: "0 0 3px",
    color: "#64748b",
    fontSize: "12px",
  },

  characterCount: {
    margin: 0,
    fontSize: "12px",
  },

  sendButton: {
    padding: "12px 19px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
  },
};

export default Conversation;