import PropTypes from "prop-types";

function Card({
  children,
  as: Component = "section",
  padding = "24px",
  elevated = false,
  hoverable = false,
  className = "",
  style,
  ...props
}) {
  return (
    <Component
      className={className}
      style={{
        ...styles.base,
        padding,
        boxShadow: elevated
          ? "var(--sf-shadow-md)"
          : "var(--sf-shadow-sm)",
        transition: hoverable
          ? (
              "transform var(--sf-transition), " +
              "box-shadow var(--sf-transition)"
            )
          : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  as: PropTypes.elementType,
  padding: PropTypes.string,
  elevated: PropTypes.bool,
  hoverable: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

const styles = {
  base: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-lg)",
    backgroundColor: "var(--sf-surface)",
    color: "var(--sf-text)",
  },
};

export default Card;