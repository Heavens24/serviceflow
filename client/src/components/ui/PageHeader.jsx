import PropTypes from "prop-types";

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}) {
  return (
    <header style={styles.header}>
      <div>
        {eyebrow && (
          <p style={styles.eyebrow}>
            {eyebrow}
          </p>
        )}

        <h1 style={styles.title}>
          {title}
        </h1>

        {description && (
          <p style={styles.description}>
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div style={styles.actions}>
          {actions}
        </div>
      )}
    </header>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
};

const styles = {
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
    color: "var(--sf-primary)",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.09em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 10px",
    color: "var(--sf-text)",
    fontSize: "clamp(30px, 5vw, 42px)",
    lineHeight: "1.12",
  },

  description: {
    maxWidth: "680px",
    margin: 0,
    color: "var(--sf-text-muted)",
    fontSize: "16px",
    lineHeight: "1.7",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
};

export default PageHeader;