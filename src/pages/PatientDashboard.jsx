import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  FileUp, Calendar, Search, Activity, Clock, ShieldAlert, Sparkles, 
  ChevronRight, ArrowUpRight
} from "lucide-react";
import { AppointmentCard, ReminderCard } from "../components/CardComponents";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reminders, alerts } = useHealth();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name.split(" ")[0];

  const nextAppointment = appointments
    .filter(apt => apt.patientId === user.id && apt.status === "Upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const todayReminders = reminders.slice(0, 3);
  const criticalAlerts = alerts.filter(a => a.severity === "high").slice(0, 1);
  const latestReport = user.reports && user.reports[0];

  return (
    <div className="flex-column gap-6">
      <div className="page-header">
        <div className="dashboard-greeting">
          <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>{greeting},</p>
          <h1>{firstName}</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Here's your medical overview for today.
          </p>
        </div>
        <div className="align-center gap-3">
          <Link to="/patient/upload" className="btn btn-primary">
            <FileUp size={16} /> Upload Report
          </Link>
          <Link to="/patient/doctors" className="btn btn-secondary">
            <Search size={16} /> Find Doctors
          </Link>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <div 
          className="card" 
          style={{
            borderLeft: "4px solid var(--danger)",
            background: "linear-gradient(90deg, var(--danger-light), transparent)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div className="align-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: "var(--radius-md)",
              background: "rgba(239, 68, 68, 0.2)", display: "flex",
              alignItems: "center", justifyContent: "center", color: "var(--danger)"
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: "var(--danger)", fontSize: "0.95rem" }}>{criticalAlerts[0].title}</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{criticalAlerts[0].action}</p>
            </div>
          </div>
          <Link to="/patient/alerts" className="btn btn-danger" style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}>
            View Guide
          </Link>
        </div>
      )}

      <div className="grid-3" style={{ gap: "1rem" }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: "var(--primary)", background: "var(--primary-light)" }}>
            <Activity size={22} />
          </div>
          <div>
            <div className="stat-label">Blood Group</div>
            <div className="stat-value">{user.bloodGroup || "O+"}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ color: "var(--success)", background: "var(--success-light)" }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-label">Active Reminders</div>
            <div className="stat-value">{reminders.filter(r => !r.taken).length} / {reminders.length}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ color: "var(--warning)", background: "var(--warning-light)" }}>
            <FileUp size={22} />
          </div>
          <div>
            <div className="stat-label">Lab Reports</div>
            <div className="stat-value">{user.reportsCount || 0} Reviewed</div>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="flex-column gap-6" style={{ gridColumn: "span 2" }}>
          <div>
            <div className="section-title-row">
              <h3>Upcoming Consultation</h3>
              <Link to="/patient/consult" className="btn-text align-center gap-1" style={{ fontSize: "0.82rem" }}>
                Telehealth Portal <ChevronRight size={14} />
              </Link>
            </div>
            {nextAppointment ? (
              <AppointmentCard 
                appointment={nextAppointment} 
                onStartConsultation={() => navigate("/patient/consult")} 
              />
            ) : (
              <div className="card empty-state">
                <div className="empty-state-icon"><Calendar size={28} /></div>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>No upcoming consultations</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.82rem", margin: "0.5rem 0 1rem" }}>
                  Schedule a routine checkup or discuss recent report logs.
                </p>
                <Link to="/patient/book" className="btn btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}>
                  Book Appointment
                </Link>
              </div>
            )}
          </div>

          <div>
            <div className="section-title-row">
              <h3>Latest Report Analysis</h3>
              <Link to="/patient/analysis" className="btn-text align-center gap-1" style={{ fontSize: "0.82rem" }}>
                Historical Trends <ChevronRight size={14} />
              </Link>
            </div>
            {latestReport ? (
              <div className="card flex-column gap-3">
                <div className="flex-between">
                  <div className="align-center gap-2">
                    <Sparkles size={16} style={{ color: "var(--primary)" }} />
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{latestReport.title}</span>
                  </div>
                  <span className="text-muted-color" style={{ fontSize: "0.75rem" }}>{latestReport.date}</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {latestReport.aiSummary.slice(0, 180)}...
                </p>
                <Link to="/patient/analysis" className="btn btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", alignSelf: "flex-start" }}>
                  View Full Diagnostics
                </Link>
              </div>
            ) : (
              <div className="card empty-state">
                <div className="empty-state-icon"><Sparkles size={28} /></div>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>No reports uploaded yet</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.82rem", margin: "0.5rem 0 1rem" }}>
                  Upload PDF or image charts for AI-powered health insights.
                </p>
                <Link to="/patient/upload" className="btn btn-primary" style={{ padding: "0.45rem 1rem", fontSize: "0.82rem" }}>
                  Upload Lab File
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex-column gap-6">
          <div>
            <div className="section-title-row">
              <h3>Pill Reminder</h3>
              <Link to="/patient/reminders" className="btn-text align-center gap-1" style={{ fontSize: "0.82rem" }}>
                Full Schedule <ChevronRight size={14} />
              </Link>
            </div>
            <div className="flex-column gap-3">
              {todayReminders.map(rem => (
                <ReminderCard key={rem.id} reminder={rem} onToggle={() => {}} />
              ))}
              {todayReminders.length === 0 && (
                <div className="card empty-state" style={{ padding: "1.5rem" }}>
                  <p className="text-secondary-color" style={{ fontSize: "0.82rem", margin: 0 }}>No active medication schedules.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card flex-column gap-3">
            <h3 style={{ fontSize: "1.05rem", margin: 0 }}>Quick Links</h3>
            <Link to="/patient/history" className="quick-link">
              <span>Medical History Log</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link to="/patient/alerts" className="quick-link">
              <span>Emergency Alerts</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link to="/patient/settings" className="quick-link">
              <span>Profile Settings</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PatientDashboard;
