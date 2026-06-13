import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { uploadReportApi } from "../services/api";
import { 
  FileUp, History, Sparkles, PlusCircle, Calendar, User, 
  CheckCircle2, FileText, ChevronRight, Activity, Download, Save, RefreshCw, AlertTriangle, Info
} from "lucide-react";
import { ReportSummaryCard } from "../components/cards";

// New Report Analyzer features imports
import { ReportSections } from "../features/reports/components/ReportSections";
import { TrendGraphs } from "../features/reports/components/TrendGraphs";
import { fetchParameterHistoryTrends, fetchPatientAlerts } from "../features/reports/services";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");

export const PatientReports = () => {
  const { user } = useAuth();
  const { trends, patients, uploadReport } = useHealth();
  
  const livePatientData = patients.find(p => p.id === user?.id);
  const reports = livePatientData?.reports || user?.reports || [];
  
  // Tab State: upload, analysis, history, graphs
  const [activeTab, setActiveTab] = useState("history");
  const [selectedReportId, setSelectedReportId] = useState(
    reports.length > 0 ? reports[0].id : null
  );

  // Database state for structured sections, trends, and alerts
  const [dbTrends, setDbTrends] = useState([]);
  const [dbAlerts, setDbAlerts] = useState([]);

  // Load database records for history graphs and warning flags
  const loadDatabaseRecords = async () => {
    if (user?.id) {
      try {
        const trData = await fetchParameterHistoryTrends(user.id);
        const alData = await fetchPatientAlerts(user.id);
        if (trData && trData.length > 0) setDbTrends(trData);
        if (alData && alData.length > 0) setDbAlerts(alData);
      } catch (err) {
        console.error("Error loading database records:", err);
      }
    }
  };

  // Sync selected report when reports list updates
  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  // Load database records when user updates or active tab changes
  useEffect(() => {
    loadDatabaseRecords();
  }, [user, activeTab]);

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];

  // Upload Form States
  const [file, setFile] = useState(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("Blood Test");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadError, setUploadError] = useState("");

  // Manual Data Entry States
  const [manualMetricName, setManualMetricName] = useState("");
  const [manualMetricVal, setManualMetricVal] = useState("");
  const [manualMetricUnit, setManualMetricUnit] = useState("mg/dL");
  const [manualMetricMin, setManualMetricMin] = useState("70");
  const [manualMetricMax, setManualMetricMax] = useState("120");
  const [manualMetricDate, setManualMetricDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStatus, setManualStatus] = useState("");

  // Update Report Summary State
  const [editableSummary, setEditableSummary] = useState("");

  useEffect(() => {
    if (activeReport) {
      setEditableSummary(activeReport.aiSummary || "");
    }
  }, [activeReport]);

  const uploadSteps = [
    "Reading uploaded report bytes...",
    "Scanning diagnostic lines...",
    "Compiling summary insights..."
  ];

  // History / Timeline States
  const historyList = livePatientData?.history || [];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (e.g. 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("The uploaded file exceeds the maximum supported size of 5MB.");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setUploadError("");
      if (!reportTitle) {
        setReportTitle(selectedFile.name.split(".")[0].replace(/[-_]/g, " "));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file && !reportTitle) {
      setUploadError("Please select a file or enter a name.");
      return;
    }

    setIsUploading(true);
    setUploadStep(0);
    setUploadError("");

    const progressInterval = setInterval(() => {
      setUploadStep((prev) => (prev < uploadSteps.length - 1 ? prev + 1 : prev));
    }, 1000);

    const formData = new FormData();
    formData.append("file", file || new Blob(["mock"], { type: "text/plain" }));
    formData.append("patient_id", user ? user.id : 'guest');
    formData.append("report_title", reportTitle || (file ? file.name : "Report"));
    formData.append("report_type", reportType);

    try {
      const data = await uploadReportApi(formData);
      clearInterval(progressInterval);
      
      if (data.report) {
        const newRep = uploadReport(
          user ? user.id : 'guest', 
          data.report.title, 
          data.report.type, 
          data.report.metrics, 
          data.report.aiSummary,
          data.report.id,
          data.report.date
        );
        setSelectedReportId(newRep.id);
        await loadDatabaseRecords(); // reload trends & alerts
      }
      
      setIsUploading(false);
      setFile(null);
      setReportTitle("");
      setActiveTab("analysis"); // Move directly to AI summary review
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      
      // Map general TypeError (Fetch failed) to a detailed local guidance message
      let errorMsg = err.message || "Failed to connect to backend engine.";
      if (errorMsg.toLowerCase().includes("fetch") || errorMsg.toLowerCase().includes("failed to upload")) {
        errorMsg = "Failed to connect to backend server. Please verify that the Flask backend is running on http://localhost:8000. Run 'python main.py' inside your backend directory.";
      }
      
      setUploadError(errorMsg);
      setIsUploading(false);
    }
  };

  const handleManualEntrySubmit = async (e) => {
    e.preventDefault();
    if (!manualMetricName || !manualMetricVal) return;

    // Build local biomarker values
    const valNum = parseFloat(manualMetricVal);
    const minNum = parseFloat(manualMetricMin);
    const maxNum = parseFloat(manualMetricMax);
    let status = "Normal";
    if (valNum < minNum) status = "Low";
    if (valNum > maxNum) status = "High";

    const newMetric = {
      name: manualMetricName,
      value: valNum,
      unit: manualMetricUnit,
      status,
      min: minNum,
      max: maxNum
    };

    // Format dates for saving
    const parsedDate = new Date(manualMetricDate);
    const dateString = parsedDate.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' });

    // Request payload
    const requestData = {
      patient_id: user ? user.id : 'guest',
      name: manualMetricName,
      value: valNum,
      unit: manualMetricUnit,
      min: manualMetricMin ? parseFloat(manualMetricMin) : null,
      max: manualMetricMax ? parseFloat(manualMetricMax) : null,
      date: manualMetricDate
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/manual-entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error("Failed to save manual log to database.");
      }
      
      const resJson = await response.json();
      
      if (resJson.report) {
        const newRep = uploadReport(
          user ? user.id : 'guest',
          resJson.report.title,
          resJson.report.type,
          resJson.report.metrics,
          resJson.report.aiSummary,
          resJson.report.id,
          resJson.report.date
        );
        setSelectedReportId(newRep.id);
        setManualStatus("Biomarker logged successfully to database!");
      }
    } catch (err) {
      console.error(err);
      
      // Fallback local saving if backend is unreachable
      const newRep = uploadReport(
        user ? user.id : 'guest',
        "Manual Record Entry",
        "Blood Test",
        [newMetric],
        `Manual entry: ${manualMetricName} recorded.`,
        `rep_man_${Date.now()}`,
        dateString
      );
      setSelectedReportId(newRep.id);
      setManualStatus("Biomarker logged locally (Backend server offline).");
    }

    // Refresh database parameters for graphs
    await loadDatabaseRecords();

    // Reset entry fields
    setManualMetricName("");
    setManualMetricVal("");
    setTimeout(() => setManualStatus(""), 3000);
  };

  const handleUpdateReport = () => {
    if (activeReport) {
      activeReport.aiSummary = editableSummary;
      alert("Report summary updated successfully.");
    }
  };

  const handleExportCSV = () => {
    if (!activeReport) return;
    const headers = "Metric,Value,Unit,Status,Reference Range\n";
    const rows = activeReport.metrics.map(m => `"${m.name}",${m.value},"${m.unit}","${m.status}","${m.min}-${m.max}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport.title.replace(/\s+/g, "_")}_data.csv`;
    a.click();
  };

  // Extract alerts/warnings from the active report
  const reportAlerts = activeReport?.metrics?.filter(m => m.status === "High" || m.status === "Low" || m.status === "Abnormal") || [];

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Page Header */}
      <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Laboratory Reports Board</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Upload test panels, update medical metrics, export clinical records, and view AI summary trends.</p>
      </div>

      {/* Subnavigation Tabs */}
      <div className="subnav-tabs">
        <button 
          onClick={() => setActiveTab("history")} 
          className={`subnav-tab ${activeTab === "history" ? "active" : ""}`}
        >
          History & Timelines
        </button>
        <button 
          onClick={() => setActiveTab("upload")} 
          className={`subnav-tab ${activeTab === "upload" ? "active" : ""}`}
        >
          Upload & Manual Entry
        </button>
        <button 
          onClick={() => setActiveTab("analysis")} 
          className={`subnav-tab ${activeTab === "analysis" ? "active" : ""}`}
        >
          AI Summary & Export
        </button>
        <button 
          onClick={() => setActiveTab("graphs")} 
          className={`subnav-tab ${activeTab === "graphs" ? "active" : ""}`}
        >
          Trend Graphs & Alerts ({dbAlerts.length || reportAlerts.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="subnav-container">
        
        {/* TAB 1: HISTORY & TIMELINES */}
        {activeTab === "history" && (
          <div className="split-layout split-layout-1-2" style={{ gap: "2.5rem" }}>
            
            {/* Left: Document Checklist */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Uploaded Documents</h3>
              <div className="flex-column gap-2" style={{ maxHeight: "350px", overflowY: "auto" }}>
                {reports.map(rep => (
                  <button
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setActiveTab("analysis");
                    }}
                    className="card text-left"
                    style={{
                      padding: "1rem",
                      border: selectedReportId === rep.id ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                      backgroundColor: selectedReportId === rep.id ? "var(--primary-light)" : "var(--bg-primary)",
                      transition: "all var(--transition-fast)"
                    }}
                  >
                    <div className="flex-between m-b-1">
                      <span className="text-muted-color" style={{ fontSize: "0.75rem" }}>{rep.date}</span>
                      <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>{rep.status}</span>
                    </div>
                    <h4 style={{ fontSize: "0.875rem", margin: 0, fontWeight: "600" }}>{rep.title}</h4>
                    <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>{rep.type}</p>
                  </button>
                ))}

                {reports.length === 0 && (
                  <div className="card text-center" style={{ padding: "1.5rem" }}>
                    <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No reports logged yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Calendar Clinical Timeline</h3>
              {historyList.length === 0 ? (
                <div className="card text-center" style={{ padding: "2rem" }}>
                  <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>No timeline events recorded.</p>
                </div>
              ) : (
                <div style={{ position: "relative", paddingLeft: "1.25rem", borderLeft: "2px solid var(--border-color)" }}>
                  <div className="flex-column gap-4">
                    {historyList.slice(0, 2).map((item) => (
                      <div key={item.id} style={{ position: "relative" }}>
                        <div 
                          style={{
                            position: "absolute",
                            left: "-1.6rem",
                            top: "6px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "var(--primary)",
                            border: "2px solid white",
                            boxShadow: "0 0 0 2px var(--primary-light)"
                          }}
                        />
                        <div className="card" style={{ padding: "1rem" }}>
                          <div className="flex-between flex-wrap gap-2 m-b-2">
                            <span className="badge badge-info" style={{ fontSize: "0.65rem", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>{item.type}</span>
                            <span className="text-muted-color" style={{ fontSize: "0.75rem" }}>{item.date}</span>
                          </div>
                          <h4 style={{ fontSize: "0.9rem", margin: 0, fontWeight: "600" }}>{item.diagnosis}</h4>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{item.notes}</p>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                            Attending: {item.doctor}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: UPLOAD & MANUAL ENTRY */}
        {activeTab === "upload" && (
          <div className="split-layout split-layout-1-1" style={{ gap: "2.5rem" }}>
            
            {/* Upload Area */}
            <div className="card flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem", fontWeight: "600" }}>AI Laboratory Document Scanner</h3>
              
              {isUploading ? (
                <div className="flex-column flex-center text-center" style={{ padding: "3rem 0" }}>
                  <div 
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "3px solid var(--primary-light)",
                      borderTop: "3px solid var(--primary)",
                      animation: "spin 1s linear infinite",
                      marginBottom: "1.5rem"
                    }}
                  />
                  <h3 style={{ fontSize: "1.1rem", color: "var(--primary)" }}>AI Agent Scanning</h3>
                  <p className="text-secondary-color" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    {uploadSteps[uploadStep]}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="flex-column gap-3">
                  {uploadError && (
                    <div style={{ padding: "0.75rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", borderLeft: "3px solid var(--primary)" }}>
                      {uploadError}
                    </div>
                  )}

                  <div 
                    style={{
                      border: "2px dashed var(--border-color)",
                      borderRadius: "var(--radius-lg)",
                      padding: "2.5rem 1rem",
                      textAlign: "center",
                      backgroundColor: "var(--bg-tertiary)",
                      cursor: "pointer"
                    }}
                    onClick={() => document.getElementById("reports-file-input").click()}
                  >
                    <input 
                      type="file" 
                      id="reports-file-input" 
                      style={{ display: "none" }} 
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    <div className="flex-column flex-center gap-2">
                      <FileUp size={32} style={{ color: "var(--primary)" }} />
                      {file ? (
                        <>
                          <h4 style={{ margin: 0, fontSize: "0.9rem" }}>{file.name}</h4>
                          <p className="text-secondary-color" style={{ fontSize: "0.75rem" }}>
                            {(file.size / 1024).toFixed(1)} KB | Click to swap
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "500" }}>Upload Laboratory PDF or Image</h4>
                          <p className="text-secondary-color" style={{ fontSize: "0.75rem" }}>
                            OCR parses ranges and normalizes metrics automatically
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Upload Guidelines Card */}
                  <div style={{ padding: "0.75rem 1rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                    <Info size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Upload Guidelines:</strong>
                      <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.1rem", lineHeight: "1.4" }}>
                        <li>Maximum supported file size: <strong>5 MB</strong></li>
                        <li>Supported formats: <strong>PDF, PNG, JPG, JPEG</strong></li>
                        <li>Requirement: Ensure the <strong>report date</strong> is clearly visible in the document so history trends chart correctly.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reports-title">Report Title</label>
                    <input 
                      type="text" 
                      id="reports-title"
                      className="form-input" 
                      placeholder="e.g. Metabolic Blood Test"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reports-type">Category</label>
                    <select 
                      id="reports-type"
                      className="form-input"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option>Blood Test</option>
                      <option>Cardiogram (ECG)</option>
                      <option>MRI Scan</option>
                      <option>Lipid Checkup</option>
                      <option>Renal Panel</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary w-full m-t-2">
                    Submit for Scan
                  </button>
                </form>
              )}
            </div>

            {/* Manual Entry Area */}
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1.25rem", fontWeight: "600" }}>Manual Biomarker Logging</h3>
              
              <form onSubmit={handleManualEntrySubmit} className="flex-column gap-3">
                {manualStatus && (
                  <div style={{ padding: "0.75rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", borderLeft: "3px solid var(--success)" }}>
                    {manualStatus}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-name">Biomarker / Metric Name</label>
                  <input
                    type="text"
                    id="manual-name"
                    className="form-input"
                    placeholder="e.g., Blood Glucose, LDL Cholesterol, Creatinine"
                    value={manualMetricName}
                    onChange={(e) => setManualMetricName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="manual-date">Record Date</label>
                  <input
                    type="date"
                    id="manual-date"
                    className="form-input"
                    value={manualMetricDate}
                    onChange={(e) => setManualMetricDate(e.target.value)}
                    required
                  />
                </div>

                <div className="mobile-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="manual-val">Recorded Value</label>
                    <input
                      type="number"
                      step="any"
                      id="manual-val"
                      className="form-input"
                      placeholder="95"
                      value={manualMetricVal}
                      onChange={(e) => setManualMetricVal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="manual-unit">Unit</label>
                    <input
                      type="text"
                      id="manual-unit"
                      className="form-input"
                      placeholder="mg/dL"
                      value={manualMetricUnit}
                      onChange={(e) => setManualMetricUnit(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mobile-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="manual-min">Ref Min</label>
                    <input
                      type="number"
                      step="any"
                      id="manual-min"
                      className="form-input"
                      value={manualMetricMin}
                      onChange={(e) => setManualMetricMin(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="manual-max">Ref Max</label>
                    <input
                      type="number"
                      step="any"
                      id="manual-max"
                      className="form-input"
                      value={manualMetricMax}
                      onChange={(e) => setManualMetricMax(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-secondary w-full m-t-2" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                  <PlusCircle size={16} /> Add Metric to Chart
                </button>
              </form>
            </div>

          </div>
        )}

        {/* TAB 3: AI SUMMARY & EXPORT */}
        {activeTab === "analysis" && (
          <div className="flex-column gap-6">
            {activeReport ? (
              <div className="split-layout split-layout-2-1" style={{ gap: "2rem" }}>
                
                {/* Left: Summary and references */}
                <div className="flex-column gap-6">
                  {/* Latest Report Data Panel */}
                  <ReportSummaryCard report={activeReport} />
                  
                  {/* Separate sections for different report types (Blood, Sugar, Lipid, Kidney, etc.) */}
                  <div style={{ marginTop: "1rem" }}>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", fontWeight: "600" }}>Categorized Laboratory Biomarkers</h3>
                    <ReportSections report={activeReport} trendsData={dbTrends} />
                  </div>

                  {/* Update Report Section */}
                  <div className="card flex-column gap-3">
                    <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Update Clinical Summary Notes</h3>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={editableSummary}
                      onChange={(e) => setEditableSummary(e.target.value)}
                    />
                    <button onClick={handleUpdateReport} className="btn btn-primary align-center gap-1" style={{ width: "fit-content", fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                      <Save size={14} /> Update Notes
                    </button>
                  </div>
                </div>

                {/* Right: Export Tools */}
                <div className="flex-column gap-4">
                  <div className="card flex-column gap-4" style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: "600" }}>Clinical Export Center</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      Export patient metrics to standard laboratory CSV templates to share with external care systems.
                    </p>
                    <button onClick={handleExportCSV} className="btn btn-secondary align-center gap-1 w-full" style={{ fontSize: "0.85rem", padding: "0.5rem" }}>
                      <Download size={14} /> Export CSV Spreadsheet
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="card text-center" style={{ padding: "4rem 2rem" }}>
                <Sparkles size={36} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
                <h3>No report summary ready</h3>
                <p className="text-secondary-color" style={{ fontSize: "0.85rem", maxWidth: "350px", margin: "0.5rem auto 1.5rem" }}>
                  Please upload a PDF checkup panel to trigger the AI summary notes generator.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GRAPHS & ALERTS */}
        {activeTab === "graphs" && (
          <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
            
            {/* Left: Recharts Graphs */}
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", fontWeight: "600" }}>Laboratory Metric Trends</h3>
              <TrendGraphs trendsData={dbTrends.length > 0 ? dbTrends : trends} />
            </div>

            {/* Right: Out-of-range alerts */}
            <div className="flex-column gap-4">
              <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Abnormal Threshold Alerts</h3>
              
              <div className="flex-column gap-3">
                {dbAlerts.length > 0 ? (
                  dbAlerts.map((alert, idx) => (
                    <div 
                      key={idx}
                      className="card flex-column gap-2"
                      style={{
                        padding: "1rem",
                        borderLeft: "4px solid var(--danger)",
                        backgroundColor: "var(--danger-light)"
                      }}
                    >
                      <div className="flex-between">
                        <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--danger-dark)" }}>{alert.title}</span>
                        <span className="badge badge-danger" style={{ fontSize: "0.65rem" }}>{alert.severity}</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                        {alert.description}
                      </p>
                    </div>
                  ))
                ) : reportAlerts.length > 0 ? (
                  reportAlerts.slice(0, 3).map((alert, idx) => (
                    <div 
                      key={idx}
                      className="card flex-column gap-2"
                      style={{
                        padding: "1rem",
                        borderLeft: "4px solid var(--primary)",
                        backgroundColor: "var(--primary-light)"
                      }}
                    >
                      <div className="flex-between">
                        <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "var(--warning-dark)" }}>{alert.name} Flagged</span>
                        <span className="badge badge-danger" style={{ fontSize: "0.6rem", background: "var(--primary)", color: "white" }}>{alert.status}</span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Recorded value: <strong>{alert.value} {alert.unit}</strong>. Reference range is {alert.min} - {alert.max} {alert.unit}.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="card text-center" style={{ padding: "2rem 1rem" }}>
                    <CheckCircle2 size={24} style={{ color: "var(--success)", marginBottom: "0.5rem" }} />
                    <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>All biomarkers are within normal reference limits.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PatientReports;
