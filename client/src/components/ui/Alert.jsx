import PropTypes from "prop-types";

const variants = {
  success: {
    backgroundColor: "var(--sf-success-soft)",
    borderColor: "#bbf7d0",
    color: "var(--sf-success)",
  },

  error: {
    backgroundColor: "var(--sf-danger-soft)",
    borderColor: "#fecaca",
    color: "var(--sf-danger)",
  },

  warning: {
    backgroundColor: "var(--sf-warning-soft)",
    borderColor: "#fde68a",
    color: "var(--sf-warning)",
  },

  info: {
    backgroundColor: "var(--sf-primary-soft)",
    borderColor: "#bfdbfe",
    color: "var(--sf-primary-dark)",
  },
};

function Alert({
  children,
  variant = "info",
  style,
}) {
  return (
    <div
      role={
        variant === "error"
          ? "alert"
          : "status"
      }
      style={{
        ...styles.base,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(
    Object.keys(variants),
  ),
  style: PropTypes.object,
};

const styles = {
  base: {
    padding: "16px 18px",
    border: "1px solid",
    borderRadius: "var(--sf-radius-md)",
    fontWeight: "700",
    lineHeight: "1.6",
  },
};

export default Alert;