import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CreditCard,
  Star,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

const benefits = [
  {
    id: 1,
    icon: TrendingUp,
    title: "Grow your business",
    description:
      "Reach customers who are actively looking for your skills instead of waiting for referrals.",
  },
  {
    id: 2,
    icon: BriefcaseBusiness,
    title: "Manage jobs easily",
    description:
      "Track requests, communicate with customers and manage your work from one dashboard.",
  },
  {
    id: 3,
    icon: CreditCard,
    title: "Secure payments",
    description:
      "Receive payments safely through ServiceFlow with clear job records and transaction history.",
  },
];

const highlights = [
  "Professional public profile",
  "Customer reviews & ratings",
  "Real-time notifications",
  "Messaging with customers",
  "Job management dashboard",
  "Future premium business tools",
];

function BecomeProvider() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div
          className="serviceflow-provider-grid"
          style={styles.grid}
        >
          <div>
            <Badge variant="primary">
              For artisans & professionals
            </Badge>

            <h2 style={styles.title}>
              Grow your business with ServiceFlow
            </h2>

            <p style={styles.description}>
              Whether you're an electrician, mechanic,
              plumber, technician, tutor, salon owner,
              healthcare professional or another skilled
              specialist, ServiceFlow helps you attract
              more customers, build trust and manage your
              business from one place.
            </p>

            <div style={styles.highlights}>
              {highlights.map((item) => (
                <div
                  key={item}
                  style={styles.highlight}
                >
                  <BadgeCheck
                    size={18}
                    color="#16a34a"
                  />

                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <Button
                to="/register"
                variant="primary"
              >
                Become an artisan
              </Button>

              <Link
                to="/marketplace"
                style={styles.secondaryButton}
              >
                Browse opportunities

                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div>
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <Card
                  key={benefit.id}
                  elevated
                  style={styles.card}
                >
                  <div style={styles.cardIcon}>
                    <Icon size={30} />
                  </div>

                  <div>
                    <h3 style={styles.cardTitle}>
                      {benefit.title}
                    </h3>

                    <p style={styles.cardText}>
                      {benefit.description}
                    </p>
                  </div>
                </Card>
              );
            })}

            <Card
              elevated
              style={styles.reviewCard}
            >
              <div style={styles.reviewTop}>
                <Star
                  fill="#fbbf24"
                  color="#fbbf24"
                  size={24}
                />

                <strong>
                  Build your reputation
                </strong>
              </div>

              <p style={styles.reviewText}>
                Every completed job helps grow your
                profile through ratings, reviews and
                customer trust, making it easier to win
                future work.
              </p>
            </Card>
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
      "linear-gradient(135deg,#1d4ed8,#2563eb,#0ea5e9)",
    color: "#fff",
  },

  container: {
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "60px",
    alignItems: "center",
  },

  title: {
    fontSize: "clamp(38px,5vw,54px)",
    margin: "22px 0",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
  },

  description: {
    fontSize: "18px",
    lineHeight: 1.8,
    color: "#dbeafe",
    maxWidth: "620px",
  },

  highlights: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "14px",
    marginTop: "38px",
    marginBottom: "42px",
  },

  highlight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,.12)",
    padding: "14px 16px",
    borderRadius: "14px",
    backdropFilter: "blur(8px)",
  },

  actions: {
    display: "flex",
    gap: "18px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },

  card: {
    display: "flex",
    gap: "20px",
    marginBottom: "22px",
  },

  cardIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "#eff6ff",
    color: "#2563eb",
    flexShrink: 0,
  },

  cardTitle: {
    margin: "0 0 8px",
    color: "var(--sf-text)",
    fontSize: "21px",
  },

  cardText: {
    margin: 0,
    color: "var(--sf-text-muted)",
    lineHeight: 1.7,
  },

  reviewCard: {
    marginTop: "12px",
    background:
      "linear-gradient(135deg,#ffffff,#f8fafc)",
  },

  reviewTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    color: "var(--sf-text)",
  },

  reviewText: {
    margin: 0,
    color: "var(--sf-text-muted)",
    lineHeight: 1.8,
  },
};

const responsive = `
@media (max-width:900px){

.serviceflow-provider-grid{
grid-template-columns:1fr!important;
}

}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-provider-responsive",
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "serviceflow-provider-responsive";

  style.textContent = responsive;

  document.head.appendChild(style);
}

export default BecomeProvider;