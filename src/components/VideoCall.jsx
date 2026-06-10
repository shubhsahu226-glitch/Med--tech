import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Peer from "peerjs";
import { Video, VideoOff, PhoneOff, Mic, MicOff, PhoneCall } from "lucide-react";

const VideoCall = ({ myPeerId, targetPeerId, targetName }) => {
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Controls state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Diagnostic Logs state and ref
  const [logs, setLogs] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("videocall_debug_logs") || "[]");
    } catch (e) {
      return [];
    }
  });

  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Peer & Call refs to prevent stale closure bugs and connection duplicates (e.g. in React StrictMode)
  const peerRef = useRef(null);
  const activeCallRef = useRef(null);
  const isMountedRef = useRef(true);

  // Debug logging helper
  const addLog = (msg) => {
    console.log("[VideoCall Debug]", msg);
    try {
      const existing = JSON.parse(sessionStorage.getItem("videocall_debug_logs") || "[]");
      existing.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      sessionStorage.setItem("videocall_debug_logs", JSON.stringify(existing.slice(-12)));
    } catch (e) {}

    if (isMountedRef.current) {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-8));
    }
  };

  // Log mounting lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    addLog(`Component mounted. myPeerId: ${myPeerId}, targetPeerId: ${targetPeerId}`);
    return () => {
      isMountedRef.current = false;
      try {
        const existing = JSON.parse(sessionStorage.getItem("videocall_debug_logs") || "[]");
        existing.push(`[${new Date().toLocaleTimeString()}] Component unmounting...`);
        sessionStorage.setItem("videocall_debug_logs", JSON.stringify(existing.slice(-12)));
      } catch (e) {}
    };
  }, [myPeerId, targetPeerId]);

  // Lock body scroll and completely hide original website root DOM when call is active
  // This physically prevents the website background from ever flashing or being visible.
  useEffect(() => {
    if (callActive) {
      document.body.classList.add("video-call-active");
      document.body.style.overflow = "hidden";
      addLog("Call active. Body scroll locked & website background hidden.");
    } else {
      document.body.classList.remove("video-call-active");
      document.body.style.overflow = "";
      addLog("Call inactive. Body scroll and website container restored.");
    }
    return () => {
      document.body.classList.remove("video-call-active");
      document.body.style.overflow = "";
    };
  }, [callActive]);

  // Attach streams when refs become available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      addLog("Local stream attached to video element.");
    }
  }, [localStream, callActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      addLog("Remote stream attached to video element.");
    }
  }, [remoteStream, callActive]);

  // Initialize PeerJS
  useEffect(() => {
    if (!peerRef.current && myPeerId) {
      addLog(`Initializing PeerJS with ID: ${myPeerId}`);
      const PeerConstructor = Peer.default || Peer;
      
      try {
        const peer = new PeerConstructor(myPeerId);
        peerRef.current = peer;
        
        peer.on("open", (id) => {
          addLog(`Peer registered successfully on server. ID: ${id}`);
        });

        peer.on("call", (call) => {
          addLog(`Incoming call received from: ${call.peer}`);
          setIncomingCall(call);
        });

        peer.on("error", (err) => {
          addLog(`PeerJS error: ${err.type} - ${err.message}`);
        });

        peer.on("disconnected", () => {
          addLog("PeerJS server disconnected. Reconnecting...");
          peer.reconnect();
        });
      } catch (err) {
        addLog(`PeerJS constructor exception: ${err.message}`);
      }
    }
    
    return () => {
      if (activeCallRef.current) {
        try {
          addLog("Closing active call during cleanup...");
          activeCallRef.current.close();
        } catch (e) {}
        activeCallRef.current = null;
      }
      if (peerRef.current) {
        addLog("Destroying PeerJS connection...");
        peerRef.current.destroy();
        peerRef.current = null;
      }
      setCallActive(false);
      setIncomingCall(null);
      cleanupMedia();
    };
  }, [myPeerId]);

  const cleanupMedia = () => {
    addLog("Cleaning up media streams and tracks...");
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        addLog(`Stopped track: ${track.kind}`);
      });
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const answerCall = () => {
    if (!incomingCall) return;
    addLog("Answering incoming call. Requesting media permissions...");
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        addLog("Permissions granted. Local stream retrieved.");
        setLocalStream(stream);
        
        incomingCall.on("stream", (incomingRemoteStream) => {
          addLog("Received remote stream track.");
          setRemoteStream(incomingRemoteStream);
        });

        incomingCall.answer(stream);
        activeCallRef.current = incomingCall;
        setCallActive(true);
        setIncomingCall(null);
        
        incomingCall.on("close", () => {
          addLog("Call closed by remote peer.");
          endCall();
        });

        incomingCall.on("error", (err) => {
          addLog(`Call error from remote: ${err.message}`);
          endCall();
        });
      })
      .catch(err => {
        addLog(`getUserMedia permission failed: ${err.message}`);
        alert("Failed to access camera/microphone. Please verify device permissions.");
      });
  };

  const declineCall = () => {
    if (incomingCall) {
      addLog("Declining incoming call...");
      incomingCall.close();
      setIncomingCall(null);
    }
  };

  const initiateCall = () => {
    if (!targetPeerId) {
      addLog("Error: Target Peer ID is null.");
      return;
    }
    addLog(`Initiating call to target: ${targetPeerId}. Requesting local media...`);
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        addLog("Permissions granted. Local stream retrieved.");
        setLocalStream(stream);
        setCallActive(true);
        
        if (peerRef.current) {
          addLog(`Calling target peer: ${targetPeerId}...`);
          const call = peerRef.current.call(targetPeerId, stream);
          if (call) {
            activeCallRef.current = call;
            
            call.on("stream", (incomingRemoteStream) => {
              addLog("Received remote stream.");
              setRemoteStream(incomingRemoteStream);
            });
            
            call.on("close", () => {
              addLog("Call closed by remote peer.");
              endCall();
            });

            call.on("error", (err) => {
              addLog(`Call connection error: ${err.message}`);
              endCall();
            });
          } else {
            addLog("Error: PeerJS failed to create call object.");
          }
        } else {
          addLog("Error: PeerJS instance not ready.");
        }
      })
      .catch(err => {
        addLog(`getUserMedia permission failed: ${err.message}`);
        alert("Failed to access camera/microphone. Please verify device permissions.");
      });
  };

  const endCall = () => {
    addLog("Ending video call...");
    if (activeCallRef.current) {
      try {
        activeCallRef.current.close();
      } catch (err) {
        addLog(`Failed to close active call reference: ${err.message}`);
      }
      activeCallRef.current = null;
    }
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
        addLog(`Microphone toggled. Enabled: ${audioTrack.enabled}`);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        addLog(`Camera toggled. Enabled: ${videoTrack.enabled}`);
      }
    }
  };

  // Full Screen Active Call Overlay - Rendered via React Portal to prevent layout issues
  const renderOverlay = () => {
    if (!callActive) return null;

    return createPortal(
      <div 
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#0f172a",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          transform: "translate3d(0,0,0)",
          backfaceVisibility: "hidden",
          overflow: "hidden"
        }}
      >
        <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", animation: "fadeIn 0.3s ease-in-out" }}>
          {/* Main Remote Video */}
          <video 
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ 
              position: "absolute",
              inset: 0,
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
              backgroundColor: "#000",
              opacity: remoteStream ? 1 : 0,
              transition: "opacity 0.3s ease-in-out"
            }}
          />
          
          {/* Target Name Badge */}
          <div style={{ position: "absolute", top: "20px", left: "20px", color: "white", fontSize: "1.2rem", background: "rgba(0,0,0,0.6)", padding: "0.5rem 1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444", display: "inline-block", animation: "pulse 2s infinite" }}></span>
            {targetName || "Target"} (Live)
          </div>

          {/* Floating Diagnostic Logs */}
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "320px",
            backgroundColor: "rgba(0,0,0,0.85)",
            border: "1px solid #22c55e",
            borderRadius: "8px",
            padding: "10px",
            zIndex: 100000,
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#22c55e",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
          }}>
            <div style={{ fontWeight: "bold", borderBottom: "1px solid #22c55e", paddingBottom: "4px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
              <span>Diagnostic Logs (V6)</span>
              <button 
                onClick={() => {
                  try {
                    sessionStorage.removeItem("videocall_debug_logs");
                    setLogs([]);
                  } catch (e) {}
                }}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "10px" }}
              >
                Clear
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {logs.map((log, index) => (
                <div key={index} style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{log}</div>
              ))}
            </div>
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
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover", 
                filter: isVideoOff ? "blur(10px)" : "none",
                opacity: localStream ? 1 : 0,
                transition: "opacity 0.3s ease-in-out"
              }}
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
          borderTop: "1px solid rgba(255,255,255,0.1)",
          animation: "fadeIn 0.3s ease-in-out"
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
      </div>,
      document.body
    );
  };

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
      
      {/* Global CSS for animations and hiding root layout when call is active */}
      <style>{`
        body.video-call-active #root,
        body.video-call-active .app-container {
          display: none !important;
        }
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
      {renderOverlay()}
    </div>
  );
};

export default VideoCall;
