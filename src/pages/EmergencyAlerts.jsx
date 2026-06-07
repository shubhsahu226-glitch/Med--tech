import React, { useState } from "react";
import { useHealth } from "../context/HealthContext";
import { ShieldAlert, AlertTriangle, PhoneCall, PlusCircle, Volume2 } from "lucide-react";
import { AlertCard } from "../components/cards";

export const EmergencyAlerts = () => {
  const { alerts, triggerEmergencyAlert } = useHealth();
  
  const [showSimForm, setShowSimForm] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!title || !description || !action) return;

    triggerEmergencyAlert(title, severity, description, action);
    
    try {
      await fetch("http://localhost:8000/api/trigger-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: "Broadcast", location: { lat: 37.77, lng: -122.41 } })
      });
    } catch (err) {
      console.error("Backend SOS error:", err);
    }

    // Reset Form
    setTitle("");
    setSeverity("medium");
    setDescription("");
    setAction("");
    setShowSimForm(false);
  };

  const emergencyContacts = [
    { title: "National Emergency Line", number: "911", desc: "For life-threatening situations" },
    { title: "MedTech Support Desk", number: "+1 (800) 555-0199", desc: "For clinical portal account assist" },
    { title: "Poison Control Center", number: "+1 (800) 222-1222", desc: "Chemical or pill ingestion emergencies" },
    { title: "Crisis Counseling Helpline", number: "988", desc: "24/7 mental health and wellness support" }
  ];

  return (
    <div className="flex-column gap-6">
      {/* Page Header */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Emergency Network Alerts</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Regional announcements regarding local health risks, weather guidelines, and clinical closures.</p>
        </div>
        
        <button 
          onClick={() => setShowSimForm(!showSimForm)} 
          className="btn btn-secondary align-center gap-2"
        >
          <Volume2 size={16} /> Simulate Network Broadcast
        </button>
      </div>

      {/* Split Layout: Alerts list vs Hotlines */}
      <div className="split-layout split-layout-2-1">
        
        {/* Left Column: Active Advisories */}
        <div className="flex-column gap-6">
          
          {/* Simulation Form Panel */}
          {showSimForm && (
            <div className="card" style={{ borderColor: "var(--warning)" }}>
              <div className="align-center gap-2 m-b-3" style={{ color: "var(--warning-dark)" }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Simulate regional alert broadcast</h3>
              </div>
              <form onSubmit={handleSimulate} className="flex-column gap-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="alert-title">Advisory Title</label>
                  <input 
                    type="text" 
                    id="alert-title"
                    className="form-input" 
                    placeholder="e.g. Air Quality Notice (AQI 150+)" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="alert-severity">Severity Level</label>
                    <select 
                      id="alert-severity"
                      className="form-input"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      <option value="high">High (Red Banner)</option>
                      <option value="medium">Medium (Amber Banner)</option>
                      <option value="low">Low (Blue Banner)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="alert-desc">Detailed Description</label>
                  <textarea 
                    id="alert-desc"
                    className="form-input" 
                    rows="2" 
                    placeholder="Provide details about the local conditions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="alert-action">Required Action</label>
                  <input 
                    type="text" 
                    id="alert-action"
                    className="form-input" 
                    placeholder="e.g. Wear masks outdoors; keep inhalers ready." 
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    required
                  />
                </div>

                <div className="flex-between m-t-2">
                  <button type="button" onClick={() => setShowSimForm(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: "var(--warning)", color: "var(--text-primary)" }}>Broadcast Alert</button>
                </div>
              </form>
            </div>
          )}

          {/* Active Advisories Checklist */}
          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Active Advisories</h3>
            <div className="flex-column gap-4">
              {alerts.map(al => (
                <AlertCard key={al.id} alert={al} />
              ))}
              {alerts.length === 0 && (
                <div className="card text-center" style={{ padding: "3rem" }}>
                  <ShieldAlert size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
                  <h4 style={{ margin: 0 }}>No Active Advisories</h4>
                  <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>Regional channels are currently fully clear.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Emergency Contacts & Quick Actions */}
        <div className="flex-column gap-6">
          
          {/* Hotline Listing card */}
          <div className="card flex-column gap-4">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Urgent Care Hotlines</h3>
            
            <div className="flex-column gap-3">
              {emergencyContacts.map((c, i) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: "0.75rem", 
                    borderRadius: "var(--radius-md)", 
                    border: "1px solid var(--border-color)", 
                    backgroundColor: "white" 
                  }}
                >
                  <div className="flex-between">
                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{c.title}</span>
                    <a 
                      href={`tel:${c.number.replace(/[-\s()]/g, "")}`} 
                      className="align-center gap-1 font-semibold" 
                      style={{ color: "var(--danger)", fontSize: "0.85rem" }}
                    >
                      <PhoneCall size={12} /> {c.number}
                    </a>
                  </div>
                  <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Kit Checklists */}
          <div className="card flex-column gap-3">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Home Preparation Guide</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
              In the event of weather warnings or high air pollution:
            </p>
            <ul style={{ fontSize: "0.8rem", paddingLeft: "1.25rem", color: "var(--text-secondary)" }} className="flex-column gap-1">
              <li>Ensure 7-day supply of all critical medications.</li>
              <li>Keep filters on indoor air conditioners clean.</li>
              <li>Keep physical print-outs of current prescriptions.</li>
              <li>Maintain contact info of attending doctor.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
export default EmergencyAlerts;
