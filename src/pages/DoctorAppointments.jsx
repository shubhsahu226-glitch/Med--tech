import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Clock, Video, Send, Save, PhoneOff, Check, X, ShieldAlert, ShieldCheck, MessageSquare, ArrowLeft } from "lucide-react";
import VideoCall from "../components/VideoCall";

const generateTempId = () => `temp_${Date.now()}`;
const getCurrentTimeString = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const DoctorAppointments = () => {
  const { user } = useAuth();
  const { appointments, addTreatmentNotes, updateAppointmentStatus, refreshAppointments } = useHealth();
  const navigate = useNavigate();

  const handleExitRoom = () => {
    setActiveTab("list");
    setSelectedAptId("");
    navigate("/doctor/appointments", { replace: true });
  };

  // Tab State: list, consult with sessionStorage persistence to survive page refreshes
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return sessionStorage.getItem("virtualvaidya_doc_active_tab") || "list";
    } catch (e) {
      return "list";
    }
  });

  // Selection states
  const [selectedAptId, setSelectedAptIdState] = useState(() => {
    try {
      return sessionStorage.getItem("virtualvaidya_doc_selected_apt_id") || "";
    } catch (e) {
      return "";
    }
  });
  const [sessionTab, setSessionTabState] = useState(() => {
    try {
      return sessionStorage.getItem("virtualvaidya_doc_session_tab") || "landing";
    } catch (e) {
      return "landing";
    }
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem("virtualvaidya_doc_active_tab", tab);
    } catch (e) {}
  };

  const setSelectedAptId = (aptId) => {
    setSelectedAptIdState(aptId);
    try {
      if (aptId) {
        sessionStorage.setItem("virtualvaidya_doc_selected_apt_id", aptId);
      } else {
        sessionStorage.removeItem("virtualvaidya_doc_selected_apt_id");
        sessionStorage.removeItem("virtualvaidya_doc_session_tab");
      }
    } catch (e) {}
  };

  const setSessionTab = (tab) => {
    setSessionTabState(tab);
    try {
      sessionStorage.setItem("virtualvaidya_doc_session_tab", tab);
    } catch (e) {}
  };

  // Refresh appointments on mount to get latest status and check for consult room redirection
  useEffect(() => {
    if (refreshAppointments) refreshAppointments();
    
    const params = new URLSearchParams(window.location.search);
    const consultAptId = params.get("consult");
    if (consultAptId) {
      setSelectedAptId(consultAptId);
      setActiveTab("consult");
    }
  }, [refreshAppointments]);

  // Consultation Room States
  const [notesDiagnosis, setNotesDiagnosis] = useState("");
  const [notesPrescription, setNotesPrescription] = useState("");
  const [notesDetails, setNotesDetails] = useState("");
  const [notesFollowUp, setNotesFollowUp] = useState("");
  const [notesStatus, setNotesStatus] = useState("");
  
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sessionTab]);

  const isGuestUser = !user?.id || user.id === "7a02fa0d-9719-4261-bd98-1c3d54238c2f";

  // Filter doctor appointments
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user.id || (isGuestUser && apt.doctorId === "7a02fa0d-9719-4261-bd98-1c3d54238c2f"));
  
  // Group appointments
  const pendingApts = doctorAppointments.filter(apt => apt.status === "Pending" || apt.status === "Paid");
  const confirmedApts = doctorAppointments.filter(apt => apt.status === "Upcoming" || apt.status === "Confirmed");

  const activeApt = selectedAptId ? (doctorAppointments.find(a => a.id === selectedAptId) || null) : null;
  const selectedPatient = activeApt ? {
    id: activeApt.patientId,
    name: activeApt.patientName || "Patient"
  } : null;

  // Handle Accept Appointment
  const handleAcceptAppointment = async (aptId) => {
    if (isGuestUser) {
      // Mock logic: updates status in health context local state
      updateAppointmentStatus(aptId, "Confirmed");
      return;
    }
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Confirmed' })
        .eq('id', aptId);
      if (error) throw error;
      updateAppointmentStatus(aptId, "Confirmed");
    } catch (err) {
      console.error("Error confirming appointment:", err);
    }
  };

  // Handle Reject/Cancel Appointment
  const handleRejectAppointment = async (aptId) => {
    if (isGuestUser) {
      updateAppointmentStatus(aptId, "Rejected");
      return;
    }
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'Rejected' })
        .eq('id', aptId);
      if (error) throw error;
      updateAppointmentStatus(aptId, "Rejected");
    } catch (err) {
      console.error("Error cancelling appointment:", err);
    }
  };

  // Handle consultation form submit
  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!notesDiagnosis || !notesDetails) return;

    if (isGuestUser) {
      addTreatmentNotes(
        selectedPatient.id,
        user.name,
        notesDiagnosis,
        notesDetails,
        notesPrescription,
        notesFollowUp
      );
      updateAppointmentStatus(selectedAptId, "Completed");
      
      setNotesStatus("Consultation completed and logged to local storage successfully!");
      setNotesDiagnosis("");
      setNotesPrescription("");
      setNotesDetails("");
      setNotesFollowUp("");
      setTimeout(() => {
        setNotesStatus("");
        handleExitRoom();
      }, 2000);
      return;
    }

    try {
      // 1. Insert prescription into treatments table
      const { error: treatErr } = await supabase.from('treatments').insert([{
        patient_id: selectedPatient.id,
        doctor_id: user.id,
        appointment_id: selectedAptId,
        diagnosis: notesDiagnosis,
        notes: notesDetails,
        prescription: notesPrescription || "None Prescribed",
        follow_up_date: notesFollowUp || null
      }]);

      if (treatErr) throw treatErr;

      // 2. Mark appointment as Completed in Supabase
      const { error: aptErr } = await supabase
        .from('appointments')
        .update({ status: 'Completed' })
        .eq('id', selectedAptId);

      if (aptErr) throw aptErr;
      updateAppointmentStatus(selectedAptId, "Completed");

      setNotesStatus("Consultation details saved to database successfully!");
      setNotesDiagnosis("");
      setNotesPrescription("");
      setNotesDetails("");
      setNotesFollowUp("");
      
      setTimeout(() => {
        setNotesStatus("");
        handleExitRoom();
      }, 2000);
    } catch (err) {
      console.error("Failed to complete consultation:", err);
      setNotesStatus("Error saving consultation details.");
    }
  };

  // Chat Integration with Supabase
  const isGuestMode = !user?.id || user.id === "7a02fa0d-9719-4261-bd98-1c3d54238c2f" || activeApt?.patientId === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a";

  useEffect(() => {
    if (!activeApt?.patientId || !user?.id || activeTab !== "consult" || (!isGuestMode && !activeApt?.id)) return;
    
    // Fetch initial messages
    const fetchMessages = async () => {
      if (isGuestMode) {
        try {
          const key = `virtualvaidya_chat_${activeApt.patientId}_${user.id}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {
          console.warn("Failed to load local messages:", err);
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
          const key = `virtualvaidya_chat_${activeApt.patientId}_${user.id}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {
          console.debug("Failed to retrieve chat updates in poll", err);
        }
      }, 1500);
      return () => clearInterval(interval);
    }

    // Subscribe to new messages for this doctor
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
  }, [activeApt?.patientId, user?.id, activeTab, isGuestMode, activeApt?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeApt?.patientId || !user?.id) return;

    const msgText = newMessage;
    setNewMessage("");

    const tempId = generateTempId();
    const timeString = getCurrentTimeString();
    const newMsgObj = { id: tempId, sender: "doctor", text: msgText, time: timeString };
    
    setChatMessages(prev => [...prev, newMsgObj]);

    if (isGuestMode) {
      try {
        const key = `virtualvaidya_chat_${activeApt.patientId}_${user.id}`;
        const msgs = JSON.parse(localStorage.getItem(key) || "[]");
        msgs.push(newMsgObj);
        localStorage.setItem(key, JSON.stringify(msgs));
      } catch (err) {
        console.warn("Failed to save local message:", err);
      }
      return;
    }

    const { data, error } = await supabase.from('messages').insert([{
      appointment_id: activeApt.id,
      sender_id: user.id,
      sender_role: 'doctor',
      text: msgText
    }]).select();

    if (data && !error) {
      setChatMessages(prev => prev.map(m => m.id === tempId ? {
        id: data[0].id, sender: data[0].sender_role, text: data[0].text, time: new Date(data[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : m));
    }
  };

  return (
    <div className="flex-column gap-6" style={{ minHeight: "80vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Manage Clinic Consultations</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Acknowledge session booking requests, join digital rooms, and chart diagnostic prescriptions.
        </p>
      </div>

      {activeTab === "list" ? (
        <div className="grid-2" style={{ gap: "2.5rem" }}>
          
          {/* Active Consultation Schedule */}
          <div className="flex-column gap-4">
            <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "600" }}>Upcoming & Confirmed Sessions</h3>
            
            <div className="flex-column gap-3">
              {confirmedApts.map(apt => (
                <div key={apt.id} className="card flex-column gap-3" style={{ padding: "1.25rem" }}>
                  <div className="flex-between">
                    <div className="align-center gap-2">
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "0.8rem" }}>
                        {apt.patientName ? apt.patientName.charAt(0) : "P"}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600" }}>{apt.patientName}</h4>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Status: Confirmed</span>
                      </div>
                    </div>
                    <span className="badge badge-info" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", fontSize: "0.65rem" }}>
                      {apt.meetingType || "Video"} Session
                    </span>
                  </div>

                  <div className="align-center gap-4" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
                    <div className="align-center gap-1"><Calendar size={14} /> {apt.date}</div>
                    <div className="align-center gap-1"><Clock size={14} /> {apt.time}</div>
                  </div>

                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.25rem 0 0.5rem 0", fontStyle: "italic" }}>
                    Notes: "{apt.reason}"
                  </p>

                  <button 
                    onClick={() => {
                      setSelectedAptId(apt.id);
                      setActiveTab("consult");
                      setSessionTab("landing");
                    }}
                    className="btn btn-primary w-full align-center gap-2 justify-content-center"
                    style={{ padding: "0.5rem", fontSize: "0.8rem", fontWeight: "600" }}
                  >
                    <Video size={14} /> Start Consultation
                  </button>
                </div>
              ))}

              {confirmedApts.length === 0 && (
                <div className="card text-center" style={{ padding: "3rem 1.5rem" }}>
                  <Calendar size={28} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                  <p className="text-secondary-color" style={{ fontSize: "0.85rem", margin: 0 }}>No sessions scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending consultation Requests */}
          <div className="flex-column gap-4">
            <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "600" }}>Patient Booking Requests</h3>
            
            <div className="flex-column gap-3">
              {pendingApts.map(apt => (
                <div key={apt.id} className="card flex-column gap-3" style={{ padding: "1.25rem", borderLeft: apt.status === "Paid" ? "3px solid #22c55e" : "3px solid #d97706" }}>
                  <div className="flex-between">
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600" }}>{apt.patientName}</h4>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.15rem 0 0 0" }}>Wishes to consult for diagnostic review</p>
                    </div>
                    {apt.status === "Paid" ? (
                      <span className="badge" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e", fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", fontWeight: "600" }}>
                        Paid Request
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#b45309", fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                        Pending Request
                      </span>
                    )}
                  </div>

                  <div className="align-center gap-4" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
                    <div className="align-center gap-1"><Calendar size={14} /> {apt.date}</div>
                    <div className="align-center gap-1"><Clock size={14} /> {apt.time}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <button 
                      onClick={() => handleAcceptAppointment(apt.id)}
                      className="btn btn-primary align-center gap-1 justify-content-center" 
                      style={{ padding: "0.45rem", fontSize: "0.75rem", backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                    >
                      <Check size={14} /> Accept Request
                    </button>
                    <button 
                      onClick={() => handleRejectAppointment(apt.id)}
                      className="btn btn-secondary align-center gap-1 justify-content-center" 
                      style={{ padding: "0.45rem", fontSize: "0.75rem", borderColor: "#ef4444", color: "#ef4444" }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingApts.length === 0 && (
                <div className="card text-center" style={{ padding: "3rem 1.5rem" }}>
                  <ShieldAlert size={28} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                  <p className="text-secondary-color" style={{ fontSize: "0.85rem", margin: 0 }}>No pending appointment requests.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* CONSULTATION ROOM PLACEHOLDER */
        <div className="card text-center" style={{ padding: "4rem 2rem", maxWidth: "600px", margin: "2rem auto" }}>
          <h3 style={{ margin: 0 }}>Active session is open</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            The consultation room is currently open in fullscreen mode.
          </p>
          <button className="btn btn-secondary m-t-4" onClick={handleExitRoom}>
            Return to List
          </button>
        </div>
      )}

      {/* RENDER THE FULLSCREEN OVERLAY MODAL */}
      {activeTab === "consult" && activeApt && (
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
          {/* Background VideoCall listener */}
          <VideoCall 
            myPeerId={`doc_${user.id}`} 
            targetPeerId={`pat_${selectedPatient?.id}`} 
            targetName={selectedPatient?.name}
            hideIdleUI={sessionTab !== "video"}
            sessionTab={sessionTab}
            onCallEnded={() => setSessionTab("chat")}
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
                    marginRight: "0.5rem",
                    cursor: "pointer"
                  }}
                >
                  <ArrowLeft size={14} /> Options
                </button>
              )}
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {selectedPatient?.name ? selectedPatient.name.charAt(0) : "P"}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "white" }}>{selectedPatient?.name}</h4>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={12} color="#10b981" /> Secure Telehealth consultation
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={handleExitRoom}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
              title="Close Room"
            >
              <X size={22} />
            </button>
          </div>

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
                    You are connecting with <strong>{selectedPatient?.name}</strong>. Choose your consultation channel below:
                  </p>
                </div>

                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
                    gap: "1.5rem", 
                    width: "100%", 
                    maxWidth: "560px" 
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
            ) : (
              /* ACTIVE CONSULTATION WITH SPLIT LAYOUT */
              <div 
                style={{ 
                  flex: 1, 
                  display: "grid", 
                  gridTemplateColumns: "1.2fr 0.8fr", 
                  gap: "1.5rem", 
                  padding: "1.5rem", 
                  backgroundColor: "#0f172a",
                  overflow: "hidden"
                }}
              >
                {/* Left side: Video or Chat */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}>
                  {sessionTab === "video" ? (
                    <div id="telehealth-video-slot" style={{ flex: 1, minHeight: "300px", position: "relative", display: "flex", flexDirection: "column", borderRadius: "12px", overflow: "hidden" }} />
                  ) : (
                    /* SECURED CHAT */
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#1e293b", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      {/* Chat Header */}
                      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#1e293b" }}>
                        <MessageSquare size={16} color="#ef4444" />
                        <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "white" }}>Secured Consultation Chat</span>
                      </div>

                      {/* Chat Feed */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {chatMessages.map((msg, i) => {
                          const isMe = msg.sender === "doctor";
                          return (
                            <div 
                              key={i} 
                              style={{ 
                                alignSelf: isMe ? "flex-end" : "flex-start",
                                backgroundColor: isMe ? "#ef4444" : "#0f172a",
                                color: "white",
                                padding: "0.5rem 0.8rem",
                                borderRadius: "12px",
                                maxWidth: "80%",
                                fontSize: "0.8rem",
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
                      <form onSubmit={handleSendMessage} style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.5rem", backgroundColor: "#1e293b" }}>
                        <input 
                          type="text" 
                          placeholder="Type to send message..." 
                          style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white", flex: 1 }}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ef4444", borderColor: "#ef4444" }}>
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right side: Treatment Prescription Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", paddingRight: "0.25rem" }}>
                  <div className="card" style={{ padding: "1.5rem", backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "white" }}>
                    <h3 style={{ fontSize: "1rem", margin: "0 0 1.25rem 0", fontWeight: "600", color: "white" }}>Prescriptions & Charting Notes</h3>
                    
                    <form onSubmit={handleSaveConsultation} className="flex-column gap-3">
                      {notesStatus && (
                        <div style={{ padding: "0.75rem", background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", borderRadius: "var(--radius-md)", fontSize: "0.8rem", borderLeft: "3px solid #22c55e" }}>
                          {notesStatus}
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label" htmlFor="notes-diag" style={{ color: "#cbd5e1" }}>Diagnosis / Primary Issue</label>
                        <input 
                          type="text" 
                          id="notes-diag"
                          className="form-input" 
                          placeholder="e.g. Primary Hypertension"
                          style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                          value={notesDiagnosis}
                          onChange={(e) => setNotesDiagnosis(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="notes-presc" style={{ color: "#cbd5e1" }}>Prescriptions (Medication / Dosage)</label>
                        <input 
                          type="text" 
                          id="notes-presc"
                          className="form-input" 
                          placeholder="e.g. Metformin 500mg, once daily"
                          style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                          value={notesPrescription}
                          onChange={(e) => setNotesPrescription(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="notes-details" style={{ color: "#cbd5e1" }}>Clinical Chart Notes</label>
                        <textarea 
                          id="notes-details"
                          className="form-input" 
                          rows="4" 
                          placeholder="Enter detailed observations, symptom assessments..."
                          style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                          value={notesDetails}
                          onChange={(e) => setNotesDetails(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="notes-follow" style={{ color: "#cbd5e1" }}>Follow-up Action Date</label>
                        <input 
                          type="date" 
                          id="notes-follow"
                          className="form-input" 
                          style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                          value={notesFollowUp}
                          onChange={(e) => setNotesFollowUp(e.target.value)}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                        <button type="submit" className="btn btn-primary align-center gap-1 justify-content-center" style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}>
                          <Save size={14} /> Complete & Save
                        </button>
                        <button type="button" onClick={handleExitRoom} className="btn btn-secondary align-center gap-1 justify-content-center" style={{ borderColor: "#ef4444", color: "#ef4444", background: "none" }}>
                          <PhoneOff size={14} /> Exit Consult Room
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
