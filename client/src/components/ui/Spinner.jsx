function Spinner({
  label = "Loading...",
}) {
  return (
    <div style={styles.wrapper}>
      <span style={styles.spinner} />

      <span style={styles.label}>
        {label}
      </span>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    color: "var(--sf-text-muted)",
  },

  spinner: {
    width: "34px",
    height: "34px",
    border:
      "4px solid var(--sf-border)",
    borderTopColor: "var(--sf-primary)",
    borderRadius: "50%",
    animation:
      "serviceflow-spin 0.8s linear infinite",
  },

  label: {
    fontWeight: "700",
  },
};

export default Spinner;