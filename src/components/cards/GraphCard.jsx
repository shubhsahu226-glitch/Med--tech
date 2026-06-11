import React, { useState } from "react";

export const GraphCard = ({ trendsData }) => {
  const [metric, setMetric] = useState("ldl"); // ldl, glucose, systolic
  
  if (!trendsData || trendsData.length === 0) return null;

  const metricMeta = {
    ldl: { label: "LDL Cholesterol", color: "#3b82f6", minVal: 80, maxVal: 180, unit: "mg/dL" },
    glucose: { label: "Fasting Sugar", color: "#10b981", minVal: 70, maxVal: 160, unit: "mg/dL" },
    systolic: { label: "Systolic Blood Pressure", color: "#ef4444", minVal: 100, maxVal: 150, unit: "mmHg" }
  };

  const currentMeta = metricMeta[metric];
  
  // Custom SVG calculation parameters
  const width = 600;
  const height = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  // Calculate SVG points path
  const points = trendsData.map((d, i) => {
    const val = d[metric];
    // Map X to SVG space
    const x = paddingLeft + (i * chartWidth) / (trendsData.length - 1);
    // Map Y to SVG space (inverted: 0 is at top)
    const ratio = (val - currentMeta.minVal) / (currentMeta.maxVal - currentMeta.minVal);
    const cappedRatio = Math.max(0, Math.min(1, ratio));
    const y = paddingTop + chartHeight * (1 - cappedRatio);
    return { x, y, val, month: d.month };
  });

  // Generate SVG path string (d)
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Generate shaded area below line
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="card flex-column gap-4">
      <div className="flex-between flex-wrap gap-2">
        <div>
          <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Report Laboratory Trends</h3>
          <p className="text-muted-color" style={{ fontSize: "0.8rem" }}>Interactive historical graph of reports</p>
        </div>
        
        {/* Metric Selector Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-secondary)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
          {Object.entries(metricMeta).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              style={{
                fontSize: "0.75rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                fontWeight: "600",
                backgroundColor: metric === key ? "var(--primary-light)" : "transparent",
                color: metric === key ? "var(--primary)" : "var(--text-secondary)",
                boxShadow: metric === key ? "var(--shadow-sm)" : "none",
                transition: "all var(--transition-fast)"
              }}
            >
              {value.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
      
      {/* SVG Plotter */}
      <div className="chart-container" style={{ marginTop: "1rem" }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const val = Math.round(currentMeta.maxVal - ratio * (currentMeta.maxVal - currentMeta.minVal));
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" style={{ fontSize: "10px", fill: "var(--text-muted)" }}>
                  {val}
                </text>
              </g>
            );
          })}

          {/* Month Labels on X Axis */}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height - 15} textAnchor="middle" style={{ fontSize: "10px", fill: "var(--text-muted)", fontWeight: "500" }}>
              {p.month}
            </text>
          ))}

          {/* Shaded Area */}
          <path d={areaD} className="chart-line-bg" fill={currentMeta.color} />

          {/* Core Plotting Line */}
          <path d={pathD} className="chart-line" stroke={currentMeta.color} />

          {/* Hover Points with Custom Callouts */}
          {points.map((p, i) => (
            <g key={i} className="chart-point-group">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={5} 
                className="chart-point" 
                stroke={currentMeta.color}
                onClick={() => alert(`${currentMeta.label} in ${p.month}: ${p.val} ${currentMeta.unit}`)}
              />
              <text 
                x={p.x} 
                y={p.y - 12} 
                textAnchor="middle" 
                style={{ 
                  fontSize: "10px", 
                  fontWeight: "700", 
                  fill: "var(--text-primary)" 
                }}
              >
                {p.val}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex-center" style={{ gap: "1.5rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        <div className="align-center gap-1">
          <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: currentMeta.color, display: "inline-block" }}></span>
          <span>Active Metric: <strong>{currentMeta.label} ({currentMeta.unit})</strong></span>
        </div>
        <div>
          <span>Click a node point to inspect detailed logs</span>
        </div>
      </div>
    </div>
  );
};
