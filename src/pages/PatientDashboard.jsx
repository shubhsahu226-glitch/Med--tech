import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Clock, Activity, FileText, ArrowRight } from "lucide-react";
import { AppointmentCard, ReminderCard } from "../components/cards";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reminders, treatments, refreshAppointments } = useHealth();
  const navigate = useNavigate();

  // Refresh appointments on mount to get latest status
  useEffect(() => {
    if (refreshAppointments) refreshAppointments();
  }, []);

  // Find next upcoming appointment
  const nextAppointment = appointments
    .filter(apt => apt.patientId === user.id && (apt.status === "Upcoming" || apt.status === "Confirmed" || apt.status === "Pending"))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  // Limit checklist reminders to 1 key upcoming medication
  const activeReminders = reminders.filter(r => !r.taken).slice(0, 1);

  // Check if guest demo patient
  const isGuest = !user?.id || user.id === "pat1";

  // Fetch current treatment details from Supabase or fallback to mock for guest
  const currentTreatment = treatments && treatments.length > 0
    ? {
        diagnosis: treatments[0].diagnosis,
        notes: treatments[0].notes,
        doctor: treatments[0].doctor_name || "Primary Clinician",
        date: treatments[0].created_at ? new Date(treatments[0].created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' }) : "Recently"
      }
    : isGuest
      ? {
          diagnosis: "Chronic Hypertension Management",
          notes: "Daily cardiovascular monitoring. Restrict dietary sodium. Continue blood pressure tracking logs.",
          doctor: "Dr. Sarah Jenkins",
          date: "Jun 02, 2026"
        }
      : null;

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Greeting Header */}
      <div className="flex-between flex-wrap gap-4" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Hello, {user.name}</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Here is your active healthcare summary.</p>
        </div>
        <div className="align-center gap-3">
          <Link to="/patient/doctors" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
            Schedule Consultation
          </Link>
        </div>
      </div>

      {/* Basic Info Banner */}
      <div className="card grid-4" style={{ padding: "1.25rem", gap: "1.5rem", borderLeft: "4px solid var(--primary)" }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Age & Gender</div>
          <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.15rem" }}>
            {user.age || "Not Specified"} Years / {user.gender || "Not Specified"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Blood Group</div>
          <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.15rem" }}>
            {user.bloodGroup || "Not Specified"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Emergency Contact</div>
          <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.15rem" }}>
            {user.emergencyContact || "Not Specified"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Primary Physician</div>
          <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginTop: "0.15rem" }}>
            {currentTreatment ? currentTreatment.doctor : "None Assigned"}
          </div>
        </div>
      </div>

      {/* Split Layout */}
      <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
        
        {/* Left Column: Treatment & Upcoming Appointments */}
        <div className="flex-column gap-6">
          
          {/* Current Treatment */}
          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", fontWeight: "600" }}>Current Treatment Course</h3>
            {currentTreatment ? (
              <div className="card flex-column gap-3" style={{ padding: "1.5rem" }}>
                <div className="flex-between">
                  <span className="badge badge-info" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", fontSize: "0.7rem" }}>
                    Active Regimen
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Prescribed: {currentTreatment.date}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>{currentTreatment.diagnosis}</h4>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {currentTreatment.notes}
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px dashed var(--border-color)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                  Prescribed by: <strong style={{ color: "var(--text-secondary)" }}>{currentTreatment.doctor}</strong>
                </div>
              </div>
            ) : (
              <div className="card text-center" style={{ padding: "3rem 1.5rem" }}>
                <Activity size={28} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500" }}>No Active Treatment Regimens</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Prescriptions or treatment courses from your doctors will appear here.</p>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div>
            <div className="flex-between m-b-3">
              <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: "600" }}>Upcoming Consultations</h3>
              <Link to="/patient/doctors" className="btn-text align-center gap-1" style={{ fontSize: "0.8rem", fontWeight: "500", padding: 0 }}>
                Manage Consults <ArrowRight size={14} />
              </Link>
            </div>
            {nextAppointment ? (
              <AppointmentCard 
                appointment={nextAppointment} 
                onStartConsultation={() => navigate("/patient/doctors")} 
                isDoctor={false}
              />
            ) : (
              <div className="card text-center" style={{ padding: "2.5rem 1.5rem" }}>
                <Calendar size={28} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500" }}>No upcoming consultations</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.8rem", margin: "0.25rem 0 1.25rem" }}>Discuss medical reports or checkups with connected physicians.</p>
                <Link to="/patient/doctors" className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>Book Appointment</Link>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Medications */}
        <div className="flex-column gap-6">
          
          <div>
            <div className="flex-between m-b-3">
              <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: "600" }}>Upcoming Medication</h3>
              <Link to="/patient/care" className="btn-text align-center gap-1" style={{ fontSize: "0.8rem", fontWeight: "500", padding: 0 }}>
                Care Panel <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex-column gap-3">
              {activeReminders.map(rem => (
                <ReminderCard 
                  key={rem.id} 
                  reminder={rem} 
                  onToggle={() => {}} // Read-only checkbox on home dashboard
                />
              ))}
              {activeReminders.length === 0 && (
                <div className="card text-center" style={{ padding: "1.5rem" }}>
                  <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>All medications logged for today.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
