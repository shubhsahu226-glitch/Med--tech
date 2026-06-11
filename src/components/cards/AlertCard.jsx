import React from "react";
import { ShieldAlert } from "lucide-react";

export const AlertCard = ({ alert }) => {
  const isHigh = alert.severity === "high";
  return (
    <div 
      className="card flex-column gap-3" 
      style={{
        borderLeft: `5px solid ${isHigh ? "var(--danger)" : "var(--warning)"}`,
        backgroundColor: isHigh ? "var(--danger-light)" : "var(--warning-light)"
      }}
    >
      <div className="flex-between">
        <div className="align-center gap-2">
          <ShieldAlert size={18} style={{ color: isHigh ? "var(--danger)" : "var(--warning)" }} />
          <h4 style={{ fontSize: "1rem", margin: 0, color: isHigh ? "var(--danger-dark)" : "var(--warning-dark)" }}>
            {alert.title}
          </h4>
        </div>
        <span className={`badge ${isHigh ? "badge-danger" : "badge-warning"}`}>
          {alert.severity} Alert
        </span>
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{alert.description}</p>
      <div style={{ padding: "0.75rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)", fontSize: "0.8rem" }}>
        <strong>Required Action:</strong> {alert.action}
      </div>
    </div>
  );
};
