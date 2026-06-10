import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Heart, Bell, Menu, X, LogOut } from "lucide-react";

export const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { reminders, alerts, appointments } = useHealth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active notifications count (uncompleted medication reminders + critical alerts + doctor pending appointments)
  const pendingReminders = reminders.filter(r => !r.taken).length;
  const activeAlerts = alerts.filter(a => a.severity === "high").length;
  const pendingAptsCount = role === "doctor" ? (appointments || []).filter(apt => apt.doctorId === user?.id && apt.status === "Pending").length : 0;
  const totalNotifications = role === "doctor" ? pendingAptsCount + activeAlerts : pendingReminders + activeAlerts;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const isLinkActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  // Profile is excluded from main nav list, opened ONLY from avatar
  const patientLinks = [
    { label: "Home", path: "/patient/dashboard" },
    { label: "Reports", path: "/patient/reports" },
    { label: "Care", path: "/patient/care" },
    { label: "Doctors", path: "/patient/doctors" }
  ];

  const doctorLinks = [
    { label: "Dashboard", path: "/doctor/dashboard" },
    { label: "My Clinic", path: "/doctor/clinic" },
    { label: "Patients", path: "/doctor/patients" },
    { label: "Appointments", path: "/doctor/appointments" },
    { label: "Alerts", path: "/doctor/alerts" }
  ];

  const navLinks = role === "patient" ? patientLinks : role === "doctor" ? doctorLinks : [];

  return (
    <>
      <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", padding: "0 1.5rem" }}>
        <div className="align-center gap-3">
          {user && navLinks.length > 0 && (
            <button 
              className="btn-icon" 
              style={{ display: "none" }} 
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          
          <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--primary)", fontWeight: "700" }}>
            <Heart fill="currentColor" size={22} style={{ color: "var(--primary)" }} />
            <span>Virtual Vaidya</span>
          </Link>
        </div>

        {/* Center top-level navigation links (Desktop) */}
        {user && navLinks.length > 0 && (
          <div className="desktop-nav" style={{ display: "flex", gap: "1rem" }}>
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                className={`nav-item ${isLinkActive(link.path)}`}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: location.pathname === link.path ? "600" : "500",
                  color: location.pathname === link.path ? "var(--primary)" : "var(--text-secondary)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: location.pathname === link.path ? "var(--primary-light)" : "transparent",
                  transition: "all var(--transition-fast)"
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              {/* Notification Bell */}
              <div style={{ position: "relative" }}>
                <button 
                  className="btn-icon" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ position: "relative", width: "38px", height: "38px" }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {totalNotifications > 0 && (
                    <span 
                      style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        background: "var(--primary)", /* Red color for primary/notifications badge */
                        color: "white",
                        fontSize: "9px",
                        fontWeight: "700",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {totalNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div 
                    className="card" 
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      width: "300px",
                      zIndex: 150,
                      padding: "1rem",
                      boxShadow: "var(--shadow-lg)",
                      backgroundColor: "var(--bg-primary)"
                    }}
                  >
                    <div className="flex-between m-b-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Notifications</h4>
                      <button className="btn-text" style={{ fontSize: "0.75rem", padding: 0 }} onClick={() => setShowNotifications(false)}>Close</button>
                    </div>

                    {totalNotifications === 0 ? (
                      <p className="text-secondary-color text-center" style={{ fontSize: "0.8rem", padding: "0.75rem 0" }}>No critical alerts</p>
                    ) : (
                      <div className="flex-column gap-2">
                        {role === "doctor" && (appointments || []).filter(apt => apt.doctorId === user?.id && apt.status === "Pending").map(apt => (
                          <div 
                            key={apt.id} 
                            style={{
                              padding: "0.5rem 0.75rem",
                              borderRadius: "var(--radius-sm)",
                              background: "rgba(217, 119, 6, 0.08)",
                              borderLeft: "3px solid #d97706",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div style={{ flex: 1, marginRight: "0.5rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#b45309" }}>Booking Request</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>From: {apt.patientName}</div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{apt.date} @ {apt.time}</div>
                            </div>
                            <Link 
                              to="/doctor/appointments" 
                              className="btn btn-primary" 
                              style={{ padding: "0.2rem 0.5rem", fontSize: "0.65rem", borderRadius: "var(--radius-sm)", backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
                              onClick={() => setShowNotifications(false)}
                            >
                              Review
                            </Link>
                          </div>
                        ))}

                        {role === "patient" && alerts.filter(a => a.severity === "high").slice(0, 1).map(alert => (
                          <div 
                            key={alert.id} 
                            style={{
                              padding: "0.5rem 0.75rem",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--primary-light)",
                              borderLeft: "3px solid var(--primary)"
                            }}
                          >
                            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--primary)", display: "block" }}>{alert.title}</span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{alert.action}</span>
                          </div>
                        ))}

                        {role === "patient" && reminders.filter(r => !r.taken).slice(0, 2).map(rem => (
                          <div 
                            key={rem.id} 
                            style={{
                              padding: "0.5rem 0.75rem",
                              borderRadius: "var(--radius-sm)",
                              background: "var(--primary-light)",
                              borderLeft: "3px solid var(--primary)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "0.75rem", fontWeight: "600" }}>{rem.name}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{rem.dosage} @ {rem.time}</div>
                            </div>
                            <Link 
                              to="/patient/care" 
                              className="btn btn-primary" 
                              style={{ padding: "0.2rem 0.4rem", fontSize: "0.65rem", borderRadius: "var(--radius-sm)" }}
                              onClick={() => setShowNotifications(false)}
                            >
                              Track
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar Click links to Profile settings directly */}
              <div className="align-center gap-2" style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "0.75rem" }}>
                <Link 
                  to={role === "patient" ? "/patient/profile" : "/doctor/profile"}
                  className="align-center gap-2"
                  style={{ cursor: "pointer" }}
                  title="View Profile Details"
                >
                  <img 
                    src={user.avatar || user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
                    alt={user.name || "User"} 
                    style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: location.pathname.includes("/profile") ? "2px solid var(--primary)" : "1px solid var(--border-color)" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }} className="navbar-user-text">
                    <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)" }}>{user.name}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{role}</span>
                  </div>
                </Link>
                
                <button onClick={handleLogout} className="btn-icon" style={{ width: "32px", height: "32px", marginLeft: "0.25rem" }} title="Sign Out" aria-label="Sign Out">
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="align-center gap-2">
              <Link to="/patient/auth" className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Patient Login</Link>
              <Link to="/doctor/auth" className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Doctor Portal</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && user && navLinks.length > 0 && (
        <div 
          style={{
            position: "fixed",
            top: "var(--navbar-height)",
            left: 0,
            right: 0,
            backgroundColor: "var(--bg-primary)",
            borderBottom: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)",
            zIndex: 99,
            padding: "1rem"
          }}
          className="mobile-nav-panel"
        >
          <div className="flex-column gap-2">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`subnav-tab ${location.pathname === link.path ? "active" : ""}`}
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "0.9rem",
                  fontWeight: location.pathname === link.path ? "600" : "500",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: location.pathname === link.path ? "var(--primary-light)" : "transparent",
                  border: "none",
                  display: "block",
                  color: location.pathname === link.path ? "var(--primary)" : "var(--text-secondary)"
                }}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Profile Trigger Link */}
            <Link
              to={role === "patient" ? "/patient/profile" : "/doctor/profile"}
              onClick={() => setMobileMenuOpen(false)}
              className={`subnav-tab ${location.pathname.includes("/profile") ? "active" : ""}`}
              style={{
                padding: "0.75rem 1rem",
                fontSize: "0.9rem",
                fontWeight: location.pathname.includes("/profile") ? "600" : "500",
                borderRadius: "var(--radius-sm)",
                backgroundColor: location.pathname.includes("/profile") ? "var(--primary-light)" : "transparent",
                border: "none",
                display: "block",
                color: location.pathname.includes("/profile") ? "var(--primary)" : "var(--text-secondary)"
              }}
            >
              My Profile Details
            </Link>
          </div>
        </div>
      )}

      {/* CSS overrides */}
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-nav {
              display: none !important;
            }
            #mobile-nav-toggle {
              display: flex !important;
            }
            .navbar-user-text {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Navbar;
