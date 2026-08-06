import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import Button from "../ui/Button";

const PUBLIC_LINKS = [
  {
    label: "Home",
    to: "/",
    end: true,
  },
  {
    label: "Services",
    to: "/services",
  },
  {
    label: "About",
    to: "/about",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  const primaryAction =
    getPrimaryAction(user);

  return (
    <header style={styles.header}>
      <nav
        aria-label="Main navigation"
        style={styles.navbar}
      >
        <div style={styles.container}>
          <Link
            to="/"
            aria-label="ServiceFlow home"
            style={styles.logo}
          >
            <span style={styles.logoMark}>
              SF
            </span>

            <span style={styles.logoText}>
              ServiceFlow
            </span>
          </Link>

          <div
            className="serviceflow-navbar-desktop-links"
            style={styles.desktopLinks}
          >
            {PUBLIC_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive
                    ? styles.activeNavLink
                    : {}),
                })}
              >
                {link.label}
              </NavLink>
            ))}

            {user?.role === "artisan" && (
              <NavLink
                to="/marketplace"
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive
                    ? styles.activeNavLink
                    : {}),
                })}
              >
                Marketplace
              </NavLink>
            )}

            {user?.role === "customer" && (
              <NavLink
                to="/my-requests"
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive
                    ? styles.activeNavLink
                    : {}),
                })}
              >
                My requests
              </NavLink>
            )}
          </div>

          <div
            className="serviceflow-navbar-desktop-actions"
            style={styles.desktopActions}
          >
            {isAuthenticated ? (
              <>
                <div
                  className="serviceflow-navbar-account-summary"
                  style={styles.accountSummary}
                >
                  <span style={styles.avatar}>
                    {getInitials(
                      user?.full_name,
                    )}
                  </span>

                  <div style={styles.accountText}>
                    <strong
                      style={styles.accountName}
                    >
                      {user?.full_name ||
                        "ServiceFlow User"}
                    </strong>

                    <span
                      style={styles.accountRole}
                    >
                      {formatRole(user?.role)}
                    </span>
                  </div>
                </div>

                <Button
                  to="/dashboard"
                  variant="secondary"
                  size="small"
                >
                  Dashboard
                </Button>

                <Button
                  to={primaryAction.to}
                  size="small"
                >
                  {primaryAction.label}
                </Button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={styles.logoutButton}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Button
                  to="/login"
                  variant="secondary"
                  size="small"
                >
                  Log in
                </Button>

                <Button
                  to="/register"
                  size="small"
                >
                  Join ServiceFlow
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="serviceflow-navbar-menu-button"
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen(
                (currentValue) =>
                  !currentValue,
              )
            }
            style={styles.menuButton}
          >
            <span
              style={{
                ...styles.menuLine,
                ...(mobileMenuOpen
                  ? styles.menuLineTopOpen
                  : {}),
              }}
            />

            <span
              style={{
                ...styles.menuLine,
                opacity: mobileMenuOpen
                  ? 0
                  : 1,
              }}
            />

            <span
              style={{
                ...styles.menuLine,
                ...(mobileMenuOpen
                  ? styles.menuLineBottomOpen
                  : {}),
              }}
            />
          </button>
        </div>

        {mobileMenuOpen && (
          <div style={styles.mobileMenu}>
            <div
              style={styles.mobileMenuContent}
            >
              {isAuthenticated && (
                <div style={styles.mobileAccount}>
                  <span style={styles.mobileAvatar}>
                    {getInitials(
                      user?.full_name,
                    )}
                  </span>

                  <div>
                    <strong
                      style={
                        styles.mobileAccountName
                      }
                    >
                      {user?.full_name ||
                        "ServiceFlow User"}
                    </strong>

                    <span
                      style={
                        styles.mobileAccountRole
                      }
                    >
                      {formatRole(user?.role)}
                    </span>
                  </div>
                </div>
              )}

              <div style={styles.mobileLinks}>
                {PUBLIC_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    style={({ isActive }) => ({
                      ...styles.mobileLink,
                      ...(isActive
                        ? styles.activeMobileLink
                        : {}),
                    })}
                  >
                    {link.label}
                  </NavLink>
                ))}

                {user?.role ===
                  "customer" && (
                  <>
                    <NavLink
                      to="/booking"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      Post a job
                    </NavLink>

                    <NavLink
                      to="/my-requests"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      My requests
                    </NavLink>

                    <NavLink
                      to="/customer-profile"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      My profile
                    </NavLink>

                    <NavLink
                      to="/notifications"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      Notifications
                    </NavLink>
                  </>
                )}

                {user?.role ===
                  "artisan" && (
                  <>
                    <NavLink
                      to="/marketplace"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      Marketplace
                    </NavLink>

                    <NavLink
                      to="/my-jobs"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      My jobs
                    </NavLink>

                    <NavLink
                      to="/artisan-profile"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      My profile
                    </NavLink>

                    <NavLink
                      to="/notifications"
                      style={({ isActive }) => ({
                        ...styles.mobileLink,
                        ...(isActive
                          ? styles.activeMobileLink
                          : {}),
                      })}
                    >
                      Notifications
                    </NavLink>
                  </>
                )}
              </div>

              <div style={styles.mobileActions}>
                {isAuthenticated ? (
                  <>
                    <Button
                      to="/dashboard"
                      variant="secondary"
                      fullWidth
                    >
                      Dashboard
                    </Button>

                    <Button
                      to={primaryAction.to}
                      fullWidth
                    >
                      {primaryAction.label}
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      fullWidth
                      onClick={handleLogout}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      to="/login"
                      variant="secondary"
                      fullWidth
                    >
                      Log in
                    </Button>

                    <Button
                      to="/register"
                      fullWidth
                    >
                      Join ServiceFlow
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function getPrimaryAction(user) {
  if (!user) {
    return {
      label: "Create account",
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
}

function getInitials(fullName) {
  if (!fullName) {
    return "SF";
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) =>
      name.charAt(0).toUpperCase(),
    )
    .join("");
}

function formatRole(role) {
  if (!role) {
    return "Member";
  }

  return (
    role.charAt(0).toUpperCase() +
    role.slice(1)
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  navbar: {
    borderBottom:
      "1px solid rgba(226, 232, 240, 0.9)",
    backgroundColor:
      "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.05)",
  },

  container: {
    width: "100%",
    maxWidth: "var(--sf-container)",
    minHeight: "74px",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
  },

  logo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
    color: "var(--sf-text)",
    textDecoration: "none",
  },

  logoMark: {
    display: "grid",
    placeItems: "center",
    width: "40px",
    height: "40px",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, var(--sf-primary), #1e40af)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.04em",
    boxShadow:
      "0 8px 20px rgba(37, 99, 235, 0.25)",
  },

  logoText: {
    color: "var(--sf-text)",
    fontSize: "21px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
  },

  desktopLinks: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    flex: 1,
  },

  navLink: {
    padding: "9px 12px",
    borderRadius: "10px",
    color: "var(--sf-text-muted)",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
    transition:
      "background-color var(--sf-transition), color var(--sf-transition)",
  },

  activeNavLink: {
    backgroundColor:
      "var(--sf-primary-soft)",
    color: "var(--sf-primary-dark)",
  },

  desktopActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexShrink: 0,
  },

  accountSummary: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginRight: "3px",
  },

  avatar: {
    display: "grid",
    placeItems: "center",
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    backgroundColor:
      "var(--sf-primary-soft)",
    color: "var(--sf-primary-dark)",
    fontSize: "12px",
    fontWeight: "900",
  },

  accountText: {
    display: "grid",
    gap: "1px",
    maxWidth: "130px",
  },

  accountName: {
    overflow: "hidden",
    color: "var(--sf-text)",
    fontSize: "12px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  accountRole: {
    color: "var(--sf-text-soft)",
    fontSize: "11px",
    fontWeight: "700",
  },

  logoutButton: {
    padding: "9px 4px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--sf-text-muted)",
    fontSize: "13px",
    fontWeight: "800",
  },

  menuButton: {
    display: "none",
    width: "43px",
    height: "43px",
    padding: "10px",
    border:
      "1px solid var(--sf-border-strong)",
    borderRadius: "11px",
    backgroundColor: "var(--sf-surface)",
  },

  menuLine: {
    display: "block",
    width: "100%",
    height: "2px",
    margin: "4px 0",
    borderRadius: "999px",
    backgroundColor: "var(--sf-text)",
    transition:
      "transform var(--sf-transition), opacity var(--sf-transition)",
  },

  menuLineTopOpen: {
    transform:
      "translateY(6px) rotate(45deg)",
  },

  menuLineBottomOpen: {
    transform:
      "translateY(-6px) rotate(-45deg)",
  },

  mobileMenu: {
    borderTop:
      "1px solid var(--sf-border)",
    backgroundColor: "var(--sf-surface)",
    boxShadow:
      "0 16px 30px rgba(15, 23, 42, 0.08)",
  },

  mobileMenuContent: {
    width: "100%",
    maxWidth: "var(--sf-container)",
    margin: "0 auto",
    padding: "20px",
  },

  mobileAccount: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    padding: "14px",
    borderRadius:
      "var(--sf-radius-md)",
    backgroundColor:
      "var(--sf-surface-soft)",
  },

  mobileAvatar: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    backgroundColor:
      "var(--sf-primary-soft)",
    color: "var(--sf-primary-dark)",
    fontSize: "14px",
    fontWeight: "900",
  },

  mobileAccountName: {
    display: "block",
    marginBottom: "2px",
    color: "var(--sf-text)",
    fontSize: "14px",
  },

  mobileAccountRole: {
    color: "var(--sf-text-muted)",
    fontSize: "12px",
    fontWeight: "700",
  },

  mobileLinks: {
    display: "grid",
    gap: "5px",
  },

  mobileLink: {
    padding: "12px 13px",
    borderRadius: "10px",
    color: "var(--sf-text-muted)",
    fontSize: "14px",
    fontWeight: "800",
    textDecoration: "none",
  },

  activeMobileLink: {
    backgroundColor:
      "var(--sf-primary-soft)",
    color: "var(--sf-primary-dark)",
  },

  mobileActions: {
    display: "grid",
    gap: "10px",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop:
      "1px solid var(--sf-border)",
  },
};

const responsiveStyles = `
  @media (max-width: 1080px) {
    .serviceflow-navbar-account-summary {
      display: none !important;
    }
  }

  @media (max-width: 900px) {
    .serviceflow-navbar-desktop-links,
    .serviceflow-navbar-desktop-actions {
      display: none !important;
    }

    .serviceflow-navbar-menu-button {
      display: block !important;
    }
  }

  @media (max-width: 480px) {
    .serviceflow-navbar-menu-button {
      width: 40px !important;
      height: 40px !important;
    }
  }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "serviceflow-navbar-responsive-styles",
  )
) {
  const styleElement =
    document.createElement("style");

  styleElement.id =
    "serviceflow-navbar-responsive-styles";

  styleElement.textContent =
    responsiveStyles;

  document.head.appendChild(
    styleElement,
  );
}

export default Navbar;