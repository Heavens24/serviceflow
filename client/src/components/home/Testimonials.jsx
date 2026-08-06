import {
  BriefcaseBusiness,
  Quote,
  Star,
  UserRound,
} from "lucide-react";

import testimonials from "../../config/testimonials";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

function Testimonials() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Badge variant="primary">
            Trusted across South Africa
          </Badge>

          <h2 style={styles.title}>
            Success stories from our community
          </h2>

          <p style={styles.subtitle}>
            Customers discover reliable professionals,
            while artisans grow their businesses through
            ServiceFlow.
          </p>
        </header>

        <div
          className="serviceflow-testimonial-grid"
          style={styles.grid}
        >
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              elevated
              style={styles.card}
            >
              <div style={styles.quoteIcon}>
                <Quote size={26} />
              </div>

              <div style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill="#fbbf24"
                    color="#fbbf24"
                  />
                ))}
              </div>

              <p style={styles.comment}>
                "{testimonial.comment}"
              </p>

              <div style={styles.footer}>
                <div style={styles.avatar}>
                  {testimonial.profession
                    ?.toLowerCase()
                    .includes("owner") ||
                  testimonial.profession
                    ?.toLowerCase()
                    .includes("mechanic") ||
                  testimonial.profession
                    ?.toLowerCase()
                    .includes("electrician") ? (
                    <BriefcaseBusiness size={24} />
                  ) : (
                    <UserRound size={24} />
                  )}
                </div>

                <div>
                  <h3 style={styles.name}>
                    {testimonial.name}
                  </h3>

                  <p style={styles.role}>
                    {testimonial.profession}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div style={styles.bottomPanel}>
          <div style={styles.metric}>
            <h3>95%</h3>
            <p>
              of customers would recommend
              ServiceFlow.
            </p>
          </div>

          <div style={styles.metric}>
            <h3>4.9★</h3>
            <p>
              average rating from completed
              jobs.
            </p>
          </div>

          <div style={styles.metric}>
            <h3>Growing</h3>
            <p>
              every month with more artisans
              joining the marketplace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "90px 20px",
    background: "#f8fafc",
  },

  container: {
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
  },

  header: {
    textAlign: "center",
    maxWidth: "760px",
    margin: "0 auto 56px",
  },

  title: {
    margin: "18px 0",
    color: "var(--sf-text)",
    fontSize: "clamp(34px,5vw,48px)",
    letterSpacing: "-0.03em",
  },

  subtitle: {
    margin: 0,
    color: "var(--sf-text-muted)",
    fontSize: "17px",
    lineHeight: 1.8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(320px,1fr))",
    gap: "26px",
  },

  card: {
    position: "relative",
    overflow: "hidden",
  },

  quoteIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "var(--sf-primary-soft)",
    color: "var(--sf-primary)",
    marginBottom: "18px",
  },

  stars: {
    display: "flex",
    gap: "4px",
    marginBottom: "18px",
  },

  comment: {
    color: "var(--sf-text-muted)",
    lineHeight: 1.8,
    fontStyle: "italic",
    minHeight: "115px",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "26px",
    paddingTop: "22px",
    borderTop: "1px solid var(--sf-border)",
  },

  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    display: "grid",
    placeItems: "center",
    background: "var(--sf-primary-soft)",
    color: "var(--sf-primary)",
    flexShrink: 0,
  },

  name: {
    margin: 0,
    color: "var(--sf-text)",
    fontSize: "18px",
  },

  role: {
    margin: "6px 0 0",
    color: "var(--sf-text-muted)",
  },

  bottomPanel: {
    marginTop: "50px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "22px",
  },

  metric: {
    padding: "26px",
    borderRadius: "20px",
    background: "#fff",
    border: "1px solid var(--sf-border)",
    textAlign: "center",
    boxShadow: "var(--sf-shadow-sm)",
  },
};

const responsive = `
@media (max-width:768px){

.serviceflow-testimonial-grid{
grid-template-columns:1fr!important;
}

}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-testimonials-responsive",
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "serviceflow-testimonials-responsive";

  style.textContent = responsive;

  document.head.appendChild(style);
}

export default Testimonials;