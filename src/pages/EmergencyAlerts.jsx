import React, { useState } from "react";
import { useHealth } from "../context/HealthContext";
import { ShieldAlert, AlertTriangle, PhoneCall, Volume2, Siren } from "lucide-react";
import { AlertCard } from "../components/CardComponents";

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

    setTitle("");
    setSeverity("medium");
    setDescription("");
    setAction("");
    setShowSimForm(false);
  };

  const emergencyContacts = [
    { title: "National Emergency Line", number: "911", desc: "For life-threatening situations", icon: Siren },
    { title: "MedTech Support Desk", number: "+1 (800) 555-0199", desc: "Clinical portal account assistance", icon: PhoneCall },
    { title: "Poison Control Center", number: "+1 (800) 222-1222", desc: "Chemical or pill ingestion emergencies", icon: AlertTriangle },
    { title: "Crisis Counseling Helpline", number: "988", desc: "24/7 mental health and wellness support", icon: ShieldAlert }
  ];

  return (
    <div className="flex-column gap-6">
      <div className="sos-hero">
        <div className="align-center gap-3">
          <div style={{
            width: 48, height: 48, borderRadius: "var(--radius-md)",
            background: "rgba(239, 68, 68, 0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--danger)"
          }}>
            <Siren size={24} />
          </div>
          <div>
            <h2>Emergency Response Network</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem", margin: 0 }}>
              {alerts.length} active {alerts.length === 1 ? "advisory" : "advisories"} in your region
            </p>
          </div>
        </div>
        <a href="tel:911" className="btn btn-danger align-center gap-2" style={{ padding: "0.65rem 1.25rem" }}>
          <PhoneCall size={16} /> Call 911 Now
        </a>
      </div>

      <div className="page-header">
        <div>
          <h1>Emergency Network Alerts</h1>
          <p className="text-secondary-color">Regional announcements regarding health risks, weather guidelines, and clinical closures.</p>
        </div>
        
        <button 
          onClick={() => setShowSimForm(!showSimForm)} 
          className="btn btn-secondary align-center gap-2"
        >
          <Volume2 size={16} /> Simulate Broadcast
        </button>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="flex-column gap-6">
          {showSimForm && (
            <div className="card" style={{ borderColor: "rgba(251, 191, 36, 0.4)", background: "rgba(251, 191, 36, 0.04)" }}>
              <div className="align-center gap-2 m-b-3" style={{ color: "var(--warning)" }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Simulate Regional Alert Broadcast</h3>
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

                <div className="form-group">
                  <label className="form-label" htmlFor="alert-severity">Severity Level</label>
                  <select 
                    id="alert-severity"
                    className="form-input"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="high">High — Red Banner</option>
                    <option value="medium">Medium — Amber Banner</option>
                    <option value="low">Low — Blue Banner</option>
                  </select>
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
                  <button type="submit" className="btn btn-primary" style={{ background: "linear-gradient(135deg, var(--warning), #d97706)" }}>
                    <Volume2 size={14} /> Broadcast Alert
                  </button>
                </div>
              </form>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Active Advisories</h3>
            <div className="flex-column gap-4">
              {alerts.map(al => (
                <AlertCard key={al.id} alert={al} />
              ))}
              {alerts.length === 0 && (
                <div className="card text-center" style={{ padding: "3rem" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "var(--success-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem", color: "var(--success)"
                  }}>
                    <ShieldAlert size={28} />
                  </div>
                  <h4 style={{ margin: 0 }}>All Clear</h4>
                  <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
                    No active advisories in your region right now.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-column gap-6">
          <div className="card flex-column gap-4">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Urgent Care Hotlines</h3>
            
            <div className="flex-column gap-3">
              {emergencyContacts.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="hotline-card">
                    <div className="flex-between align-center">
                      <div className="align-center gap-2">
                        <Icon size={16} style={{ color: "var(--danger)", opacity: 0.8 }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{c.title}</span>
                      </div>
                      <a 
                        href={`tel:${c.number.replace(/[-\s()]/g, "")}`} 
                        className="hotline-number"
                      >
                        <PhoneCall size={12} /> {c.number}
                      </a>
                    </div>
                    <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}>{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card flex-column gap-3">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Home Preparation Guide</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
              In the event of weather warnings or high air pollution:
            </p>
            <ul style={{ fontSize: "0.82rem", paddingLeft: "0", listStyle: "none" }} className="flex-column gap-2">
              {[
                "Ensure 7-day supply of all critical medications",
                "Keep indoor air conditioner filters clean",
                "Keep physical print-outs of current prescriptions",
                "Maintain contact info of attending doctor"
              ].map((item, i) => (
                <li key={i} className="align-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--primary)", flexShrink: 0
                  }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EmergencyAlerts;
