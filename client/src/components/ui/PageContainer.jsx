import PropTypes from "prop-types";

function PageContainer({
  children,
  width = "var(--sf-container)",
  style,
}) {
  return (
    <main style={styles.page}>
      <div
        style={{
          ...styles.container,
          maxWidth: width,
          ...style,
        }}
      >
        {children}
      </div>
    </main>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  width: PropTypes.string,
  style: PropTypes.object,
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "var(--sf-background)",
  },

  container: {
    width: "100%",
    margin: "0 auto",
  },
};

export default PageContainer;