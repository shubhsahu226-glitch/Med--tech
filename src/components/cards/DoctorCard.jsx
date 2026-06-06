import React from "react";

export const DoctorCard = ({ doctor, onBookClick, onProfileClick }) => {
  return (
    <div className="card flex-column gap-4">
      <div className="align-center gap-3">
        <img 
          src={doctor.image} 
          alt={doctor.name} 
          style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }}
        />
        <div>
          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{doctor.name}</h3>
          <p style={{ color: "var(--primary)", fontSize: "0.875rem", fontWeight: "600" }}>{doctor.specialty}</p>
          <div className="align-center gap-1" style={{ fontSize: "0.8rem", color: "var(--warning)" }}>
            <span>★</span>
            <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{doctor.rating}</span>
            <span style={{ color: "var(--text-muted)" }}>({doctor.reviews} reviews)</span>
          </div>
        </div>
      </div>
      
      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <p><strong>Education:</strong> {doctor.education}</p>
        <p><strong>Experience:</strong> {doctor.experience}</p>
        <p><strong>Fee:</strong> {doctor.consultationFee}</p>
      </div>
      
      <div className="flex-between gap-3">
        <button onClick={onProfileClick} className="btn btn-secondary w-full" style={{ fontSize: "0.85rem", padding: "0.5rem" }}>View Info</button>
        <button onClick={onBookClick} className="btn btn-primary w-full" style={{ fontSize: "0.85rem", padding: "0.5rem" }}>Book Slot</button>
      </div>
    </div>
  );
};
