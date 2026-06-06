import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Heart, Bell, Menu, LogOut, ShieldAlert, Award } from "lucide-react";

export const Navbar = ({ toggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { reminders, alerts } = useHealth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

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
            id="sidebar-toggle-btn"
            style={{ display: "none" }}
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <Link to="/" className="nav-brand">
          <Heart fill="currentColor" size={24} />
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
            <div style={{ position: "relative" }}>
              <button 
                className="btn-icon" 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {totalNotifications > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "var(--danger)",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "700",
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--bg-primary)"
                  }}>
                    {totalNotifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="card notif-dropdown">
                  <div className="flex-between m-b-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Notifications</h4>
                    <button className="btn-text" style={{ fontSize: "0.8rem", padding: "0.15rem 0.4rem" }} onClick={() => setShowNotifications(false)}>
                      Close
                    </button>
                  </div>

                  {totalNotifications === 0 ? (
                    <p className="text-secondary-color text-center" style={{ fontSize: "0.85rem", padding: "1.5rem 0" }}>
                      No new notifications
                    </p>
                  ) : (
                    <div className="flex-column gap-3">
                      {alerts.slice(0, 2).map(alert => (
                        <div 
                          key={alert.id} 
                          className={`notif-item ${alert.severity === "high" ? "alert-high" : "alert-medium"}`}
                        >
                          <div className="align-center gap-2 m-b-1">
                            <ShieldAlert size={14} style={{ color: alert.severity === "high" ? "var(--danger)" : "var(--warning)" }} />
                            <span style={{ fontSize: "0.82rem", fontWeight: "600" }}>{alert.title}</span>
                          </div>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{alert.action}</p>
                        </div>
                      ))}

                      {reminders.filter(r => !r.taken).slice(0, 3).map(rem => (
                        <div key={rem.id} className="notif-item reminder">
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: "600" }}>Take {rem.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{rem.dosage} at {rem.time}</div>
                          </div>
                          <Link 
                            to="/patient/reminders" 
                            className="btn btn-primary" 
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.7rem" }}
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

            <div className="align-center gap-3">
              <Link 
                to={role === "patient" ? "/patient/dashboard" : "/doctor/dashboard"}
                className="align-center gap-2"
                style={{ padding: "0.35rem 0.75rem 0.35rem 0.35rem", borderRadius: "var(--radius-full)", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.2)", transition: "all var(--transition-fast)" }}
              >
                <img 
                  src={user.avatar || user.image} 
                  alt={user.name} 
                  style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-light)" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }} className="sidebar-link-text">
                  <span style={{ fontSize: "0.82rem", fontWeight: "600" }}>{user.name}</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                    {role === "doctor" && <Award size={10} />}
                    {role === "doctor" ? "Doctor" : "Patient"}
                  </span>
                </div>
              </Link>

              <button onClick={handleLogout} className="btn-icon" title="Sign Out" aria-label="Sign Out">
                <LogOut size={17} />
              </button>
            </div>
          </>
        ) : (
          <div className="align-center gap-2">
            <Link to="/patient/auth" className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
              Patient Login
            </Link>
            <Link to="/doctor/auth" className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
              Doctor Portal
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
