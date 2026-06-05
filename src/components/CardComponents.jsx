import React, { useState } from "react";
import { 
  Heart, Calendar, Clock, Award, ShieldAlert, 
  Sparkles, FileText, CheckCircle2, AlertCircle, ChevronRight, Video, MessageSquare 
} from "lucide-react";
import { Link } from "react-router-dom";

// Feature Card - For Homepage and lists
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

// Workflow Card - Steps explaining how the system works
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

// Doctor Card - For Search & Doctor Profiles
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

// Appointment Card - Schedule widgets
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
        
        {appointment.status === "Upcoming" && (
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

// Reminder Card - Medication tracker list items
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

// Alert Card - Notification messages
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
      <div style={{ padding: "0.75rem", background: "white", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)", fontSize: "0.8rem" }}>
        <strong>Required Action:</strong> {alert.action}
      </div>
    </div>
  );
};

// Report Summary Card - AI Summary View
export const ReportSummaryCard = ({ report }) => {
  return (
    <div className="card flex-column gap-4" style={{ backgroundColor: "white" }}>
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
          {report.metrics.map((m, idx) => {
            const isAbnormal = m.status.toLowerCase().includes("abnormal") || m.status.toLowerCase().includes("high") && !m.status.toLowerCase().includes("normal");
            return (
              <div 
                key={idx} 
                style={{ 
                  padding: "0.75rem", 
                  borderRadius: "var(--radius-md)", 
                  background: "var(--bg-secondary)",
                  border: isAbnormal ? "1px solid var(--danger)" : "1px solid var(--border-color)"
                }}
              >
                <div className="flex-between m-b-1">
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{m.name}</span>
                  <span className={`badge ${isAbnormal ? "badge-danger" : "badge-success"}`} style={{ fontSize: "0.65rem" }}>
                    {m.status}
                  </span>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                  {m.value} <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "var(--text-muted)" }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  Range: {m.min} - {m.max}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Graph Card - Custom interactive SVG graph plotter
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
                backgroundColor: metric === key ? "white" : "transparent",
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
                  fill: "var(--text-primary)", 
                  background: "white" 
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
