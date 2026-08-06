import { useState } from "react";
import {
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import Badge from "../ui/Badge";
import Button from "../ui/Button";

function Footer() {
  const [email, setEmail] =
    useState("");

  const [newsletterMessage, setNewsletterMessage] =
    useState("");

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();

    const normalizedEmail =
      email.trim();

    if (!normalizedEmail) {
      setNewsletterMessage(
        "Please enter your email address.",
      );
      return;
    }

    setNewsletterMessage(
      "Newsletter registration is coming soon.",
    );
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div
          className="serviceflow-footer-grid"
          style={styles.grid}
        >
          {/* ==========================
              Company Information
          ========================== */}
          <section>
            <Badge
              variant="primary"
              style={styles.countryBadge}
            >
              🇿🇦 Proudly built in South Africa
            </Badge>

            <Link
              to="/"
              aria-label="ServiceFlow home"
              style={styles.brand}
            >
              <span style={styles.logoMark}>
                SF
              </span>

              <span style={styles.logo}>
                ServiceFlow
              </span>
            </Link>

            <p style={styles.description}>
              Connecting customers with trusted
              artisans, technicians, and service
              professionals through one modern
              marketplace.
            </p>

            <div style={styles.contact}>
              <a
                href="mailto:support@serviceflow.co.za"
                style={styles.contactItem}
              >
                <Mail
                  size={18}
                  aria-hidden="true"
                />

                <span>
                  support@serviceflow.co.za
                </span>
              </a>

              <Link
                to="/contact"
                style={styles.contactItem}
              >
                <MessageCircle
                  size={18}
                  aria-hidden="true"
                />

                <span>
                  Contact support
                </span>
              </Link>

              <div style={styles.contactItem}>
                <MapPin
                  size={18}
                  aria-hidden="true"
                />

                <span>
                  South Africa
                </span>
              </div>
            </div>
          </section>

          {/* ==========================
              Marketplace Links
          ========================== */}
          <nav aria-label="Marketplace links">
            <h3 style={styles.heading}>
              Marketplace
            </h3>

            <FooterLink to="/">
              Home
            </FooterLink>

            <FooterLink to="/services">
              Browse services
            </FooterLink>

            <FooterLink to="/marketplace">
              Find work
            </FooterLink>

            <FooterLink to="/booking">
              Post a job
            </FooterLink>

            <FooterLink to="/register">
              Become an artisan
            </FooterLink>
          </nav>

          {/* ==========================
              Platform Links
          ========================== */}
          <nav aria-label="Platform links">
            <h3 style={styles.heading}>
              Platform
            </h3>

            <FooterLink to="/login">
              Log in
            </FooterLink>

            <FooterLink to="/register">
              Create account
            </FooterLink>

            <FooterLink to="/dashboard">
              Dashboard
            </FooterLink>

            <FooterLink to="/notifications">
              Notifications
            </FooterLink>

            <FooterLink to="/about">
              About ServiceFlow
            </FooterLink>

            <FooterLink to="/contact">
              Contact
            </FooterLink>
          </nav>

          {/* ==========================
              Newsletter
          ========================== */}
          <section>
            <h3 style={styles.heading}>
              Stay updated
            </h3>

            <p style={styles.newsletter}>
              Receive future product updates,
              marketplace news, and useful business
              tips from ServiceFlow.
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              style={styles.subscribe}
              noValidate
            >
              <label
                htmlFor="footer-newsletter-email"
                style={styles.visuallyHidden}
              >
                Email address
              </label>

              <input
                id="footer-newsletter-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value,
                  );

                  if (newsletterMessage) {
                    setNewsletterMessage("");
                  }
                }}
                placeholder="Email address"
                autoComplete="email"
                style={styles.input}
              />

              <Button
                type="submit"
                fullWidth
              >
                Subscribe
              </Button>
            </form>

            {newsletterMessage && (
              <p
                role="status"
                style={styles.newsletterMessage}
              >
                {newsletterMessage}
              </p>
            )}

            <div style={styles.socialSection}>
              <span style={styles.socialLabel}>
                Follow ServiceFlow
              </span>

              <div style={styles.socials}>
                <SocialIcon
                  label="ServiceFlow website"
                >
                  <Globe2 size={20} />
                </SocialIcon>

                <SocialIcon
                  label="ServiceFlow community"
                >
                  <MessageCircle size={20} />
                </SocialIcon>

                <SocialIcon
                  label="ServiceFlow business network"
                >
                  <ExternalLink size={20} />
                </SocialIcon>
              </div>

              <p style={styles.socialNotice}>
                Official social profiles will be
                linked here as they launch.
              </p>
            </div>
          </section>
        </div>

        {/* ==========================
            Footer Bottom
        ========================== */}
        <div style={styles.bottom}>
          <div style={styles.trust}>
            <ShieldCheck
              size={18}
              color="#22c55e"
              aria-hidden="true"
            />

            <span>
              Protected accounts
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span>
              Trusted profiles
            </span>

            <span aria-hidden="true">
              •
            </span>

            <span>
              Growing marketplace
            </span>
          </div>

          <p style={styles.copy}>
            © {new Date().getFullYear()}{" "}
            ServiceFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  to,
  children,
}) {
  return (
    <Link
      to={to}
      className="serviceflow-footer-link"
      style={styles.link}
    >
      {children}
    </Link>
  );
}

function SocialIcon({
  children,
  label,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="serviceflow-footer-social"
      style={styles.social}
    >
      {children}
    </button>
  );
}

const styles = {
  footer: {
    background:
      "linear-gradient(180deg, #0f172a, #020617)",
    color: "#ffffff",
    marginTop: "80px",
    padding: "80px 20px 28px",
  },

  container: {
    width: "100%",
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1fr 1fr 1.4fr",
    gap: "40px",
  },

  countryBadge: {
    marginBottom: "20px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    gap: "12px",
    color: "#ffffff",
    textDecoration: "none",
  },

  logoMark: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.05em",
    boxShadow:
      "0 10px 26px rgba(37, 99, 235, 0.3)",
  },

  logo: {
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: "900",
    letterSpacing: "-0.04em",
  },

  description: {
    maxWidth: "420px",
    margin: "18px 0 0",
    color: "#cbd5e1",
    lineHeight: "1.8",
  },

  contact: {
    display: "grid",
    gap: "12px",
    marginTop: "24px",
  },

  contactItem: {
    display: "flex",
    alignItems: "center",
    width: "fit-content",
    gap: "10px",
    color: "#cbd5e1",
    textDecoration: "none",
  },

  heading: {
    margin: "0 0 22px",
    color: "#ffffff",
    fontSize: "18px",
  },

  link: {
    display: "block",
    width: "fit-content",
    marginBottom: "14px",
    color: "#cbd5e1",
    textDecoration: "none",
    transition:
      "color var(--sf-transition), " +
      "transform var(--sf-transition)",
  },

  newsletter: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: "1.7",
  },

  subscribe: {
    display: "grid",
    gap: "12px",
    marginTop: "18px",
  },

  input: {
    width: "100%",
    padding: "14px",
    border: "1px solid #334155",
    borderRadius: "12px",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    outline: "none",
  },

  newsletterMessage: {
    margin: "12px 0 0",
    color: "#93c5fd",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.5",
  },

  socialSection: {
    marginTop: "26px",
  },

  socialLabel: {
    display: "block",
    marginBottom: "12px",
    color: "#e2e8f0",
    fontSize: "13px",
    fontWeight: "800",
  },

  socials: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },

  social: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    padding: 0,
    border: "1px solid #334155",
    borderRadius: "13px",
    backgroundColor: "#111827",
    color: "#ffffff",
    transition:
      "background-color var(--sf-transition), " +
      "border-color var(--sf-transition), " +
      "transform var(--sf-transition)",
  },

  socialNotice: {
    margin: "12px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: "1.6",
  },

  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginTop: "60px",
    paddingTop: "26px",
    borderTop:
      "1px solid rgba(255, 255, 255, 0.08)",
    flexWrap: "wrap",
  },

  trust: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "700",
    flexWrap: "wrap",
  },

  copy: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "13px",
  },

  visuallyHidden: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  },
};

const responsiveStyles = `
  .serviceflow-footer-link:hover {
    color: #ffffff !important;
    transform: translateX(3px);
  }

  .serviceflow-footer-social:hover {
    background-color: #1e3a8a !important;
    border-color: #3b82f6 !important;
    transform: translateY(-2px);
  }

  @media (max-width: 950px) {
    .serviceflow-footer-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 640px) {
    .serviceflow-footer-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-footer-responsive",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-footer-responsive";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default Footer;