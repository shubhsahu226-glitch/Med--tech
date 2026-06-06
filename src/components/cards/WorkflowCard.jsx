import React from "react";

export const WorkflowCard = ({ step, title, description }) => {
  return (
    <div className="card flex-column gap-2" style={{ position: "relative", overflow: "hidden" }}>
      <div 
        style={{
          position: "absolute",
          top: "-15px",
          right: "-10px",
          fontSize: "6rem",
          fontWeight: "800",
          color: "var(--bg-tertiary)",
          opacity: 0.4,
          lineHeight: 1,
          pointerEvents: "none"
        }}
      >
        {step}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{title}</h3>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>{description}</p>
      </div>
    </div>
  );
};
