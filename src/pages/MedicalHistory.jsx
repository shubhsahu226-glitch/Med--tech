import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { History, Calendar, User, FileText, ChevronRight, PlusCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const MedicalHistory = () => {
  const { user } = useAuth();
  const { patients } = useHealth();
  
  // Dynamic lookup of patient records to reflect updates made by doctors!
  const currentPatient = patients.find(p => p.id === user.id) || user;
  // Use local state for the history list, fallback to mock data if the Supabase profile has no history yet.
  const [historyList, setHistoryList] = useState(currentPatient.history || (patients[0] ? patients[0].history : []));

  const [filterType, setFilterType] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [type, setType] = useState("General");
  const [notes, setNotes] = useState("");
  const [doctorName, setDoctorName] = useState("");

  const handleAddHistory = (e) => {
    e.preventDefault();
    if (!diagnosis || !notes) return;

    const newRecord = {
      id: `h_${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' }),
      type,
      diagnosis,
      notes,
      doctor: doctorName || "Self-reported"
    };

    // Update the local state so the UI refreshes instantly
    setHistoryList(prev => [newRecord, ...prev]);
    
    // Reset form
    setDiagnosis("");
    setNotes("");
    setDoctorName("");
    setShowAddForm(false);
  };

  const categories = ["All", "Cardiology", "Neurology", "General", "Consultation Review"];
  
  const filteredHistory = historyList.filter(item => {
    if (filterType === "All") return true;
    return item.type.toLowerCase().includes(filterType.toLowerCase()) || 
           item.diagnosis.toLowerCase().includes(filterType.toLowerCase());
  });

  return (
    <div className="flex-column gap-6">
      {/* Page Header */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Unified Clinical Timeline</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>A chronological checklist of your diagnoses, previous consultations, and prescriptions.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn btn-primary"
        >
          <PlusCircle size={16} /> Add Past Record
        </button>
      </div>

      {/* Add Record Modal / Form */}
      {showAddForm && (
        <div className="card">
          <h3 className="m-b-4">Log Medical Event</h3>
          <form onSubmit={handleAddHistory} className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="history-diagnosis">Condition / Diagnosis</label>
              <input 
                type="text" 
                id="history-diagnosis"
                className="form-input" 
                placeholder="e.g. Seasonal Asthma" 
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="history-type">Department / Type</label>
              <select 
                id="history-type"
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>General</option>
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Pediatrics</option>
                <option>Immunization</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label" htmlFor="history-doctor">Attending Physician / Hospital</label>
              <input 
                type="text" 
                id="history-doctor"
                className="form-input" 
                placeholder="Dr. Sarah Jenkins (Optional)" 
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label" htmlFor="history-notes">Clinical Notes & Action Recommended</label>
              <textarea 
                id="history-notes"
                className="form-input" 
                rows="3" 
                placeholder="Prescriptions given, follow up directions, or scan outputs..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>

            <div className="flex-between" style={{ gridColumn: "span 2", marginTop: "1rem" }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Event Log</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: "600",
              backgroundColor: filterType === cat ? "var(--primary-light)" : "transparent",
              color: filterType === cat ? "var(--primary)" : "var(--text-secondary)",
              transition: "all var(--transition-fast)"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Timeline Layout */}
      {filteredHistory.length === 0 ? (
        <div className="card text-center" style={{ padding: "3rem" }}>
          <History size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
          <h4 style={{ margin: 0 }}>No records found for filter</h4>
          <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>Adjust your filters or add a new event to seed the chart.</p>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
          {/* Vertical Timeline Axis */}
          <div 
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "6px",
              width: "2px",
              backgroundColor: "var(--border-color)"
            }}
          />

          <div className="flex-column gap-6">
            {filteredHistory.map((item, index) => (
              <div key={item.id} style={{ position: "relative" }}>
                {/* Timeline node dot */}
                <div 
                  style={{
                    position: "absolute",
                    left: "-1.85rem",
                    top: "6px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    border: "3px solid white",
                    boxShadow: "0 0 0 2px var(--primary-light)"
                  }}
                />

                {/* Timeline card */}
                <div className="card" style={{ padding: "1.25rem" }}>
                  <div className="flex-between flex-wrap gap-2 m-b-2">
                    <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>{item.type}</span>
                    <span className="align-center gap-1 text-muted-color" style={{ fontSize: "0.8rem" }}>
                      <Calendar size={12} /> {item.date}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: "1.05rem", margin: 0 }}>{item.diagnosis}</h3>
                  
                  <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
                    {item.notes}
                  </p>
                  
                  <div 
                    style={{ 
                      marginTop: "0.75rem", 
                      borderTop: "1px dashed var(--border-color)", 
                      paddingTop: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)"
                    }}
                  >
                    <User size={12} />
                    <span>Attending: <strong>{item.doctor}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MedicalHistory;
