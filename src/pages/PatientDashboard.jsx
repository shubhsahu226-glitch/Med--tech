import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Clock, Activity, FileText, ArrowRight, Video, MessageSquare, X, Send, ShieldCheck, ArrowLeft } from "lucide-react";
import { AppointmentCard, ReminderCard } from "../components/cards";
import VideoCall from "../components/VideoCall";
import { supabase } from "../config/supabase";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reminders, treatments, refreshAppointments } = useHealth();
  const navigate = useNavigate();

  // Active Consultation Overlay states
  const [activeSessionApt, setActiveSessionApt] = useState(null);
  const [sessionTab, setSessionTab] = useState("landing"); // landing, video, or chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sessionTab]);

  // Sync / Fetch Chat Messages when Session Hub Modal is open
  useEffect(() => {
    if (!activeSessionApt || !user?.id) return;
    const isGuestSession = user.id === "pat1" || activeSessionApt.doctorId === "doc1";

    const fetchMessages = async () => {
      if (isGuestSession) {
        try {
          const key = `virtualvaidya_chat_${user.id}_${activeSessionApt.doctorId}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {
          console.warn("Failed to load local messages:", err);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("appointment_id", activeSessionApt.id)
          .order("created_at", { ascending: true });

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

    if (isGuestSession) {
      const interval = setInterval(() => {
        try {
          const key = `virtualvaidya_chat_${user.id}_${activeSessionApt.doctorId}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {}
      }, 1500);
      return () => clearInterval(interval);
    } else {
      const channel = supabase
        .channel(`dashboard_chat_room_${activeSessionApt.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `appointment_id=eq.${activeSessionApt.id}`
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
    }
  }, [activeSessionApt, user?.id]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSessionApt || !user?.id) return;

    const msgText = newMessage;
    setNewMessage("");

    const tempId = `temp_${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgObj = { id: tempId, sender: "patient", text: msgText, time: timeString };

    setChatMessages(prev => [...prev, newMsgObj]);

    const isGuestSession = user.id === "pat1" || activeSessionApt.doctorId === "doc1";
    if (isGuestSession) {
      try {
        const key = `virtualvaidya_chat_${user.id}_${activeSessionApt.doctorId}`;
        const msgs = JSON.parse(localStorage.getItem(key) || "[]");
        msgs.push(newMsgObj);
        localStorage.setItem(key, JSON.stringify(msgs));
      } catch (err) {
        console.warn("Failed to save local message:", err);
      }
      return;
    }

    const { data, error } = await supabase.from("messages").insert([{
      appointment_id: activeSessionApt.id,
      sender_id: user.id,
      sender_role: "patient",
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
                onStartConsultation={() => {
                  setActiveSessionApt(nextAppointment);
                  setSessionTab("landing");
                }} 
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

      {/* Telehealth Session Hub Modal (Inline Overlay on Same Page - Single Tab View) */}
      {activeSessionApt && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "#0f172a",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "1.25rem 1.5rem", 
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "#1e293b"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {sessionTab !== "landing" && (
                <button 
                  onClick={() => setSessionTab("landing")}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    padding: "0.4rem 0.6rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    color: "#e2e8f0",
                    fontSize: "0.75rem",
                    fontWeight: "500",
                    marginRight: "0.5rem"
                  }}
                >
                  <ArrowLeft size={14} /> Options
                </button>
              )}
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#ef4444", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {activeSessionApt.doctorName ? activeSessionApt.doctorName.charAt(0) : "D"}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "white" }}>{activeSessionApt.doctorName}</h4>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={12} color="#10b981" /> Secure Telehealth consultation
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveSessionApt(null)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
              title="Close Room"
            >
              <X size={22} />
            </button>
          </div>

          {/* Sub Navigation Tabs (Visible only when in active Video/Chat session) */}
          {sessionTab !== "landing" && (
            <div style={{ display: "flex", backgroundColor: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setSessionTab("video")}
                style={{
                  flex: 1,
                  padding: "1rem",
                  background: "none",
                  border: "none",
                  color: sessionTab === "video" ? "#ef4444" : "#94a3b8",
                  borderBottom: sessionTab === "video" ? "3px solid #ef4444" : "3px solid transparent",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <Video size={16} /> Start Video Call
              </button>
              <button
                onClick={() => setSessionTab("chat")}
                style={{
                  flex: 1,
                  padding: "1rem",
                  background: "none",
                  border: "none",
                  color: sessionTab === "chat" ? "#ef4444" : "#94a3b8",
                  borderBottom: sessionTab === "chat" ? "3px solid #ef4444" : "3px solid transparent",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <MessageSquare size={16} /> Chat
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {sessionTab === "landing" ? (
              /* CHOICE SCREEN (LANDING) */
              <div 
                style={{ 
                  flex: 1, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  padding: "2rem",
                  backgroundColor: "#0f172a",
                  overflowY: "auto"
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "2rem", maxWidth: "480px" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
                    <ShieldCheck size={36} />
                  </div>
                  <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: "700", margin: "0 0 0.5rem 0" }}>Start Consultation Session</h2>
                  <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.4" }}>
                    You are connecting with <strong>{activeSessionApt.doctorName}</strong> ({activeSessionApt.doctorSpecialty}). Choose your consultation channel below:
                  </p>
                </div>

                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
                    gap: "1.5rem", 
                    width: "100%", 
                    maxWidth: "600px" 
                  }}
                >
                  {/* Option 1: Video Call */}
                  <button
                    onClick={() => setSessionTab("video")}
                    style={{
                      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "2rem 1.5rem",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Video size={24} />
                    </div>
                    <div>
                      <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.25rem 0" }}>Start Video Call</h3>
                      <p style={{ color: "#64748b", fontSize: "0.75rem", lineHeight: "1.3" }}>Connect face-to-face via high definition secure video stream.</p>
                    </div>
                  </button>

                  {/* Option 2: Live Chat */}
                  <button
                    onClick={() => setSessionTab("chat")}
                    style={{
                      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "2rem 1.5rem",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#10b981";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h3 style={{ color: "white", fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.25rem 0" }}>Chat</h3>
                      <p style={{ color: "#64748b", fontSize: "0.75rem", lineHeight: "1.3" }}>Text messaging system for live discussions and prescriptions.</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : sessionTab === "video" ? (
              /* VIDEO STREAM */
              <div style={{ flex: 1, position: "relative", minHeight: 0, padding: "1.5rem" }}>
                <VideoCall 
                  myPeerId={`pat_${user.id}`}
                  targetPeerId={`doc_${activeSessionApt.doctorId}`}
                  targetName={activeSessionApt.doctorName}
                />
              </div>
            ) : (
              /* SECURED CHAT */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0f172a" }}>
                
                {/* Chat Feed */}
                <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {chatMessages.map((msg, i) => {
                    const isMe = msg.sender === "patient";
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          backgroundColor: isMe ? "#ef4444" : "#1e293b",
                          color: "white",
                          padding: "0.6rem 0.9rem",
                          borderRadius: "12px",
                          maxWidth: "80%",
                          fontSize: "0.85rem",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                        }}
                      >
                        <p style={{ margin: 0, lineHeight: 1.4, wordBreak: "break-word" }}>{msg.text}</p>
                        <span style={{ fontSize: "0.6rem", color: isMe ? "rgba(255,255,255,0.7)" : "#94a3b8", float: "right", marginTop: "4px" }}>
                          {msg.time}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChatMessage} style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.5rem", backgroundColor: "#1e293b" }}>
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    style={{ fontSize: "0.85rem", padding: "0.55rem 0.75rem", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white", flex: 1 }}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: "0.55rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ef4444", borderColor: "#ef4444" }}>
                    <Send size={14} />
                  </button>
                </form>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
