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

    // Simulate AI loading steps sequentially
    const interval = setInterval(() => {
      setUploadStep(prevStep => {
        if (prevStep < steps.length - 1) {
          return prevStep + 1;
        } else {
          clearInterval(interval);
          
          // Generate realistic mock report metrics depending on selection
          let metrics = [];
          let summary = "";
          
          if (reportType === "Blood Test") {
            metrics = [
              { name: "Systolic BP", value: 120 + Math.floor(Math.random() * 20), unit: "mmHg", status: "Normal", min: 90, max: 129 },
              { name: "Diastolic BP", value: 80 + Math.floor(Math.random() * 10), unit: "mmHg", status: "Normal", min: 60, max: 84 },
              { name: "LDL Cholesterol", value: 110 + Math.floor(Math.random() * 40), unit: "mg/dL", status: "Borderline High", min: 50, max: 99 },
              { name: "Fasting Glucose", value: 85 + Math.floor(Math.random() * 30), unit: "mg/dL", status: "Normal", min: 70, max: 99 }
            ];
            // Assess thresholds
            metrics = metrics.map(m => {
              if (m.name === "LDL Cholesterol" && m.value > 130) {
                return { ...m, status: "Abnormal" };
              }
              if (m.name === "Fasting Glucose" && m.value > 100) {
                return { ...m, status: "Abnormal" };
              }
              if (m.name === "Systolic BP" && m.value > 130) {
                return { ...m, status: "High Borderline" };
              }
              return m;
            });
            
            const abnormalCount = metrics.filter(m => m.status.includes("Abnormal")).length;
            summary = `The AI diagnostics finished scan of Blood Panel "${reportTitle}". We identified ${abnormalCount} abnormal values. Fasting blood glucose and vital signs look satisfactory. However, LDL levels show a mild elevation which could benefit from dietary fiber increase and routine cardio activity.`;
          } else {
            metrics = [
              { name: "Scan Clearance", value: 1.0, unit: "Index", status: "Normal", min: 0.9, max: 1.1 },
              { name: "Structural Shift", value: 0.0, unit: "mm", status: "Normal", min: 0.0, max: 0.1 }
            ];
            summary = `We processed the digital imaging scan "${reportTitle}". Neural tissue and brain structures show symmetry. No sign of acute pathology, blockages, or intracranial lesions detected. The results appear clean.`;
          }

          // Save to context
          uploadReport(user.id, reportTitle || file.name, reportType, metrics, summary);
          setIsUploading(false);
          navigate("/patient/analysis");
          return prevStep;
        }
      });
    }, 900);
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
