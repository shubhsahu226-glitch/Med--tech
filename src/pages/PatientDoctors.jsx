import React, { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  Search, MapPin, DollarSign, Calendar, Star, Video, MessageSquare, 
  Send, PhoneOff, Award, ChevronRight, CheckCircle2 
} from "lucide-react";
import { DoctorCard } from "../components/cards";

export const PatientDoctors = () => {
  const { user } = useAuth();
  const { doctors, appointments, addAppointment } = useHealth();
  const location = useLocation();

  // Tab State: search, telehealth
  const [activeTab, setActiveTab] = useState("search");

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const specialties = ["All", "Cardiologist", "Neurologist", "Pediatrician", "General Physician"];

  // Booking States
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [meetingType, setMeetingType] = useState("Video");
  const [reason, setReason] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");

  // Telehealth Consultation Room States
  const [chatMessages, setChatMessages] = useState([
    { sender: "doctor", text: "Hello! How can I assist you today?", time: "10:02 AM" }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [peerInstance, setPeerInstance] = useState(null);

  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize PeerJS
  useEffect(() => {
    if (activeTab === "telehealth" && !peerInstance) {
      const peer = new Peer(`pat_${user.id}`);
      
      peer.on("open", (id) => {
        console.log("Patient Peer initialized with ID:", id);
      });

      peer.on("call", (call) => {
        // Answer incoming call
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            call.answer(stream);
            setCallActive(true);
            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
          })
          .catch(err => console.error("Failed to get local stream", err));
      });

      setPeerInstance(peer);
    }
    
    return () => {
      if (peerInstance && activeTab !== "telehealth") {
        peerInstance.destroy();
        setPeerInstance(null);
        setCallActive(false);
      }
    };
  }, [activeTab, user.id]);

  const initiateCall = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCallActive(true);
        
        if (peerInstance && activeDoctor) {
          const call = peerInstance.call(`doc_${activeDoctor.id}`, stream);
          if (call) {
            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
          }
        }
      })
      .catch(err => console.error("Failed to get local stream", err));
  };

  const endCall = () => {
    setCallActive(false);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  // Sync pre-selected doctor if passed in route state
  useEffect(() => {
    if (location.state?.selectedDoctor) {
      setSelectedDoctorId(location.state.selectedDoctor.id);
      setActiveTab("telehealth");
    } else if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [location.state, doctors, selectedDoctorId]);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const patientApts = appointments.filter(apt => apt.patientId === user.id);

  // Filter Doctors list
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All" || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookingDate || !bookingSlot || !reason) return;

    addAppointment({
      patientId: user.id,
      patientName: user.name,
      doctorId: selectedDoctorId,
      doctorName: activeDoctor.name,
      doctorSpecialty: activeDoctor.specialty,
      date: bookingDate,
      time: bookingSlot,
      reason,
      meetingType
    });

    setBookingStatus("Booking confirmed!");
    setReason("");
    setBookingDate("");
    setBookingSlot("");
    setTimeout(() => setBookingStatus(""), 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: "patient", text: newMessage, time: timeString }]);
    setNewMessage("");

    // Simple reply simulation
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: "doctor",
        text: "I am reviewing your symptoms details in the chart log now.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
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

            {/* Doctors list (1-2 items only) */}
            <div className="grid-3" style={{ gap: "1.5rem" }}>
              {filteredDoctors.slice(0, 2).map(doc => (
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
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Schedule Consult Slot</h3>
              
              <div className="card">
                {bookingStatus ? (
                  <div className="flex-column flex-center text-center" style={{ padding: "2rem 1rem" }}>
                    <CheckCircle2 size={36} style={{ color: "var(--success)" }} />
                    <h4 style={{ marginTop: "1rem", color: "var(--success-dark)" }}>{bookingStatus}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Your consultation slot has been added.</p>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="flex-column gap-3">
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

                    <button type="submit" className="btn btn-primary w-full m-t-2">
                      Confirm Appointment
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right Panel: Live Consultation Video and Chat Room */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Live Digital Room</h3>
              
              <div className="card flex-column gap-3" style={{ padding: "1rem", overflow: "hidden" }}>
                
                {/* Mock Video Stream Panel */}
                <div 
                  style={{
                    backgroundColor: "#1e293b",
                    height: "140px",
                    borderRadius: "var(--radius-md)",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {callActive ? (
                    <>
                      <video 
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#000" }}
                      />
                      <div style={{ position: "absolute", bottom: "8px", left: "8px", color: "white", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "0.2rem 0.5rem", borderRadius: "3px" }}>
                        {activeDoctor.name} (Live Video)
                      </div>
                      
                      {/* Local PIP Video */}
                      <div 
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          width: "36px",
                          height: "48px",
                          backgroundColor: "#475569",
                          borderRadius: "3px",
                          border: "1px solid white",
                          overflow: "hidden"
                        }}
                      >
                        <video 
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      
                      <button 
                        onClick={endCall}
                        className="btn btn-danger" 
                        style={{ position: "absolute", top: "8px", right: "8px", padding: "0.3rem", borderRadius: "50%", width: "26px", height: "26px" }}
                        title="Disconnect Call"
                      >
                        <PhoneOff size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="text-center" style={{ color: "#94a3b8" }}>
                      <Video size={20} />
                      <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>Video stream offline</p>
                      <button onClick={initiateCall} className="btn btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", marginTop: "0.5rem" }}>
                        Connect Video Feed
                      </button>
                    </div>
                  )}
                </div>

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
    </div>
  );
};

export default PatientDoctors;
