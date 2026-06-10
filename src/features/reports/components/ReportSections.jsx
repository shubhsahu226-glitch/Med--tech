import React from "react";
import { Droplet, Flame, Heart, ShieldAlert, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

// Mini Sparkline Graph Preview Component
const MiniSparkline = ({ data, color = "#3b82f6" }) => {
  if (!data || data.length < 2) {
    return (
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>
        No historical trends
      </span>
    );
  }

  const width = 80;
  const height = 25;
  const padding = 2;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - ((val - min) * (height - padding * 2)) / range;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="align-center gap-2" style={{ marginLeft: "auto" }}>
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Draw a small endpoint dot */}
        {data.length > 0 && (
          <circle
            cx={padding + ((data.length - 1) * (width - padding * 2)) / (data.length - 1)}
            cy={height - padding - ((data[data.length - 1] - min) * (height - padding * 2)) / range}
            r="2.5"
            fill={color}
          />
        )}
      </svg>
    </div>
  );
};

export const ReportSections = ({ report, trendsData = [] }) => {
  if (!report) return null;

  const metrics = report.metrics || [];

  // Grouping rules helper (for backward compatibility if sections aren't pre-grouped by backend)
  const categorizeMetric = (name = "") => {
    const n = name.toLowerCase();
    if (
      n.includes("hemoglobin") ||
      n.includes("wbc") ||
      n.includes("rbc") ||
      n.includes("platelet") ||
      n.includes("blood count") ||
      n.includes("hematocrit") ||
      n.includes("mch") ||
      n.includes("mcv")
    ) {
      return "Blood";
    }
    if (n.includes("glucose") || n.includes("sugar") || n.includes("hba1c") || n.includes("glycemic")) {
      return "Sugar";
    }
    if (
      n.includes("cholesterol") ||
      n.includes("lipid") ||
      n.includes("ldl") ||
      n.includes("hdl") ||
      n.includes("triglyceride") ||
      n.includes("vldl")
    ) {
      return "Lipid";
    }
    if (
      n.includes("creatinine") ||
      n.includes("urea") ||
      n.includes("uric") ||
      n.includes("bun") ||
      n.includes("kidney") ||
      n.includes("renal")
    ) {
      return "Kidney";
    }
    return "Other";
  };

  // Group metrics by section
  const sectionsMap = {
    Blood: { title: "Blood Health Panel", icon: <Droplet size={18} color="#ef4444" />, metrics: [] },
    Sugar: { title: "Glycemic / Sugar Control", icon: <Flame size={18} color="#f59e0b" />, metrics: [] },
    Lipid: { title: "Lipid Profile", icon: <Heart size={18} color="#ec4899" />, metrics: [] },
    Kidney: { title: "Renal / Kidney Panel", icon: <ShieldAlert size={18} color="#8b5cf6" />, metrics: [] },
    Other: { title: "Other Clinical Diagnostics", icon: <FileText size={18} color="#6b7280" />, metrics: [] }
  };

  // Populate sections using structured data or fallback dynamic classification
  if (report.sections && report.sections.length > 0) {
    report.sections.forEach(sec => {
      const name = sec.section_name || "Other";
      const groupKey = sectionsMap[name] ? name : "Other";
      sectionsMap[groupKey].metrics.push(...(sec.metrics || []));
    });
  } else {
    // Dynamic fallback grouping
    metrics.forEach(m => {
      const cat = categorizeMetric(m.name);
      sectionsMap[cat].metrics.push(m);
    });
  }

  // Helper to extract historical timeline values for a given parameter name
  const getParamHistoryData = (paramName) => {
    const key = paramName.toLowerCase().replace("blood", "").replace("fasting", "").replace("test", "").replace(" ", "_").replace(/^_+|_+$/g, "");
    const fallbackKey = paramName.toLowerCase().replace(" ", "_");

    return trendsData
      .map(point => point[key] || point[fallbackKey])
      .filter(val => val !== undefined && val !== null);
  };

  return (
    <div className="flex-column gap-6">
      {Object.entries(sectionsMap).map(([key, section]) => {
        if (section.metrics.length === 0) return null;

        return (
          <div key={key} className="card flex-column gap-4" style={{ padding: "1.25rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)" }}>
            {/* Section Header */}
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <div className="align-center gap-2">
                {section.icon}
                <h3 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>{section.title}</h3>
              </div>
              <span className="badge badge-info" style={{ fontSize: "0.7rem", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {section.metrics.length} {section.metrics.length === 1 ? "Marker" : "Markers"}
              </span>
            </div>

            {/* Grid of Metric Cards */}
            <div className="grid-2" style={{ gap: "1rem" }}>
              {section.metrics.map((m, idx) => {
                const statusStr = m.status ? String(m.status).toLowerCase() : "unknown";
                const isHigh = statusStr.includes("high");
                const isLow = statusStr.includes("low");
                const isAbnormal = statusStr.includes("abnormal") || isHigh || isLow;
                
                // Color theme based on clinical status
                let badgeClass = "badge-success";
                let cardStyle = { backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" };
                let valColor = "var(--text-primary)";
                let trendColor = "#3b82f6"; // default blue

                if (isHigh) {
                  badgeClass = "badge-danger";
                  cardStyle = { backgroundColor: "#fef2f2", border: "1px solid #fee2e2" }; // light red
                  valColor = "#ef4444";
                  trendColor = "#ef4444";
                } else if (isLow) {
                  badgeClass = "badge-info";
                  cardStyle = { backgroundColor: "#eff6ff", border: "1px solid #dbeafe" }; // light blue
                  valColor = "#3b82f6";
                  trendColor = "#3b82f6";
                } else if (isAbnormal) {
                  badgeClass = "badge-danger";
                  cardStyle = { backgroundColor: "#fffbeb", border: "1px solid #fef3c7" }; // light amber
                  valColor = "#d97706";
                  trendColor = "#f59e0b";
                }

                const paramHistory = getParamHistoryData(m.name);

                return (
                  <div key={idx} className="flex-column gap-2" style={{ padding: "1rem", borderRadius: "var(--radius-md)", ...cardStyle, transition: "transform var(--transition-fast)" }}>
                    <div className="flex-between">
                      <span style={{ fontSize: "0.8rem", fontWeight: "600", color: isAbnormal ? valColor : "var(--text-secondary)" }}>
                        {m.name}
                      </span>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: "0.6rem", padding: "0.2rem 0.5rem" }}>
                        {m.status || "Normal"}
                      </span>
                    </div>

                    <div className="flex-between flex-wrap gap-2" style={{ marginTop: "0.25rem" }}>
                      <div className="align-center gap-1">
                        <span style={{ fontSize: "1.35rem", fontWeight: "700", color: isAbnormal ? valColor : "var(--text-primary)" }}>
                          {m.value !== undefined ? m.value : "--"}
                        </span>
                        <span className="text-secondary-color" style={{ fontSize: "0.75rem" }}>{m.unit}</span>
                      </div>
                      
                      {/* Mini Sparkline Graph Preview */}
                      <MiniSparkline data={paramHistory} color={trendColor} />
                    </div>

                    {(m.min !== undefined && m.max !== undefined && m.min !== null && m.max !== null) ? (
                      <div className="text-muted-color" style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>
                        Reference Range: {m.min} - {m.max} {m.unit}
                      </div>
                    ) : (
                      <div className="text-muted-color" style={{ fontSize: "0.65rem", marginTop: "0.25rem" }}>
                        Reference Range: Clinical discretion
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportSections;
