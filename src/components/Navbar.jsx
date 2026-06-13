import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Bell, Menu, X, LogOut } from "lucide-react";
import { BrandWordmark } from "./BrandLogo";

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
  const pendingAptsCount = role === "doctor" ? (appointments || []).filter(apt => apt.doctorId === user?.id && (apt.status === "Pending" || apt.status === "Paid")).length : 0;
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
      <nav className="navbar">
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
          
          <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-text-full">
              <span className="brand-logo">
                <img className="brand-mark brand-mark--uploaded" src="/logo-vv.svg" alt="Virtual Vaidya logo" />
                <BrandWordmark />
              </span>
            </span>
            <span className="brand-text-mobile">
              <span className="brand-logo">
                <img className="brand-mark brand-mark--uploaded" src="/logo-vv.svg" alt="Virtual Vaidya logo" />
                <BrandWordmark compact />
              </span>
            </span>
          </Link>
        </div>

        {/* Center top-level navigation links (Desktop) */}
        {user && navLinks.length > 0 && location.pathname !== "/" && (
          <div className="desktop-nav">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                className={`nav-item ${isLinkActive(link.path)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="nav-actions">
          {user && location.pathname !== "/" ? (
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
                  <div className="notifications-dropdown">
                    <div className="flex-between m-b-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Notifications</h4>
                      <button className="btn-text" style={{ fontSize: "0.75rem", padding: 0 }} onClick={() => setShowNotifications(false)}>Close</button>
                    </div>

                    {totalNotifications === 0 ? (
                      <p className="text-secondary-color text-center" style={{ fontSize: "0.8rem", padding: "0.75rem 0" }}>No critical alerts</p>
                    ) : (
                      <div className="flex-column gap-2">
                        {role === "doctor" && (appointments || []).filter(apt => apt.doctorId === user?.id && (apt.status === "Pending" || apt.status === "Paid")).map(apt => (
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
              <div style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "1.25rem", display: "flex", alignItems: "center" }}>
                <Link 
                  to={role === "patient" ? "/patient/profile" : "/doctor/profile"}
                  className="user-profile-trigger"
                  title="View Profile Details"
                >
                  <img 
                    src={user.avatar || user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
                    alt={user.name || "User"} 
                    className={`user-profile-avatar ${location.pathname.includes("/profile") ? "active" : ""}`}
                  />
                  <div className="user-profile-info navbar-user-text">
                    <span className="user-profile-name">{user.name}</span>
                    <span className="user-profile-role">{role}</span>
                  </div>
                </Link>
                
                <button onClick={handleLogout} className="btn-icon" style={{ width: "36px", height: "36px", marginLeft: "0.5rem" }} title="Sign Out" aria-label="Sign Out">
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-btn-group">
              <Link to="/patient/auth" className="btn btn-secondary">Patient Login</Link>
              <Link to="/doctor/auth" className="btn btn-primary">Doctor Portal</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && user && navLinks.length > 0 && (
        <div className="mobile-nav-panel" style={{ position: "fixed", top: "var(--navbar-height)", left: 0, right: 0, zIndex: 99 }}>
          <div className="flex-column gap-2">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`subnav-tab ${location.pathname === link.path ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Profile Trigger Link */}
            <Link
              to={role === "patient" ? "/patient/profile" : "/doctor/profile"}
              onClick={() => setMobileMenuOpen(false)}
              className={`subnav-tab ${location.pathname.includes("/profile") ? "active" : ""}`}
            >
              My Profile Details
            </Link>
          </div>
        </div>
      )}

      {/* CSS overrides */}
      <style>
        {`
          .brand-text-mobile {
            display: none;
          }
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
          @media (max-width: 520px) {
            .brand-text-full {
              display: none !important;
            }
            .brand-text-mobile {
              display: inline !important;
            }
            .nav-brand {
              font-size: 1.15rem !important;
              gap: 0.35rem !important;
            }
            .nav-brand .brand-mark {
              width: 30px !important;
              height: 30px !important;
            }
            /* Make login buttons smaller to fit alongside logo */
            .nav-actions .btn {
              padding: 0.35rem 0.65rem !important;
              font-size: 0.72rem !important;
              border-radius: var(--radius-md) !important;
            }
            .nav-actions {
              gap: 0.5rem !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Navbar;
