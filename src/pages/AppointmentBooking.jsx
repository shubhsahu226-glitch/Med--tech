import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Clock, Video, MessageSquare, HeartPulse, User } from "lucide-react";
import { Link } from "react-router-dom";

export const AppointmentBooking = () => {
  const { user } = useAuth();
  const { doctors, addAppointment } = useHealth();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [meetingType, setMeetingType] = useState("Video");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if a doctor was passed through router state
  useEffect(() => {
    if (location.state?.selectedDoctor) {
      setSelectedDoctorId(location.state.selectedDoctor.id);
    } else if (doctors.length > 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [location.state, doctors]);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDoctorId || !selectedDate || !selectedSlot || !reason) {
      setError("Please fill in all the booking fields.");
      return;
    }

    // Call HealthContext action
    addAppointment({
      patientId: user.id,
      patientName: user.name,
      doctorId: selectedDoctorId,
      doctorName: activeDoctor.name,
      doctorSpecialty: activeDoctor.specialty,
      date: selectedDate,
      time: selectedSlot,
      reason,
      meetingType
    });

    setSuccess(true);
    setTimeout(() => {
      navigate("/patient/dashboard");
    }, 2000);
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }} className="flex-column gap-6">
      <div>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Schedule Telehealth Consultation</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Book interactive clinical consultations with board-certified physicians.</p>
      </div>

      {success ? (
        <div className="card text-center" style={{ padding: "3rem 1.5rem", borderColor: "var(--success)" }}>
          <div className="flex-center m-b-3" style={{ color: "var(--success)" }}>
            <HeartPulse size={48} className="animate-pulse" fill="var(--success-light)" />
          </div>
          <h2 style={{ color: "var(--success-dark)" }}>Appointment Scheduled!</h2>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Your consultation session has been registered. Redirecting to your dashboard...
          </p>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} className="flex-column gap-4">
            
            {error && (
              <div style={{ padding: "0.75rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            {/* Doctor Selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="booking-doctor">Select Specialist</label>
              <select
                id="booking-doctor"
                className="form-input"
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setSelectedSlot("");
                }}
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </div>

            {activeDoctor && (
              <div 
                className="align-center gap-3" 
                style={{ 
                  background: "var(--bg-secondary)", 
                  padding: "0.75rem 1rem", 
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem"
                }}
              >
                <img 
                  src={activeDoctor.image} 
                  alt={activeDoctor.name} 
                  style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontWeight: "600" }}>{activeDoctor.name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                    Fee: {activeDoctor.consultationFee} | Hours: {activeDoctor.availability[0]}
                  </div>
                </div>
              </div>
            )}

            {/* Date Picker */}
            <div className="form-group">
              <label className="form-label" htmlFor="booking-date">Consultation Date</label>
              <input
                type="date"
                id="booking-date"
                className="form-input"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Slot Selector */}
            {selectedDate && activeDoctor && (
              <div className="form-group">
                <label className="form-label">Available Time Slots</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                  {activeDoctor.slots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: "0.5rem 0.85rem",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: selectedSlot === slot ? "var(--primary)" : "white",
                        color: selectedSlot === slot ? "white" : "var(--text-secondary)",
                        border: selectedSlot === slot ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                        transition: "all var(--transition-fast)"
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Type Selector */}
            <div className="form-group">
              <label className="form-label">Consultation Channel</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setMeetingType("Video")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: meetingType === "Video" ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    backgroundColor: meetingType === "Video" ? "var(--primary-light)" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontWeight: "600"
                  }}
                >
                  <Video size={18} style={{ color: "var(--primary)" }} />
                  <span>Video Session</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingType("Chat")}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: meetingType === "Chat" ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    backgroundColor: meetingType === "Chat" ? "var(--primary-light)" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontWeight: "600"
                  }}
                >
                  <MessageSquare size={18} style={{ color: "var(--primary)" }} />
                  <span>Live Chat</span>
                </button>
              </div>
            </div>

            {/* Reason Text */}
            <div className="form-group">
              <label className="form-label" htmlFor="booking-reason">Symptoms / Consultation Reason</label>
              <textarea
                id="booking-reason"
                className="form-input"
                rows="3"
                placeholder="Explain any physical symptoms, recurring problems, or specific reports you'd like to discuss..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full m-t-2" style={{ padding: "0.75rem" }}>
              Request Appointment Slot
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default AppointmentBooking;
