import React, { useState } from "react";
import { useHealth } from "../context/HealthContext";
import { Clock, Plus, CheckCircle2, AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { ReminderCard } from "../components/cards";

export const MedicationReminder = () => {
  const { reminders, addReminder, toggleReminder, deleteReminder } = useHealth();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily (Morning)");
  const [time, setTime] = useState("08:00 AM");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !dosage) return;

    addReminder(name, dosage, frequency, time);
    
    // Reset form
    setName("");
    setDosage("");
    setFrequency("Once daily (Morning)");
    setTime("08:00 AM");
    setShowForm(false);
  };

  const completedCount = reminders.filter(r => r.taken).length;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }} className="flex-column gap-6">
      {/* Header */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Medication Schedule & Tracker</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Keep track of daily dosages, pill schedules, and intake history.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
        >
          <PlusCircle size={16} /> Add Medication
        </button>
      </div>

      {/* Progress Card */}
      <div className="card align-center flex-between" style={{ padding: "1.25rem", background: "var(--primary-light)", borderColor: "rgba(59, 130, 246, 0.1)" }}>
        <div className="align-center gap-3">
          <div style={{ color: "var(--primary)" }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem" }}>Today's Progress Checklist</h4>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
              You have taken <strong>{completedCount}</strong> of <strong>{reminders.length}</strong> scheduled medications.
            </p>
          </div>
        </div>
        
        {/* Progress Bar Circle/Bar */}
        <div style={{ width: "120px", background: "var(--border-color)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
          <div 
            style={{ 
              height: "100%", 
              background: "var(--primary)", 
              width: `${reminders.length > 0 ? (completedCount / reminders.length) * 100 : 0}%`,
              transition: "width 0.3s ease"
            }}
          />
        </div>
      </div>

      {/* Add Medication Form */}
      {showForm && (
        <div className="card">
          <h3 className="m-b-4">Add Medication Schedule</h3>
          <form onSubmit={handleSubmit} className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="med-name">Medicine Name</label>
              <input 
                type="text" 
                id="med-name"
                className="form-input" 
                placeholder="e.g. Metformin" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="med-dosage">Dosage Strength</label>
              <input 
                type="text" 
                id="med-dosage"
                className="form-input" 
                placeholder="e.g. 500mg / 1 capsule" 
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="med-freq">Frequency</label>
              <select 
                id="med-freq"
                className="form-input"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option>Once daily (Morning)</option>
                <option>Once daily (Afternoon)</option>
                <option>Once daily (Night)</option>
                <option>Twice daily</option>
                <option>Three times daily</option>
                <option>As needed (PRN)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="med-time">Reminder Time</label>
              <input 
                type="text" 
                id="med-time"
                className="form-input" 
                placeholder="e.g. 08:00 AM" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            <div className="flex-between" style={{ gridColumn: "span 2", marginTop: "1rem" }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Add Reminder</button>
            </div>
          </form>
        </div>
      )}

      {/* Reminders List */}
      <div className="flex-column gap-3">
        {reminders.map(rem => (
          <ReminderCard 
            key={rem.id}
            reminder={rem}
            onToggle={() => toggleReminder(rem.id)}
            onDelete={() => deleteReminder(rem.id)}
          />
        ))}
        {reminders.length === 0 && (
          <div className="card text-center" style={{ padding: "3rem" }}>
            <Clock size={32} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
            <h4 style={{ margin: 0 }}>No Medications Scheduled</h4>
            <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>Add a medicine details to begin tracking daily intake logs.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default MedicationReminder;
