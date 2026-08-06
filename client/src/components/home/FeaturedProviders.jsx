import { useNavigate } from "react-router-dom";

import providers from "../../config/providers";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

function FeaturedProviders() {
  const navigate = useNavigate();

  const handleViewProvider = (provider) => {
    if (provider.user_id) {
      navigate(`/artisans/${provider.user_id}`);
      return;
    }

    navigate("/register");
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Badge variant="primary">
            Featured Professionals
          </Badge>

          <h2 style={styles.title}>
            Discover trusted artisans
          </h2>

          <p style={styles.subtitle}>
            Explore experienced professionals with strong ratings,
            proven service history, and clear pricing.
          </p>
        </div>

        <div
          className="serviceflow-featured-grid"
          style={styles.grid}
        >
          {providers.map((provider) => (
            <Card
              key={provider.id}
              elevated
              padding="0"
              style={styles.card}
            >
              <div style={styles.cardHeader}>
                <div style={styles.iconWrap}>
                  {provider.icon}
                </div>

                <div style={styles.headerOverlay}>
                  {provider.verified ? (
                    <Badge
                      variant="success"
                      size="small"
                    >
                      ✓ Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="neutral"
                      size="small"
                    >
                      New professional
                    </Badge>
                  )}
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.identityBlock}>
                  <h3 style={styles.name}>
                    {provider.name}
                  </h3>

                  <p style={styles.profession}>
                    {provider.profession}
                  </p>
                </div>

                <div style={styles.ratingRow}>
                  <span
                    aria-label={`${provider.rating} out of 5 stars`}
                    style={styles.stars}
                  >
                    ★★★★★
                  </span>

                  <strong style={styles.ratingValue}>
                    {provider.rating}
                  </strong>
                </div>

                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>
                      Location
                    </span>

                    <strong style={styles.detailValue}>
                      {provider.location}
                    </strong>
                  </div>

                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>
                      Starting price
                    </span>

                    <strong style={styles.price}>
                      {provider.price}
                    </strong>
                  </div>
                </div>

                <div style={styles.trustStrip}>
                  <span style={styles.trustDot} />

                  <span style={styles.trustText}>
                    Profile reviewed by ServiceFlow
                  </span>
                </div>

                <Button
                  type="button"
                  fullWidth
                  onClick={() =>
                    handleViewProvider(provider)
                  }
                >
                  {provider.user_id
                    ? "View profile"
                    : "Join to connect"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div style={styles.footer}>
          <div>
            <h3 style={styles.footerHeading}>
              Are you a skilled professional?
            </h3>

            <p style={styles.footerText}>
              Create your artisan profile, showcase your experience,
              and connect with customers looking for trusted help.
            </p>
          </div>

          <Button
            to="/register"
            variant="secondary"
          >
            Become an artisan
          </Button>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "88px 20px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  },

  container: {
    width: "100%",
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
  },

  header: {
    maxWidth: "760px",
    margin: "0 auto 52px",
    textAlign: "center",
  },

  title: {
    margin: "18px 0 16px",
    color: "var(--sf-text)",
    fontSize: "clamp(34px, 5vw, 48px)",
    letterSpacing: "-0.035em",
  },

  subtitle: {
    margin: 0,
    color: "var(--sf-text-muted)",
    fontSize: "17px",
    lineHeight: "1.8",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },

  card: {
    overflow: "hidden",
  },

  cardHeader: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    minHeight: "150px",
    padding: "24px",
    background:
      "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)",
  },

  iconWrap: {
    display: "grid",
    placeItems: "center",
    width: "82px",
    height: "82px",
    borderRadius: "24px",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    color: "#ffffff",
    fontSize: "46px",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow:
      "0 16px 36px rgba(15, 23, 42, 0.18)",
  },

  headerOverlay: {
    position: "absolute",
    top: "14px",
    right: "14px",
  },

  cardBody: {
    padding: "24px",
  },

  identityBlock: {
    marginBottom: "18px",
    textAlign: "center",
  },

  name: {
    margin: "0 0 6px",
    color: "var(--sf-text)",
    fontSize: "21px",
  },

  profession: {
    margin: 0,
    color: "var(--sf-text-muted)",
    fontSize: "14px",
  },

  ratingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    marginBottom: "20px",
  },

  stars: {
    color: "#f59e0b",
    letterSpacing: "0.05em",
    fontSize: "14px",
  },

  ratingValue: {
    color: "var(--sf-text)",
    fontSize: "14px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },

  detailItem: {
    padding: "13px",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-md)",
    backgroundColor: "var(--sf-surface-soft)",
  },

  detailLabel: {
    display: "block",
    marginBottom: "5px",
    color: "var(--sf-text-soft)",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  detailValue: {
    color: "var(--sf-text)",
    fontSize: "13px",
  },

  price: {
    color: "var(--sf-primary-dark)",
    fontSize: "13px",
  },

  trustStrip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "18px",
    padding: "11px 12px",
    borderRadius: "var(--sf-radius-md)",
    backgroundColor: "var(--sf-success-soft)",
  },

  trustDot: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "999px",
    backgroundColor: "#22c55e",
  },

  trustText: {
    color: "var(--sf-success)",
    fontSize: "12px",
    fontWeight: "700",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    marginTop: "36px",
    padding: "24px",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-lg)",
    backgroundColor: "var(--sf-surface)",
    flexWrap: "wrap",
  },

  footerHeading: {
    margin: "0 0 6px",
    color: "var(--sf-text)",
    fontSize: "19px",
  },

  footerText: {
    maxWidth: "680px",
    margin: 0,
    color: "var(--sf-text-muted)",
    lineHeight: "1.7",
  },
};

const responsiveStyles = `
  @media (max-width: 640px) {
    .serviceflow-featured-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-featured-responsive-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-featured-responsive-styles";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default FeaturedProviders;