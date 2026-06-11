import React from "react";
import { Sparkles } from "lucide-react";

export const ReportSummaryCard = ({ report }) => {
  return (
    <div className="card flex-column gap-4">
      <div className="flex-between">
        <div className="align-center gap-2">
          <Sparkles size={18} style={{ color: "var(--primary)" }} />
          <h4 style={{ margin: 0 }}>AI Health Insights</h4>
        </div>
        <span className="text-muted-color" style={{ fontSize: "0.8rem" }}>{report.date}</span>
      </div>
      
      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        {report.aiSummary}
      </p>
      
      <div>
        <h5 className="m-b-2" style={{ fontSize: "0.85rem", fontWeight: "600" }}>Biometric Metrics Checked:</h5>
        <div className="grid-2" style={{ gap: "0.75rem" }}>
          {report.metrics && report.metrics.map((m, idx) => {
            const statusStr = m.status ? String(m.status).toLowerCase() : "unknown";
            const isAbnormal = statusStr.includes("abnormal") || statusStr.includes("high") || statusStr.includes("low");
            return (
              <div 
                key={idx} 
                style={{ 
                  padding: "0.75rem", 
                  backgroundColor: isAbnormal ? "var(--danger-light)" : "var(--bg-secondary)", 
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isAbnormal ? "var(--danger)" : "var(--border-color)"}`
                }}
              >
                <div className="flex-between m-b-1">
                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: isAbnormal ? "var(--danger-dark)" : "var(--text-primary)" }}>
                    {m.name || "Unknown Metric"}
                  </span>
                  <span className={`badge ${isAbnormal ? "badge-danger" : "badge-success"}`} style={{ fontSize: "0.65rem" }}>
                    {m.status || "Unknown"}
                  </span>
                </div>
                <div className="align-center gap-1">
                  <span style={{ fontSize: "1.25rem", fontWeight: "700" }}>{m.value !== undefined ? m.value : "--"}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.unit || ""}</span>
                </div>
                {(m.min !== undefined && m.max !== undefined) && (
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Ref: {m.min} - {m.max}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
