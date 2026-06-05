import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  Calendar, Users, FileText, Activity, MessageSquare, 
  ChevronRight, ArrowRight, ShieldAlert, Sparkles, User 
} from "lucide-react";
import { AppointmentCard } from "../components/CardComponents";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { patients, appointments, updateAppointmentStatus } = useHealth();
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Filter appointments for this doctor
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user.id || apt.doctorId === "doc1");

  const todayAppointments = doctorAppointments.filter(apt => apt.status === "Upcoming");
  const pastAppointments = doctorAppointments.filter(apt => apt.status === "Completed");

  const handleStartCall = (apt) => {
    // Navigate to consultation with specific appointment parameters
    navigate("/doctor/consult", { state: { appointment: apt } });
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="flex-column gap-6">
      {/* Welcome Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Clinical Workspace: {user.name}</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>{user.specialty} | {user.education}</p>
      </div>

      {/* Grid: Calendar, Appointments & Patient Directory */}
      <div className="grid-3" style={{ gridTemplateColumns: "1.8fr 1.2fr" }}>
        
        {/* Left: Schedule and Connected Patients */}
        <div className="flex-column gap-6">
          
          {/* Today's appointments list */}
          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Today's Scheduled Consultations ({todayAppointments.length})</h3>
            <div className="flex-column gap-3">
              {todayAppointments.map(apt => (
                <AppointmentCard 
                  key={apt.id} 
                  appointment={apt} 
                  isDoctor={true} 
                  onStartConsultation={() => handleStartCall(apt)}
                />
              ))}
              {todayAppointments.length === 0 && (
                <div className="card text-center" style={{ padding: "2.5rem" }}>
                  <Calendar size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
                  <h4 style={{ margin: 0, fontSize: "0.95rem" }}>No appointments for today</h4>
                  <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>Incoming consultations booked by patients will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Connected Patients Directory */}
          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Connected Patients Directory</h3>
            <div className="grid-2" style={{ gap: "1rem" }}>
              {patients.map(pat => (
                <div 
                  key={pat.id} 
                  className="card flex-column gap-3" 
                  style={{ 
                    cursor: "pointer",
                    border: selectedPatientId === pat.id ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                    backgroundColor: selectedPatientId === pat.id ? "var(--primary-light)" : "white",
                    transition: "all var(--transition-fast)"
                  }}
                  onClick={() => setSelectedPatientId(selectedPatientId === pat.id ? null : pat.id)}
                >
                  <div className="align-center gap-3">
                    <img 
                      src={pat.avatar} 
                      alt={pat.name} 
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", margin: 0 }}>{pat.name}</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{pat.gender}, {pat.age} yrs | {pat.bloodGroup}</p>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
                    <p><strong>Primary Issue:</strong> {pat.condition}</p>
                    <p><strong>Last Visit:</strong> {pat.lastVisit}</p>
                  </div>
                  
                  <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>Click to inspect medical chart</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: Selected Patient Details Panel (Static/Dynamic toggle) */}
        <div>
          <div className="card flex-column gap-4" style={{ height: "100%", position: "sticky", top: "90px", minHeight: "450px" }}>
            {selectedPatient ? (
              <>
                {/* Header */}
                <div className="align-center gap-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                  <img 
                    src={selectedPatient.avatar} 
                    alt={selectedPatient.name} 
                    style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "1.15rem", margin: 0 }}>{selectedPatient.name}</h3>
                    <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>{selectedPatient.condition}</span>
                  </div>
                </div>

                {/* Patient Health Info */}
                <div style={{ fontSize: "0.85rem" }} className="flex-column gap-3">
                  <div>
                    <strong className="text-secondary-color" style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Contact Details</strong>
                    <p>{selectedPatient.phone} | {selectedPatient.email}</p>
                  </div>

                  <div>
                    <strong className="text-secondary-color" style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Recent Laboratory Summary</strong>
                    {selectedPatient.reports && selectedPatient.reports[0] ? (
                      <div style={{ background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginTop: "0.25rem" }}>
                        <p style={{ fontWeight: "600", fontSize: "0.8rem" }}>{selectedPatient.reports[0].title}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0.25rem 0" }}>{selectedPatient.reports[0].aiSummary.slice(0, 100)}...</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                          {selectedPatient.reports[0].metrics.slice(0, 3).map((m, i) => (
                            <span 
                              key={i} 
                              className={`badge ${m.status.includes("Normal") ? "badge-success" : "badge-danger"}`}
                              style={{ fontSize: "0.6rem", padding: "0.15rem 0.35rem" }}
                            >
                              {m.name}: {m.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-color">No lab reports found for this patient.</p>
                    )}
                  </div>

                  <div>
                    <strong className="text-secondary-color" style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase" }}>Clinical History</strong>
                    <div className="flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto", marginTop: "0.25rem" }}>
                      {selectedPatient.history.map((hist, idx) => (
                        <div key={idx} style={{ padding: "0.5rem", borderLeft: "2px solid var(--primary)", background: "var(--bg-secondary)", fontSize: "0.75rem" }}>
                          <div className="flex-between">
                            <strong>{hist.diagnosis}</strong>
                            <span className="text-muted-color">{hist.date}</span>
                          </div>
                          <p style={{ color: "var(--text-secondary)", marginTop: "0.15rem" }}>{hist.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-column gap-2" style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <button 
                    onClick={() => navigate("/doctor/consult", { state: { patient: selectedPatient } })}
                    className="btn btn-primary w-full" 
                    style={{ fontSize: "0.85rem" }}
                  >
                    Open Telehealth Portal
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-column flex-center text-center" style={{ flex: 1, padding: "2rem" }}>
                <Users size={40} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Select Patient Chart</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>Click any patient card in the directory to inspect their active laboratory values, diagnoses, and open files.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default DoctorDashboard;
