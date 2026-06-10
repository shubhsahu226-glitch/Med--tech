import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Users, FileText, ArrowRight } from "lucide-react";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { patients, appointments } = useHealth();

  // Filter clinician's schedule
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user.id || apt.doctorId === "doc1");
  const upcomingApts = doctorAppointments.filter(apt => apt.status === "Upcoming");

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Greeting Header */}
      <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Clinician Workspace</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          {user.name} | {user.specialty} — {user.education}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-3" style={{ gap: "1.5rem" }}>
        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Total Patients</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{patients.length} Registered</div>
          </div>
        </div>

        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Scheduled Sessions</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{upcomingApts.length} Pending</div>
          </div>
        </div>

        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Reviews Completed</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{patients.flatMap(p => p.reports || []).length} Logs</div>
          </div>
        </div>
      </div>

      {/* Main Console Board */}
      <div className="card flex-column gap-4" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Workspace Navigation Console</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Access patient consultations, update diagnosis logs, write medical prescriptions, and monitor active patient alerts.
        </p>
        
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "0.5rem" }}>
          <Link to="/doctor/appointments" className="btn btn-primary align-center gap-1" style={{ width: "fit-content", fontSize: "0.85rem" }}>
            Open Appointments & Consults <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
