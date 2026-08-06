import {
  BriefcaseBusiness,
  CircleCheckBig,
  MessageSquareText,
  Search,
} from "lucide-react";

import howItWorks from "../../config/howItWorks";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

const iconMap = {
  search: Search,
  calendar: BriefcaseBusiness,
  check: CircleCheckBig,
  message: MessageSquareText,
};

function HowItWorks() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Badge variant="primary">
            Simple from start to finish
          </Badge>

          <h2 style={styles.title}>
            How ServiceFlow works
          </h2>

          <p style={styles.subtitle}>
            Customers post jobs, artisans find suitable
            opportunities, and both sides manage the work
            securely through one platform.
          </p>
        </header>

        <div
          className="serviceflow-how-it-works-grid"
          style={styles.grid}
        >
          {howItWorks.map((item, index) => {
            const Icon =
              iconMap[item.icon] || Search;

            return (
              <div
                key={item.id}
                style={styles.stepWrapper}
              >
                <Card
                  elevated
                  padding="28px"
                  style={styles.card}
                >
                  <div style={styles.cardTopRow}>
                    <div style={styles.iconWrap}>
                      <Icon
                        size={30}
                        strokeWidth={2.2}
                      />
                    </div>

                    <span style={styles.stepNumber}>
                      {item.step ||
                        String(index + 1).padStart(
                          2,
                          "0",
                        )}
                    </span>
                  </div>

                  <h3 style={styles.stepTitle}>
                    {item.title}
                  </h3>

                  <p style={styles.description}>
                    {item.description}
                  </p>

                  <div style={styles.progressRow}>
                    <span style={styles.progressDot} />
                    <span style={styles.progressLine} />
                  </div>
                </Card>

                {index <
                  howItWorks.length - 1 && (
                  <div
                    className="serviceflow-step-connector"
                    style={styles.connector}
                    aria-hidden="true"
                  >
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <section style={styles.summaryPanel}>
          <div style={styles.summaryIcon}>
            <CircleCheckBig
              size={26}
              strokeWidth={2.3}
            />
          </div>

          <div>
            <h3 style={styles.summaryTitle}>
              One clear workflow for every job
            </h3>

            <p style={styles.summaryText}>
              From the first request to final confirmation,
              ServiceFlow keeps job progress, communication,
              reviews, and account activity organised.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "88px 20px",
    backgroundColor: "var(--sf-surface)",
  },

  container: {
    width: "100%",
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
  },

  header: {
    maxWidth: "760px",
    margin: "0 auto 54px",
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
      "repeat(3, minmax(0, 1fr))",
    gap: "24px",
  },

  stepWrapper: {
    position: "relative",
  },

  card: {
    height: "100%",
  },

  cardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "24px",
  },

  iconWrap: {
    display: "grid",
    placeItems: "center",
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    backgroundColor:
      "var(--sf-primary-soft)",
    color: "var(--sf-primary-dark)",
  },

  stepNumber: {
    color: "var(--sf-primary)",
    fontSize: "14px",
    fontWeight: "900",
    letterSpacing: "0.08em",
  },

  stepTitle: {
    margin: "0 0 14px",
    color: "var(--sf-text)",
    fontSize: "23px",
  },

  description: {
    margin: 0,
    color: "var(--sf-text-muted)",
    lineHeight: "1.8",
  },

  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginTop: "28px",
  },

  progressDot: {
    width: "9px",
    height: "9px",
    flexShrink: 0,
    borderRadius: "999px",
    backgroundColor: "var(--sf-primary)",
  },

  progressLine: {
    width: "56px",
    height: "3px",
    borderRadius: "999px",
    backgroundColor:
      "var(--sf-primary-soft)",
  },

  connector: {
    position: "absolute",
    top: "50%",
    right: "-18px",
    zIndex: 2,
    transform: "translateY(-50%)",
    color: "var(--sf-primary)",
    fontSize: "22px",
    fontWeight: "900",
  },

  summaryPanel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginTop: "34px",
    padding: "22px",
    border: "1px solid #bbf7d0",
    borderRadius: "var(--sf-radius-lg)",
    backgroundColor: "var(--sf-success-soft)",
  },

  summaryIcon: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: "48px",
    height: "48px",
    borderRadius: "15px",
    backgroundColor: "#dcfce7",
    color: "var(--sf-success)",
  },

  summaryTitle: {
    margin: "0 0 6px",
    color: "var(--sf-success)",
    fontSize: "18px",
  },

  summaryText: {
    margin: 0,
    color: "#15803d",
    lineHeight: "1.7",
  },
};

const responsiveStyles = `
  @media (max-width: 900px) {
    .serviceflow-how-it-works-grid {
      grid-template-columns: 1fr !important;
    }

    .serviceflow-step-connector {
      display: none !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-how-it-works-responsive",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-how-it-works-responsive";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(styleElement);
}

export default HowItWorks;