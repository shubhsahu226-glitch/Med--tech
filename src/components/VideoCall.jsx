import React, { useState, useEffect, useRef } from "react";
import Peer from "peerjs";
import { Video, PhoneOff } from "lucide-react";

const VideoCall = ({ myPeerId, targetPeerId, targetName }) => {
  const [callActive, setCallActive] = useState(false);
  const [peerInstance, setPeerInstance] = useState(null);

  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Initialize PeerJS
  useEffect(() => {
    if (!peerInstance && myPeerId) {
      const peer = new Peer(myPeerId);
      
      peer.on("open", (id) => {
        console.log("Peer initialized with ID:", id);
      });

      peer.on("call", (call) => {
        // Answer incoming call
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            call.answer(stream);
            setCallActive(true);
            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
          })
          .catch(err => console.error("Failed to get local stream", err));
      });

      setPeerInstance(peer);
    }
    
    return () => {
      if (peerInstance) {
        peerInstance.destroy();
        setPeerInstance(null);
        setCallActive(false);
      }
    };
  }, [myPeerId]);

  const initiateCall = () => {
    if (!targetPeerId) return;
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setCallActive(true);
        
        if (peerInstance) {
          const call = peerInstance.call(targetPeerId, stream);
          if (call) {
            call.on("stream", (remoteStream) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
            });
          }
        }
      })
      .catch(err => console.error("Failed to get local stream", err));
  };

  const endCall = () => {
    setCallActive(false);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  return (
    <div 
      style={{
        backgroundColor: "#1e293b",
        height: "140px",
        borderRadius: "var(--radius-md)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {callActive ? (
        <>
          <video 
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#000" }}
          />
          <div style={{ position: "absolute", bottom: "8px", left: "8px", color: "white", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "0.2rem 0.5rem", borderRadius: "3px" }}>
            {targetName || "Target"} (Live Video)
          </div>
          
          {/* Local PIP Video */}
          <div 
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              width: "36px",
              height: "48px",
              backgroundColor: "#475569",
              borderRadius: "3px",
              border: "1px solid white",
              overflow: "hidden"
            }}
          >
            <video 
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          
          <button 
            onClick={endCall}
            className="btn btn-danger" 
            style={{ position: "absolute", top: "8px", right: "8px", padding: "0.3rem", borderRadius: "50%", width: "26px", height: "26px" }}
            title="Disconnect Call"
          >
            <PhoneOff size={12} />
          </button>
        </>
      ) : (
        <div className="text-center" style={{ color: "#94a3b8" }}>
          <Video size={20} />
          <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>Video stream offline</p>
          <button onClick={initiateCall} className="btn btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", marginTop: "0.5rem" }}>
            Connect Video Feed
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
