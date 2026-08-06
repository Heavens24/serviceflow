import { useState } from "react";
import { useNavigate } from "react-router-dom";

import services from "../../config/services";
import Button from "../ui/Button";
import Card from "../ui/Card";

function SearchBar() {
  const navigate = useNavigate();

  const [category, setCategory] = useState(
    services[0] || "",
  );

  const [location, setLocation] =
    useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (category) {
      params.set("category", category);
    }

    if (location.trim()) {
      params.set(
        "location",
        location.trim(),
      );
    }

    navigate(
      `/marketplace?${params.toString()}`,
    );
  };

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <Card>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>
                Find the right professional
              </h2>

              <p style={styles.subtitle}>
                Search by service and city to
                discover trusted artisans near
                you.
              </p>
            </div>

            <div style={styles.badge}>
              Marketplace Search
            </div>
          </div>

          <div
            className="serviceflow-search-grid"
            style={styles.grid}
          >
            <div>
              <label style={styles.label}>
                Service Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value,
                  )
                }
                style={styles.select}
              >
                {services.map((service) => (
                  <option
                    key={service}
                    value={service}
                  >
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                City
              </label>

              <input
                type="text"
                value={location}
                placeholder="Bloemfontein"
                onChange={(e) =>
                  setLocation(
                    e.target.value,
                  )
                }
                style={styles.input}
              />
            </div>

            <div style={styles.buttonArea}>
              <Button
                onClick={handleSearch}
                fullWidth
              >
                Find Artisans
              </Button>
            </div>
          </div>

          <div style={styles.quickFilters}>
            <span style={styles.filterLabel}>
              Popular:
            </span>

            {[
              "Electrician",
              "Plumber",
              "Mechanic",
              "Welder",
              "Tutor",
            ].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setCategory(item)
                }
                style={styles.filterChip}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

const styles = {
  section: {
    marginTop: "-42px",
    position: "relative",
    zIndex: 20,
    padding: "0 20px 50px",
  },

  container: {
    maxWidth:
      "var(--sf-container)",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "var(--sf-text)",
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color:
      "var(--sf-text-muted)",
    lineHeight: 1.7,
  },

  badge: {
    padding: "8px 16px",
    borderRadius: "999px",
    background:
      "var(--sf-primary-soft)",
    color:
      "var(--sf-primary-dark)",
    fontWeight: 700,
    fontSize: "13px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr auto",
    gap: "20px",
    alignItems: "end",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 700,
    color:
      "var(--sf-text)",
  },

  select: {
    width: "100%",
    padding: "14px",
    borderRadius:
      "var(--sf-radius-md)",
    border:
      "1px solid var(--sf-border)",
    background: "#fff",
    fontSize: "15px",
  },

  input: {
    width: "100%",
    padding: "14px",
    borderRadius:
      "var(--sf-radius-md)",
    border:
      "1px solid var(--sf-border)",
    fontSize: "15px",
  },

  buttonArea: {
    minWidth: "190px",
  },

  quickFilters: {
    marginTop: "30px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  filterLabel: {
    fontWeight: 700,
    color:
      "var(--sf-text-muted)",
  },

  filterChip: {
    border: "none",
    cursor: "pointer",
    padding: "10px 16px",
    borderRadius: "999px",
    background:
      "var(--sf-surface-soft)",
    color:
      "var(--sf-text)",
    fontWeight: 600,
    transition: "0.2s",
  },
};

const responsive = `
@media (max-width:900px){

.serviceflow-search-grid{
grid-template-columns:1fr !important;
}

}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-search-responsive",
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "serviceflow-search-responsive";

  style.textContent =
    responsive;

  document.head.appendChild(style);
}

export default SearchBar;