import React from "react";

export const FeatureCard = ({ title, description, icon: Icon, color = "var(--primary)" }) => {
  return (
    <div className="card flex-column gap-3" style={{ height: "100%" }}>
      <div 
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-md)",
          backgroundColor: `${color}15`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>{title}</h3>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>{description}</p>
      </div>
    </div>
  );
};
