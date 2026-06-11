import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Calendar, Clock, Video, Send, Save, PhoneOff, Check, X, ShieldAlert, MessageSquare } from "lucide-react";
import VideoCall from "../components/VideoCall";

const generateTempId = () => `temp_${Date.now()}`;
const getCurrentTimeString = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const DoctorAppointments = () => {
  const { user } = useAuth();
  const { appointments, addTreatmentNotes, updateAppointmentStatus, refreshAppointments } = useHealth();

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

  const isGuestUser = !user?.id || user.id === "doc1";

  // Filter doctor appointments
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user.id || (isGuestUser && apt.doctorId === "doc1"));
  
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
        setActiveTab("list");
        setSelectedAptId("");
      }, 2000);
      return;
    }

    try {
      // 1. Insert prescription into treatments table
      const { error: treatErr } = await supabase.from('treatments').insert([{
        patient_id: selectedPatient.id,
        doctor_id: user.id,
        doctor_name: user.name,
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
        setActiveTab("list");
        setSelectedAptId("");
      }, 2000);
    } catch (err) {
      console.error("Failed to complete consultation:", err);
      setNotesStatus("Error saving consultation details.");
    }
  };

  // Chat Integration with Supabase
  const isGuestMode = !user?.id || user.id === "doc1" || activeApt?.patientId === "pat1";

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
        /* CONSULTATION ROOM */
        !activeApt ? (
          <div className="card text-center" style={{ padding: "4rem 2rem", maxWidth: "600px", margin: "2rem auto" }}>
            <h3 style={{ margin: 0 }}>No active session found</h3>
            <button className="btn btn-primary m-t-4" onClick={() => setActiveTab("list")}>Back to List</button>
          </div>
        ) : (
          <div className="split-layout split-layout-1-2" style={{ gap: "2.5rem" }}>
            {/* Background VideoCall listener (always mounted when consult room is open) */}
            <VideoCall 
              myPeerId={`doc_${user.id}`} 
              targetPeerId={`pat_${selectedPatient?.id}`} 
              targetName={selectedPatient?.name}
              hideIdleUI={sessionTab !== "video"}
              sessionTab={sessionTab}
            />
            
            {/* Left: Stream + Chat */}
            <div className="flex-column gap-6">
              
              {/* Selected Patient Bio summary */}
              <div className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "1.1rem" }}>
                    {selectedPatient?.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>{selectedPatient?.name}</h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>Active Clinical Consultation Room</p>
                  </div>
                </div>
                {sessionTab !== "landing" && (
                  <button
                    onClick={() => setSessionTab("landing")}
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.6rem", fontSize: "0.7rem", fontWeight: "600", borderColor: "var(--border-solid)" }}
                  >
                    ← Options
                  </button>
                )}
              </div>

              {/* Sub Navigation Tabs for Doctor (only if not on landing) */}
              {sessionTab !== "landing" && (
                <div style={{ display: "flex", backgroundColor: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setSessionTab("video")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: sessionTab === "video" ? "var(--primary-light)" : "none",
                      border: "none",
                      color: sessionTab === "video" ? "var(--primary)" : "var(--text-secondary)",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <Video size={14} /> Start Video Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionTab("chat")}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: sessionTab === "chat" ? "var(--primary-light)" : "none",
                      border: "none",
                      color: sessionTab === "chat" ? "var(--primary)" : "var(--text-secondary)",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <MessageSquare size={14} /> Chat Feed
                  </button>
                </div>
              )}

              {/* Tab Content Rendering */}
              {sessionTab === "landing" ? (
                /* CHOICE SCREEN (LANDING) */
                <div className="card flex-column gap-4" style={{ padding: "2rem", textAlign: "center", minHeight: "300px", justifyContent: "center", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.05rem", margin: 0, fontWeight: "600", color: "var(--text-primary)" }}>Choose Consultation Method</h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, maxWidth: "300px" }}>
                    Select how you would like to connect with <strong>{selectedPatient?.name}</strong> today:
                  </p>
                  <div className="flex-column gap-3" style={{ width: "100%", maxWidth: "320px" }}>
                    <button
                      onClick={() => setSessionTab("video")}
                      className="btn btn-primary align-center gap-2 justify-content-center"
                      style={{ padding: "0.65rem", fontSize: "0.8rem", fontWeight: "600", width: "100%" }}
                    >
                      <Video size={14} /> Start Video Call
                    </button>
                    <button
                      onClick={() => setSessionTab("chat")}
                      className="btn btn-secondary align-center gap-2 justify-content-center"
                      style={{ padding: "0.65rem", fontSize: "0.8rem", fontWeight: "600", width: "100%", borderColor: "var(--border-solid)" }}
                    >
                      <MessageSquare size={14} /> Open Chat Feed
                    </button>
                  </div>
                </div>
              ) : sessionTab === "video" ? (
                <div id="telehealth-video-slot" style={{ flex: 1, minHeight: "300px", position: "relative", display: "flex", flexDirection: "column" }} />
              ) : (
                <div className="card flex-column gap-3" style={{ padding: "1rem" }}>
                  <h3 style={{ fontSize: "0.95rem", margin: 0, fontWeight: "600" }}>Secured Consultation Chat</h3>
                  
                  <div style={{ height: "180px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem" }} className="flex-column gap-2">
                    {chatMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          alignSelf: msg.sender === "doctor" ? "flex-end" : "flex-start",
                          backgroundColor: msg.sender === "doctor" ? "var(--primary-light)" : "var(--bg-tertiary)",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "var(--radius-md)",
                          maxWidth: "85%",
                          fontSize: "0.75rem"
                        }}
                      >
                        <p style={{ margin: 0, color: "var(--text-primary)" }}>{msg.text}</p>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", float: "right", marginTop: "2px" }}>{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.5rem" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type to send message..." 
                      style={{ fontSize: "0.75rem", padding: "0.4rem" }}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: "0.4rem" }} title="Send Message">
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Right: Treatment Prescription Form */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Prescriptions & Charting Notes</h3>
              
              <div className="card" style={{ padding: "2rem" }}>
                <form onSubmit={handleSaveConsultation} className="flex-column gap-3">
                  {notesStatus && (
                    <div style={{ padding: "0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", borderLeft: "3px solid var(--success)" }}>
                      {notesStatus}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes-diag">Diagnosis / Primary Issue</label>
                    <input 
                      type="text" 
                      id="notes-diag"
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
                      rows="4" 
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    <button type="submit" className="btn btn-primary align-center gap-1 justify-content-center">
                      <Save size={14} /> Complete & Save
                    </button>
                    <button type="button" onClick={() => { setActiveTab("list"); setSelectedAptId(""); }} className="btn btn-secondary align-center gap-1 justify-content-center" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                      <PhoneOff size={14} /> Exit Consult Room
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        )
      )}
    </div>
  );
};

export default DoctorAppointments;
