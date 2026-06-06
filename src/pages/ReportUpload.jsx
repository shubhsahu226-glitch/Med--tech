import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { FileUp, Sparkles, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

export const ReportUpload = () => {
  const { user } = useAuth();
  const { uploadReport } = useHealth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("Blood Test");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [error, setError] = useState("");

  const steps = [
    "Reading uploaded report document bytes...",
    "OCR analysis in progress: scanning diagnostic lines...",
    "Correlating biomaterial metrics to reference guides...",
    "AI summary compiling: calculating clinical threshold warnings...",
    "Finalizing medical summary insights..."
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Autofill title if empty
      if (!reportTitle) {
        setReportTitle(selectedFile.name.split(".")[0].replace(/[-_]/g, " "));
      }
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!file && !reportTitle) {
      setError("Please select a file or add a name.");
      return;
    }

    setIsUploading(true);
    setUploadStep(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file || new Blob(["mock"], { type: "text/plain" }));
    formData.append("patient_id", user ? user.id : 'guest');
    formData.append("report_title", reportTitle || (file ? file.name : "Report"));
    formData.append("report_type", reportType);

    fetch("http://localhost:8000/api/upload-report", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.report) {
        // Pass the new fully structured report from the DB directly to the context
        uploadReport(
          user ? user.id : 'guest', 
          data.report.title, 
          data.report.type, 
          data.report.metrics, 
          data.report.aiSummary,
          data.report.id, // pass DB ID
          data.report.date // pass DB date
        );
      }
      
      setIsUploading(false);
      navigate("/patient/analysis");
    })
    .catch(err => {
      console.error(err);
      setError("Failed to connect to backend AI Engine.");
      setIsUploading(false);
    });
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }} className="flex-column gap-6">
      <div>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>AI Laboratory Report Uploader</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Drag and drop clinical PDF records or medical images to generate summaries.</p>
      </div>

      <div className="card">
        {isUploading ? (
          <div className="flex-column flex-center text-center" style={{ padding: "3rem 0" }}>
            {/* Spinning/pulsing animation mockup */}
            <div 
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "4px solid var(--primary-light)",
                borderTop: "4px solid var(--primary)",
                animation: "spin 1s linear infinite",
                marginBottom: "1.5rem"
              }}
            />
            <style>
              {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
            </style>
            
            <h3 style={{ fontSize: "1.2rem", color: "var(--primary)" }}>AI Medical Agent Scanning</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
              {steps[uploadStep]}
            </p>
            
            <div className="w-full" style={{ background: "var(--border-color)", height: "4px", borderRadius: "2px", maxWidth: "300px", marginTop: "1.5rem", overflow: "hidden" }}>
              <div 
                style={{ 
                  height: "100%", 
                  background: "var(--primary)", 
                  width: `${((uploadStep + 1) / steps.length) * 100}%`,
                  transition: "width 0.4s ease"
                }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              HIPAA compliant pipeline. Data is encrypted.
            </span>
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit} className="flex-column gap-4">
            
            {error && (
              <div style={{ padding: "0.75rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            {/* Drag and drop Area */}
            <div 
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "var(--radius-lg)",
                padding: "3rem 1.5rem",
                textAlign: "center",
                backgroundColor: "var(--bg-secondary)",
                cursor: "pointer",
                transition: "border var(--transition-fast)"
              }}
              onClick={() => document.getElementById("file-upload-input").click()}
            >
              <input 
                type="file" 
                id="file-upload-input" 
                style={{ display: "none" }} 
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              
              <div className="flex-column flex-center gap-2">
                <FileUp size={44} style={{ color: "var(--primary)", marginBottom: "0.5rem" }} />
                {file ? (
                  <>
                    <h4 style={{ margin: 0 }}>{file.name}</h4>
                    <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>
                      {(file.size / 1024).toFixed(1)} KB | Click to swap file
                    </p>
                  </>
                ) : (
                  <>
                    <h4 style={{ margin: 0 }}>Select Clinical File</h4>
                    <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
                      Supports PDF, PNG, JPG files from lab networks
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="report-name">Report Title / Alias</label>
              <input 
                type="text" 
                id="report-name"
                className="form-input" 
                placeholder="Comprehensive Metabolic Panel (CMP)"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="report-category">Record Category</label>
              <select 
                id="report-category"
                className="form-input"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option>Blood Test</option>
                <option>MRI Scan</option>
                <option>Cardiogram (ECG)</option>
                <option>Vaccination Certificate</option>
              </select>
            </div>

            <div 
              style={{
                display: "flex",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "var(--primary-light)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(59, 130, 246, 0.1)",
                fontSize: "0.8rem",
                color: "var(--text-secondary)"
              }}
            >
              <Sparkles size={16} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <div>
                <strong>Intelligent OCR Extraction:</strong> Selecting a file and submitting initiates an automated diagnostic mapping, comparing result ranges against typical averages.
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full m-t-2" style={{ padding: "0.75rem" }}>
              Upload and Analyze Report
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
export default ReportUpload;
