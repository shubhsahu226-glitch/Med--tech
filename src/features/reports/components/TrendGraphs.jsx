import React, { useState, useMemo } from "react";
import { Activity, Info } from "lucide-react";

export const TrendGraphs = ({ trendsData = [] }) => {
  // Available standard medical trackers
  const trackerMeta = {
    glucose: { label: "Fasting Blood Sugar", color: "#f43f5e", defaultMin: 70, defaultMax: 150, unit: "mg/dL" },
    ldl: { label: "LDL Cholesterol", color: "#e11d48", defaultMin: 60, defaultMax: 180, unit: "mg/dL" },
    systolic: { label: "Systolic Blood Pressure", color: "#be123c", defaultMin: 90, defaultMax: 160, unit: "mmHg" },
    creatinine: { label: "Serum Creatinine", color: "#fda4af", defaultMin: 0.5, defaultMax: 1.5, unit: "mg/dL" },
    hemoglobin: { label: "Hemoglobin", color: "#f43f5e", defaultMin: 10, defaultMax: 18, unit: "g/dL" }
  };

  const [activeMetricKey, setActiveMetricKey] = useState("glucose");

  // Determine what parameters are actually available in the trendsData
  const availableMetrics = useMemo(() => {
    const keys = new Set();
    trendsData.forEach(point => {
      Object.keys(point).forEach(k => {
        if (k !== "date" && k !== "month" && trackerMeta[k]) {
          keys.add(k);
        }
      });
    });
    
    // Fallback if none found
    if (keys.size === 0) {
      keys.add("glucose");
      keys.add("ldl");
      keys.add("systolic");
    }
    return Array.from(keys);
  }, [trendsData]);

  // Ensure active metric key is valid, otherwise set to first available
  const metricKey = availableMetrics.includes(activeMetricKey) ? activeMetricKey : availableMetrics[0];
  const activeMeta = trackerMeta[metricKey] || { label: "Biomarker", color: "#3b82f6", defaultMin: 0, defaultMax: 100, unit: "" };

  // Filter history points that have values for the active metric
  const chartPoints = useMemo(() => {
    return trendsData
      .map((d, index) => {
        const val = d[metricKey];
        return {
          month: d.month || `P${index + 1}`,
          date: d.date || "Unknown Date",
          val: val !== undefined ? parseFloat(val) : null
        };
      })
      .filter(p => p.val !== null);
  }, [trendsData, metricKey]);

  if (trendsData.length === 0 || chartPoints.length === 0) {
    return (
      <div className="flex-column flex-center text-center" style={{ padding: "3rem 1rem", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-md)" }}>
        <Activity size={32} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
        <h4 style={{ margin: 0 }}>No historical graph data ready</h4>
        <p className="text-secondary-color" style={{ fontSize: "0.8rem", maxWidth: "300px", marginTop: "0.25rem" }}>
          Upload multiple reports to begin plotting trends over time.
        </p>
      </div>
    );
  }

  // Setup Dimensions for SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute min/max limits for scaling SVG Y axis
  const values = chartPoints.map(p => p.val);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  
  const yMin = Math.min(activeMeta.defaultMin, Math.max(0, minVal - (maxVal - minVal) * 0.25));
  const yMax = Math.max(activeMeta.defaultMax, maxVal + (maxVal - minVal) * 0.25);
  const yRange = yMax - yMin === 0 ? 1 : yMax - yMin;

  // Build points for SVG rendering
  const svgPoints = chartPoints.map((p, i) => {
    // Map X index to SVG width
    const x = paddingLeft + (chartPoints.length > 1 ? (i * chartWidth) / (chartPoints.length - 1) : chartWidth / 2);
    // Map Y value to SVG height (reversed, 0 is at top)
    const ratio = (p.val - yMin) / yRange;
    const cappedRatio = Math.max(0, Math.min(1, ratio));
    const y = paddingTop + chartHeight * (1 - cappedRatio);
    return { x, y, val: p.val, month: p.month, date: p.date };
  });

  // SVG path definitions
  const pathD = svgPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = svgPoints.length > 0
    ? `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${paddingTop + chartHeight} L ${svgPoints[0].x} ${paddingTop + chartHeight} Z`
    : "";

  return (
    <div className="flex-column gap-4">
      {/* Selector Tabs */}
      <div className="flex-between flex-wrap gap-3" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Laboratories Chronological Trends</h3>
          <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>Review clinical biomarker changes over checkups</p>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", background: "var(--bg-secondary)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
          {availableMetrics.map(key => {
            const label = trackerMeta[key]?.label || key;
            const isActive = metricKey === key;
            return (
              <button
                key={key}
                onClick={() => setActiveMetricKey(key)}
                style={{
                  fontSize: "0.7rem",
                  padding: "0.4rem 0.8rem",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: "600",
                  backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                  transition: "all var(--transition-fast)"
                }}
              >
                {label.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="chart-container" style={{ position: "relative", backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: "visible" }}>
          {/* Horizontal Grid lines with ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + chartHeight * ratio;
            const labelVal = (yMax - ratio * yRange).toFixed(metricKey === "creatinine" ? 1 : 0);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text x={paddingLeft - 10} y={y + 4} textAnchor="end" style={{ fontSize: "10px", fill: "var(--text-muted)", fontWeight: "500" }}>
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Timeline points labels on X Axis */}
          {svgPoints.map((p, i) => (
            <text key={i} x={p.x} y={height - 10} textAnchor="middle" style={{ fontSize: "10px", fill: "var(--text-muted)", fontWeight: "500" }}>
              {p.month}
            </text>
          ))}

          {/* Shaded Area fill under graph curve */}
          {areaD && (
            <path
              d={areaD}
              fill={`url(#gradient-${metricKey})`}
              opacity="0.15"
            />
          )}

          {/* Main line path curve */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={activeMeta.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Circular node points with click events */}
          {svgPoints.map((p, i) => (
            <g key={i} className="chart-point-group" style={{ cursor: "pointer" }}>
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="white"
                stroke={activeMeta.color}
                strokeWidth="2.5"
                onClick={() => alert(`Inspection details:\n- Biomarker: ${activeMeta.label}\n- Date: ${p.date}\n- Value: ${p.val} ${activeMeta.unit}`)}
              />
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  fill: "var(--text-primary)",
                  padding: "2px"
                }}
              >
                {p.val}
              </text>
            </g>
          ))}

          {/* Definition of shading gradients */}
          <defs>
            <linearGradient id={`gradient-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeMeta.color} />
              <stop offset="100%" stopColor={activeMeta.color} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Graph Details / Guide */}
      <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${activeMeta.color}` }}>
        <Info size={16} style={{ color: activeMeta.color, flexShrink: 0, marginTop: "2px" }} />
        <p style={{ fontSize: "0.75rem", margin: 0, color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Currently showing historical logs of <strong>{activeMeta.label}</strong> ({activeMeta.unit}). 
          Normal standard benchmark range: <strong>{activeMeta.defaultMin} - {activeMeta.defaultMax} {activeMeta.unit}</strong>.
          Nodes represent specific checkup files. Click any circular node above to view exact clinical records date.
        </p>
      </div>
    </div>
  );
};

export default TrendGraphs;
