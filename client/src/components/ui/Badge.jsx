import PropTypes from "prop-types";

const variants = {
  neutral: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
  },

  primary: {
    backgroundColor: "var(--sf-primary-soft)",
    color: "var(--sf-primary-dark)",
  },

  success: {
    backgroundColor: "var(--sf-success-soft)",
    color: "var(--sf-success)",
  },

  warning: {
    backgroundColor: "var(--sf-warning-soft)",
    color: "var(--sf-warning)",
  },

  danger: {
    backgroundColor: "var(--sf-danger-soft)",
    color: "var(--sf-danger)",
  },
};

const sizes = {
  small: {
    padding: "5px 8px",
    fontSize: "11px",
  },

  medium: {
    padding: "7px 11px",
    fontSize: "12px",
  },

  large: {
    padding: "9px 13px",
    fontSize: "13px",
  },
};

function Badge({
  children,
  variant = "neutral",
  size = "medium",
  className = "",
  style,
  ...props
}) {
  const selectedVariant =
    variants[variant] || variants.neutral;

  const selectedSize =
    sizes[size] || sizes.medium;

  return (
    <span
      className={className}
      style={{
        ...styles.base,
        ...selectedVariant,
        ...selectedSize,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(
    Object.keys(variants),
  ),
  size: PropTypes.oneOf(
    Object.keys(sizes),
  ),
  className: PropTypes.string,
  style: PropTypes.object,
};

const styles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    borderRadius: "var(--sf-radius-pill)",
    fontWeight: "900",
    lineHeight: "1",
    whiteSpace: "nowrap",
  },
};

export default Badge;