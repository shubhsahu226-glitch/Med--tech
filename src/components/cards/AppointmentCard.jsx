import React from "react";
import { Calendar, Clock, Video, MessageSquare } from "lucide-react";

export const AppointmentCard = ({ appointment, onStartConsultation, isDoctor = false }) => {
  return (
    <div className="card flex-column gap-3" style={{ borderLeft: "4px solid var(--primary)" }}>
      <div className="flex-between">
        <div className="align-center gap-2">
          {appointment.meetingType === "Video" ? <Video size={16} /> : <MessageSquare size={16} />}
          <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{appointment.meetingType} Call</span>
        </div>
        <span className="badge badge-info">{appointment.status}</span>
      </div>
      
      <div>
        <h4 style={{ fontSize: "1rem", margin: 0 }}>
          {isDoctor ? `Patient: ${appointment.patientName}` : `Doctor: ${appointment.doctorName}`}
        </h4>
        {!isDoctor && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{appointment.doctorSpecialty}</p>}
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
          <strong>Reason:</strong> {appointment.reason}
        </p>
      </div>
      
      <div 
        className="flex-between m-t-2" 
        style={{
          borderTop: "1px solid var(--border-color)",
          paddingTop: "0.75rem",
          fontSize: "0.85rem"
        }}
      >
        <div className="align-center gap-3">
          <span className="align-center gap-1"><Calendar size={14} /> {appointment.date}</span>
          <span className="align-center gap-1"><Clock size={14} /> {appointment.time}</span>
        </div>
        
        {(appointment.status === "Upcoming" || appointment.status === "Confirmed") && (
          <button 
            onClick={onStartConsultation} 
            className="btn btn-primary animate-pulse" 
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
};
