import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Heart, Bell, Menu, X, LogOut, ShieldAlert, Award } from "lucide-react";

export const Navbar = ({ toggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { reminders, alerts } = useHealth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Active notifications count: uncompleted reminders + medium/high alerts
  const pendingReminders = reminders.filter(r => !r.taken).length;
  const activeAlerts = alerts.filter(a => a.severity === "high" || a.severity === "medium").length;
  const totalNotifications = pendingReminders + activeAlerts;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isHome = location.pathname === "/";

  return (
    <nav className="navbar">
      <div className="align-center gap-3">
        {user && (
          <button 
            className="btn-icon" 
            style={{ display: "none" }} // Show via css on media query
            id="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <Link to="/" className="nav-brand">
          <Heart fill="currentColor" size={24} style={{ color: "var(--primary)" }} />
          <span>MedTech AI</span>
        </Link>
      </div>

      <div className="nav-links">
        {isHome && (
          <>
            <a href="#how-it-works" className="nav-item">How it Works</a>
            <a href="#features" className="nav-item">Features</a>
          </>
        )}
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            {/* Notification Bell with Badge */}
            <div style={{ position: "relative" }}>
              <button 
                className="btn-icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: "relative" }}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {totalNotifications > 0 && (
                  <span 
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      background: "var(--danger)",
                      color: "white",
                      fontSize: "10px",
                      fontWeight: "700",
                      width: "18px",
                      height: "18px",
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

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div 
                  className="card" 
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: 0,
                    width: "320px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    zIndex: 150,
                    padding: "1rem",
                    boxShadow: "var(--shadow-xl)"
                  }}
                >
                  <div className="flex-between m-b-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Notifications</h4>
                    <button className="btn-text" style={{ fontSize: "0.8rem", padding: 0 }} onClick={() => setShowNotifications(false)}>Close</button>
                  </div>

                  {totalNotifications === 0 ? (
                    <p className="text-secondary-color text-center" style={{ fontSize: "0.85rem", padding: "1rem 0" }}>No new notifications</p>
                  ) : (
                    <div className="flex-column gap-3">
                      {alerts.slice(0, 2).map(alert => (
                        <div 
                          key={alert.id} 
                          style={{
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            background: alert.severity === "high" ? "var(--danger-light)" : "var(--warning-light)",
                            borderLeft: `3px solid ${alert.severity === "high" ? "var(--danger)" : "var(--warning)"}`
                          }}
                        >
                          <div className="align-center gap-2 m-b-1">
                            <ShieldAlert size={14} style={{ color: alert.severity === "high" ? "var(--danger)" : "var(--warning)" }} />
                            <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>{alert.title}</span>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{alert.action}</p>
                        </div>
                      ))}

                      {reminders.filter(r => !r.taken).slice(0, 3).map(rem => (
                        <div 
                          key={rem.id} 
                          style={{
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--primary-light)",
                            borderLeft: "3px solid var(--primary)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.8rem", fontWeight: "600" }}>Take {rem.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{rem.dosage} at {rem.time}</div>
                          </div>
                          <Link 
                            to="/patient/reminders" 
                            className="btn btn-primary" 
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", borderRadius: "var(--radius-sm)" }}
                            onClick={() => setShowNotifications(false)}
                          >
                            Open
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Details & Dashboard Redirect */}
            <div className="align-center gap-3">
              <Link 
                to={role === "patient" ? "/patient/dashboard" : "/doctor/dashboard"}
                className="align-center gap-2"
              >
                <img 
                  src={user.avatar || user.image} 
                  alt={user.name} 
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }} className="sidebar-link-text">
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>{user.name}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                    {role === "doctor" && <Award size={10} />}
                    {role === "doctor" ? "Doctor" : "Patient"}
                  </span>
                </div>
              </Link>

              <button onClick={handleLogout} className="btn-icon" title="Sign Out" aria-label="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="align-center gap-2">
            <Link to="/patient/auth" className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>Patient Login</Link>
            <Link to="/doctor/auth" className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>Doctor Portal</Link>
          </div>
        )}
      </div>
    </nav>
  );
};
