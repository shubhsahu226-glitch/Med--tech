import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  FileUp, Calendar, Search, Activity, Clock, ShieldAlert, Sparkles, 
  ChevronRight, ArrowUpRight, CheckCircle2, AlertCircle 
} from "lucide-react";
import { AppointmentCard, ReminderCard } from "../components/cards";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reminders, alerts } = useHealth();
  const navigate = useNavigate();

  // Find next upcoming appointment
  const nextAppointment = appointments
    .filter(apt => apt.patientId === user.id && apt.status === "Upcoming")
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  // Daily medication reminders checklist
  const todayReminders = reminders.slice(0, 3);

  // Active critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === "high").slice(0, 1);

  // Fetch patient's latest uploaded report
  const latestReport = user.reports && user.reports[0];

  const handleToggleReminder = (id) => {
    // Toggled through context
  };

  return (
    <div className="flex-column gap-6">
      {/* Greeting Header */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Welcome back, {user.name}</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Here is your medical overview for today.</p>
        </div>
        <div className="align-center gap-3">
          <Link to="/patient/upload" className="btn btn-primary">
            <FileUp size={16} /> Upload New Report
          </Link>
          <Link to="/patient/doctors" className="btn btn-secondary">
            <Search size={16} /> Find Doctors
          </Link>
        </div>
      </div>

      {/* Critical Alert banner if active */}
      {criticalAlerts.length > 0 && (
        <div 
          className="card" 
          style={{
            borderLeft: "5px solid var(--danger)",
            background: "var(--danger-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem"
          }}
        >
          <div className="align-center gap-3">
            <ShieldAlert size={24} style={{ color: "var(--danger)" }} />
            <div>
              <h4 style={{ margin: 0, color: "var(--danger-dark)", fontSize: "0.95rem" }}>{criticalAlerts[0].title}</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{criticalAlerts[0].action}</p>
            </div>
          </div>
          <Link to="/patient/alerts" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: "white" }}>
            View Guide
          </Link>
        </div>
      )}

      {/* Split Layout: Primary Metrics & Info */}
      <div className="split-layout split-layout-18-12">
        {/* Left Column: Quick Stats / Next Appointment / History */}
        <div className="flex-column gap-6">
          
          {/* Quick Health Parameters */}
          <div className="grid-3" style={{ gap: "1rem" }}>
            <div className="card align-center gap-3" style={{ padding: "1rem" }}>
              <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
                <Activity size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Blood Group</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{user.bloodGroup || "O+"}</div>
              </div>
            </div>

            <div className="card align-center gap-3" style={{ padding: "1rem" }}>
              <div style={{ color: "var(--success)", background: "var(--success-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Active Reminders</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{reminders.filter(r => !r.taken).length} / {reminders.length}</div>
              </div>
            </div>

            <div className="card align-center gap-3" style={{ padding: "1rem" }}>
              <div style={{ color: "var(--warning)", background: "var(--warning-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
                <FileUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Lab Reports</div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{user.reportsCount || 0} Reviewed</div>
              </div>
            </div>
          </div>

          {/* Next Scheduled Appointment */}
          <div>
            <div className="flex-between m-b-2">
              <h3 style={{ fontSize: "1.15rem", margin: 0 }}>Upcoming Consultation</h3>
              <Link to="/patient/consult" className="btn-text align-center gap-1" style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                Go to Telehealth Portal <ChevronRight size={14} />
              </Link>
            </div>
            {nextAppointment ? (
              <AppointmentCard 
                appointment={nextAppointment} 
                onStartConsultation={() => navigate("/patient/consult")} 
              />
            ) : (
              <div className="card text-center" style={{ padding: "2rem" }}>
                <Calendar size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>No upcoming consultations</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>Schedule a routine checkup or discuss recent report logs.</p>
                <Link to="/patient/book" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Book Appointment</Link>
              </div>
            )}
          </div>

          {/* AI Insights & Latest Upload summary */}
          <div>
            <div className="flex-between m-b-2">
              <h3 style={{ fontSize: "1.15rem", margin: 0 }}>Latest Report Analysis</h3>
              <Link to="/patient/analysis" className="btn-text align-center gap-1" style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                See Historical Trends <ChevronRight size={14} />
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
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {latestReport.aiSummary.slice(0, 180)}...
                </p>
                <Link to="/patient/analysis" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", alignSelf: "flex-start" }}>
                  View Full Diagnostics
                </Link>
              </div>
            ) : (
              <div className="card text-center" style={{ padding: "2rem" }}>
                <Sparkles size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>No diagnostic reports uploaded yet</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>Upload images or PDF charts to view automated AI highlights and health thresholds.</p>
                <Link to="/patient/upload" className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Upload Lab File</Link>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Medication Reminders & Quick Actions */}
        <div className="flex-column gap-6">
          
          {/* Medications Panel */}
          <div>
            <div className="flex-between m-b-2">
              <h3 style={{ fontSize: "1.15rem", margin: 0 }}>Pill Reminder</h3>
              <Link to="/patient/reminders" className="btn-text align-center gap-1" style={{ fontSize: "0.85rem", fontWeight: "500" }}>
                Full Schedule <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="flex-column gap-3">
              {todayReminders.map(rem => (
                <ReminderCard 
                  key={rem.id} 
                  reminder={rem} 
                  onToggle={() => {}} // Done statically or handled in reminders page
                />
              ))}
              {todayReminders.length === 0 && (
                <div className="card text-center" style={{ padding: "1.5rem" }}>
                  <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No active medication schedules.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="card flex-column gap-3">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Quick Links</h3>
            
            <Link to="/patient/history" className="align-center flex-between p-2" style={{ padding: "0.6rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
              <span>Medical History Log</span>
              <ArrowUpRight size={14} style={{ color: "var(--text-muted)" }} />
            </Link>

            <Link to="/patient/alerts" className="align-center flex-between p-2" style={{ padding: "0.6rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
              <span>Emergency Alerts & Actions</span>
              <ArrowUpRight size={14} style={{ color: "var(--text-muted)" }} />
            </Link>

            <Link to="/patient/settings" className="align-center flex-between p-2" style={{ padding: "0.6rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
              <span>Profile Information</span>
              <ArrowUpRight size={14} style={{ color: "var(--text-muted)" }} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
export default PatientDashboard;
