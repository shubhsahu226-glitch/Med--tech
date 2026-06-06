import React, { useState, useEffect, useRef } from "react";
import { Peer } from "peerjs";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { 
  Video, VideoOff, Mic, MicOff, Send, MessageSquare, 
  FileText, CheckCircle2, User, PhoneCall, HeartPulse, Lock
} from "lucide-react";

export const Consultation = () => {
  const { user, role } = useAuth();
  const { patients, doctors, addTreatmentNotes } = useHealth();
  const location = useLocation();

  const mockTargetPatient = patients[0];
  const mockTargetDoctor = doctors[0];

  const targetPatient = location.state?.patient || mockTargetPatient;
  const targetDoctor = location.state?.appointment 
    ? doctors.find(d => d.name === location.state.appointment.doctorName) 
    : mockTargetDoctor;

  const [activeTab, setActiveTab] = useState("video");
  const [messages, setMessages] = useState([
    { id: 1, sender: "doctor", text: "Hello! Welcome to our telehealth session. How are you feeling today?", time: "10:01 AM" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [formSaved, setFormSaved] = useState(false);

  const chatEndRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const [peerId, setPeerId] = useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const peer = new Peer();
    peer.on('open', (id) => setPeerId(id));

    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
        if (currentUserVideoRef.current) {
           currentUserVideoRef.current.srcObject = mediaStream;
           currentUserVideoRef.current.play();
        }
        call.answer(mediaStream);
        call.on('stream', function(remoteStream) {
          if (remoteVideoRef.current) {
             remoteVideoRef.current.srcObject = remoteStream;
             remoteVideoRef.current.play();
          }
        });
      });
    });

    peerInstance.current = peer;
    return () => { if (peerInstance.current) peerInstance.current.destroy(); };
  }, []);

  const callPatient = () => {
    const remoteId = prompt("Enter Patient Connection ID:", "");
    if (!remoteId) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
      if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = mediaStream;
          currentUserVideoRef.current.play();
      }
      const call = peerInstance.current.call(remoteId, mediaStream);
      call.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play();
        }
      });
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

    setTimeout(() => {
      let replyText = "";
      if (role === "patient") {
        replyText = "Thank you for sharing. I am reviewing your biometric trends and lab values right now on my dashboard panel.";
      } else {
        replyText = "Understood. Please list any specific symptoms, or tell me if you have uploaded your latest blood panel report.";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: role === "patient" ? "doctor" : "patient",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
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

  const participantName = role === "patient" ? targetDoctor?.name : targetPatient?.name;

  return (
    <div className="flex-column gap-6" style={{ height: "calc(100vh - var(--navbar-height) - 4rem)" }}>
      <div className="page-header">
        <div>
          <div className="align-center gap-3" style={{ marginBottom: "0.5rem" }}>
            <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Active Telehealth Room</h1>
            <span className="status-live">Live</span>
          </div>
          <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
            Connection ID: <strong style={{ color: "var(--primary)" }}>{peerId || "Connecting..."}</strong>
            <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>|</span>
            <Lock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} />
            HIPAA Secure
          </p>
        </div>
        
        <div className="segment-control">
          <button 
            onClick={() => setActiveTab("video")}
            className={`segment-btn ${activeTab === "video" ? "active" : ""}`}
          >
            <Video size={14} /> Video
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`segment-btn ${activeTab === "chat" ? "active" : ""}`}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>
      </div>

      <div className="consultation-layout">
        <div className="card flex-column" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
          {activeTab === "video" ? (
            <div className="video-room">
              <div className="video-main">
                {isVideoOn ? (
                  <video ref={remoteVideoRef} autoPlay playsInline />
                ) : (
                  <div className="video-placeholder">
                    <div className="video-placeholder-icon">
                      <User size={32} />
                    </div>
                    <span>Participant's camera is turned off</span>
                  </div>
                )}
                
                <div className="video-label">{participantName}</div>
              </div>

              <div className="video-pip">
                <video ref={currentUserVideoRef} muted autoPlay playsInline />
              </div>

              <div className="video-controls">
                <button 
                  onClick={() => setIsVideoOn(!isVideoOn)} 
                  className={`control-btn ${!isVideoOn ? "off" : ""}`}
                  aria-label={isVideoOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>

                <button 
                  onClick={() => setIsAudioOn(!isAudioOn)} 
                  className={`control-btn ${!isAudioOn ? "off" : ""}`}
                  aria-label={isAudioOn ? "Mute microphone" : "Unmute microphone"}
                >
                  {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                {role === "doctor" && (
                  <button className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }} onClick={callPatient}>
                    <PhoneCall size={14} /> Start Call
                  </button>
                )}

                <button 
                  className="btn btn-danger" 
                  style={{ padding: "0.5rem 1.5rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem" }}
                  onClick={() => alert("Exited consultation room.")}
                >
                  End Session
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-panel">
              <div className="chat-messages">
                {messages.map(msg => {
                  const isMe = (role === "patient" && msg.sender === "patient") || 
                               (role === "doctor" && msg.sender === "doctor");
                  return (
                    <div 
                      key={msg.id}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "78%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start"
                      }}
                    >
                      <div className={`chat-bubble ${isMe ? "sent" : "received"}`}>
                        {msg.text}
                      </div>
                      <span className="chat-time">{msg.time}</span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-bar">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type your message..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 1rem" }} aria-label="Send message">
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>

        <div style={{ height: "100%", overflowY: "auto" }}>
          {role === "doctor" ? (
            <div className="card flex-column gap-4" style={{ height: "100%" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                <div className="align-center gap-2">
                  <FileText size={18} style={{ color: "var(--primary)" }} />
                  <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Prescription & Care Notes</h3>
                </div>
                <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  Add diagnostics directly to patient's medical history chart.
                </p>
              </div>

              {formSaved && (
                <div className="toast-success">
                  <CheckCircle2 size={16} />
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
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Synced to patient medication reminders</span>
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
                  <CheckCircle2 size={16} /> Commit Notes & End Visit
                </button>
              </form>
            </div>
          ) : (
            <div className="card flex-column gap-4" style={{ height: "100%" }}>
              <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                <div className="align-center gap-2">
                  <HeartPulse size={18} style={{ color: "var(--primary)" }} />
                  <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Practitioner Profile</h3>
                </div>
              </div>

              <div className="align-center gap-3">
                <div className="avatar-ring">
                  <img src={targetDoctor.image} alt={targetDoctor.name} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{targetDoctor.name}</h4>
                  <p style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: "600" }}>{targetDoctor.specialty}</p>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Attending Credentials</h4>
                <p className="m-b-2"><strong>Education:</strong> {targetDoctor.education}</p>
                <p className="m-b-2"><strong>Experience:</strong> {targetDoctor.experience}</p>
                <p style={{ marginTop: "0.5rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{targetDoctor.about}</p>
              </div>

              <div className="flex-column gap-2" style={{ marginTop: "auto" }}>
                <h4 style={{ fontSize: "0.85rem" }}>Emergency Assistance</h4>
                <a href="tel:911" className="btn btn-danger w-full align-center gap-2" style={{ justifyContent: "center" }}>
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
