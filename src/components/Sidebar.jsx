import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, FileUp, FileText, History, 
  Search, CalendarRange, MessageSquare, Clock, 
  ShieldAlert, Settings, UserRound, Sparkles, PhoneCall
} from "lucide-react";

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const { role } = useAuth();
  const location = useLocation();

  const isLinkActive = (path) => location.pathname === path ? "active" : "";

  const patientSections = [
    {
      label: "Overview",
      links: [
        { label: "Dashboard", path: "/patient/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      label: "Health Records",
      links: [
        { label: "Upload Report", path: "/patient/upload", icon: FileUp },
        { label: "AI Analysis", path: "/patient/analysis", icon: Sparkles },
        { label: "Medical History", path: "/patient/history", icon: History },
      ]
    },
    {
      label: "Care",
      links: [
        { label: "Search Doctors", path: "/patient/doctors", icon: Search },
        { label: "Book Consultation", path: "/patient/book", icon: CalendarRange },
        { label: "Video & Chat", path: "/patient/consult", icon: MessageSquare },
        { label: "Medication Reminders", path: "/patient/reminders", icon: Clock },
      ]
    },
    {
      label: "Safety",
      links: [
        { label: "Emergency Alerts", path: "/patient/alerts", icon: ShieldAlert },
        { label: "Profile & Settings", path: "/patient/settings", icon: Settings },
      ]
    }
  ];

  const doctorSections = [
    {
      label: "Practice",
      links: [
        { label: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
        { label: "Consultation Panel", path: "/doctor/consult", icon: MessageSquare },
        { label: "Profile & Settings", path: "/doctor/settings", icon: UserRound },
      ]
    }
  ];

  const sections = role === "patient" ? patientSections : doctorSections;

  return (
    <>
      {isOpen && (
        <div 
          onClick={closeSidebar}
          style={{
            position: "fixed",
            inset: 0,
            top: "var(--navbar-height)",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 80
          }}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="flex-column" style={{ flex: 1, overflowY: "auto" }}>
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.links.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={idx}
                    to={link.path}
                    className={`sidebar-link ${isLinkActive(link.path)}`}
                    onClick={closeSidebar}
                  >
                    <span className="sidebar-link-icon">
                      <Icon size={17} strokeWidth={2} />
                    </span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-support">
            <div className="align-center gap-2 m-b-2" style={{ color: "var(--danger)" }}>
              <PhoneCall size={14} />
              <span className="font-semibold" style={{ fontSize: "0.8rem" }}>Emergency</span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
              Life-threatening? Call <strong style={{ color: "var(--danger)" }}>911</strong> immediately.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
