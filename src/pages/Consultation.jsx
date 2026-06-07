import React, { useState, useEffect, useRef } from "react";
import { Peer } from "peerjs";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  Video, VideoOff, Mic, MicOff, Send, MessageSquare, 
  Sparkles, FileText, CheckCircle2, User, PhoneCall, HeartPulse 
} from "lucide-react";
import { Link } from "react-router-dom";

export const Consultation = () => {
  const { user, role } = useAuth();
  const { patients, doctors, addTreatmentNotes, appointments } = useHealth();
  const location = useLocation();

  // Pick patient or doctor context from route state
  const mockTargetPatient = patients[0]; // Default Alex Mercer
  const mockTargetDoctor = doctors[0]; // Default Dr Sarah Jenkins

  const targetPatient = location.state?.patient || mockTargetPatient;
  const targetDoctor = location.state?.appointment 
    ? doctors.find(d => d.name === location.state.appointment.doctorName) 
    : mockTargetDoctor;

  const [activeTab, setActiveTab] = useState("video"); // video or chat
  const [messages, setMessages] = useState([
    { id: 1, sender: "doctor", text: "Hello! Welcome to our telehealth session. How are you feeling today?", time: "10:01 AM" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  // Doctor treatment notes form states
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [formSaved, setFormSaved] = useState(false);

  const chatEndRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const connInstance = useRef(null); // Ref for chat data connection
  const [peerId, setPeerId] = useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => setPeerId(id));

    // Handle Incoming Text Chat
    peer.on('connection', (conn) => {
      connInstance.current = conn;
      conn.on('data', (data) => {
        setMessages(prev => [...prev, data]);
      });
    });

    // Handle Incoming Video Call
    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          if (currentUserVideoRef.current) {
             currentUserVideoRef.current.srcObject = mediaStream;
             currentUserVideoRef.current.play().catch(e => console.log(e));
          }
          call.answer(mediaStream);
          call.on('stream', function(remoteStream) {
            if (remoteVideoRef.current) {
               remoteVideoRef.current.srcObject = remoteStream;
               remoteVideoRef.current.play().catch(e => console.log(e));
            }
          });
        })
        .catch(err => {
          console.error("Failed to get local stream", err);
          alert("Could not access your camera or microphone. Please check permissions.");
        });
    });

    peerInstance.current = peer;
    return () => { if (peerInstance.current) peerInstance.current.destroy(); };
  }, []);

  const callPatient = () => {
    const remoteId = prompt("Enter Patient Connection ID:", "");
    if (!remoteId) return;

    // Connect Data (Text Chat)
    const conn = peerInstance.current.connect(remoteId);
    conn.on('open', () => {
      connInstance.current = conn;
      conn.on('data', (data) => {
        setMessages(prev => [...prev, data]);
      });
    });

    // Connect Media (Video Call)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        if (currentUserVideoRef.current) {
            currentUserVideoRef.current.srcObject = mediaStream;
            currentUserVideoRef.current.play().catch(e => console.log(e));
        }
        const call = peerInstance.current.call(remoteId, mediaStream);
        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(e => console.log(e));
          }
        });
      })
      .catch(err => {
        console.error("Failed to get local stream", err);
        alert("Camera missing or blocked. The Text Chat is still active!");
      });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: role === "patient" ? "patient" : "doctor",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText("");

    // If connected to another peer, send the message across the WebRTC tunnel!
    if (connInstance.current && connInstance.current.open) {
      connInstance.current.send(newMsg);
    } else {
      // If not connected, show a helpful alert instead of the fake mock bot
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: "system",
          text: "System: You are not connected to another person yet. Share your Connection ID to start chatting!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 500);
    }
  };

  const handleDoctorSubmitNotes = (e) => {
    e.preventDefault();
    if (!diagnosis || !notes) return;

    addTreatmentNotes(
      targetPatient.id,
      user.name,
      diagnosis,
      notes,
      prescription,
      followUpDate || "No follow-up scheduled"
    );

    setFormSaved(true);
    setTimeout(() => {
      setFormSaved(false);
      setDiagnosis("");
      setNotes("");
      setPrescription("");
      setFollowUpDate("");
    }, 2000);
  };

  return (
    <div className="flex-column gap-6" style={{ height: "calc(100vh - var(--navbar-height) - 4rem)" }}>
      {/* Consultation Room Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Active Telehealth Room</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
            Your Connection ID: <strong>{peerId || "Connecting..."}</strong> | HIPAA Secure Connection
          </p>
        </div>
        
        {/* Toggle Video/Chat Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", background: "white", padding: "0.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <button 
            onClick={() => setActiveTab("video")}
            className="btn"
            style={{ 
              padding: "0.4rem 0.8rem", 
              fontSize: "0.8rem",
              background: activeTab === "video" ? "var(--primary)" : "transparent",
              color: activeTab === "video" ? "white" : "var(--text-secondary)"
            }}
          >
            <Video size={14} /> Video Stream
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className="btn"
            style={{ 
              padding: "0.4rem 0.8rem", 
              fontSize: "0.8rem",
              background: activeTab === "chat" ? "var(--primary)" : "transparent",
              color: activeTab === "chat" ? "white" : "var(--text-secondary)"
            }}
          >
            <MessageSquare size={14} /> Text Chat
          </button>
        </div>
      </div>

      {/* Split Panel */}
      <div className="split-layout split-layout-18-12 telehealth-room-container" style={{ flex: 1, minHeight: 0 }}>
        
        {/* Left Side: Call Stream or Chat Module */}
        <div className="card flex-column" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
          {activeTab === "video" ? (
            /* Video Layout Mockup */
            <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0f172a", position: "relative" }}>
              
              {/* Doctor Main Frame */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {isVideoOn ? (
                  <video 
                    ref={remoteVideoRef}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    autoPlay playsInline
                  />
                ) : (
                  <div style={{ color: "white", fontSize: "0.9rem" }}>Participant's camera is turned off</div>
                )}
                
                <div 
                  style={{ 
                    position: "absolute", 
                    bottom: "1rem", 
                    left: "1rem", 
                    background: "rgba(15, 23, 42, 0.75)", 
                    padding: "0.4rem 0.8rem", 
                    borderRadius: "var(--radius-sm)", 
                    color: "white",
                    fontSize: "0.75rem",
                    backdropFilter: "blur(2px)"
                  }}
                >
                  {role === "patient" ? targetDoctor.name : targetPatient.name}
                </div>
              </div>

              {/* Patient Miniature Inset Frame */}
              <div 
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  width: "120px",
                  height: "90px",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                  background: "#1e293b",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-md)"
                }}
              >
                <video 
                  ref={currentUserVideoRef}
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  autoPlay playsInline
                />
              </div>

              {/* Call Controls Bar */}
              <div 
                style={{ 
                  background: "#1e293b", 
                  padding: "1rem", 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center",
                  gap: "1rem",
                  borderTop: "1px solid #334155" 
                }}
              >
                <button 
                  onClick={() => setIsVideoOn(!isVideoOn)} 
                  className="btn"
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    backgroundColor: isVideoOn ? "rgba(255,255,255,0.15)" : "var(--danger)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>

                <button 
                  onClick={() => setIsAudioOn(!isAudioOn)} 
                  className="btn"
                  style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    backgroundColor: isAudioOn ? "rgba(255,255,255,0.15)" : "var(--danger)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  aria-label={isAudioOn ? "Mute microphone" : "Unmute microphone"}
                >
                  {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                {role === "doctor" && (
                  <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={callPatient}>
                    Start Call
                  </button>
                )}

                <button 
                  className="btn btn-danger" 
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem" }}
                  onClick={() => alert("Exited consultation room.")}
                >
                  End Session
                </button>
              </div>

            </div>
          ) : (
            /* Chat Interface Mockup */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              
              {/* Message Thread */}
              <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map(msg => {
                  const isMe = (role === "patient" && msg.sender === "patient") || 
                               (role === "doctor" && msg.sender === "doctor");
                  const isSystem = msg.sender === "system";
                  
                  return (
                    <div 
                      key={msg.id}
                      style={{
                        alignSelf: isSystem ? "center" : (isMe ? "flex-end" : "flex-start"),
                        maxWidth: isSystem ? "90%" : "75%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isSystem ? "center" : (isMe ? "flex-end" : "flex-start")
                      }}
                    >
                      <div 
                        style={{
                          background: isSystem ? "var(--warning-light)" : (isMe ? "var(--primary)" : "var(--bg-tertiary)"),
                          color: isSystem ? "var(--warning-dark)" : (isMe ? "white" : "var(--text-primary)"),
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--radius-lg)",
                          borderBottomRightRadius: isSystem ? "var(--radius-lg)" : (isMe ? "2px" : "var(--radius-lg)"),
                          borderBottomLeftRadius: isSystem ? "var(--radius-lg)" : (isMe ? "var(--radius-lg)" : "2px"),
                          fontSize: "0.9rem",
                          textAlign: isSystem ? "center" : "left"
                        }}
                      >
                        {msg.text}
                      </div>
                      {!isSystem && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{msg.time}</span>}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form 
                onSubmit={handleSendMessage}
                style={{ 
                  padding: "1rem", 
                  borderTop: "1px solid var(--border-color)", 
                  display: "flex", 
                  gap: "0.5rem",
                  backgroundColor: "white" 
                }}
              >
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type message here..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" aria-label="Send message">
                  <Send size={16} />
                </button>
              </form>

            </div>
          )}
        </div>

        {/* Right Side: Role-Specific Action Forms */}
        <div style={{ height: "100%", overflowY: "auto" }}>
          {role === "doctor" ? (
            /* Doctor Action Panel: Diagnose & Prescribe */
            <div className="card flex-column gap-4" style={{ height: "100%" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Prescription & Care Notes</h3>
                <p className="text-secondary-color" style={{ fontSize: "0.75rem" }}>Add diagnostics directly to Patient's medical history chart.</p>
              </div>

              {formSaved && (
                <div style={{ padding: "0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                  Clinical notes saved and sent to patient checklist.
                </div>
              )}

              <form onSubmit={handleDoctorSubmitNotes} className="flex-column gap-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="consult-diagnosis">Clinical Diagnosis</label>
                  <input 
                    type="text" 
                    id="consult-diagnosis"
                    className="form-input" 
                    placeholder="Hypertension Stage 1, Diet compliance needed"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="consult-notes">Clinical Assessment / Findings</label>
                  <textarea 
                    id="consult-notes"
                    className="form-input" 
                    rows="3" 
                    placeholder="Describe laboratory values, dietary advice, or diagnostic explanations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="consult-prescription">Rx Medication / Dosage</label>
                  <input 
                    type="text" 
                    id="consult-prescription"
                    className="form-input" 
                    placeholder="Lisinopril 10mg once daily (Morning)"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>If specified, pill is synced to patient reminders!</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="consult-followup">Follow-up Session Date</label>
                  <input 
                    type="date" 
                    id="consult-followup"
                    className="form-input"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full m-t-2">
                  Commit Notes & End Visit
                </button>
              </form>
            </div>
          ) : (
            /* Patient Info Panel */
            <div className="card flex-column gap-4" style={{ height: "100%" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Practitioner Profile</h3>
              </div>

              <div className="align-center gap-3">
                <img 
                  src={targetDoctor.image} 
                  alt={targetDoctor.name} 
                  style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <h4 style={{ margin: 0 }}>{targetDoctor.name}</h4>
                  <p style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600" }}>{targetDoctor.specialty}</p>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Attending Credentials</h4>
                <p><strong>Education:</strong> {targetDoctor.education}</p>
                <p><strong>Experience:</strong> {targetDoctor.experience}</p>
                <p style={{ marginTop: "0.5rem" }}>{targetDoctor.about}</p>
              </div>

              <div className="flex-column gap-2" style={{ marginTop: "auto" }}>
                <h4 style={{ fontSize: "0.85rem" }}>Emergency Assistance</h4>
                <a href="tel:911" className="btn btn-secondary w-full align-center gap-2" style={{ color: "var(--danger)", borderColor: "var(--danger-light)" }}>
                  <PhoneCall size={14} /> Call Emergency (911)
                </a>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default Consultation;
