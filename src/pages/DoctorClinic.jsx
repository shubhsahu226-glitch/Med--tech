import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, CheckCircle2, ShieldCheck, Clock, MapPin, DollarSign, Calendar, Sparkles } from "lucide-react";

export const DoctorClinic = () => {
  const { user, role, saveProfile, updateUserProfile } = useAuth();

  const [clinicName, setClinicName] = useState("");
  const [specialty, setSpecialty] = useState("General Physician");
  const [description, setDescription] = useState("");
  const [consultationFee, setConsultationFee] = useState("50");
  const [availabilityDays, setAvailabilityDays] = useState(["Monday", "Wednesday", "Friday"]);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setClinicName(user.hospital || user.location || "City Central Clinic");
      setSpecialty(user.specialty || "General Physician");
      setDescription(user.description || `Dr. ${user.name || "Clinician"} is dedicated to providing high quality virtual consultations.`);
      setConsultationFee(user.consultationFee ? user.consultationFee.replace("$", "") : "50");
      
      if (user.availability && user.availability.length > 0) {
        setAvailabilityDays(user.availability);
      }
    }
  }, [user]);

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleDayToggle = (day) => {
    setAvailabilityDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const isGuestUser = !user?.id || user.id === "doc1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setIsLoading(true);

    // Generate sample hourly slots based on start/end times
    const generatedSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

    if (isGuestUser) {
      // Mock save locally
      updateUserProfile({
        hospital: clinicName,
        specialty,
        description,
        consultationFee: `$${consultationFee}`,
        availability: availabilityDays,
        slots: generatedSlots
      });
      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    // Real DB Sync Flow
    const profileData = {
      name: user.name,
      phone: user.phone || "",
      location: clinicName,
      specialty,
      hospital: clinicName,
      licenseNumber: user.licenseNumber || "",
      consultationFee: `$${consultationFee}`,
      availability: availabilityDays,
      slots: generatedSlots
    };

    const ok = await saveProfile(profileData);
    setIsLoading(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="flex-column gap-6" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>My Virtual Clinic Setup</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Configure working hours, days, fees, and diagnostic slots visible to patient directories.
        </p>
      </div>

      {success && (
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
          <span>Clinic settings saved successfully and published to the directory!</span>
        </div>
      )}

      <div className="split-layout split-layout-2-1" style={{ gap: "2.5rem" }}>
        
        {/* Form Panel */}
        <div className="card" style={{ padding: "2.5rem", borderRadius: "1rem" }}>
          <form onSubmit={handleSubmit} className="flex-column gap-4">
            
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              Clinic Profile Details
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="clinic-name" style={{ fontWeight: "500" }}>Virtual Clinic Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <MapPin size={16} />
                </span>
                <input 
                  type="text" 
                  id="clinic-name" 
                  className="form-input" 
                  placeholder="e.g. City Wellness Digital Clinic" 
                  value={clinicName} 
                  onChange={(e) => setClinicName(e.target.value)} 
                  style={{ paddingLeft: "2.5rem", width: "100%" }}
                  required
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: "1.5rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="clinic-specialty" style={{ fontWeight: "500" }}>Specialty Category</label>
                <select 
                  id="clinic-specialty" 
                  className="form-input" 
                  value={specialty} 
                  onChange={(e) => setSpecialty(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option>Cardiologist</option>
                  <option>Neurologist</option>
                  <option>Pediatrician</option>
                  <option>Dermatologist</option>
                  <option>General Physician</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="clinic-fee" style={{ fontWeight: "500" }}>Consultation Fee ($)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                    <DollarSign size={16} />
                  </span>
                  <input 
                    type="number" 
                    id="clinic-fee" 
                    className="form-input" 
                    placeholder="50" 
                    value={consultationFee} 
                    onChange={(e) => setConsultationFee(e.target.value)} 
                    style={{ paddingLeft: "2.5rem", width: "100%" }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="clinic-desc" style={{ fontWeight: "500" }}>Clinic Description & About</label>
              <textarea 
                id="clinic-desc" 
                className="form-input" 
                rows="3" 
                placeholder="Write a brief overview of your clinical background and virtual clinic services..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", lineHeight: 1.4 }}
                required
              />
            </div>

            <h3 style={{ margin: "1rem 0 0 0", fontSize: "1.2rem", fontWeight: "600", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              Availability Configuration
            </h3>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: "500" }}>Available Consult Days</label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
                {allDays.map(day => {
                  const active = availabilityDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      style={{
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        borderRadius: "var(--radius-full)",
                        backgroundColor: active ? "var(--primary)" : "white",
                        color: active ? "white" : "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid-2" style={{ gap: "1.5rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="clinic-start" style={{ fontWeight: "500" }}>Hours Start</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                    <Clock size={16} />
                  </span>
                  <input 
                    type="text" 
                    id="clinic-start" 
                    className="form-input" 
                    placeholder="09:00 AM" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    style={{ paddingLeft: "2.5rem", width: "100%" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="clinic-end" style={{ fontWeight: "500" }}>Hours End</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                    <Clock size={16} />
                  </span>
                  <input 
                    type="text" 
                    id="clinic-end" 
                    className="form-input" 
                    placeholder="05:00 PM" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    style={{ paddingLeft: "2.5rem", width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* Sandbox Notice Banner */}
            <div 
              style={{ 
                display: "flex", 
                gap: "0.75rem", 
                padding: "1rem", 
                backgroundColor: isGuestUser ? "rgba(245, 158, 11, 0.05)" : "rgba(34, 197, 94, 0.05)", 
                border: isGuestUser ? "1px solid rgba(245, 158, 11, 0.15)" : "1px solid rgba(34, 197, 94, 0.15)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.825rem",
                color: isGuestUser ? "#b45309" : "#15803d",
                marginTop: "1rem"
              }}
            >
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <div>
                {isGuestUser ? (
                  <span><strong>Guest Demo Settings:</strong> You are currently configuring availability on a temporary local guest profile. Values will not be synchronized to the remote catalog.</span>
                ) : (
                  <span><strong>Cloud Directory Active:</strong> Your configuration is fully synced with the secure PostgreSQL backend. Patient booking portals will dynamically display these slots.</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2.5rem", fontWeight: "600" }} disabled={isLoading}>
                {isLoading ? "Saving Settings..." : "Publish Clinic Settings"}
              </button>
            </div>

          </form>
        </div>

        {/* Catalog Preview Panel */}
        <div className="flex-column gap-4">
          <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "600" }}>Live Patient-Catalog Preview</h3>
          
          <div className="card flex-column gap-3" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
            <div className="align-center gap-3">
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "700" }}>
                {user?.name ? user.name.replace("Dr. ", "").charAt(0) : "D"}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600" }}>{user?.name || "Dr. Sarah Jenkins"}</h4>
                <span className="badge badge-info" style={{ fontSize: "0.65rem", backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>{specialty}</span>
              </div>
            </div>
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0.25rem 0" }}>
              {description}
            </p>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", fontSize: "0.75rem" }} className="flex-column gap-2">
              <div className="align-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <MapPin size={14} style={{ color: "var(--primary)" }} />
                <span>{clinicName}</span>
              </div>
              <div className="align-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <DollarSign size={14} style={{ color: "var(--success)" }} />
                <span><strong>${consultationFee}</strong> Consultation Fee</span>
              </div>
              <div className="align-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <Calendar size={14} style={{ color: "#d97706" }} />
                <span>Days: {availabilityDays.join(", ") || "None selected"}</span>
              </div>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <button type="button" className="btn btn-secondary w-full" style={{ padding: "0.5rem", fontSize: "0.75rem", pointerEvents: "none" }}>
                Patient Booking Portal Active
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorClinic;
