import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, CheckCircle2, Clock, Check, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export const DoctorAlerts = () => {
  const { user } = useAuth();
  const [alertsList, setAlertsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isGuestUser = !user?.id || user.id === "7a02fa0d-9719-4261-bd98-1c3d54238c2f";

  // Mock clinical alerts for guest/demo doctor
  const getMockAlerts = () => {
    return [
      {
        id: "al_mock_1",
        patient_id: "6bbc3a1a-2b12-48cd-b04d-8974ca01264a",
        patient_name: "Alex Mercer",
        patient_age: 34,
        patient_gender: "Male",
        title: "Critical Hypertension Spike",
        severity: "High",
        description: "Systolic BP reading exceeded 160 mmHg (recorded at 162/95 mmHg). High risk of cardiovascular event. Immediate clinical review recommended.",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      },
      {
        id: "al_mock_2",
        patient_id: "pat2",
        patient_name: "Emily Watson",
        patient_age: 28,
        patient_gender: "Female",
        title: "Emergency SOS Alarm Triggered",
        severity: "High",
        description: "Patient triggered immediate emergency SOS alarm via mobile patient workspace. Checked-in location: Metropolitan Area (simulated GPS coordinates 40.7128° N, 74.0060° W).",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: "al_mock_3",
        patient_id: "pat3",
        patient_name: "Michael Vance",
        patient_age: 62,
        patient_gender: "Male",
        title: "Borderline Hyperglycemia Indicator",
        severity: "Medium",
        description: "Fasting blood sugar was uploaded at 145 mg/dL. Chronic diabetes marker HbA1c is currently at 7.2%. Requires treatment review or dose adjustment of Metformin.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
      }
    ];
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      setErrorMsg("");

      // Read local alerts from localStorage
      const localAlerts = [];
      try {
        const localStr = localStorage.getItem("virtualvaidya_local_alerts") || "[]";
        const parsed = JSON.parse(localStr);
        parsed.forEach(la => {
          localAlerts.push(la);
        });
      } catch (e) {
        console.warn("Failed to load local alerts from storage:", e);
      }

      if (isGuestUser) {
        const patientNames = { "6bbc3a1a-2b12-48cd-b04d-8974ca01264a": "Alex Mercer", pat2: "Emily Watson", pat3: "Michael Vance" };
        const enrichedLocal = localAlerts.map(a => ({
          ...a,
          patient_name: patientNames[a.patient_id] || a.patient_name || "Unknown Patient",
          patient_age: a.patient_age || 34,
          patient_gender: a.patient_gender || "Patient"
        }));

        setAlertsList([...enrichedLocal, ...getMockAlerts()]);
        setIsLoading(false);
        return;
      }

      try {
        // 1. Get connected patient IDs from appointments
        const { data: aptsData, error: aptsErr } = await supabase
          .from("appointments")
          .select("patient_id")
          .eq("doctor_id", user.id);

        if (aptsErr) throw aptsErr;

        if (!aptsData || aptsData.length === 0) {
          // No DB alerts, but check if local storage alerts apply
          const rosterLocalAlerts = localAlerts
            .map(la => ({
              ...la,
              patient_name: la.patient_name || "Unknown Patient",
              patient_age: la.patient_age || 30,
              patient_gender: la.patient_gender || "Patient"
            }));
          setAlertsList(rosterLocalAlerts);
          setIsLoading(false);
          return;
        }

        const patientIds = [...new Set(aptsData.map((a) => a.patient_id))];

        // 2. Fetch active alerts for these patients
        const { data: alertsData, error: alertsErr } = await supabase
          .from("alerts")
          .select("*")
          .in("patient_id", patientIds)
          .eq("status", "Active")
          .order("created_at", { ascending: false });

        if (alertsErr) throw alertsErr;

        // 3. Fetch patient profile names & dob to match
        const { data: profilesData, error: profErr } = await supabase
          .from("profiles")
          .select("id, name, dob")
          .in("id", patientIds);

        if (profErr) throw profErr;

        const profilesMap = {};
        if (profilesData) {
          profilesData.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }

        const calculateAge = (dobString) => {
          if (!dobString) return null;
          const birthDate = new Date(dobString);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
          return age;
        };

        const enrichedAlerts = (alertsData || []).map((a) => {
          const profile = profilesMap[a.patient_id] || {};
          return {
            ...a,
            patient_name: profile.name || "Unknown Patient",
            patient_age: calculateAge(profile.dob) || 30,
            patient_gender: "Patient",
          };
        });

        // 4. Merge database alerts with local alerts belonging to our patient roster
        const finalAlerts = [...enrichedAlerts];
        
        const rosterLocalAlerts = localAlerts
          .filter(la => patientIds.includes(la.patient_id))
          .map(la => ({
            ...la,
            patient_name: la.patient_name || "Unknown Patient",
            patient_age: la.patient_age || 30,
            patient_gender: la.patient_gender || "Patient"
          }));

        rosterLocalAlerts.forEach(la => {
          if (!finalAlerts.find(fa => fa.id === la.id)) {
            finalAlerts.unshift(la);
          }
        });

        setAlertsList(finalAlerts);
      } catch (err) {
        console.error("Error fetching clinical alerts:", err);
        setErrorMsg("Failed to load active patient alerts from database.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();

    // Set up storage polling/syncing for real-time doctor alerts updates
    const handleStorage = () => {
      fetchAlerts();
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(fetchAlerts, 3000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [user, isGuestUser]);

  const handleResolveAlert = async (alertId) => {
    setSuccessMsg("");
    setErrorMsg("");

    // Resolve local alert if it exists in localStorage
    try {
      const localAlertsStr = localStorage.getItem("virtualvaidya_local_alerts") || "[]";
      const localAlerts = JSON.parse(localAlertsStr);
      const filtered = localAlerts.filter(a => a.id !== alertId);
      if (filtered.length !== localAlerts.length) {
        localStorage.setItem("virtualvaidya_local_alerts", JSON.stringify(filtered));
        setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
        setSuccessMsg("Local alert resolved successfully.");
        setTimeout(() => setSuccessMsg(""), 3000);
        window.dispatchEvent(new Event("storage"));
        return;
      }
    } catch (e) {
      console.warn("Failed to update local storage on resolve:", e);
    }

    if (isGuestUser) {
      setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
      setSuccessMsg("Alert resolved successfully (Guest Mode).");
      setTimeout(() => setSuccessMsg(""), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from("alerts")
        .update({ status: "Resolved" })
        .eq("id", alertId);

      if (error) throw error;

      setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
      setSuccessMsg("Clinical alert updated to Resolved status in PostgreSQL database.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error resolving alert:", err);
      setErrorMsg("Failed to update alert status in the database.");
    }
  };

  const formatTimeAgo = (isoString) => {
    try {
      const date = new Date(isoString);
      const seconds = Math.floor((new Date() - date) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return "just now";
    } catch {
      return "recently";
    }
  };

  return (
    <div className="flex-column gap-6" style={{ minHeight: "80vh", backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Patient Alerts Board</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Monitor critical SOS triggers, physiological warnings, and out-of-range diagnostic biomarkers for connected patients.
        </p>
      </div>

      {/* System feedback banners */}
      {successMsg && (
        <div 
          className="card align-center gap-2" 
          style={{ 
            padding: "1rem", 
            background: "var(--success-light)", 
            borderColor: "rgba(16, 185, 129, 0.15)",
            color: "var(--success-dark)",
            fontSize: "0.9rem",
            borderRadius: "var(--radius-md)"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div 
          className="card align-center gap-2" 
          style={{ 
            padding: "1rem", 
            background: "var(--danger-light)", 
            borderColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--danger-dark)",
            fontSize: "0.9rem",
            borderRadius: "var(--radius-md)"
          }}
        >
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Alerts Dashboard Summary Cards */}
      <div className="grid-3" style={{ gap: "1.5rem" }}>
        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--danger-dark)", background: "var(--danger-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>High Severity</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>
              {alertsList.filter(a => a.severity?.toLowerCase() === "high").length} Active SOS/Spike(s)
            </div>
          </div>
        </div>

        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--warning-dark)", background: "var(--warning-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Medium Severity</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>
              {alertsList.filter(a => a.severity?.toLowerCase() === "medium" || a.severity?.toLowerCase() === "moderate").length} Warning(s)
            </div>
          </div>
        </div>

        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--success-dark)", background: "var(--success-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>System Integrity</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Clinical Feeds Synced
            </div>
          </div>
        </div>
      </div>

      {/* Main Alerts List Grid */}
      <div className="flex-column gap-4" style={{ marginTop: "1rem" }}>
        <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "600" }}>Active Clinical Warnings</h3>

        {isLoading ? (
          <div className="flex-center" style={{ minHeight: "200px" }}>
            <div 
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                border: "3px solid var(--border-color)",
                borderTop: "3px solid var(--primary)",
                animation: "spin 1s linear infinite"
              }}
            />
          </div>
        ) : alertsList.length === 0 ? (
          <div className="card text-center" style={{ padding: "5rem 2rem", borderRadius: "1rem" }}>
            <div className="flex-center" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--success-light)", color: "var(--success)", margin: "0 auto 1.5rem auto" }}>
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>All Patients Stable</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem", maxWidth: "450px", margin: "0 auto", lineHeight: 1.5 }}>
              There are currently no active emergency notifications, critical biomarker spikes, or pending warning logs on your roster.
            </p>
          </div>
        ) : (
          <div className="flex-column gap-4">
            {alertsList.map((alert) => {
              const isHigh = alert.severity?.toLowerCase() === "high";
              return (
                <div 
                  key={alert.id}
                  className="card flex-column gap-3"
                  style={{
                    padding: "1.5rem",
                    borderLeft: isHigh ? "4px solid var(--danger-dark)" : "4px solid var(--warning-dark)",
                    borderRadius: "var(--radius-md)",
                    transition: "all var(--transition-fast)",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <div className="flex-between flex-wrap gap-2">
                    <div className="align-center gap-3">
                      <span 
                        className={`badge ${isHigh ? "badge-danger" : "badge-warning"}`}
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.25rem 0.6rem",
                          backgroundColor: isHigh ? "var(--danger-light)" : "var(--warning-light)",
                          color: isHigh ? "var(--danger-dark)" : "var(--warning-dark)"
                        }}
                      >
                        {isHigh ? "CRITICAL ALERT" : "CLINICAL WARNING"}
                      </span>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "600" }}>{alert.title}</h4>
                    </div>
                    
                    <div className="align-center gap-2 text-muted-color" style={{ fontSize: "0.75rem" }}>
                      <Clock size={14} />
                      <span>{formatTimeAgo(alert.created_at)}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {alert.description}
                  </p>

                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      borderTop: "1px solid var(--border-color)", 
                      paddingTop: "1rem", 
                      marginTop: "0.5rem",
                      flexWrap: "wrap",
                      gap: "1rem"
                    }}
                  >
                    {/* Patient Context Tag */}
                    <div className="align-center gap-2">
                      <div 
                        style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          background: "var(--bg-tertiary)", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "var(--text-secondary)"
                        }}
                      >
                        {alert.patient_name.charAt(0)}
                      </div>
                      <div className="flex-column">
                        <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)" }}>
                          {alert.patient_name}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          {alert.patient_age} yrs • {alert.patient_gender}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="align-center gap-2">
                      <Link 
                        to="/doctor/patients" 
                        className="btn btn-secondary" 
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                      >
                        View Chart
                      </Link>
                      
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="btn btn-primary align-center gap-1"
                        style={{ 
                          padding: "0.4rem 1rem", 
                          fontSize: "0.75rem",
                          backgroundColor: "var(--success)",
                          backgroundImage: "none",
                          boxShadow: "none"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--success-dark)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--success)"}
                      >
                        <Check size={14} /> Resolve Alert
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAlerts;
