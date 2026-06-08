import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, FileUp, FileText, History, 
  Search, CalendarRange, MessageSquare, Clock, 
  ShieldAlert, Settings, UserRound, Sparkles
} from "lucide-react";

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { role } = useAuth();
  const location = useLocation();

  const isLinkActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  const patientLinks = [
    { label: "Dashboard", path: "/patient/dashboard", icon: LayoutDashboard },
    { label: "Upload Report", path: "/patient/upload", icon: FileUp },
    { label: "AI Analysis", path: "/patient/analysis", icon: Sparkles },
    { label: "Medical History", path: "/patient/history", icon: History },
    { label: "Search Doctors", path: "/patient/doctors", icon: Search },
    { label: "Book Consultation", path: "/patient/book", icon: CalendarRange },
    { label: "Video & Chat", path: "/patient/consult", icon: MessageSquare },
    { label: "Medication Reminders", path: "/patient/reminders", icon: Clock },
    { label: "Emergency Alerts", path: "/patient/alerts", icon: ShieldAlert },
    { label: "Profile & Settings", path: "/patient/settings", icon: Settings },
  ];

  const doctorLinks = [
    { label: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Consultation Panel", path: "/doctor/consult", icon: MessageSquare },
    { label: "Profile & Settings", path: "/doctor/settings", icon: UserRound },
  ];

  const activeLinks = role === "patient" ? patientLinks : doctorLinks;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: "fixed",
            top: "var(--navbar-height)",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.1)",
            zIndex: 80
          }}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="flex-column gap-1" style={{ flex: 1 }}>
          {activeLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <Link
                key={idx}
                to={link.path}
                className={`sidebar-link ${isLinkActive(link.path)}`}
                onClick={closeSidebar}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
        
        <div className="sidebar-footer">
          <div style={{ padding: "0.5rem", borderRadius: "var(--radius-sm)", background: "var(--bg-secondary)", fontSize: "0.75rem", border: "1px solid var(--border-color)" }}>
            <p className="font-semibold text-secondary-color">Virtual Vaidya Support</p>
            <p className="text-muted-color">Emergency Call: 911</p>
          </div>
        </div>
      </aside>
    </>
  );
};
