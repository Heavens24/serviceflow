import {
  Globe,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import stats from "../../config/stats";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

const icons = [
  Users,
  ShieldCheck,
  TrendingUp,
  Globe,
];

function Stats() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Badge variant="primary">
            Growing every day
          </Badge>

          <h2 style={styles.title}>
            Trusted across South Africa
          </h2>

          <p style={styles.subtitle}>
            ServiceFlow is building a trusted marketplace
            where customers find skilled professionals and
            artisans grow successful businesses.
          </p>
        </header>

        <div
          className="serviceflow-stats-grid"
          style={styles.grid}
        >
          {stats.map((stat, index) => {
            const Icon =
              icons[index % icons.length];

            return (
              <Card
                key={stat.id}
                elevated
                style={styles.card}
              >
                <div style={styles.icon}>
                  <Icon size={30} />
                </div>

                <h3 style={styles.number}>
                  {stat.number}
                </h3>

                <p style={styles.label}>
                  {stat.label}
                </p>
              </Card>
            );
          })}
        </div>

        <div style={styles.bottom}>
          <div style={styles.left}>
            <h3 style={styles.bottomTitle}>
              Building the future of skilled services
            </h3>

            <p style={styles.bottomText}>
              Every customer request, completed job,
              review and verified artisan helps strengthen
              the ServiceFlow marketplace and build trust
              between professionals and customers.
            </p>
          </div>

          <div style={styles.right}>
            <div style={styles.badge}>
              🇿🇦 Proudly built in South Africa
            </div>

            <div style={styles.badge}>
              🔒 Secure platform
            </div>

            <div style={styles.badge}>
              ⭐ Trusted professionals
            </div>

            <div style={styles.badge}>
              🚀 Growing marketplace
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "96px 20px",
    background:
      "linear-gradient(135deg,#0f172a,#172554,#1e3a8a)",
    color: "#fff",
  },

  container: {
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
  },

  header: {
    textAlign: "center",
    maxWidth: "760px",
    margin: "0 auto 60px",
  },

  title: {
    margin: "20px 0 16px",
    fontSize: "clamp(36px,5vw,52px)",
    letterSpacing: "-0.03em",
  },

  subtitle: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "17px",
    lineHeight: 1.8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "24px",
  },

  card: {
    textAlign: "center",
    background:
      "rgba(255,255,255,.06)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,.12)",
  },

  icon: {
    width: "64px",
    height: "64px",
    margin: "0 auto 22px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background:
      "rgba(255,255,255,.12)",
    color: "#93c5fd",
  },

  number: {
    margin: "0 0 10px",
    fontSize: "clamp(34px,4vw,48px)",
    color: "#ffffff",
  },

  label: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },

  bottom: {
    marginTop: "60px",
    display: "grid",
    gridTemplateColumns:
      "1.3fr .7fr",
    gap: "32px",
    alignItems: "center",
  },

  left: {},

  bottomTitle: {
    margin: "0 0 14px",
    fontSize: "28px",
  },

  bottomText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.9,
  },

  right: {
    display: "grid",
    gap: "14px",
  },

  badge: {
    padding: "14px 18px",
    borderRadius: "14px",
    background:
      "rgba(255,255,255,.08)",
    border:
      "1px solid rgba(255,255,255,.12)",
    fontWeight: 600,
  },
};

const responsive = `
@media (max-width:900px){

.serviceflow-stats-grid{
grid-template-columns:repeat(2,1fr)!important;
}

}

@media (max-width:640px){

.serviceflow-stats-grid{
grid-template-columns:1fr!important;
}

}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-stats-responsive",
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "serviceflow-stats-responsive";

  style.textContent = responsive;

  document.head.appendChild(style);
}

export default Stats;