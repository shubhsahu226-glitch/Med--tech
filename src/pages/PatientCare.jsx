import React, { useState } from "react";
import { useHealth } from "../context/HealthContext";
import { Clock, ShieldAlert, CheckCircle2, Heart, Activity } from "lucide-react";
import { ReminderCard } from "../components/cards";

export const PatientCare = () => {
  const { reminders, toggleReminder, deleteReminder } = useHealth();

  // Tab State: treatment, advice
  const [activeTab, setActiveTab] = useState("treatment");

  // Daily medication limits (1 key reminder for minimalism)
  const activeReminders = reminders.slice(0, 1);

  // Care Content Definitions (1-2 dummy items only)
  const careOverview = {
    treatmentName: "Hypertension Therapy Regimen",
    healthStatus: "Optimal (Stable)",
    currentSymptoms: ["Occasional morning dizziness", "Mild fatigue"],
    dietSuggestions: [
      "Sodium restriction: Limit sodium intake to under 1500mg daily.",
      "Incorporate foods rich in potassium, calcium, and magnesium (DASH diet)."
    ],
    cureInfo: [
      "Aerobic physical activity: 30 minutes of walking daily.",
      "Stress relief methods: 10 minutes of deep-breathing exercises."
    ],
    doctorUpdate: {
      physicianName: "Dr. Sarah Jenkins",
      date: "Jun 04, 2026",
      message: "Blood pressure reading logs show steady improvement. Please continue tracking readings twice weekly and maintain the current Metformin schedule."
    }
  };

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Care Desk & Regimen</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>View ongoing medical treatments, track medication checklist completion, and follow dietary suggestions.</p>
      </div>

      {/* Tabs */}
      <div className="subnav-tabs">
        <button 
          onClick={() => setActiveTab("treatment")} 
          className={`subnav-tab ${activeTab === "treatment" ? "active" : ""}`}
        >
          Treatment & Medications
        </button>
        <button 
          onClick={() => setActiveTab("advice")} 
          className={`subnav-tab ${activeTab === "advice" ? "active" : ""}`}
        >
          Diet & Guidance
        </button>
      </div>

      <div className="subnav-container">
        
        {/* TAB 1: TREATMENT & MEDICATIONS */}
        {activeTab === "treatment" && (
          <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
            
            {/* Treatment, Status, Symptoms */}
            <div className="flex-column gap-6">
              
              <div className="card flex-column gap-3">
                <div className="flex-between">
                  <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Current Treatment Details</h3>
                  <span className="badge badge-info" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", fontSize: "0.7rem" }}>
                    Active
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>{careOverview.treatmentName}</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Overall Health Status</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--success)" }}>{careOverview.healthStatus}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Primary Clinician</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-primary)" }}>{careOverview.doctorUpdate.physicianName}</span>
                  </div>
                </div>
              </div>

              <div className="card flex-column gap-3">
                <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Active Symptoms Log</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Recent symptoms reported during consultations:</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                  {careOverview.currentSymptoms.map((symptom, idx) => (
                    <span 
                      key={idx}
                      className="badge badge-danger" 
                      style={{ fontSize: "0.7rem", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Ongoing Medication Checklist */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: "600" }}>Ongoing Medication</h3>
              
              <div className="flex-column gap-3">
                {activeReminders.map(rem => (
                  <ReminderCard 
                    key={rem.id}
                    reminder={rem}
                    onToggle={() => toggleReminder(rem.id)}
                    onDelete={() => deleteReminder(rem.id)}
                  />
                ))}
                {activeReminders.length === 0 && (
                  <div className="card text-center" style={{ padding: "1.5rem" }}>
                    <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No medications scheduled.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DIET & GUIDANCE */}
        {activeTab === "advice" && (
          <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
            
            {/* Diet Suggestions and Cure/Therapy guidelines */}
            <div className="flex-column gap-6">
              
              <div className="card flex-column gap-3">
                <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Dietary Management Suggestions</h3>
                <ul style={{ paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }} className="flex-column gap-2">
                  {careOverview.dietSuggestions.map((suggestion, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              <div className="card flex-column gap-3">
                <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Therapeutic & Activity Guidelines</h3>
                <ul style={{ paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }} className="flex-column gap-2">
                  {careOverview.cureInfo.map((tip, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5 }}>{tip}</li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Connected Doctor updates */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Clinician Notes Feed</h3>
              
              <div className="card flex-column gap-3" style={{ padding: "1.25rem", borderLeft: "3px solid var(--primary)" }}>
                <div className="flex-between">
                  <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    {careOverview.doctorUpdate.physicianName}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{careOverview.doctorUpdate.date}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  "{careOverview.doctorUpdate.message}"
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PatientCare;
