import React, { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import { Video, VideoOff, PhoneOff, Mic, MicOff, PhoneCall } from "lucide-react";

const VideoCall = ({ myPeerId, targetPeerId, targetName }) => {
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [peerInstance, setPeerInstance] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Attach streams when refs become available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callActive]);

  // Initialize PeerJS
  useEffect(() => {
    if (!peerInstance && myPeerId) {
      const PeerConstructor = Peer.default || Peer;
      const peer = new PeerConstructor(myPeerId);
      
      peer.on("open", (id) => {
        console.log("Peer initialized with ID:", id);
      });

      peer.on("call", (call) => {
        // Instead of auto-answering, we set incomingCall to show the ringing UI
        setIncomingCall(call);
      });

      setPeerInstance(peer);
    }
    
    return () => {
      if (peerInstance) {
        peerInstance.destroy();
        setPeerInstance(null);
        setCallActive(false);
        setIncomingCall(null);
        cleanupMedia();
      }
    };
  }, [myPeerId]);

  const cleanupMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const answerCall = () => {
    if (!incomingCall) return;
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        
        incomingCall.on("stream", (incomingRemoteStream) => {
          setRemoteStream(incomingRemoteStream);
        });

        incomingCall.answer(stream);
        setCallActive(true);
        setIncomingCall(null);
        
        incomingCall.on("close", () => {
          endCall();
        });
      })
      .catch(err => console.error("Failed to get local stream", err));
  };

  const declineCall = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
  };

  const initiateCall = () => {
    if (!targetPeerId) {
      console.error("Target Peer ID is null. Cannot initiate call.");
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        setCallActive(true);
        
        if (peerInstance) {
          const call = peerInstance.call(targetPeerId, stream);
          if (call) {
            call.on("stream", (incomingRemoteStream) => {
              setRemoteStream(incomingRemoteStream);
            });
            call.on("close", () => {
              endCall();
            });
          }
        }
      })
      .catch(err => console.error("Failed to get local stream", err));
  };

  const endCall = () => {
    setCallActive(false);
    cleanupMedia();
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Full Screen Active Call Overlay
  if (callActive) {
    return (
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "#0f172a",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          {/* Main Remote Video */}
          <video 
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#000" }}
          />
          
          {/* Target Name Badge */}
          <div style={{ position: "absolute", top: "20px", left: "20px", color: "white", fontSize: "1.2rem", background: "rgba(0,0,0,0.6)", padding: "0.5rem 1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block", animation: "pulse 2s infinite" }}></span>
            {targetName || "Target"} (Live)
          </div>

          {/* Local PIP Video */}
          <div 
            style={{
              position: "absolute",
              bottom: "40px",
              right: "40px",
              width: "180px",
              height: "240px",
              backgroundColor: "#1e293b",
              borderRadius: "12px",
              border: "2px solid rgba(255,255,255,0.2)",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
            }}
          >
            <video 
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: isVideoOff ? "blur(10px)" : "none" }}
            />
            {isVideoOff && (
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", background: "rgba(0,0,0,0.5)" }}>
                <VideoOff size={32} />
              </div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div style={{ 
          height: "90px", 
          backgroundColor: "#1e293b", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.1)"
        }}>
          <button 
            onClick={toggleAudio}
            style={{ 
              width: "56px", height: "56px", borderRadius: "50%", 
              backgroundColor: isMuted ? "#ef4444" : "#334155", 
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s"
            }}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={endCall}
            style={{ 
              width: "64px", height: "64px", borderRadius: "50%", 
              backgroundColor: "#ef4444", 
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
              transition: "transform 0.2s"
            }}
            title="End Call"
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <PhoneOff size={28} />
          </button>
          
          <button 
            onClick={toggleVideo}
            style={{ 
              width: "56px", height: "56px", borderRadius: "50%", 
              backgroundColor: isVideoOff ? "#ef4444" : "#334155", 
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s"
            }}
            title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        </div>
      </div>
    );
  }

  // Incoming Call Ringing UI
  if (incomingCall) {
    return (
      <div 
        style={{
          backgroundColor: "#1e293b",
          height: "160px",
          borderRadius: "var(--radius-md)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #3b82f6",
          animation: "pulse-border 2s infinite",
          boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)"
        }}
      >
        <PhoneCall size={32} color="#3b82f6" style={{ animation: "wiggle 1s infinite" }} />
        <h4 style={{ color: "white", margin: "10px 0", fontSize: "1rem" }}>Incoming Video Call...</h4>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button 
            onClick={answerCall} 
            className="btn btn-primary" 
            style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Video size={16} /> Accept
          </button>
          <button 
            onClick={declineCall} 
            className="btn btn-danger" 
            style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <PhoneOff size={16} /> Decline
          </button>
        </div>
      </div>
    );
  }

  // Idle UI (Ready to call)
  return (
    <div 
      style={{
        backgroundColor: "#1e293b",
        height: "140px",
        borderRadius: "var(--radius-md)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div className="text-center" style={{ color: "#94a3b8" }}>
        <Video size={24} style={{ marginBottom: "8px" }} />
        <p style={{ fontSize: "0.85rem", margin: "0 0 10px 0" }}>Video Consultation Room</p>
        <button 
          onClick={initiateCall} 
          className="btn btn-primary" 
          style={{ padding: "0.5rem 1.5rem", borderRadius: "50px", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 auto" }}
        >
          <Video size={16} /> Start Call
        </button>
      </div>
      
      {/* Global CSS for animations */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
};

export default VideoCall;
