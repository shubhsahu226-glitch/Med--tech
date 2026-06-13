import React, { useState } from "react";
import { useHealth } from "../context/HealthContext";
import { useAuth } from "../context/AuthContext";
import { Clock, ShieldAlert, CheckCircle2, Heart, Activity } from "lucide-react";
import { ReminderCard } from "../components/cards";

export const PatientCare = () => {
  const { user } = useAuth();
  const { reminders, toggleReminder, deleteReminder, addReminder, treatments } = useHealth();

  // Tab State: treatment, advice
  const [activeTab, setActiveTab] = useState("treatment");

  // Form States for adding medication
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medFrequency, setMedFrequency] = useState("Once daily (Morning)");
  const [medTime, setMedTime] = useState("08:00 AM");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Daily medication checklist (Display all reminders)
  const activeReminders = reminders;

  // Check if guest demo patient
  const isGuest = !user?.id || user.id === "6bbc3a1a-2b12-48cd-b04d-8974ca01264a";

  // Load primary active treatment from Supabase or mock for guest
  const activeTreatment = treatments && treatments.length > 0 
    ? treatments[0] 
    : isGuest 
      ? {
          diagnosis: "Hypertension Therapy Regimen",
          doctor_name: "Dr. Sarah Jenkins",
          notes: "Blood pressure reading logs show steady improvement. Please continue tracking readings twice weekly and maintain the current Lisinopril schedule.",
          created_at: "2026-06-04T00:00:00Z"
        }
      : null;

  // Care Content Definitions populated dynamically
  const careOverview = activeTreatment ? {
    treatmentName: activeTreatment.diagnosis,
    healthStatus: "Active Treatment Plan",
    currentSymptoms: isGuest ? ["Occasional morning dizziness", "Mild fatigue"] : ["Under Monitoring"],
    dietSuggestions: isGuest ? [
      "Sodium restriction: Limit sodium intake to under 1500mg daily.",
      "Incorporate foods rich in potassium, calcium, and magnesium (DASH diet)."
    ] : [
      "Follow standard balanced clinical nutrition parameters.",
      "Consult your primary clinician for personalized caloric and sodium guidelines."
    ],
    cureInfo: isGuest ? [
      "Aerobic physical activity: 30 minutes of walking daily.",
      "Stress relief methods: 10 minutes of deep-breathing exercises."
    ] : [
      "Log daily physical activity details within your home trackers.",
      "Note down any sudden metric spikes to alert your care provider."
    ],
    doctorUpdate: {
      physicianName: activeTreatment.doctor_name || "Primary Clinician",
      date: activeTreatment.created_at ? new Date(activeTreatment.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' }) : "Recently",
      message: activeTreatment.notes || "Continue with active prescription schedules and checkups."
    }
  } : null;

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!medName || !medDosage) return;

    addReminder(medName, medDosage, medFrequency, medTime);
    setMedName("");
    setMedDosage("");
    setFeedbackMsg("Medication tracker added successfully!");
    setTimeout(() => setFeedbackMsg(""), 3000);
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
          !careOverview ? (
            <div className="card text-center" style={{ padding: "4rem 2rem", borderRadius: "1rem" }}>
              <div className="flex-center" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f3f4f6", color: "#9ca3af", margin: "0 auto 1.5rem auto" }}>
                <ShieldAlert size={32} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", margin: "0 0 0.5rem 0", color: "#1f2937" }}>No Active Care Regimens</h3>
              <p className="text-secondary-color" style={{ fontSize: "0.875rem", maxWidth: "450px", margin: "0 auto", lineHeight: 1.5 }}>
                There are currently no active clinical treatment plans or medication trackers recorded for your account. Consult a physician to establish your therapy regimen.
              </p>
            </div>
          ) : (
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
                  
                  <div className="mobile-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
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

              {/* Ongoing Medication Checklist & Tracker Add Form */}
              <div className="flex-column gap-6">
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

                {/* Add Medication Tracker Card */}
                <div className="card flex-column gap-3" style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: "600" }}>Add Medication Tracker</h3>
                  
                  {feedbackMsg && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.75rem", borderLeft: "3px solid var(--success)" }}>
                      {feedbackMsg}
                    </div>
                  )}

                  <form onSubmit={handleAddMedication} className="flex-column gap-3">
                    <div className="form-group">
                      <label className="form-label" htmlFor="med-name" style={{ fontSize: "0.75rem" }}>Medication Name</label>
                      <input 
                        type="text" 
                        id="med-name"
                        className="form-input" 
                        placeholder="e.g. Lisinopril, Metformin" 
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        style={{ fontSize: "0.8rem", padding: "0.45rem", width: "100%" }}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="med-dosage" style={{ fontSize: "0.75rem" }}>Dosage & Strength</label>
                      <input 
                        type="text" 
                        id="med-dosage"
                        className="form-input" 
                        placeholder="e.g. 10mg, 1 tablet" 
                        value={medDosage}
                        onChange={(e) => setMedDosage(e.target.value)}
                        style={{ fontSize: "0.8rem", padding: "0.45rem", width: "100%" }}
                        required
                      />
                    </div>

                    <div className="mobile-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="med-freq" style={{ fontSize: "0.75rem" }}>Frequency</label>
                        <select 
                          id="med-freq"
                          className="form-input" 
                          value={medFrequency}
                          onChange={(e) => setMedFrequency(e.target.value)}
                          style={{ fontSize: "0.8rem", padding: "0.45rem", width: "100%" }}
                        >
                          <option>Once daily (Morning)</option>
                          <option>Once daily (Night)</option>
                          <option>Twice daily</option>
                          <option>Three times daily</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="med-time" style={{ fontSize: "0.75rem" }}>Scheduled Time</label>
                        <input 
                          type="text" 
                          id="med-time"
                          className="form-input" 
                          placeholder="e.g. 08:00 AM" 
                          value={medTime}
                          onChange={(e) => setMedTime(e.target.value)}
                          style={{ fontSize: "0.8rem", padding: "0.45rem", width: "100%" }}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-secondary w-full" style={{ padding: "0.5rem", fontSize: "0.75rem", fontWeight: "600", borderColor: "var(--primary)", color: "var(--primary)" }}>
                      + Add Medication
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )
        )}

        {/* TAB 2: DIET & GUIDANCE */}
        {activeTab === "advice" && (
          !careOverview ? (
            <div className="card text-center" style={{ padding: "4rem 2rem", borderRadius: "1rem" }}>
              <div className="flex-center" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f3f4f6", color: "#9ca3af", margin: "0 auto 1.5rem auto" }}>
                <ShieldAlert size={32} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", margin: "0 0 0.5rem 0", color: "#1f2937" }}>No Dietary Guidance Available</h3>
              <p className="text-secondary-color" style={{ fontSize: "0.875rem", maxWidth: "450px", margin: "0 auto", lineHeight: 1.5 }}>
                Dietary recommendations and wellness guidelines will appear here once an active clinical treatment plan is established by your doctor.
              </p>
            </div>
          ) : (
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
          )
        )}

      </div>
    </div>
  );
};

export default PatientCare;
