import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import VideoCall from "../components/VideoCall";
import { 
  Search, MapPin, Star, Video, MessageSquare, Send, CheckCircle2 
} from "lucide-react";

const generateTempId = () => `temp_${Date.now()}`;
const getCurrentTimeString = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const PatientDoctors = () => {
  const { user } = useAuth();
  const { doctors, appointments, addAppointment, refreshDoctors, refreshAppointments } = useHealth();
  
  // Refresh doctors list whenever this page is visited to ensure it's up to date
  useEffect(() => {
    if (refreshDoctors) refreshDoctors();
    if (refreshAppointments) refreshAppointments();
  }, []);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryTab = queryParams.get("tab");
  const queryDoctorId = queryParams.get("doctor");

  // Tab State: search, telehealth
  const [activeTab, setActiveTab] = useState(() => 
    queryTab === "telehealth" || location.state?.selectedDoctor ? "telehealth" : "search"
  );

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const specialties = ["All", "Cardiologist", "Neurologist", "Pediatrician", "General Physician"];

  // Booking States
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    if (queryDoctorId) return queryDoctorId;
    if (location.state?.selectedDoctor) {
      return location.state.selectedDoctor.id;
    }
    return "";
  });
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [meetingType, setMeetingType] = useState("Video");
  const [reason, setReason] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [bookingError, setBookingError] = useState("");

  // Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardName, setCardName] = useState(user?.name || "Patient Name");

  // Auto-initialize selectedDoctorId when doctors load if empty
  useEffect(() => {
    if (doctors && doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Telehealth Consultation Room States
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const activeDoctorId = selectedDoctorId || (doctors.length > 0 ? doctors[0].id : "");
  const activeDoctor = doctors.find(d => d.id === activeDoctorId) || null;
  const patientApts = appointments.filter(apt => apt.patientId === user.id);

  // Chat Integration with Supabase
  const activeApt = patientApts.find(apt => apt.doctorId === activeDoctorId);
  const isGuestMode = !user?.id || user.id === "pat1" || activeDoctorId === "doc1";
  const hasConfirmedApt = activeApt && (activeApt.status === "Confirmed" || activeApt.status === "Upcoming");

  useEffect(() => {
    if (!activeDoctorId || !user?.id || (!isGuestMode && !activeApt?.id)) return;
    
    const fetchMessages = async () => {
      if (isGuestMode) {
        try {
          const key = `virtualvaidya_chat_${user.id}_${activeDoctorId}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {
          console.warn("Failed to load local messages", err);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('appointment_id', activeApt.id)
          .order('created_at', { ascending: true });
          
        if (data && !error) {
          setChatMessages(data.map(m => ({
            id: m.id,
            sender: m.sender_role,
            text: m.text,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    
    fetchMessages();

    if (isGuestMode) {
      const interval = setInterval(() => {
        try {
          const key = `virtualvaidya_chat_${user.id}_${activeDoctorId}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {
          console.debug("Failed to retrieve chat updates in poll", err);
        }
      }, 1500);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel(`chat_${activeApt.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `appointment_id=eq.${activeApt.id}` 
      }, payload => {
        const m = payload.new;
        setChatMessages(prev => {
          if (prev.find(msg => msg.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            sender: m.sender_role,
            text: m.text,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeDoctorId, isGuestMode, activeApt?.id]);

  if (!activeDoctor) {
    return (
      <div className="flex-center" style={{ height: "60vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTop: "3px solid var(--primary)", animation: "spin 1s linear infinite" }} />
        <p className="text-secondary-color">Loading available specialists...</p>
      </div>
    );
  }

  // Filter Doctors list
  const filteredDoctors = doctors.filter(doc => {
    const docName = doc.name || "";
    const docSpecialty = doc.specialty || "";
    const matchesSearch = docName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          docSpecialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All" || docSpecialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookingDate || !bookingSlot || !reason) return;

    setBookingError("");
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    setBookingStatus("Processing payment...");

    // Simulate payment gateway delay (1.5 seconds)
    setTimeout(async () => {
      try {
        await addAppointment({
          patientId: user.id,
          patientName: user.name,
          doctorId: selectedDoctorId,
          doctorName: activeDoctor.name,
          doctorSpecialty: activeDoctor.specialty,
          date: bookingDate,
          time: bookingSlot,
          reason,
          meetingType,
          status: "Paid" // Save with status Paid
        });

        setBookingStatus("Booking requested & payment successful!");
        setReason("");
        setBookingDate("");
        setBookingSlot("");
        setShowPaymentModal(false);
        setTimeout(() => setBookingStatus(""), 4000);
      } catch (err) {
        console.error("Failed to submit booking after payment:", err);
        setBookingStatus("");
        setBookingError(err.message || "Failed to complete booking. Please try again.");
        setShowPaymentModal(false);
      } finally {
        setIsProcessingPayment(false);
      }
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeDoctorId || !user?.id) return;

    const msgText = newMessage;
    setNewMessage("");

    const tempId = generateTempId();
    const timeString = getCurrentTimeString();
    const newMsgObj = { id: tempId, sender: "patient", text: msgText, time: timeString };
    
    setChatMessages(prev => [...prev, newMsgObj]);

    if (isGuestMode) {
      try {
        const key = `virtualvaidya_chat_${user.id}_${activeDoctorId}`;
        const msgs = JSON.parse(localStorage.getItem(key) || "[]");
        msgs.push(newMsgObj);
        localStorage.setItem(key, JSON.stringify(msgs));
      } catch (err) {
        console.warn("Failed to save local message", err);
      }
      return;
    }

    const { data, error } = await supabase.from('messages').insert([{
      appointment_id: activeApt?.id || null,
      sender_id: user.id,
      sender_role: 'patient',
      text: msgText
    }]).select();

    if (data && !error) {
      setChatMessages(prev => prev.map(m => m.id === tempId ? {
        id: data[0].id, sender: data[0].sender_role, text: data[0].text, time: new Date(data[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : m));
    }
  };

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Telehealth & Physicians</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Consult verified clinical specialists, schedule routine health checkups, and join live digital sessions.</p>
      </div>

      {/* Tabs */}
      <div className="subnav-tabs">
        <button 
          onClick={() => setActiveTab("search")} 
          className={`subnav-tab ${activeTab === "search" ? "active" : ""}`}
        >
          Clinician Directory
        </button>
        <button 
          onClick={() => setActiveTab("telehealth")} 
          className={`subnav-tab ${activeTab === "telehealth" ? "active" : ""}`}
        >
          Telehealth Consult Center
        </button>
      </div>

      <div className="subnav-container">
        
        {/* TAB 1: CLINICIAN DIRECTORY */}
        {activeTab === "search" && (
          <div className="flex-column gap-6">
            
            {/* Search inputs */}
            <div className="card flex-column gap-3" style={{ padding: "1.25rem" }}>
              <div style={{ position: "relative" }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search doctors by name or specialty..." 
                  style={{ paddingLeft: "2.5rem" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search 
                  size={16} 
                  style={{ 
                    position: "absolute", 
                    top: "50%", 
                    left: "0.875rem", 
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)" 
                  }} 
                />
              </div>

              {/* Specialty tags */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {specialties.map(spec => (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpecialty(spec)}
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: selectedSpecialty === spec ? "var(--primary)" : "white",
                      color: selectedSpecialty === spec ? "white" : "var(--text-secondary)",
                      border: "1px solid var(--border-color)",
                      transition: "all var(--transition-fast)"
                    }}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctors list */}
            <div className="grid-3" style={{ gap: "1.5rem" }}>
              {filteredDoctors.map(doc => (
                <div key={doc.id} className="card flex-column gap-3" style={{ padding: "1.25rem" }}>
                  <div className="align-center gap-3">
                    <img 
                      src={doc.image} 
                      alt={doc.name} 
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>{doc.name}</h4>
                      <span className="badge badge-info" style={{ fontSize: "0.65rem", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>{doc.specialty}</span>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", fontSize: "0.75rem" }} className="flex-column gap-1">
                    <div className="align-center gap-1"><Star size={12} fill="var(--primary)" style={{ color: "var(--primary)" }} /> <strong>{doc.rating}</strong> ({doc.reviews} reviews)</div>
                    <div className="align-center gap-1"><MapPin size={12} /> {doc.location}</div>
                    <div className="align-center gap-1" style={{ color: "var(--primary)", fontWeight: "600", marginTop: "2px" }}>💵 Fee: {doc.consultationFee || doc.fee || "$50"}</div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedDoctorId(doc.id);
                      setActiveTab("telehealth");
                    }} 
                    className="btn btn-primary w-full"
                    style={{ fontSize: "0.8rem", padding: "0.5rem" }}
                  >
                    Select & Book Consultation
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: TELEHEALTH CONSULT CENTER */}
        {activeTab === "telehealth" && (
          <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
            
            {/* Left Panel: Schedule Consultation Booking Form */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Schedule Consult Slot <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "normal" }}>(Code Version: V5)</span></h3>
              
              <div className="card">
                {bookingStatus ? (
                  <div className="flex-column flex-center text-center" style={{ padding: "2rem 1rem" }}>
                    <CheckCircle2 size={36} style={{ color: "var(--success)" }} />
                    <h4 style={{ marginTop: "1rem", color: "var(--success-dark)" }}>{bookingStatus}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Your consultation slot has been added.</p>
                    <div style={{ marginTop: "1.25rem", padding: "0.6rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-tertiary)", fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace", textAlign: "left", width: "100%", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem", color: "var(--text-primary)" }}>Debug Info:</div>
                      <div>Mode: {user?.id === "pat1" || selectedDoctorId === "doc1" ? "Guest Mode (Local)" : "Database Mode (Supabase)"}</div>
                      <div>Patient ID: {user?.id}</div>
                      <div>Doctor ID: {selectedDoctorId}</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="flex-column gap-3">
                    {bookingError && (
                      <div className="card" style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "600" }}>Error: </span>
                        <span>{bookingError}</span>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label" htmlFor="appt-doc">Selected Practitioner</label>
                      <select
                        id="appt-doc"
                        className="form-input"
                        value={selectedDoctorId}
                        onChange={(e) => {
                          setSelectedDoctorId(e.target.value);
                          setBookingSlot("");
                        }}
                      >
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                        ))}
                      </select>
                    </div>

                    {activeDoctor && (
                      <div className="card" style={{ padding: "0.75rem", backgroundColor: "var(--primary-light)", border: "1px solid var(--primary)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--primary)" }}>Consultation Price:</span>
                        <span style={{ fontSize: "1rem", fontWeight: "700", color: "var(--primary)" }}>{activeDoctor.consultationFee || activeDoctor.fee || "$50"}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label" htmlFor="appt-date">Consultation Date</label>
                      <input
                        type="date"
                        id="appt-date"
                        className="form-input"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        required
                      />
                    </div>

                    {bookingDate && activeDoctor && (
                      <div className="form-group">
                        <label className="form-label">Available Hours</label>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                          {activeDoctor.slots.slice(0, 3).map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingSlot(slot)}
                              style={{
                                padding: "0.35rem 0.6rem",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                borderRadius: "var(--radius-md)",
                                backgroundColor: bookingSlot === slot ? "var(--primary)" : "white",
                                color: bookingSlot === slot ? "white" : "var(--text-secondary)",
                                border: bookingSlot === slot ? "1px solid var(--primary)" : "1px solid var(--border-color)"
                              }}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">Consultation Channel</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <button
                          type="button"
                          onClick={() => setMeetingType("Video")}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-md)",
                            border: meetingType === "Video" ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                            backgroundColor: meetingType === "Video" ? "var(--primary-light)" : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            color: meetingType === "Video" ? "var(--primary)" : "var(--text-secondary)"
                          }}
                        >
                          <Video size={14} />
                          <span>Video Session</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMeetingType("Chat")}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "var(--radius-md)",
                            border: meetingType === "Chat" ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                            backgroundColor: meetingType === "Chat" ? "var(--primary-light)" : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            color: meetingType === "Chat" ? "var(--primary)" : "var(--text-secondary)"
                          }}
                        >
                          <MessageSquare size={14} />
                          <span>Live Chat</span>
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="appt-reason">Symptom details / Consultation Notes</label>
                      <textarea
                        id="appt-reason"
                        className="form-input"
                        rows="2"
                        placeholder="Explain symptoms or medical history update requests..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary w-full m-t-2" disabled={bookingStatus === "Booking..."}>
                      {bookingStatus === "Booking..." ? "Booking..." : "Confirm Appointment"}
                    </button>

                    <div style={{ marginTop: "1.25rem", padding: "0.6rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--bg-tertiary)", fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace", textAlign: "left", border: "1px solid var(--border-color)" }}>
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem", color: "var(--text-primary)" }}>Debug Info:</div>
                      <div>Mode: {user?.id === "pat1" || selectedDoctorId === "doc1" ? "Guest Mode (Local)" : "Database Mode (Supabase)"}</div>
                      <div>Patient ID: {user?.id}</div>
                      <div>Doctor ID: {selectedDoctorId}</div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Panel: Live Consultation Video and Chat Room */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Live Digital Room</h3>
              
              <div className="card flex-column gap-3" style={{ padding: "1rem", overflow: "hidden" }}>
                
                {/* Video Call Session - unlocked only if appointment is confirmed */}
                {hasConfirmedApt ? (
                  <VideoCall 
                    myPeerId={activeTab === "telehealth" ? `pat_${user.id}` : null} 
                    targetPeerId={activeDoctor ? `doc_${activeDoctor.id}` : null} 
                    targetName={activeDoctor?.name}
                  />
                ) : (
                  <div 
                    style={{
                      backgroundColor: "#1e293b",
                      height: "140px",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                      padding: "1rem",
                      textAlign: "center"
                    }}
                  >
                    <Video size={24} style={{ marginBottom: "8px", color: "var(--text-muted)" }} />
                    <p style={{ fontSize: "0.85rem", margin: 0, fontWeight: "600" }}>Video Consultation Locked</p>
                    <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px", lineHeight: 1.3 }}>
                      {activeApt?.status === "Paid" 
                        ? `Payment of ${activeDoctor?.consultationFee || activeDoctor?.fee || "$50"} received successfully! Awaiting provider's acceptance to start the consultation.` 
                        : activeApt 
                        ? "Awaiting confirmation from the medical provider." 
                        : "Please schedule an appointment to unlock video consultation."}
                    </p>
                  </div>
                )}

                {/* Mock Chat Feed Panel */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }} className="flex-column gap-2">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: "600" }}>Secured Messaging</span>
                  
                  <div style={{ height: "120px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem" }} className="flex-column gap-2">
                    {chatMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          alignSelf: msg.sender === "patient" ? "flex-end" : "flex-start",
                          backgroundColor: msg.sender === "patient" ? "var(--primary-light)" : "var(--bg-tertiary)",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "var(--radius-md)",
                          maxWidth: "85%",
                          fontSize: "0.75rem"
                        }}
                      >
                        <p style={{ margin: 0, color: "var(--text-primary)" }}>{msg.text}</p>
                        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", float: "right", marginTop: "2px" }}>{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type a message..." 
                      style={{ fontSize: "0.75rem", padding: "0.4rem" }}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: "0.4rem" }} title="Send Message">
                      <Send size={12} />
                    </button>
                  </form>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* Secure Mock Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
              🔒 Secure Consultation Payment
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 1.25rem 0" }}>
              Verify details and complete the mock payment process to submit your booking request to the doctor.
            </p>

            <div className="card" style={{ padding: "0.75rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span className="text-secondary-color">Practitioner:</span>
                <strong>{activeDoctor?.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span className="text-secondary-color">Date & Time:</span>
                <strong>{bookingDate} at {bookingSlot}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-color)", paddingTop: "0.4rem", marginTop: "0.4rem" }}>
                <span className="text-secondary-color">Consultation Fee:</span>
                <strong style={{ color: "var(--primary)", fontSize: "1rem" }}>{activeDoctor?.consultationFee || activeDoctor?.fee || "$50"}</strong>
              </div>
            </div>

            {isProcessingPayment ? (
              <div className="flex-column flex-center text-center" style={{ padding: "2rem 1rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTop: "3px solid var(--primary)", animation: "spin 1s linear infinite" }} />
                <h4 style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>Processing secure payment...</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Verifying mock transactions with banking gateway.</p>
              </div>
            ) : (
              <div className="flex-column gap-3">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "0.75rem" }} htmlFor="card-holder">Cardholder Name</label>
                  <input
                    type="text"
                    id="card-holder"
                    className="form-input"
                    style={{ fontSize: "0.8rem", padding: "0.45rem" }}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "0.75rem" }} htmlFor="card-number">Card Number</label>
                  <input
                    type="text"
                    id="card-number"
                    className="form-input"
                    style={{ fontSize: "0.8rem", padding: "0.45rem" }}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 1111 1111 1111"
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "0.75rem" }} htmlFor="card-exp">Expiry Date</label>
                    <input
                      type="text"
                      id="card-exp"
                      className="form-input"
                      style={{ fontSize: "0.8rem", padding: "0.45rem" }}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: "0.75rem" }} htmlFor="card-cvv">CVV</label>
                    <input
                      type="password"
                      id="card-cvv"
                      className="form-input"
                      style={{ fontSize: "0.8rem", padding: "0.45rem" }}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: "0.5rem" }} onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" style={{ padding: "0.5rem" }} onClick={handleConfirmPayment}>
                    Pay & Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDoctors;
