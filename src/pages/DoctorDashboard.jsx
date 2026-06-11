import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useHealth } from "../context/HealthContext";
import { supabase } from "../config/supabase";
import { 
  Calendar, 
  Users, 
  FileText, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  Video, 
  AlertTriangle, 
  Check, 
  CheckCircle2, 
  Activity 
} from "lucide-react";

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { patients, appointments, refreshAppointments } = useHealth();
  const [alertsList, setAlertsList] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Refresh appointments on mount to get latest status
  useEffect(() => {
    if (refreshAppointments) refreshAppointments();
  }, []);

  const isGuestUser = !user?.id || user.id === "doc1";

  // Filter clinician's schedule
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user.id || (isGuestUser && apt.doctorId === "doc1"));
  const upcomingApts = doctorAppointments.filter(apt => apt.status === "Upcoming" || apt.status === "Confirmed" || apt.status === "Pending" || apt.status === "Paid");

  // Filter for today's appointments (Confirmed or Upcoming or Paid)
  const todayStr = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' });
  const todaysApts = upcomingApts.filter(apt => apt.date === todayStr || apt.status === "Confirmed" || apt.status === "Paid");

  // Mock clinical alerts for guest/demo doctor
  const getMockAlerts = () => {
    return [
      {
        id: "al_mock_1",
        patient_id: "pat1",
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
      }
    ];
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      
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
        const patientNames = { pat1: "Alex Mercer", pat2: "Emily Watson", pat3: "Michael Vance" };
        const enrichedLocal = localAlerts.map(a => ({
          ...a,
          patient_name: patientNames[a.patient_id] || a.patient_name || "Unknown Patient",
          patient_age: a.patient_age || 34,
          patient_gender: a.patient_gender || "Patient"
        }));

        setAlertsList([...enrichedLocal, ...getMockAlerts()]);
        setAlertsLoading(false);
        return;
      }

      try {
        const { data: aptsData, error: aptsErr } = await supabase
          .from("appointments")
          .select("patient_id")
          .eq("doctor_id", user.id);

        if (aptsErr) throw aptsErr;

        if (!aptsData || aptsData.length === 0) {
          const rosterLocalAlerts = localAlerts.map(la => ({
            ...la,
            patient_name: la.patient_name || "Unknown Patient",
            patient_age: la.patient_age || 30,
            patient_gender: la.patient_gender || "Patient"
          }));
          setAlertsList(rosterLocalAlerts);
          setAlertsLoading(false);
          return;
        }

        const patientIds = [...new Set(aptsData.map((a) => a.patient_id))];

        const { data: alertsData, error: alertsErr } = await supabase
          .from("alerts")
          .select("*")
          .in("patient_id", patientIds)
          .eq("status", "Active")
          .order("created_at", { ascending: false });

        if (alertsErr) throw alertsErr;

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
        console.error("Error fetching alerts on dashboard:", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();

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
    // Resolve local alert if it exists in localStorage
    try {
      const localAlertsStr = localStorage.getItem("virtualvaidya_local_alerts") || "[]";
      const localAlerts = JSON.parse(localAlertsStr);
      const filtered = localAlerts.filter(a => a.id !== alertId);
      if (filtered.length !== localAlerts.length) {
        localStorage.setItem("virtualvaidya_local_alerts", JSON.stringify(filtered));
        setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
        window.dispatchEvent(new Event("storage"));
        return;
      }
    } catch (e) {
      console.warn("Failed to update local storage on resolve:", e);
    }

    if (isGuestUser) {
      setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
      return;
    }

    try {
      const { error } = await supabase
        .from("alerts")
        .update({ status: "Resolved" })
        .eq("id", alertId);

      if (error) throw error;
      setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Error resolving alert:", err);
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

  const formattedDate = new Date().toLocaleDateString("en-US", { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Greeting Header */}
      <div className="flex-between flex-wrap gap-4" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Clinician Workspace</h1>
          <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {user.name} | {user.specialty} — {user.education}
          </p>
        </div>
        <div className="align-center gap-2 text-muted-color" style={{ fontSize: "0.875rem", fontWeight: "500" }}>
          <Clock size={16} />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-3" style={{ gap: "1.5rem" }}>
        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <Users size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Total Patients</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{patients.length} Registered</div>
          </div>
        </div>

        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <Calendar size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Scheduled Sessions</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{upcomingApts.length} Active</div>
          </div>
        </div>

        <div className="card align-center gap-3" style={{ padding: "1.25rem" }}>
          <div style={{ color: "var(--primary)", background: "var(--primary-light)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
            <FileText size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500" }}>Reviews Completed</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>{patients.flatMap(p => p.reports || []).length} Logs</div>
          </div>
        </div>
      </div>

      {/* Split Workspace Layout */}
      <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
        
        {/* Left Column: Today's Clinical Schedule */}
        <div className="flex-column gap-4">
          <div className="flex-between">
            <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "600" }}>Today's Clinical Schedule</h3>
            <Link to="/doctor/appointments" className="btn-text align-center gap-1" style={{ fontSize: "0.8rem", fontWeight: "500", padding: 0 }}>
              All Appointments <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-column gap-3">
            {todaysApts.map(apt => {
              const isPendingAction = apt.status === "Pending" || apt.status === "Paid";
              return (
                <div key={apt.id} className="card flex-column gap-3" style={{ padding: "1.25rem", borderLeft: isPendingAction ? "3px solid #d97706" : "3px solid var(--primary)" }}>
                  <div className="flex-between">
                    <div className="align-center gap-2">
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "0.8rem" }}>
                        {apt.patientName ? apt.patientName.charAt(0) : "P"}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "600" }}>{apt.patientName}</h4>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          Status: {apt.status === "Paid" ? "Paid Request" : apt.status}
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-info" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", fontSize: "0.65rem" }}>
                      {apt.meetingType || "Video"} Session
                    </span>
                  </div>

                  <div className="align-center gap-4" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
                    <div className="align-center gap-1"><Calendar size={14} /> {apt.date}</div>
                    <div className="align-center gap-1"><Clock size={14} /> {apt.time}</div>
                  </div>

                  {isPendingAction ? (
                    <Link 
                      to="/doctor/appointments"
                      className="btn btn-secondary w-full align-center gap-2 justify-content-center"
                      style={{ padding: "0.5rem", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      Review Booking Request
                    </Link>
                  ) : (
                    <Link 
                      to={`/doctor/appointments?consult=${apt.id}`}
                      className="btn btn-primary w-full align-center gap-2 justify-content-center"
                      style={{ padding: "0.5rem", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      <Video size={14} /> Start Consultation
                    </Link>
                  )}
                </div>
              );
            })}

            {todaysApts.length === 0 && (
              <div className="card text-center" style={{ padding: "4rem 2rem", borderRadius: "1rem" }}>
                <Calendar size={36} style={{ color: "var(--text-muted)", marginBottom: "0.75rem", marginLeft: "auto", marginRight: "auto" }} />
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "600" }}>No consultations scheduled today</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  All caught up! Check the Appointments tab to view and accept future booking requests.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Patient Alerts Feed */}
        <div className="flex-column gap-4">
          <div className="flex-between">
            <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "600" }}>Active Alerts Feed</h3>
            <Link to="/doctor/alerts" className="btn-text align-center gap-1" style={{ fontSize: "0.8rem", fontWeight: "500", padding: 0 }}>
              Alerts Board <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-column gap-3">
            {alertsLoading ? (
              <div className="flex-center" style={{ minHeight: "150px" }}>
                <div 
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: "2px solid var(--border-color)",
                    borderTop: "2px solid var(--primary)",
                    animation: "spin 1s linear infinite"
                  }}
                />
              </div>
            ) : alertsList.length === 0 ? (
              <div className="card text-center" style={{ padding: "2.5rem 1.5rem" }}>
                <div className="flex-center" style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--success-light)", color: "var(--success)", margin: "0 auto 0.75rem auto" }}>
                  <CheckCircle2 size={24} />
                </div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>All Patients Stable</h4>
                <p className="text-secondary-color" style={{ fontSize: "0.75rem", marginTop: "0.15rem" }}>
                  No active SOS calls or critical biomarkers on your patient roster.
                </p>
              </div>
            ) : (
              alertsList.slice(0, 3).map(alert => {
                const isHigh = alert.severity?.toLowerCase() === "high";
                return (
                  <div 
                    key={alert.id} 
                    className="card flex-column gap-2" 
                    style={{ 
                      padding: "1rem", 
                      borderLeft: isHigh ? "3px solid var(--danger-dark)" : "3px solid var(--warning-dark)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    <div className="flex-between">
                      <span 
                        className={`badge ${isHigh ? "badge-danger" : "badge-warning"}`}
                        style={{
                          fontSize: "0.6rem",
                          padding: "0.15rem 0.4rem",
                          backgroundColor: isHigh ? "var(--danger-light)" : "var(--warning-light)",
                          color: isHigh ? "var(--danger-dark)" : "var(--warning-dark)"
                        }}
                      >
                        {isHigh ? "CRITICAL" : "WARNING"}
                      </span>
                      <span className="align-center gap-1 text-muted-color" style={{ fontSize: "0.65rem" }}>
                        <Clock size={12} />
                        {formatTimeAgo(alert.created_at || new Date().toISOString())}
                      </span>
                    </div>

                    <h4 style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", fontWeight: "600" }}>{alert.title}</h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {alert.description}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-primary)" }}>
                        {alert.patient_name}
                      </span>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="btn btn-primary align-center gap-1"
                        style={{ 
                          padding: "0.25rem 0.5rem", 
                          fontSize: "0.65rem",
                          backgroundColor: "var(--success)",
                          borderColor: "var(--success)",
                          backgroundImage: "none",
                          boxShadow: "none",
                          height: "auto",
                          borderRadius: "var(--radius-sm)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--success-dark)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--success)"}
                      >
                        <Check size={12} /> Resolve
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;

