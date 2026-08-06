import { useNavigate } from "react-router-dom";

import categories from "../../config/categories";
import Badge from "../ui/Badge";
import Card from "../ui/Card";

function Categories() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    const params = new URLSearchParams({
      category: category.name,
    });

    navigate(`/marketplace?${params.toString()}`);
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Badge variant="primary">
            Popular Services
          </Badge>

          <h2 style={styles.title}>
            Explore Service Categories
          </h2>

          <p style={styles.subtitle}>
            Whether you need a quick repair, healthcare,
            education, beauty services or skilled
            professionals, ServiceFlow helps you find
            trusted providers across South Africa.
          </p>
        </div>

        <div
          className="serviceflow-category-grid"
          style={styles.grid}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              style={styles.cardWrapper}
              onClick={() =>
                handleCategoryClick(category)
              }
            >
              <Card>
                <div style={styles.icon}>
                  {category.icon}
                </div>

                <h3 style={styles.name}>
                  {category.name}
                </h3>

                <p style={styles.description}>
                  Find trusted{" "}
                  {category.name.toLowerCase()}s near
                  you.
                </p>

                <div style={styles.footer}>
                  <span style={styles.explore}>
                    Explore →
                  </span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    padding: "80px 20px",
    background: "#f8fafc",
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
    marginTop: "18px",
    marginBottom: "18px",
    fontSize: "clamp(34px,5vw,48px)",
    color: "var(--sf-text)",
  },

  subtitle: {
    color: "var(--sf-text-muted)",
    lineHeight: 1.8,
    fontSize: "17px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "24px",
  },

  cardWrapper: {
    cursor: "pointer",
    transition: "all .25s ease",
  },

  icon: {
    fontSize: "56px",
    marginBottom: "22px",
  },

  name: {
    margin: 0,
    fontSize: "22px",
    color: "var(--sf-text)",
  },

  description: {
    marginTop: "14px",
    marginBottom: "26px",
    color: "var(--sf-text-muted)",
    lineHeight: 1.7,
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  explore: {
    color: "var(--sf-primary)",
    fontWeight: 700,
  },
};

const responsive = `
.serviceflow-category-grid > div:hover{
transform:translateY(-8px);
}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-category-style",
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "serviceflow-category-style";

  style.textContent = responsive;

  document.head.appendChild(style);
}

export default Categories;