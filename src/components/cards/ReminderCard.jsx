import React from "react";
import { CheckCircle2 } from "lucide-react";

export const ReminderCard = ({ reminder, onToggle, onDelete }) => {
  return (
    <div 
      className="card flex-between" 
      style={{
        padding: "1rem",
        opacity: reminder.taken ? 0.75 : 1,
        transition: "all var(--transition-fast)"
      }}
    >
      <div className="align-center gap-3">
        <button 
          onClick={onToggle} 
          style={{
            color: reminder.taken ? "var(--success)" : "var(--border-color)",
            transition: "color var(--transition-fast)"
          }}
          aria-label={reminder.taken ? "Mark medication as not taken" : "Mark medication as taken"}
        >
          <CheckCircle2 size={24} fill={reminder.taken ? "var(--success-light)" : "none"} />
        </button>
        <div>
          <h4 style={{ 
            fontSize: "0.95rem", 
            margin: 0,
            textDecoration: reminder.taken ? "line-through" : "none",
            color: reminder.taken ? "var(--text-muted)" : "var(--text-primary)"
          }}>
            {reminder.name}
          </h4>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {reminder.dosage} | {reminder.frequency}
          </p>
        </div>
      </div>
      
      <div className="align-center gap-4">
        <span className="badge badge-info" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
          {reminder.time}
        </span>
        {onDelete && (
          <button onClick={onDelete} className="btn-text" style={{ fontSize: "0.8rem", color: "var(--danger)" }}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
