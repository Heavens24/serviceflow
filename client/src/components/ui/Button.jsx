import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const variants = {
  primary: {
    backgroundColor: "var(--sf-primary)",
    borderColor: "var(--sf-primary)",
    color: "#ffffff",
  },

  secondary: {
    backgroundColor: "var(--sf-surface)",
    borderColor: "var(--sf-border-strong)",
    color: "var(--sf-text)",
  },

  success: {
    backgroundColor: "var(--sf-success)",
    borderColor: "var(--sf-success)",
    color: "#ffffff",
  },

  danger: {
    backgroundColor: "var(--sf-danger)",
    borderColor: "var(--sf-danger)",
    color: "#ffffff",
  },

  warning: {
    backgroundColor: "var(--sf-warning)",
    borderColor: "var(--sf-warning)",
    color: "#ffffff",
  },

  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "var(--sf-primary)",
  },
};

const sizes = {
  small: {
    minHeight: "36px",
    padding: "8px 12px",
    fontSize: "13px",
  },

  medium: {
    minHeight: "42px",
    padding: "11px 17px",
    fontSize: "14px",
  },

  large: {
    minHeight: "48px",
    padding: "14px 21px",
    fontSize: "15px",
  },
};

function Button({
  children,
  to,
  type = "button",
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  onClick,
  className = "",
  style,
  ...props
}) {
  const selectedVariant =
    variants[variant] || variants.primary;

  const selectedSize =
    sizes[size] || sizes.medium;

  const sharedStyle = {
    ...styles.base,
    ...selectedVariant,
    ...selectedSize,
    width: fullWidth ? "100%" : "auto",
    opacity: disabled ? 0.65 : 1,
    cursor: disabled
      ? "not-allowed"
      : "pointer",
    ...style,
  };

  if (to) {
    return (
      <Link
        to={to}
        className={className}
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          onClick?.(event);
        }}
        style={sharedStyle}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={sharedStyle}
      {...props}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  type: PropTypes.oneOf([
    "button",
    "submit",
    "reset",
  ]),
  variant: PropTypes.oneOf(
    Object.keys(variants),
  ),
  size: PropTypes.oneOf(
    Object.keys(sizes),
  ),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
};

const styles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxSizing: "border-box",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "var(--sf-radius-md)",
    fontFamily: "inherit",
    fontWeight: "800",
    lineHeight: "1",
    textAlign: "center",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition:
      "transform var(--sf-transition), " +
      "box-shadow var(--sf-transition), " +
      "opacity var(--sf-transition), " +
      "background-color var(--sf-transition)",
  },
};

export default Button;