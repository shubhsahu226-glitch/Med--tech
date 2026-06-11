import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import VideoCall from "../components/VideoCall";
import { Send, MessageSquare, ShieldCheck, User } from "lucide-react";
import { supabase } from "../config/supabase";

export const VideoRoom = () => {
  const { user, role } = useAuth();
  const { appointments, updateAppointmentStatus, refreshAppointments } = useHealth();
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const params = new URLSearchParams(window.location.search);
  const apptId = params.get("apptId");

  const appointment = appointments.find(a => a.id === apptId);
  const isGuestMode = !user?.id || user.id === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a" || appointment?.doctorId === "7a02fa0d-9719-4261-bd98-1c3d54238c2f" || appointment?.patientId === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a";

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Sync / Fetch Chat Messages
  useEffect(() => {
    if (!appointment || !user?.id) return;

    const fetchMessages = async () => {
      if (isGuestMode) {
        try {
          const key = `virtualvaidya_chat_${appointment.patientId}_${appointment.doctorId}`;
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
          .eq("appointment_id", appointment.id)
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

    // Setup polling for Guest Mode or Subscription for Database Mode
    if (isGuestMode) {
      const interval = setInterval(() => {
        try {
          const key = `virtualvaidya_chat_${appointment.patientId}_${appointment.doctorId}`;
          const localMsgs = JSON.parse(localStorage.getItem(key) || "[]");
          setChatMessages(localMsgs);
        } catch (err) {}
      }, 1500);
      return () => clearInterval(interval);
    } else {
      const channel = supabase
        .channel(`chat_room_${appointment.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `appointment_id=eq.${appointment.id}`
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
  }, [appointment, user?.id, isGuestMode]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !appointment || !user?.id) return;

    const msgText = newMessage;
    setNewMessage("");

    const tempId = `temp_${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgObj = { id: tempId, sender: role, text: msgText, time: timeString };

    setChatMessages(prev => [...prev, newMsgObj]);

    if (isGuestMode) {
      try {
        const key = `virtualvaidya_chat_${appointment.patientId}_${appointment.doctorId}`;
        const msgs = JSON.parse(localStorage.getItem(key) || "[]");
        msgs.push(newMsgObj);
        localStorage.setItem(key, JSON.stringify(msgs));
      } catch (err) {
        console.warn("Failed to save local message:", err);
      }
      return;
    }

    const { data, error } = await supabase.from("messages").insert([{
      appointment_id: appointment.id,
      sender_id: user.id,
      sender_role: role,
      text: msgText
    }]).select();

    if (data && !error) {
      setChatMessages(prev => prev.map(m => m.id === tempId ? {
        id: data[0].id, sender: data[0].sender_role, text: data[0].text, time: new Date(data[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : m));
    }
  };

  if (!user || !appointment) {
    return (
      <div className="flex-center" style={{ height: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTop: "3px solid var(--primary)", animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Initializing consultation room...</p>
      </div>
    );
  }

  const isPatient = role === "patient";
  const myPeerId = isPatient ? `pat_${user.id}` : `doc_${user.id}`;
  const targetPeerId = isPatient ? `doc_${appointment.doctorId}` : `pat_${appointment.patientId}`;
  const targetName = isPatient ? appointment.doctorName : appointment.patientName;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", overflow: "hidden" }}>
      {/* Left side: Video stream wrapper */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.5rem", position: "relative" }}>
        
        {/* Header bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", backgroundColor: "var(--bg-primary)", padding: "0.75rem 1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(225, 29, 72, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9rem" }}>
              {targetName ? targetName.charAt(0) : "U"}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{targetName}</h4>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={12} color="var(--success)" /> Secure Telehealth Consultation
              </p>
            </div>
          </div>
          <span style={{ fontSize: "0.75rem", backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(225, 29, 72, 0.15)", padding: "0.25rem 0.75rem", borderRadius: "50px", fontWeight: "600" }}>
            Status: {appointment.status}
          </span>
        </div>

        {/* Video Call */}
        <div style={{ flex: 1, minHeight: 0, borderRadius: "12px", overflow: "hidden" }}>
          <VideoCall 
            myPeerId={myPeerId} 
            targetPeerId={targetPeerId} 
            targetName={targetName} 
          />
        </div>
      </div>

      {/* Right side: Chat panel */}
      <div style={{ width: "350px", backgroundColor: "var(--bg-primary)", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", height: "100%" }}>
        
        {/* Chat Header */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageSquare size={18} color="var(--primary)" />
          <span style={{ fontWeight: "600", fontSize: "0.95rem", color: "var(--text-primary)" }}>Secured Live Chat</span>
        </div>

        {/* Chat Feed */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {chatMessages.map((msg, i) => {
            const isMe = msg.sender === role;
            return (
              <div 
                key={i} 
                style={{ 
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  backgroundColor: isMe ? "var(--primary)" : "var(--bg-tertiary)",
                  color: isMe ? "white" : "var(--text-primary)",
                  padding: "0.5rem 0.8rem",
                  borderRadius: "12px",
                  maxWidth: "85%",
                  fontSize: "0.8rem",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <p style={{ margin: 0, lineHeight: 1.4, wordBreak: "break-word" }}>{msg.text}</p>
                <span style={{ fontSize: "0.6rem", color: isMe ? "rgba(255,255,255,0.8)" : "var(--text-muted)", float: "right", marginTop: "4px" }}>
                  {msg.time}
                </span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Form */}
        <form onSubmit={handleSendMessage} style={{ padding: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "0.5rem", backgroundColor: "var(--bg-secondary)" }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Type your message..." 
            style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem", borderRadius: "8px", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-solid)", color: "var(--text-primary)", flex: 1 }}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={14} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default VideoRoom;
