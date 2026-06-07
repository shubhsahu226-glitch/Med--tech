import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  Calendar, Clock, Video, MessageSquare, Send, Save, PhoneOff, 
  Activity, CheckCircle2, ChevronRight, User 
} from "lucide-react";
import { AppointmentCard } from "../components/cards";

export const DoctorWorkspace = () => {
  const { user } = useAuth();
  const { appointments, patients, addTreatmentNotes } = useHealth();
  const location = useLocation();

  // Workspace subnav tab: schedule, consult
  const [activeTab, setActiveTab] = useState("schedule");

  // Selection state
  const [selectedAptId, setSelectedAptId] = useState("");
  const [availabilityStart, setAvailabilityStart] = useState("09:00 AM");
  const [availabilityEnd, setAvailabilityEnd] = useState("05:00 PM");
  const [availabilityStatus, setAvailabilityStatus] = useState("");

  // Consultation Room States
  const [notesDiagnosis, setNotesDiagnosis] = useState("");
  const [notesPrescription, setNotesPrescription] = useState("");
  const [notesDetails, setNotesDetails] = useState("");
  const [notesFollowUp, setNotesFollowUp] = useState("");
  const [notesStatus, setNotesStatus] = useState("");

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { sender: "patient", text: "Hello doctor, I uploaded my blood report yesterday. The glucose seems a bit high.", time: "10:01 AM" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [callActive, setCallActive] = useState(true);

  // Sync state if redirected from Doctor Dashboard
  useEffect(() => {
    if (location.state?.appointment) {
      setSelectedAptId(location.state.appointment.id);
      setActiveTab("consult");
    } else if (location.state?.patient) {
      // Find appointment for this patient
      const apt = appointments.find(a => a.patientId === location.state.patient.id);
      if (apt) setSelectedAptId(apt.id);
      setActiveTab("consult");
    }
  }, [location.state, appointments]);

  // Filters
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user.id || apt.doctorId === "doc1");
  const activeApt = doctorAppointments.find(a => a.id === selectedAptId) || doctorAppointments[0];
  const selectedPatient = patients.find(p => p.id === activeApt?.patientId) || patients[0];

  const handleUpdateAvailability = (e) => {
    e.preventDefault();
    setAvailabilityStatus("Availability updated successfully!");
    setTimeout(() => setAvailabilityStatus(""), 3000);
  };

  const handleSaveConsultation = (e) => {
    e.preventDefault();
    if (!notesDiagnosis || !notesDetails) return;

    // Save notes to Patient history using Health Context
    addTreatmentNotes(
      selectedPatient.id,
      user.name,
      notesDiagnosis,
      notesDetails,
      notesPrescription,
      notesFollowUp
    );

    setNotesStatus("Consultation notes saved to patient history!");
    setNotesDiagnosis("");
    setNotesPrescription("");
    setNotesDetails("");
    setNotesFollowUp("");
    
    setTimeout(() => setNotesStatus(""), 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: "doctor", text: newMessage, time: timeString }]);
    setNewMessage("");

    // Patient response simulation
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: "patient",
        text: "Thank you doctor, I will follow these guidelines.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Page Header */}
      <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Clinical Operations Board</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Manage clinical slots, consult active patients, prescribe treatments, and write follow-up notes.</p>
      </div>

      {/* Tabs */}
      <div className="subnav-tabs">
        <button 
          onClick={() => setActiveTab("schedule")} 
          className={`subnav-tab ${activeTab === "schedule" ? "active" : ""}`}
        >
          My Clinic Schedule
        </button>
        <button 
          onClick={() => setActiveTab("consult")} 
          className={`subnav-tab ${activeTab === "consult" ? "active" : ""}`}
        >
          Active Consultation Room
        </button>
      </div>

      <div className="subnav-container">
        
        {/* TAB 1: CLINIC SCHEDULE */}
        {activeTab === "schedule" && (
          <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
            
            {/* Appointments Queue */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Upcoming Session Queue</h3>
              
              <div className="flex-column gap-3">
                {doctorAppointments.slice(0, 2).map(apt => (
                  <div key={apt.id} className="flex-column gap-2">
                    <AppointmentCard 
                      appointment={apt} 
                      isDoctor={true} 
                      onStartConsultation={() => {
                        setSelectedAptId(apt.id);
                        setActiveTab("consult");
                      }}
                    />
                  </div>
                ))}

                {doctorAppointments.length === 0 && (
                  <div className="card text-center" style={{ padding: "2.5rem" }}>
                    <Calendar size={28} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
                    <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No sessions registered for today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Availability hours control */}
            <div className="flex-column gap-6">
              
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", fontWeight: "600" }}>Set Consultation Hours</h3>
                
                <form onSubmit={handleUpdateAvailability} className="flex-column gap-3">
                  {availabilityStatus && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.8rem" }}>
                      {availabilityStatus}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="avail-start">Start Time</label>
                    <input 
                      type="text" 
                      id="avail-start" 
                      className="form-input" 
                      value={availabilityStart} 
                      onChange={(e) => setAvailabilityStart(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="avail-end">End Time</label>
                    <input 
                      type="text" 
                      id="avail-end" 
                      className="form-input" 
                      value={availabilityEnd} 
                      onChange={(e) => setAvailabilityEnd(e.target.value)} 
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary w-full" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                    Update Hours
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ACTIVE CONSULTATION ROOM */}
        {activeTab === "consult" && (
          <div className="split-layout split-layout-1-2" style={{ gap: "2.5rem" }}>
            
            {/* Left Column: Patient Feed, Video, Chat */}
            <div className="flex-column gap-6">
              
              {/* Selected Patient overview */}
              {selectedPatient && (
                <div className="card align-center gap-3" style={{ padding: "1rem" }}>
                  <img 
                    src={selectedPatient.avatar} 
                    alt={selectedPatient.name} 
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>{selectedPatient.name}</h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {selectedPatient.gender}, {selectedPatient.age} Yrs | {selectedPatient.bloodGroup} | {selectedPatient.condition}
                    </p>
                  </div>
                </div>
              )}

              {/* Video Mock Panel */}
              <div 
                style={{
                  backgroundColor: "#1e293b",
                  height: "150px",
                  borderRadius: "var(--radius-md)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                {callActive && selectedPatient ? (
                  <>
                    <img 
                      src={selectedPatient.avatar} 
                      alt={selectedPatient.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                    />
                    <div style={{ position: "absolute", bottom: "8px", left: "8px", color: "white", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "0.2rem 0.5rem", borderRadius: "3px" }}>
                      Patient Stream (Active)
                    </div>
                    <button 
                      onClick={() => setCallActive(false)}
                      className="btn btn-danger" 
                      style={{ position: "absolute", top: "8px", right: "8px", padding: "0.3rem", borderRadius: "50%", width: "26px", height: "26px" }}
                      title="End Video Stream"
                    >
                      <PhoneOff size={12} />
                    </button>
                  </>
                ) : (
                  <div className="text-center" style={{ color: "#94a3b8" }}>
                    <Video size={20} />
                    <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>Consultation camera offline</p>
                    <button onClick={() => setCallActive(true)} className="btn btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", marginTop: "0.5rem" }}>
                      Open Camera Feed
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Interface */}
              <div className="card flex-column gap-3" style={{ padding: "1rem" }}>
                <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: "600" }}>Secured Consultation Chat</h3>
                
                <div style={{ height: "100px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem" }} className="flex-column gap-2">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        alignSelf: msg.sender === "doctor" ? "flex-end" : "flex-start",
                        backgroundColor: msg.sender === "doctor" ? "var(--primary-light)" : "var(--bg-tertiary)",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "var(--radius-md)",
                        maxWidth: "85%",
                        fontSize: "0.75rem"
                      }}
                    >
                      <p style={{ margin: 0 }}>{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type to chat..." 
                    style={{ fontSize: "0.75rem", padding: "0.4rem" }}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "0.4rem" }}>
                    <Send size={12} />
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Prescription, notes & follow-ups */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Prescriptions & Charting Notes</h3>
              
              <div className="card">
                <form onSubmit={handleSaveConsultation} className="flex-column gap-3">
                  {notesStatus && (
                    <div style={{ padding: "0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", borderLeft: "3px solid var(--success)" }}>
                      {notesStatus}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes-diagnosis">Diagnosis / Primary Issue</label>
                    <input 
                      type="text" 
                      id="notes-diagnosis"
                      className="form-input" 
                      placeholder="e.g. Primary Hypertension"
                      value={notesDiagnosis}
                      onChange={(e) => setNotesDiagnosis(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes-presc">Prescriptions (Medication / Dosage)</label>
                    <input 
                      type="text" 
                      id="notes-presc"
                      className="form-input" 
                      placeholder="e.g. Metformin 500mg, once daily"
                      value={notesPrescription}
                      onChange={(e) => setNotesPrescription(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes-details">Clinical Chart Notes</label>
                    <textarea 
                      id="notes-details"
                      className="form-input" 
                      rows="3" 
                      placeholder="Enter detailed observations, symptom assessments..."
                      value={notesDetails}
                      onChange={(e) => setNotesDetails(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes-follow">Follow-up Action Date</label>
                    <input 
                      type="date" 
                      id="notes-follow"
                      className="form-input" 
                      value={notesFollowUp}
                      onChange={(e) => setNotesFollowUp(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full m-t-2 align-center gap-1 justify-content-center">
                    <Save size={14} /> Save & Complete Consultation
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default DoctorWorkspace;
