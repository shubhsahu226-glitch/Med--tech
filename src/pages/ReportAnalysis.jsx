import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { Sparkles, FileText, CheckCircle2, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";
import { ReportSummaryCard, GraphCard } from "../components/CardComponents";
import { Link } from "react-router-dom";

export const ReportAnalysis = () => {
  const { user } = useAuth();
  const { trends } = useHealth();
  const [selectedReportId, setSelectedReportId] = useState(
    user?.reports && user.reports.length > 0 ? user.reports[0].id : null
  );

  const reports = user?.reports || [];
  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0];

  return (
    <div className="flex-column gap-6">
      {/* Page Header */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>AI Diagnostics & Laboratory Trends</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>View real-time OCR results, AI breakdowns, and long-term health graphs.</p>
        </div>
        <Link to="/patient/upload" className="btn btn-primary">
          Upload New File
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center" style={{ padding: "4rem 2rem" }}>
          <Sparkles size={48} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
          <h2>No Reports Found</h2>
          <p className="text-secondary-color" style={{ maxWidth: "450px", margin: "0.5rem auto 1.5rem" }}>
            Upload a laboratory checkup record or metabolic blood test panel to view structured data charts.
          </p>
          <Link to="/patient/upload" className="btn btn-primary">Upload Now</Link>
        </div>
      ) : (
        /* Grid Layout: Left sidebar selector, Right main details */
        <div className="grid-3" style={{ gridTemplateColumns: "1fr 2fr" }}>
          
          {/* Left: Report History Checklist */}
          <div className="flex-column gap-3">
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Documents Log</h3>
            <div className="flex-column gap-2" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {reports.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className="card text-left"
                  style={{
                    padding: "1rem",
                    border: selectedReportId === rep.id ? "1px solid var(--primary)" : "1px solid var(--border-color)",
                    backgroundColor: selectedReportId === rep.id ? "var(--primary-light)" : "white",
                    transition: "all var(--transition-fast)"
                  }}
                >
                  <div className="flex-between m-b-1">
                    <span className="text-muted-color" style={{ fontSize: "0.75rem" }}>{rep.date}</span>
                    <span className="badge badge-success" style={{ fontSize: "0.6rem" }}>{rep.status}</span>
                  </div>
                  <h4 style={{ fontSize: "0.9rem", margin: 0, color: "var(--text-primary)" }}>{rep.title}</h4>
                  <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>{rep.type}</p>
                </button>
              ))}
            </div>

            <div style={{ padding: "1rem", background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
              <div className="align-center gap-2 m-b-2" style={{ color: "var(--success)" }}>
                <CheckCircle2 size={16} />
                <h4 style={{ fontSize: "0.85rem", margin: 0 }}>Secure Sandbox</h4>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                Reports are analyzed inside an encrypted environment. No information is stored on public LLM servers.
              </p>
            </div>
          </div>

          {/* Right: Main charts & summary */}
          <div className="flex-column gap-6">
            {activeReport && (
              <>
                {/* AI Summary and Table Card */}
                <ReportSummaryCard report={activeReport} />

                {/* SVG Trend Graph over time */}
                <GraphCard trendsData={trends} />
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
export default ReportAnalysis;
