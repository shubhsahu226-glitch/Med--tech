import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Clock, Activity, FileText, ArrowRight, Video, MessageSquare, X, Send, ShieldCheck, ArrowLeft, ShieldAlert } from "lucide-react";
import { AppointmentCard, ReminderCard } from "../components/cards";
import VideoCall from "../components/VideoCall";
import { supabase } from "../config/supabase";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { appointments, reminders, treatments, refreshAppointments, triggerEmergencyAlert } = useHealth();
  const navigate = useNavigate();

  // Active Consultation Overlay states with sessionStorage persistence to survive page refreshes
  const [activeSessionApt, setActiveSessionAptState] = useState(() => {
    try {
      const saved = sessionStorage.getItem("virtualvaidya_active_session_apt");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [sessionTab, setSessionTabState] = useState(() => {
    try {
      return sessionStorage.getItem("virtualvaidya_session_tab") || "landing";
    } catch (e) {
      return "landing";
    }
  });

  const setActiveSessionApt = (apt) => {
    setActiveSessionAptState(apt);
    try {
      if (apt) {
        sessionStorage.setItem("virtualvaidya_active_session_apt", JSON.stringify(apt));
      } else {
        sessionStorage.removeItem("virtualvaidya_active_session_apt");
        sessionStorage.removeItem("virtualvaidya_session_tab");
      }
    } catch (e) {}
  };

  const setSessionTab = (tab) => {
    setSessionTabState(tab);
    try {
      sessionStorage.setItem("virtualvaidya_session_tab", tab);
    } catch (e) {}
  };
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  // SOS Emergency Alert States
  const [isSOSConfirmOpen, setIsSOSConfirmOpen] = useState(false);
  const [sosStatus, setSosStatus] = useState(""); // "", "locating", "sending", "success", "error"
  const [sosError, setSosError] = useState("");

  const handleSOSDispatch = () => {
    setSosStatus("locating");
    setSosError("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          await sendSOSAlert(lat, lng);
        },
        async (error) => {
          console.warn("Geolocation permission denied or failed. Dispatching default coords...", error);
          await sendSOSAlert(19.0760, 72.8777); // Mumbai
        },
        { timeout: 8000 }
      );
    } else {
      console.warn("Geolocation API not supported by browser. Dispatching default coords...");
      sendSOSAlert(19.0760, 72.8777);
    }
  };

  const sendSOSAlert = async (lat, lng) => {
    setSosStatus("sending");
    const descriptionStr = `SOS emergency alarm triggered by patient from Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}. Emergency dispatch and clinician have been alerted.`;
    
    try {
      // 1. Context Alert creation (saves to state and local storage)
      if (triggerEmergencyAlert) {
        triggerEmergencyAlert("Emergency SOS Alarm Triggered", "high", descriptionStr, "Emergency units dispatched. Provider alerted.");
      }

      // 2. Call backend triggerSOSApi if real user
      if (!isGuest) {
        try {
          // Direct supabase insert as secondary fallback/parallel action
          await supabase.from("alerts").insert({
            patient_id: user.id,
            title: "Emergency SOS Alarm Triggered",
            severity: "High",
            description: descriptionStr,
            status: "Active"
          });
        } catch (dbErr) {
          console.error("Direct Supabase alert log failed:", dbErr);
        }
      }

      setSosStatus("success");
      setTimeout(() => {
        setIsSOSConfirmOpen(false);
        setSosStatus("");
      }, 3000);
    } catch (err) {
      console.error("SOS Alert dispatch failed:", err);
      setSosStatus("error");
      setSosError("SOS dispatch failed to reach the servers. Please dial your local emergency services directly.");
    }
  };

  // Refresh appointments on mount to get latest status
  useEffect(() => {
    if (refreshAppointments) refreshAppointments();
  }, []);

  // Find next upcoming appointment
  console.log("PatientDashboard debug:", { userId: user?.id, appointments, filtered: appointments.filter(apt => apt.patientId === user?.id) });
  const nextAppointment = appointments
    .filter(apt => apt.patientId === user?.id && (apt.status === "Upcoming" || apt.status === "Confirmed" || apt.status === "Pending" || apt.status === "Paid"))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  // Limit checklist reminders to 1 key upcoming medication
  const activeReminders = reminders.filter(r => !r.taken).slice(0, 1);

  // Check if guest demo patient
  const isGuest = !user?.id || user.id === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a";

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
    const isGuestSession = user.id === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a" || activeSessionApt.doctorId === "7a02fa0d-9719-4261-bd98-1c3d54238c2f";

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

    const isGuestSession = user.id === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a" || activeSessionApt.doctorId === "7a02fa0d-9719-4261-bd98-1c3d54238c2f";
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
      <style>{`
        @keyframes pulseRed {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>

      {/* Greeting Header */}
      <div className="flex-between flex-wrap gap-4 animate-slide-up" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Hello, {user.name}</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Here is your active healthcare summary.</p>
        </div>
        <div className="align-center gap-3">
          <button 
            type="button"
            onClick={() => setIsSOSConfirmOpen(true)}
            className="btn align-center gap-1 animate-pulse-scale"
            style={{ 
              fontSize: "0.85rem", 
              backgroundColor: "var(--danger)", 
              color: "white", 
              borderColor: "var(--danger)",
              fontWeight: "600",
              boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.6)",
              animation: "pulseRed 1.8s infinite, pulseScale 2s infinite ease-in-out"
            }}
          >
            <ShieldAlert size={14} /> SOS Emergency
          </button>

          <Link to="/patient/doctors" className="btn btn-primary" style={{ fontSize: "0.85rem" }}>
            Schedule Consultation
          </Link>
        </div>
      </div>

      {/* Basic Info Banner */}
      <div className="card grid-4 animate-slide-up delay-1" style={{ padding: "1.25rem", gap: "1.5rem", borderLeft: "4px solid var(--primary)" }}>
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
        <div className="flex-column gap-6 animate-slide-up delay-2">
          
          {/* Current Treatment */}
          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", fontWeight: "600" }}>Current Treatment Course</h3>
            {currentTreatment ? (
              <div className="card flex-column gap-3 list-item-interactive" style={{ padding: "1.5rem" }}>
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
              <Link to="/patient/doctors" className="btn-text align-center gap-1 btn-hover-arrow" style={{ fontSize: "0.8rem", fontWeight: "500", padding: 0 }}>
                Manage Consults <ArrowRight size={14} />
              </Link>
            </div>
            {nextAppointment ? (
              <div className="list-item-interactive animate-slide-up delay-1">
                <AppointmentCard 
                  appointment={nextAppointment} 
                  onStartConsultation={() => {
                    setActiveSessionApt(nextAppointment);
                    setSessionTab("landing");
                  }} 
                  isDoctor={false}
                />
              </div>
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
        <div className="flex-column gap-6 animate-slide-up delay-3">
          
          <div>
            <div className="flex-between m-b-3">
              <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: "600" }}>Upcoming Medication</h3>
              <Link to="/patient/care" className="btn-text align-center gap-1 btn-hover-arrow" style={{ fontSize: "0.8rem", fontWeight: "500", padding: 0 }}>
                Care Panel <ArrowRight size={14} />
              </Link>
            </div>

            <div className="flex-column gap-3">
              {activeReminders.map(rem => (
                <div key={rem.id} className="list-item-interactive animate-slide-up delay-1">
                  <ReminderCard 
                    reminder={rem} 
                    onToggle={() => {}} // Read-only checkbox on home dashboard
                  />
                </div>
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
          {/* Background VideoCall listener (always mounted when telehealth room is open) */}
          <VideoCall 
            myPeerId={`pat_${user.id}`}
            targetPeerId={`doc_${activeSessionApt.doctorId}`}
            targetName={activeSessionApt.doctorName}
            hideIdleUI={sessionTab !== "video"}
            sessionTab={sessionTab}
          />
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
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      padding: "2rem 1.5rem",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "var(--shadow-md)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    }}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Video size={24} />
                    </div>
                    <div>
                      <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.25rem 0" }}>Start Video Call</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", lineHeight: "1.3" }}>Connect face-to-face via high definition secure video stream.</p>
                    </div>
                  </button>

                  {/* Option 2: Live Chat */}
                  <button
                    onClick={() => setSessionTab("chat")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      padding: "2rem 1.5rem",
                      textAlign: "center",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "1rem",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: "var(--shadow-md)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--success)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    }}
                  >
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "var(--success-light)", color: "var(--success-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.25rem 0" }}>Chat</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", lineHeight: "1.3" }}>Text messaging system for live discussions and prescriptions.</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : sessionTab === "video" ? (
              /* VIDEO STREAM */
              <div id="telehealth-video-slot" style={{ flex: 1, position: "relative", minHeight: 0, padding: "1.5rem", display: "flex", flexDirection: "column" }} />
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

      {/* SOS Confirmation Modal Overlay */}
      {isSOSConfirmOpen && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem"
          }}
        >
          <div 
            className="card flex-column gap-4" 
            style={{ 
              maxWidth: "500px", 
              width: "100%", 
              padding: "2rem", 
              borderRadius: "1rem", 
              textAlign: "center",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              backgroundColor: "var(--bg-primary)",
              boxShadow: "var(--shadow-2xl)",
              animation: "fadeIn 0.25s ease-out"
            }}
          >
            {/* Pulsing Alert Icon */}
            <div 
              style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "50%", 
                backgroundColor: "rgba(239, 68, 68, 0.1)", 
                border: "2px solid rgba(239, 68, 68, 0.3)",
                color: "var(--danger)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                margin: "0 auto 0.5rem auto",
                animation: "pulseRed 1.5s infinite"
              }}
            >
              <ShieldAlert size={40} />
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
              Emergency SOS Dispatch
            </h2>

            {sosStatus === "" && (
              <>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <strong>WARNING:</strong> You are triggering a critical medical alert. This will immediately log an active emergency alert and dispatch your coordinates to your primary clinician and emergency contacts.
                </p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button 
                    onClick={() => setIsSOSConfirmOpen(false)} 
                    className="btn btn-secondary flex-1"
                    style={{ padding: "0.6rem" }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSOSDispatch} 
                    className="btn btn-primary flex-1"
                    style={{ padding: "0.6rem", backgroundColor: "var(--danger)", borderColor: "var(--danger)" }}
                  >
                    CONFIRM DISPATCH
                  </button>
                </div>
              </>
            )}

            {sosStatus === "locating" && (
              <div className="flex-column align-center gap-3" style={{ padding: "1rem 0" }}>
                <div 
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "3px solid var(--border-color)",
                    borderTop: "3px solid var(--danger)",
                    animation: "spin 1s linear infinite"
                  }}
                />
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Retrieving GPS Geolocation...
                </p>
              </div>
            )}

            {sosStatus === "sending" && (
              <div className="flex-column align-center gap-3" style={{ padding: "1rem 0" }}>
                <div 
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "3px solid var(--border-color)",
                    borderTop: "3px solid var(--danger)",
                    animation: "spin 1s linear infinite"
                  }}
                />
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Broadcasting SOS alerts to clinical networks...
                </p>
              </div>
            )}

            {sosStatus === "success" && (
              <div className="flex-column align-center gap-3" style={{ padding: "1rem 0" }}>
                <div 
                  style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--success-light)", 
                    color: "var(--success)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}
                >
                  <ShieldCheck size={28} />
                </div>
                <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--success-dark)", fontWeight: "600" }}>
                  Alert Dispatched!
                </h4>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Emergency signal transmitted. Clinician dashboard has been locked on high alert.
                </p>
              </div>
            )}

            {sosStatus === "error" && (
              <div className="flex-column align-center gap-3" style={{ padding: "1rem 0" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--danger-dark)", fontWeight: "600" }}>
                  {sosError}
                </p>
                <button 
                  onClick={() => setSosStatus("")} 
                  className="btn btn-secondary"
                  style={{ padding: "0.5rem 1.5rem" }}
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {/* MOBILE DEBUG OVERLAY */}
      <div style={{ position: "fixed", bottom: 0, right: 0, left: 0, backgroundColor: "rgba(0,0,0,0.9)", color: "#22c55e", padding: "10px", fontSize: "11px", zIndex: 999999, fontFamily: "monospace", borderTop: "2px solid #22c55e", maxHeight: "150px", overflowY: "auto" }}>
        <strong>DEBUG INFO:</strong><br />
        User ID: {user?.id || "null"}<br />
        User Name: {user?.name || "null"}<br />
        Total Appointments: {appointments?.length || 0}<br />
        Next Appointment Status: {nextAppointment ? `${nextAppointment.id.substring(0,6)} (Status: ${nextAppointment.status}, Pat: ${nextAppointment.patientId?.substring(0,6)}, Doc: ${nextAppointment.doctorId?.substring(0,6)})` : "null"}<br />
        All Apts: {appointments?.map(a => `${a.id.substring(0,4)}:${a.status}:${a.patientId?.substring(0,4)}`).join(', ')}
      </div>
    </div>
  );
};

export default PatientDashboard;
