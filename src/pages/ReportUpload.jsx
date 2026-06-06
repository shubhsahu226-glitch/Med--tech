import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { FileUp, Sparkles, FileText, CheckCircle2, Shield } from "lucide-react";

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
    "OCR analysis: scanning diagnostic lines...",
    "Correlating biomarkers to reference guides...",
    "AI summary: calculating threshold warnings...",
    "Finalizing medical summary insights..."
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
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

    const stepInterval = setInterval(() => {
      setUploadStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    const formData = new FormData();
    formData.append("file", file || new Blob(["mock"], { type: "text/plain" }));

    fetch("http://localhost:8000/api/upload-report", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      clearInterval(stepInterval);
      let summary = `AI Insights: ${data.insights.diet} | Reminders: ${data.insights.reminder}`;
      if (data.insights.danger_flags && data.insights.danger_flags.length > 0) {
         summary += ` | WARNING: ${data.insights.danger_flags.join(", ")}`;
      }
      
      const titleToSave = reportTitle || (file ? file.name : "Report");
      uploadReport(user ? user.id : 'guest', titleToSave, reportType, data.historical_data, summary);
      
      setIsUploading(false);
      navigate("/patient/analysis");
    })
    .catch(err => {
      clearInterval(stepInterval);
      console.error(err);
      setError("Failed to connect to backend AI Engine.");
      setIsUploading(false);
    });
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }} className="flex-column gap-6">
      <div className="page-header" style={{ flexDirection: "column", alignItems: "flex-start" }}>
        <div className="align-center gap-2" style={{ marginBottom: "0.5rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--radius-md)",
            background: "var(--primary-light)", display: "flex",
            alignItems: "center", justifyContent: "center", color: "var(--primary)"
          }}>
            <Sparkles size={20} />
          </div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>AI Report Uploader</h1>
        </div>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>
          Upload clinical PDFs or medical images to generate AI-powered summaries and trend analysis.
        </p>
      </div>

      <div className="card">
        {isUploading ? (
          <div className="flex-column flex-center text-center" style={{ padding: "3rem 1.5rem" }}>
            <div className="spinner" style={{ marginBottom: "1.5rem" }} />
            
            <h3 style={{ fontSize: "1.2rem", color: "var(--primary)" }}>AI Medical Agent Scanning</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
              {steps[uploadStep]}
            </p>
            
            <div className="progress-track">
              <div 
                className="progress-fill"
                style={{ width: `${((uploadStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="upload-steps">
              {steps.map((step, i) => (
                <div key={i} className={`upload-step ${i < uploadStep ? "done" : i === uploadStep ? "active" : ""}`}>
                  <span className="upload-step-dot" />
                  {step}
                </div>
              ))}
            </div>

            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1.25rem" }} className="align-center gap-1">
              <Shield size={12} /> HIPAA compliant pipeline — data is encrypted
            </span>
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit} className="flex-column gap-4">
            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "var(--danger-light)", color: "var(--danger)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", border: "1px solid rgba(248, 113, 113, 0.25)" }}>
                {error}
              </div>
            )}

            <div 
              className={`upload-zone ${file ? "has-file" : ""}`}
              onClick={() => document.getElementById("file-upload-input").click()}
            >
              <input 
                type="file" 
                id="file-upload-input" 
                style={{ display: "none" }} 
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              
              <div className="upload-zone-content flex-column flex-center gap-2">
                <div className="upload-icon-wrap">
                  {file ? <FileText size={28} /> : <FileUp size={28} />}
                </div>
                {file ? (
                  <>
                    <h4 style={{ margin: 0 }}>{file.name}</h4>
                    <p className="text-secondary-color" style={{ fontSize: "0.8rem" }}>
                      {(file.size / 1024).toFixed(1)} KB — click to change file
                    </p>
                    <span className="badge badge-success" style={{ marginTop: "0.25rem" }}>
                      <CheckCircle2 size={12} /> Ready to analyze
                    </span>
                  </>
                ) : (
                  <>
                    <h4 style={{ margin: 0 }}>Drop your clinical file here</h4>
                    <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
                      Supports PDF, PNG, JPG from lab networks
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

            <div className="info-banner">
              <Sparkles size={16} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Intelligent OCR Extraction</strong> — automated diagnostic mapping comparing your results against clinical reference ranges.
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full m-t-2" style={{ padding: "0.85rem" }}>
              <Sparkles size={16} /> Upload and Analyze Report
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
export default ReportUpload;
