import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as PeerModule from "peerjs";
import { Video, VideoOff, PhoneOff, Mic, MicOff, PhoneCall } from "lucide-react";

const VideoCall = ({ myPeerId, targetPeerId, targetName, hideIdleUI = false, sessionTab = "landing" }) => {
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    if (!hideIdleUI) {
      const findTarget = () => {
        const el = document.getElementById("telehealth-video-slot");
        if (el) {
          setPortalTarget(el);
        } else {
          setTimeout(() => {
            const retryEl = document.getElementById("telehealth-video-slot");
            if (retryEl) setPortalTarget(retryEl);
          }, 50);
        }
      };
      findTarget();
    } else {
      setPortalTarget(null);
    }
  }, [hideIdleUI, sessionTab]);

  // Role Detection
  const isPatient = myPeerId?.startsWith("pat_");

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

  // Toggle debug panel display using URL query params (e.g., ?debug=true)
  const showDebugLogs = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "true";

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
      localVideoRef.current.play().catch(err => {
        addLog(`Local video autoplay prevented: ${err.message}`);
      });
    }
  }, [localStream, callActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      addLog("Remote stream attached to video element.");
      remoteVideoRef.current.play().catch(err => {
        addLog(`Remote video autoplay prevented: ${err.message}`);
      });
    }
  }, [remoteStream, callActive]);

  // Initialize PeerJS
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (peerRef.current) {
        addLog("Tab unload/refresh detected. Sync destroying PeerJS...");
        peerRef.current.destroy();
      }
    };

    let isRetryingLocal = false;
    let isRetryingCloud = false;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    const initializePeer = (useCloud = true) => {
      if (!myPeerId) return;
      addLog(`Initializing PeerJS (${useCloud ? "Cloud" : "Local"}) with ID: ${myPeerId}`);
      const PeerConstructor = PeerModule.Peer || PeerModule.default || PeerModule;
      
      try {
        const options = useCloud 
          ? {
              debug: 3,
              host: "0.peerjs.com",
              port: 443,
              secure: true,
              config: {
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" },
                  { urls: "stun:stun1.l.google.com:19302" },
                  { urls: "stun:stun2.l.google.com:19302" },
                  { urls: "stun:stun3.l.google.com:19302" },
                  { urls: "stun:stun4.l.google.com:19302" }
                ]
              }
            }
          : {
              debug: 3,
              host: "localhost",
              port: 9000,
              path: "/myapp",
              secure: false,
              config: {
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" }
                ]
              }
            };

        const peer = new PeerConstructor(myPeerId, options);
        peerRef.current = peer;
        
        peer.on("open", (id) => {
          addLog(`Peer registered successfully on ${useCloud ? "Cloud" : "Local"} server. ID: ${id}`);
        });

        peer.on("call", (call) => {
          addLog(`Incoming call received from: ${call.peer}`);
          setIncomingCall(call);
        });

        peer.on("error", (err) => {
          addLog(`PeerJS error (${useCloud ? "Cloud" : "Local"}): ${err.type} - ${err.message}`);
          
          if (useCloud && !isRetryingLocal) {
            isRetryingLocal = true;
            addLog("Cloud server connection failed. Attempting local peerjs server fallback at localhost:9000/myapp...");
            try {
              peer.destroy();
            } catch (e) {}
            setTimeout(() => {
              initializePeer(false);
            }, 1000);
          } else if (!useCloud && !isRetryingCloud) {
            isRetryingCloud = true;
            addLog("Local server connection failed. Attempting cloud peerjs server fallback...");
            try {
              peer.destroy();
            } catch (e) {}
            setTimeout(() => {
              initializePeer(true);
            }, 1000);
          } else {
            addLog("All connection attempts failed. Please ensure either internet is available or 'npx -p peer peerjs --port 9000 --path /myapp' is running in your terminal.");
          }
        });

        peer.on("disconnected", () => {
          addLog("PeerJS server disconnected. Reconnecting...");
          peer.reconnect();
        });

      } catch (err) {
        addLog(`PeerJS initialization exception: ${err.message}`);
      }
    };

    if (!peerRef.current && myPeerId) {
      // If on localhost, default to local peerjs server first for 100% reliable local testing
      initializePeer(!isLocal);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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

  const createMockStream = (label) => {
    addLog(`Creating simulated stream fallback for: ${label}`);
    
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    
    let angle = 0;
    const intervalId = setInterval(() => {
      if (!ctx) return;
      
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1e293b");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Moving visualizer circle
      angle += 0.05;
      const radius = 50 + Math.sin(angle) * 15;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#3b82f6";
      ctx.stroke();
      
      // Telehealth badge
      ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
      ctx.fillRect(40, 40, canvas.width - 80, 50);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, canvas.width - 80, 50);
      
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#22c55e";
      ctx.textAlign = "center";
      ctx.fillText("VIRTUAL VAIDYA Telehealth Session", canvas.width / 2, 72);
      
      // Main label
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 5);
      
      // Subtext
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("(Simulated Stream - Hardware Camera in Use)", canvas.width / 2, canvas.height / 2 + 100);
      ctx.fillText(`Timestamp: ${new Date().toLocaleTimeString()}`, canvas.width / 2, canvas.height / 2 + 130);
    }, 66); // ~15 FPS
    
    const canvasStream = canvas.captureStream ? canvas.captureStream(15) : canvas.webkitCaptureStream(15);
    
    let audioTrack;
    let audioContext;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime); // mute to avoid loud feedback/screeching
      oscillator.connect(gainNode);
      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);
      oscillator.start();
      audioTrack = destination.stream.getAudioTracks()[0];
    } catch (e) {
      addLog(`Failed to create simulated audio track: ${e.message}`);
    }
    
    const mockTracks = [...canvasStream.getVideoTracks()];
    if (audioTrack) {
      mockTracks.push(audioTrack);
    }
    
    const stream = new MediaStream(mockTracks);
    
    // Cleanup helper
    const originalGetTracks = stream.getTracks;
    stream.getTracks = function() {
      const tracks = originalGetTracks.call(this);
      tracks.forEach(track => {
        if (!track.hasOwnProperty('_originalStop')) {
          const originalStop = track.stop;
          track._originalStop = originalStop;
          track.stop = function() {
            clearInterval(intervalId);
            if (audioContext && audioContext.state !== "closed") {
              try { audioContext.close(); } catch (err) {}
            }
            originalStop.call(this);
          };
        }
      });
      return tracks;
    };
    
    return stream;
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
        addLog(`getUserMedia failed (${err.name}: ${err.message}). Falling back to simulated stream...`);
        const stream = createMockStream(isPatient ? "Patient Room Stream" : "Doctor Portal Stream");
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
        addLog(`getUserMedia failed (${err.name}: ${err.message}). Falling back to simulated stream...`);
        const stream = createMockStream(isPatient ? "Patient Room Stream" : "Doctor Portal Stream");
        setLocalStream(stream);
        setCallActive(true);
        
        if (peerRef.current) {
          addLog(`Calling target peer: ${targetPeerId} using mock stream...`);
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
        <style>{`
          body.video-call-active #root,
          body.video-call-active .app-container {
            display: none !important;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
        `}</style>
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

          {/* Floating Diagnostic Logs - Rendered conditionally */}
          {showDebugLogs && (
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
          )}

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
          backgroundColor: "rgba(255, 255, 255, 0.95)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "1.5rem",
          borderTop: "1px solid var(--border-color)",
          animation: "fadeIn 0.3s ease-in-out"
        }}>
          <button 
            onClick={toggleAudio}
            style={{ 
              width: "56px", height: "56px", borderRadius: "50%", 
              backgroundColor: isMuted ? "var(--primary)" : "var(--bg-tertiary)", 
              color: isMuted ? "white" : "var(--text-primary)", 
              border: "1px solid var(--border-color)", 
              cursor: "pointer",
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
              backgroundColor: "var(--danger)", 
              color: "white", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
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
              backgroundColor: isVideoOff ? "var(--primary)" : "var(--bg-tertiary)", 
              color: isVideoOff ? "white" : "var(--text-primary)", 
              border: "1px solid var(--border-color)", 
              cursor: "pointer",
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

  const idleContent = (
    <div 
      style={{
        backgroundColor: "var(--bg-primary)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-color)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        minHeight: "240px",
        padding: "2rem"
      }}
    >
      <div className="text-center" style={{ color: "var(--text-secondary)" }}>
        <Video size={36} style={{ marginBottom: "12px", color: isPatient ? "var(--primary)" : "var(--text-muted)", animation: isPatient ? "pulse 2s infinite" : "none" }} />
        <p style={{ fontSize: "1rem", margin: "0 0 12px 0", fontWeight: "600", color: "var(--text-primary)" }}>
          {isPatient ? "Waiting for doctor to start the call..." : "Video Consultation Room"}
        </p>
        {!isPatient ? (
          <button 
            onClick={initiateCall} 
            className="btn btn-primary animate-pulse-scale" 
            style={{ padding: "0.6rem 2rem", borderRadius: "50px", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 auto", fontWeight: "600" }}
          >
            <Video size={18} /> Start Call
          </button>
        ) : (
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, padding: "0 1.5rem", lineHeight: 1.45 }}>
            Keep this tab open. You will receive a call ring once the doctor initiates the session.
          </p>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );

  if (callActive) {
    return renderOverlay();
  }

  if (incomingCall) {
    return createPortal(
      <div 
        style={{
          position: "fixed",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999999,
          width: "90%",
          maxWidth: "400px",
          backgroundColor: "var(--bg-primary)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          border: "2px solid var(--primary)",
          animation: "pulse-border-red 2s infinite, slideUp 0.3s ease-out",
          boxShadow: "var(--shadow-2xl)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <PhoneCall size={32} color="var(--primary)" style={{ animation: "wiggle 1s infinite" }} />
        <h4 style={{ color: "var(--text-primary)", margin: "10px 0", fontSize: "1rem", fontWeight: "600" }}>Incoming Video Call...</h4>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0 0 1rem 0", textAlign: "center" }}>
          <strong>{targetName || "Doctor"}</strong> is calling you for the consultation.
        </p>
        <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
          <button 
            onClick={answerCall} 
            className="btn btn-primary flex-1 align-center gap-2 justify-content-center" 
            style={{ backgroundColor: "var(--success)", borderColor: "var(--success)", padding: "0.6rem" }}
          >
            <Video size={16} /> Accept
          </button>
          <button 
            onClick={declineCall} 
            className="btn btn-danger flex-1 align-center gap-2 justify-content-center" 
            style={{ padding: "0.6rem" }}
          >
            <PhoneOff size={16} /> Decline
          </button>
        </div>
        <style>{`
          @keyframes wiggle {
            0%, 100% { transform: rotate(-15deg); }
            50% { transform: rotate(15deg); }
          }
          @keyframes pulse-border-red {
            0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); }
            100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
          }
          @keyframes slideUp {
            from { transform: translate(-50%, 20px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  if (hideIdleUI) {
    return null;
  }

  if (portalTarget) {
    return createPortal(idleContent, portalTarget);
  }

  return idleContent;
};

export default VideoCall;
