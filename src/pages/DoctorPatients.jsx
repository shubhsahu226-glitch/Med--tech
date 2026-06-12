import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { User, ClipboardList, TrendingUp, ChevronRight, FileText, Save, ArrowLeft } from "lucide-react";
import ReportSections from "../features/reports/components/ReportSections";
import TrendGraphs from "../features/reports/components/TrendGraphs";

export const DoctorPatients = () => {
  const { user } = useAuth();
  const { patients } = useHealth();

  const [connectedPatients, setConnectedPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isMobileListClosed, setIsMobileListClosed] = useState(false);
  
  // Tab within details view: profile, reports, trends
  const [activeTab, setActiveTab] = useState("profile");
  
  // Reports for selected patient
  const [patientReports, setPatientReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  
  // Treatment history
  const [patientTreatments, setPatientTreatments] = useState([]);

  // Notes Form State
  const [notesDiagnosis, setNotesDiagnosis] = useState("");
  const [notesPrescription, setNotesPrescription] = useState("");
  const [notesDetails, setNotesDetails] = useState("");
  const [notesFollowUp, setNotesFollowUp] = useState("");
  const [notesStatus, setNotesStatus] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const isGuestUser = !user?.id || user.id === "7a02fa0d-9719-4261-bd98-1c3d54238c2f";

  const selectedPatient = connectedPatients.find(p => p.id === selectedPatientId) || null;
  const selectedReport = selectedReportId ? (patientReports.find(r => r.id === selectedReportId) || null) : null;

  // 1. Fetch connected patients based on doctor appointments
  useEffect(() => {
    const fetchConnectedPatients = async () => {
      if (isGuestUser) {
        // Fallback to mock patient list from context for demo doctor
        const patsList = patients.map(pat => ({
          id: pat.id,
          name: pat.name,
          phone: pat.phone || pat.mobile_number || "+1 (555) 019-2834",
          email: pat.email || `${pat.name.toLowerCase().replace(/\s/g, "")}@gmail.com`,
          avatar: pat.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
          condition: pat.condition || "Hypertension (Controlled)",
          lastVisit: pat.lastVisit || "May 12, 2026",
          age: pat.age || 34,
          gender: pat.gender || "Male",
          bloodGroup: pat.bloodGroup || pat.blood_type || "O+",
          emergencyContact: pat.emergencyContact || pat.emergency_contact_phone || "Not Specified"
        }));
        setConnectedPatients(patsList);
        if (patsList.length > 0) setSelectedPatientId(patsList[0].id);
        return;
      }

      // Real Database logic
      try {
        // Query patient_doctor_connections for current doctor to find patient IDs
        const { data: aptsData, error: aptsErr } = await supabase
          .from('patient_doctor_connections')
          .select('patient_id')
          .eq('doctor_id', user.id)
          .eq('status', 'Active');

        if (aptsErr) throw aptsErr;
        if (!aptsData || aptsData.length === 0) {
          setConnectedPatients([]);
          return;
        }

        const patientIds = [...new Set(aptsData.map(a => a.patient_id))];

        // Fetch patient profiles
        const { data: profilesData, error: profErr } = await supabase
          .from('profiles')
          .select('id, name, mobile_number, location, dob')
          .in('id', patientIds);

        if (profErr) throw profErr;

        // Fetch patient emergency contact details
        const { data: patientsData } = await supabase
          .from('patients')
          .select('*')
          .in('id', patientIds);

        const patientDetailsMap = {};
        if (patientsData) {
          patientsData.forEach(p => {
            patientDetailsMap[p.id] = p;
          });
        }

        function calculateAge(dobString) {
          if (!dobString) return 30;
          const birthDate = new Date(dobString);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
          return age;
        }

        const patsList = profilesData.map(profile => {
          const details = patientDetailsMap[profile.id] || {};
          return {
            id: profile.id,
            name: profile.name,
            phone: profile.mobile_number,
            location: profile.location,
            dob: profile.dob,
            age: calculateAge(profile.dob),
            gender: "Patient", // default label
            bloodGroup: details.blood_type || "Not Specified",
            emergencyContact: details.emergency_contact_phone
              ? `${details.emergency_contact_name} (${details.emergency_contact_phone})`
              : "Not Specified"
          };
        });

        setConnectedPatients(patsList);
        if (patsList.length > 0) setSelectedPatientId(patsList[0].id);
      } catch (err) {
        console.error("Error fetching connected patients:", err);
      }
    };

    fetchConnectedPatients();
  }, [user, isGuestUser, patients]);

  // 2. Fetch reports and medical history whenever a patient is selected
  useEffect(() => {
    if (!selectedPatientId) return;

    const fetchPatientData = async () => {
      if (isGuestUser) {
        // Fetch patient reports and treatments from context
        const currentPat = patients.find(p => p.id === selectedPatientId);
        if (currentPat) {
          setPatientReports(currentPat.reports || []);
          setPatientTreatments(currentPat.history || []);
        } else {
          setPatientReports([]);
          setPatientTreatments([]);
        }
        return;
      }

      // Real Database query
      try {
        // Query reports
        const { data: repsData, error: repsErr } = await supabase
          .from('reports')
          .select('*')
          .eq('patient_id', selectedPatientId)
          .order('date', { ascending: false });

        if (repsErr) throw repsErr;

        setPatientReports(repsData.map(r => ({
          ...r,
          metrics: r.metrics_json ? JSON.parse(r.metrics_json) : [],
          aiSummary: r.ai_summary
        })));

        // Query treatments
        const { data: treatData, error: treatErr } = await supabase
          .from('treatments')
          .select('*')
          .eq('patient_id', selectedPatientId)
          .order('created_at', { ascending: false });

        if (treatErr) throw treatErr;
        setPatientTreatments(treatData);
      } catch (err) {
        console.error("Error fetching reports/history:", err);
      }
    };

    fetchPatientData();
  }, [selectedPatientId, isGuestUser, patients]);

  // Handle consultation notes form submit
  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!notesDiagnosis || !notesDetails) return;

    setNotesStatus("");
    setIsSavingNotes(true);

    if (isGuestUser) {
      const newTreatObj = {
        id: `t_${Date.now()}`,
        diagnosis: notesDiagnosis,
        notes: notesDetails,
        prescription: notesPrescription,
        doctor_name: user?.name || "Dr. Sarah Jenkins",
        created_at: new Date().toISOString()
      };
      setPatientTreatments(prev => [newTreatObj, ...prev]);
      setNotesDiagnosis("");
      setNotesPrescription("");
      setNotesDetails("");
      setNotesFollowUp("");
      setNotesStatus("Consultation log saved to demo patient history successfully!");
      setIsSavingNotes(false);
      setTimeout(() => setNotesStatus(""), 3000);
      return;
    }

    try {
      // Save treatment notes to Supabase
      const { error: insErr } = await supabase.from('treatments').insert([{
        patient_id: selectedPatientId,
        doctor_id: user.id,
        doctor_name: user.name,
        diagnosis: notesDiagnosis,
        notes: notesDetails,
        prescription: notesPrescription || "None Prescribed",
        follow_up_date: notesFollowUp || null
      }]);

      if (insErr) throw insErr;

      // Reload treatments
      const { data: treatData } = await supabase
        .from('treatments')
        .select('*')
        .eq('patient_id', selectedPatientId)
        .order('created_at', { ascending: false });
        
      setPatientTreatments(treatData);

      setNotesDiagnosis("");
      setNotesPrescription("");
      setNotesDetails("");
      setNotesFollowUp("");
      setNotesStatus("Consultation details saved to Postgres database!");
      setTimeout(() => setNotesStatus(""), 3000);
    } catch (err) {
      console.error("Failed to insert treatment notes:", err);
      setNotesStatus("Error: Could not save notes to database.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="flex-column gap-6" style={{ minHeight: "80vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Connected Patients Directory</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Explore patient charts, review extracted diagnostic metrics, and update treatment history notes.
        </p>
      </div>

      {connectedPatients.length === 0 ? (
        <div className="card text-center" style={{ padding: "4rem 2rem", borderRadius: "1rem" }}>
          <div className="flex-center" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f3f4f6", color: "#9ca3af", margin: "0 auto 1.5rem auto" }}>
            <User size={32} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>No Connected Patients</h3>
          <p className="text-secondary-color" style={{ fontSize: "0.875rem", maxWidth: "450px", margin: "0 auto", lineHeight: 1.5 }}>
            Patients will automatically appear here once they book consultations, select you as their physician, or request appointment reviews.
          </p>
        </div>
      ) : (
        <div className="split-layout split-layout-1-3" style={{ gap: "2rem" }}>
          
          {/* Left Panel: Patients Directory List */}
          <div className={`flex-column gap-3 doctor-patient-list-sidebar ${isMobileListClosed ? "mobile-hidden" : ""}`}>
            <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Patient List</h3>
            <div className="flex-column gap-2" style={{ maxHeight: "600px", overflowY: "auto" }}>
              {connectedPatients.map(pat => {
                const selected = pat.id === selectedPatientId;
                return (
                  <button
                    key={pat.id}
                    onClick={() => {
                      setSelectedPatientId(pat.id);
                      setActiveTab("profile");
                      setSelectedReportId("");
                      setIsMobileListClosed(true); // Close the list on mobile to show details
                    }}
                    className="card text-left"
                    style={{
                      width: "100%",
                      padding: "1rem",
                      cursor: "pointer",
                      border: selected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                      backgroundColor: selected ? "var(--primary-light)" : "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "var(--text-secondary)" }}>
                      {pat.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pat.name}</h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{pat.age} Yrs / {pat.bloodGroup}</span>
                    </div>
                    <ChevronRight size={16} style={{ color: "#9ca3af" }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Patient Chart Details */}
          {selectedPatient && (
            <div className={`flex-column gap-5 doctor-patient-details-panel ${!isMobileListClosed ? "mobile-hidden" : ""}`}>
              {/* Mobile Back Button */}
              <button 
                type="button"
                onClick={() => setIsMobileListClosed(false)}
                className="btn btn-secondary mobile-back-button"
                style={{ display: "none", alignSelf: "flex-start", marginBottom: "0.5rem" }}
              >
                <ArrowLeft size={16} /> Back to Patients
              </button>
              
              {/* Profile Bio Header */}
              <div className="card flex-between flex-wrap gap-4" style={{ padding: "1.5rem 2rem", borderRadius: "1rem", borderLeft: "4px solid var(--primary)" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: 0 }}>{selectedPatient.name}</h2>
                  <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginTop: "0.15rem" }}>
                    DOB: {selectedPatient.dob || "Not Specified"} ({selectedPatient.age} years old)
                  </p>
                </div>
                <div className="align-center gap-4 flex-wrap">
                  <div style={{ padding: "0.25rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Blood Group</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--primary)" }}>{selectedPatient.bloodGroup}</span>
                  </div>
                  <div style={{ padding: "0.25rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Emergency Contact</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>{selectedPatient.emergencyContact}</span>
                  </div>
                </div>
              </div>

              {/* Chart Tabs */}
              <div className="subnav-tabs" style={{ marginBottom: "-1rem" }}>
                <button 
                  onClick={() => setActiveTab("profile")} 
                  className={`subnav-tab ${activeTab === "profile" ? "active" : ""}`}
                >
                  <ClipboardList size={14} style={{ marginRight: "0.35rem" }} /> Profile & Medical History
                </button>
                <button 
                  onClick={() => setActiveTab("reports")} 
                  className={`subnav-tab ${activeTab === "reports" ? "active" : ""}`}
                >
                  <FileText size={14} style={{ marginRight: "0.35rem" }} /> Diagnostic Reports
                </button>
                <button 
                  onClick={() => setActiveTab("trends")} 
                  className={`subnav-tab ${activeTab === "trends" ? "active" : ""}`}
                >
                  <TrendingUp size={14} style={{ marginRight: "0.35rem" }} /> Biomarker Trends
                </button>
              </div>

              <div className="subnav-container">
                
                {/* TAB 1: PROFILE & MEDICAL HISTORY */}
                {activeTab === "profile" && (
                  <div className="split-layout split-layout-1-1" style={{ gap: "2rem" }}>
                    
                    {/* Diagnostic Consult Log Form */}
                    <div className="flex-column gap-3">
                      <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Log Clinical Consultation</h3>
                      
                      <div className="card" style={{ padding: "1.5rem" }}>
                        <form onSubmit={handleSaveNotes} className="flex-column gap-3">
                          {notesStatus && (
                            <div style={{ padding: "0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", borderLeft: "3px solid var(--success)" }}>
                              {notesStatus}
                            </div>
                          )}

                          <div className="form-group">
                            <label className="form-label" htmlFor="notes-diag" style={{ fontWeight: "500" }}>Primary Diagnosis</label>
                            <input 
                              type="text" 
                              id="notes-diag"
                              className="form-input" 
                              placeholder="e.g. Stage 1 Hypertension"
                              value={notesDiagnosis}
                              onChange={(e) => setNotesDiagnosis(e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="notes-presc" style={{ fontWeight: "500" }}>Prescription & Medication</label>
                            <input 
                              type="text" 
                              id="notes-presc"
                              className="form-input" 
                              placeholder="e.g. Lisinopril 10mg once daily"
                              value={notesPrescription}
                              onChange={(e) => setNotesPrescription(e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="notes-details" style={{ fontWeight: "500" }}>Clinical Notes</label>
                            <textarea 
                              id="notes-details"
                              className="form-input" 
                              rows="4" 
                              placeholder="Describe observed clinical symptoms, diet requirements, and consultation parameters..."
                              value={notesDetails}
                              onChange={(e) => setNotesDetails(e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="notes-follow" style={{ fontWeight: "500" }}>Follow-up Date</label>
                            <input 
                              type="date" 
                              id="notes-follow"
                              className="form-input" 
                              value={notesFollowUp}
                              onChange={(e) => setNotesFollowUp(e.target.value)}
                            />
                          </div>

                          <button type="submit" className="btn btn-primary w-full m-t-2 align-center gap-2 justify-content-center" disabled={isSavingNotes}>
                            <Save size={16} /> {isSavingNotes ? "Saving log..." : "Save Consult Log"}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Medical History Logs list */}
                    <div className="flex-column gap-3">
                      <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Consultation History</h3>
                      
                      <div className="flex-column gap-3" style={{ maxHeight: "450px", overflowY: "auto" }}>
                        {patientTreatments.map(treat => (
                          <div key={treat.id} className="card flex-column gap-2" style={{ padding: "1.25rem", borderLeft: "3px solid var(--primary)" }}>
                            <div className="flex-between">
                              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "#1f2937" }}>{treat.diagnosis}</h4>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {new Date(treat.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: "0.25rem 0" }}>
                              {treat.notes}
                            </p>
                            {treat.prescription && treat.prescription !== "None Prescribed" && (
                              <div style={{ fontSize: "0.75rem", color: "var(--success-dark)", padding: "0.35rem 0.5rem", background: "var(--success-light)", borderRadius: "var(--radius-sm)", width: "fit-content", fontWeight: "500" }}>
                                💊 Prescription: {treat.prescription}
                              </div>
                            )}
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                              Logged by: <strong>{treat.doctor_name}</strong>
                            </div>
                          </div>
                        ))}

                        {patientTreatments.length === 0 && (
                          <div className="card text-center" style={{ padding: "2rem" }}>
                            <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No previous consultations logged.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: DIAGNOSTIC REPORTS */}
                {activeTab === "reports" && (
                  <div className="split-layout split-layout-1-2" style={{ gap: "2rem" }}>
                    
                    {/* Left: Reports list */}
                    <div className="flex-column gap-3">
                      <h4 style={{ fontSize: "0.95rem", margin: 0, fontWeight: "600" }}>Uploaded Reports</h4>
                      <div className="flex-column gap-2">
                        {patientReports.map(rep => {
                          const active = rep.id === selectedReportId;
                          return (
                            <button
                              key={rep.id}
                              type="button"
                              onClick={() => setSelectedReportId(rep.id)}
                              className="card text-left"
                              style={{
                                width: "100%",
                                padding: "0.85rem 1rem",
                                border: active ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                                backgroundColor: active ? "var(--primary-light)" : "white",
                                cursor: "pointer",
                                transition: "all 0.15s"
                              }}
                            >
                              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1f2937" }}>{rep.title}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                {rep.date} | {rep.type}
                              </div>
                            </button>
                          );
                        })}

                        {patientReports.length === 0 && (
                          <div className="card text-center" style={{ padding: "1.5rem" }}>
                            <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No scanned reports uploaded by patient.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Detailed report metrics panels */}
                    <div className="flex-column gap-4">
                      {selectedReport ? (
                        <div className="flex-column gap-4">
                          <div className="card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", fontWeight: "600" }}>AI scan analysis</h3>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{selectedReport.aiSummary}</p>
                          </div>
                          
                          {/* Categorized Panels using ReportSections */}
                          <ReportSections reportId={selectedReport.id} />
                        </div>
                      ) : (
                        <div className="card flex-column flex-center text-center justify-content-center" style={{ padding: "4rem 2rem", minHeight: "250px" }}>
                          <FileText size={36} style={{ color: "#9ca3af", marginBottom: "0.75rem" }} />
                          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500", color: "#4b5563" }}>Select Report to View Details</h4>
                          <p className="text-secondary-color" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Click any report in the left column to view parsed sections and biomarkers.</p>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 3: BIOMARKER TRENDS */}
                {activeTab === "trends" && (
                  <div className="card" style={{ padding: "2rem" }}>
                    <h3 style={{ fontSize: "1.15rem", margin: "0 0 1.5rem 0", fontWeight: "600" }}>Timeline Biomarker History Curves</h3>
                    
                    {/* Render trend lines for this specific patient */}
                    <TrendGraphs patientId={selectedPatientId} />
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
