import { useMemo } from "react";

import useAuth from "../../hooks/useAuth";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

function Hero() {
  const { user } = useAuth();

  const primaryAction = useMemo(() => {
    if (!user) {
      return {
        label: "Post a job",
        to: "/register",
      };
    }

    if (user.role === "artisan") {
      return {
        label: "Find work",
        to: "/marketplace",
      };
    }

    return {
      label: "Post a job",
      to: "/booking",
    };
  }, [user]);

  const secondaryAction = useMemo(() => {
    if (!user) {
      return {
        label: "Join as an artisan",
        to: "/register",
      };
    }

    if (user.role === "artisan") {
      return {
        label: "View my jobs",
        to: "/my-jobs",
      };
    }

    return {
      label: "View my requests",
      to: "/my-requests",
    };
  }, [user]);

  return (
    <section style={styles.section}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div
        className="serviceflow-hero-grid"
        style={styles.container}
      >
        <div style={styles.content}>
          <Badge
            variant="primary"
            style={styles.eyebrow}
          >
            South Africa&apos;s service marketplace
          </Badge>

          <h1 style={styles.heading}>
            Find trusted artisans.
            <span style={styles.highlight}>
              {" "}
              Post jobs.
            </span>

            <br />

            Grow your business.
          </h1>

          <p style={styles.description}>
            ServiceFlow connects customers with skilled
            professionals across South Africa. Compare
            profiles, manage work, communicate securely,
            and build long-term trust in one place.
          </p>

          <div
            className="serviceflow-hero-actions"
            style={styles.actions}
          >
            <Button
              to={primaryAction.to}
              size="large"
            >
              {primaryAction.label}
            </Button>

            <Button
              to={secondaryAction.to}
              variant="secondary"
              size="large"
            >
              {secondaryAction.label}
            </Button>
          </div>

          <div
            className="serviceflow-hero-trust-row"
            style={styles.trustRow}
          >
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>
                ✓
              </span>

              <div>
                <strong style={styles.trustHeading}>
                  Trusted profiles
                </strong>

                <span style={styles.trustText}>
                  Ratings, reviews, and service history
                </span>
              </div>
            </div>

            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>
                ✓
              </span>

              <div>
                <strong style={styles.trustHeading}>
                  Built for both sides
                </strong>

                <span style={styles.trustText}>
                  Customers post work. Artisans find jobs.
                </span>
              </div>
            </div>

            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>
                ✓
              </span>

              <div>
                <strong style={styles.trustHeading}>
                  Secure communication
                </strong>

                <span style={styles.trustText}>
                  Keep job updates and messages in one place
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside style={styles.visualCard}>
          <div style={styles.visualHeader}>
            <span style={styles.visualBadge}>
              Live marketplace
            </span>

            <span style={styles.onlineIndicator}>
              <span style={styles.onlineDot} />
              Active
            </span>
          </div>

          <div style={styles.profileCard}>
            <div style={styles.avatar}>
              JM
            </div>

            <div style={styles.profileDetails}>
              <div style={styles.profileTopRow}>
                <div>
                  <strong style={styles.profileName}>
                    January Mokoena
                  </strong>

                  <span style={styles.profileRole}>
                    Plumber · Bloemfontein
                  </span>
                </div>

                <Badge
                  variant="success"
                  size="small"
                >
                  Verified
                </Badge>
              </div>

              <div style={styles.ratingRow}>
                <span style={styles.stars}>
                  ★★★★★
                </span>

                <strong style={styles.ratingValue}>
                  5.0
                </strong>

                <span style={styles.ratingCount}>
                  12 reviews
                </span>
              </div>
            </div>
          </div>

          <div style={styles.jobCard}>
            <div style={styles.jobTopRow}>
              <div>
                <span style={styles.jobCategory}>
                  Plumbing
                </span>

                <h2 style={styles.jobTitle}>
                  Repair leaking kitchen tap
                </h2>
              </div>

              <Badge variant="warning">
                Open
              </Badge>
            </div>

            <p style={styles.jobDescription}>
              Customer needs a reliable artisan for a
              same-week repair in Bloemfontein.
            </p>

            <div
              className="serviceflow-hero-meta-grid"
              style={styles.jobMetaGrid}
            >
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>
                  Budget
                </span>

                <strong style={styles.metaValue}>
                  R750
                </strong>
              </div>

              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>
                  Location
                </span>

                <strong style={styles.metaValue}>
                  Bloemfontein
                </strong>
              </div>

              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>
                  Status
                </span>

                <strong style={styles.metaValue}>
                  Ready to accept
                </strong>
              </div>
            </div>
          </div>

          <div style={styles.activityStrip}>
            <div>
              <span style={styles.activityLabel}>
                New opportunities
              </span>

              <strong style={styles.activityValue}>
                Updated daily
              </strong>
            </div>

            <Button
              to={primaryAction.to}
              size="small"
            >
              Explore now
            </Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

const styles = {
  section: {
    position: "relative",
    overflow: "hidden",
    padding: "88px 20px 72px",
    background:
      "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
  },

  backgroundGlowOne: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    backgroundColor: "rgba(37, 99, 235, 0.10)",
    filter: "blur(10px)",
  },

  backgroundGlowTwo: {
    position: "absolute",
    bottom: "-180px",
    left: "-120px",
    width: "420px",
    height: "420px",
    borderRadius: "999px",
    backgroundColor: "rgba(14, 165, 233, 0.08)",
    filter: "blur(12px)",
  },

  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.1fr) minmax(340px, 0.9fr)",
    gap: "52px",
    alignItems: "center",
  },

  content: {
    minWidth: 0,
  },

  eyebrow: {
    marginBottom: "22px",
  },

  heading: {
    maxWidth: "760px",
    margin: "0 0 22px",
    color: "var(--sf-text)",
    fontSize: "clamp(44px, 7vw, 72px)",
    lineHeight: "1.02",
    letterSpacing: "-0.055em",
  },

  highlight: {
    color: "var(--sf-primary)",
  },

  description: {
    maxWidth: "680px",
    margin: 0,
    color: "var(--sf-text-muted)",
    fontSize: "18px",
    lineHeight: "1.8",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "30px",
  },

  trustRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "36px",
  },

  trustItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "14px",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-md)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },

  trustIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "26px",
    height: "26px",
    borderRadius: "999px",
    backgroundColor: "var(--sf-success-soft)",
    color: "var(--sf-success)",
    fontSize: "13px",
    fontWeight: "900",
  },

  trustHeading: {
    display: "block",
    marginBottom: "3px",
    color: "var(--sf-text)",
    fontSize: "13px",
  },

  trustText: {
    display: "block",
    color: "var(--sf-text-muted)",
    fontSize: "12px",
    lineHeight: "1.5",
  },

  visualCard: {
    padding: "22px",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-xl)",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    boxShadow: "var(--sf-shadow-lg)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },

  visualHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },

  visualBadge: {
    color: "var(--sf-primary-dark)",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  onlineIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    color: "var(--sf-success)",
    fontSize: "12px",
    fontWeight: "800",
  },

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    backgroundColor: "#22c55e",
    boxShadow:
      "0 0 0 4px rgba(34, 197, 94, 0.12)",
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-lg)",
    backgroundColor: "var(--sf-surface-soft)",
  },

  avatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, var(--sf-primary), #1e40af)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
  },

  profileDetails: {
    minWidth: 0,
    flex: 1,
  },

  profileTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  profileName: {
    display: "block",
    color: "var(--sf-text)",
    fontSize: "15px",
  },

  profileRole: {
    display: "block",
    marginTop: "3px",
    color: "var(--sf-text-muted)",
    fontSize: "12px",
  },

  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "8px",
  },

  stars: {
    color: "#f59e0b",
    letterSpacing: "0.04em",
  },

  ratingValue: {
    color: "var(--sf-text)",
    fontSize: "13px",
  },

  ratingCount: {
    color: "var(--sf-text-soft)",
    fontSize: "12px",
  },

  jobCard: {
    marginTop: "16px",
    padding: "18px",
    border: "1px solid var(--sf-border)",
    borderRadius: "var(--sf-radius-lg)",
    backgroundColor: "var(--sf-surface)",
  },

  jobTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
  },

  jobCategory: {
    display: "block",
    marginBottom: "5px",
    color: "var(--sf-primary)",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  jobTitle: {
    margin: 0,
    color: "var(--sf-text)",
    fontSize: "19px",
  },

  jobDescription: {
    margin: "13px 0 16px",
    color: "var(--sf-text-muted)",
    fontSize: "13px",
    lineHeight: "1.7",
  },

  jobMetaGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "10px",
  },

  metaItem: {
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "var(--sf-surface-soft)",
  },

  metaLabel: {
    display: "block",
    marginBottom: "3px",
    color: "var(--sf-text-soft)",
    fontSize: "10px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  metaValue: {
    color: "var(--sf-text)",
    fontSize: "12px",
  },

  activityStrip: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "16px",
    padding: "14px 16px",
    borderRadius: "var(--sf-radius-md)",
    backgroundColor: "var(--sf-primary-soft)",
  },

  activityLabel: {
    display: "block",
    marginBottom: "2px",
    color: "var(--sf-primary-dark)",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  activityValue: {
    color: "var(--sf-text)",
    fontSize: "13px",
  },
};

const responsiveStyles = `
  @media (max-width: 980px) {
    .serviceflow-hero-grid {
      grid-template-columns: 1fr !important;
    }

    .serviceflow-hero-trust-row {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 640px) {
    .serviceflow-hero-actions {
      display: grid !important;
    }

    .serviceflow-hero-actions > * {
      width: 100% !important;
    }

    .serviceflow-hero-meta-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-hero-responsive-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-hero-responsive-styles";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default Hero;