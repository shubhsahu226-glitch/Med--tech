import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, MapPin, CheckCircle2, ShieldCheck, Calendar, FileText, AlertCircle, Heart, Stethoscope, Award, IndianRupee, Clock, Briefcase, Sparkles } from "lucide-react";

export const ProfileSettingsForm = () => {
  const { user, role, updateUserProfile, saveProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const email = user?.email || "";
  const [phone, setPhone] = useState(user?.phone || user?.mobile_number || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [location, setLocation] = useState(user?.location || "");
  const [consultationFee, setConsultationFee] = useState(user?.consultationFee || "");
  const [specialty, setSpecialty] = useState(user?.specialty || user?.specialization || "General Physician");
  const [experience, setExperience] = useState(user?.experience || "");
  const [licenseNumber, setLicenseNumber] = useState(user?.licenseNumber || user?.license_number || "");
  
  // Patient specific fields
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "");
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || "");

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function calculateAge(dobString) {
    if (!dobString) return "";
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Determine if this is a Guest/Demo user (local-only state)
  const isGuestUser = !user?.id || user.id === "pat1" || user.id === "doc1";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setErrorMsg("");
    setIsLoading(true);

    if (isGuestUser) {
      // Mock flow - save to local session storage
      const commonData = { name, email, phone };
      const roleSpecificData = role === "patient" 
        ? { 
            dob, 
            age: calculateAge(dob), 
            bloodGroup, 
            emergencyContactName, 
            emergencyContactPhone,
            emergencyContact: emergencyContactPhone ? `${emergencyContactName} (${emergencyContactPhone})` : ""
          } 
        : { location, consultationFee, specialty, experience, licenseNumber };

      updateUserProfile({
        ...commonData,
        ...roleSpecificData
      });

      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return;
    }

    // Real DB Sync Flow
    const profileData = {
      name,
      phone,
      dob,
      location,
      specialty,
      hospital: location,
      licenseNumber,
      consultationFee,
      experience,
      bloodGroup,
      emergencyContactName,
      emergencyContactPhone
    };

    const isSaved = await saveProfile(profileData);
    setIsLoading(false);
    if (isSaved) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } else {
      setErrorMsg("Failed to sync profile changes with the database. Please try again.");
    }
  };

  if (role === "doctor") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }} className="flex-column gap-6">
        {/* Clinician Registry Header */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          padding: "2rem",
          borderRadius: "1.25rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(14, 165, 233, 0.15)",
            filter: "blur(40px)"
          }} />
          
          <div className="flex-between align-center" style={{ flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Stethoscope size={18} style={{ color: "#0ea5e9" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "#38bdf8" }}>
                  Clinical Registry
                </span>
              </div>
              <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700", letterSpacing: "-0.025em" }}>
                Practitioner Profile Settings
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                Manage medical credentials, clinical affiliation, consultation parameters, and registry status.
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-full)"
            }}>
              <ShieldCheck size={16} style={{ color: "#10b981" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#34d399" }}>Verified Provider</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {success && (
          <div 
            className="card align-center gap-2" 
            style={{ 
              padding: "1rem", 
              background: "#d1fae5", 
              borderColor: "rgba(16, 185, 129, 0.15)",
              color: "#065f46",
              fontSize: "0.9rem",
              borderRadius: "var(--radius-md)"
            }}
          >
            <CheckCircle2 size={18} />
            <span>
              {isGuestUser 
                ? "Provider demo settings saved successfully to local session sandbox." 
                : "Your professional profile has been saved and synced with the database."}
            </span>
          </div>
        )}

        {errorMsg && (
          <div 
            className="card align-center gap-2" 
            style={{ 
              padding: "1rem", 
              background: "#fee2e2", 
              borderColor: "rgba(239, 68, 68, 0.15)",
              color: "#991b1b",
              fontSize: "0.9rem",
              borderRadius: "var(--radius-md)"
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Columns */}
        <form onSubmit={handleSubmit} className="flex-column gap-6">
          <div className="grid-2" style={{ gap: "2rem", alignItems: "start" }}>
            
            {/* Column 1: Credentials & Clinical Identity */}
            <div className="card" style={{ padding: "2rem", borderRadius: "1.25rem", background: "white", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.1)", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#1e293b" }}>Professional Identity</h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Your medical licenses and clinical specializations</p>
                </div>
              </div>

              <div className="flex-column gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-name" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Full Name (with Prefix)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <User size={16} />
                    </span>
                    <input 
                      type="text" 
                      id="settings-doc-name"
                      className="form-input" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem" }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-specialty" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Medical Specialty</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <Stethoscope size={16} />
                    </span>
                    <select
                      id="settings-doc-specialty"
                      className="form-input"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem", appearance: "none" }}
                    >
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Dermatologist">Dermatologist</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-license" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Medical License Number</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <FileText size={16} />
                    </span>
                    <input 
                      type="text" 
                      id="settings-doc-license"
                      className="form-input" 
                      placeholder="e.g. LIC-987654"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem" }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-experience" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Years of Clinical Experience</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <Briefcase size={16} />
                    </span>
                    <input 
                      type="number" 
                      id="settings-doc-experience"
                      className="form-input" 
                      placeholder="e.g. 10"
                      value={experience ? experience.replace(" years", "") : ""}
                      onChange={(e) => setExperience(e.target.value ? `${e.target.value} years` : "")}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Clinic Location & Consultation Rates */}
            <div className="card" style={{ padding: "2rem", borderRadius: "1.25rem", background: "white", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#1e293b" }}>Clinic & Rates</h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Your practice location and consultation pricing</p>
                </div>
              </div>

              <div className="flex-column gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-location" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Clinic/Hospital Name</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <MapPin size={16} />
                    </span>
                    <input 
                      type="text" 
                      id="settings-doc-location"
                      className="form-input" 
                      placeholder="e.g. City Central Wellness Clinic"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem" }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-fee" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Consultation Fee (₹)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <IndianRupee size={16} />
                    </span>
                    <input 
                      type="number" 
                      id="settings-doc-fee"
                      className="form-input" 
                      placeholder="e.g. 500"
                      value={consultationFee ? consultationFee.replace("$", "").replace("₹", "") : ""}
                      onChange={(e) => setConsultationFee(e.target.value ? `₹${e.target.value}` : "")}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-phone" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Clinical Contact Phone</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <Phone size={16} />
                    </span>
                    <input 
                      type="tel" 
                      id="settings-doc-phone"
                      className="form-input" 
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-doc-email" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>Login Email (Linked to Account)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}>
                      <Mail size={16} />
                    </span>
                    <input 
                      type="email" 
                      id="settings-doc-email"
                      className="form-input" 
                      value={email}
                      disabled
                      style={{ paddingLeft: "2.5rem", width: "100%", borderRadius: "0.5rem", backgroundColor: "#f8fafc", cursor: "not-allowed", color: "#94a3b8", border: "1px solid #e2e8f0" }}
                      title="Account email cannot be modified"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Hours & Availability Summary */}
          <div className="card" style={{ padding: "2rem", borderRadius: "1.25rem", background: "white", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(217, 119, 6, 0.1)", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#1e293b" }}>Consultation Hours & Schedule Preview</h3>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Live preview of the working slots visible to booking patients</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "250px" }} className="flex-column gap-3">
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Days</span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {user?.availability && user.availability.length > 0 ? (
                      user.availability.map((day, idx) => (
                        <span key={idx} style={{ padding: "0.35rem 0.75rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "var(--radius-full)", fontSize: "0.8rem", fontWeight: "600", color: "#334155" }}>
                          {day}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>No active consult days configured.</span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Time Slots</span>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {user?.slots && user.slots.length > 0 ? (
                      user.slots.map((slot, idx) => (
                        <span key={idx} style={{ padding: "0.35rem 0.75rem", background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.15)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", fontWeight: "500", color: "#0284c7" }}>
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic" }}>No slots configured.</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "1.25rem",
                borderRadius: "1rem",
                maxWidth: "340px",
                fontSize: "0.825rem",
                color: "#475569",
                lineHeight: "1.4"
              }} className="flex-column gap-2">
                <div style={{ fontWeight: "600", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Sparkles size={14} style={{ color: "#d97706" }} />
                  <span>How to adjust consultation hours?</span>
                </div>
                <span>The slots and days are generated automatically based on your clinic setup. Use the <strong>"My Clinic"</strong> navigation panel to configure hours, consult days, and pricing.</span>
              </div>
            </div>
          </div>

          {/* Privacy & Cloud Banner */}
          <div 
            style={{ 
              display: "flex", 
              gap: "0.75rem", 
              padding: "1.25rem", 
              backgroundColor: isGuestUser ? "rgba(245, 158, 11, 0.04)" : "rgba(16, 185, 129, 0.04)", 
              border: isGuestUser ? "1px solid rgba(245, 158, 11, 0.15)" : "1px solid rgba(16, 185, 129, 0.15)",
              borderRadius: "1rem",
              fontSize: "0.825rem",
              color: isGuestUser ? "#b45309" : "#15803d",
              lineHeight: 1.4
            }}
          >
            {isGuestUser ? (
              <>
                <ShieldCheck size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: "0.1rem" }} />
                <div>
                  <strong>Demo Mode Practitioner Sandbox:</strong> You are logged in with a local clinical mock account. Changes will only persist in your temporary session storage. Use a registered clinical email to link with the global medical directory.
                </div>
              </>
            ) : (
              <>
                <ShieldCheck size={20} style={{ color: "#10b981", flexShrink: 0, marginTop: "0.1rem" }} />
                <div>
                  <strong>Practitioner Data Integrity Active:</strong> Your professional details are synchronized with the secure PostgreSQL server. Connected patient directories, digital prescriptions, and video consult corridors will adapt dynamically to these attributes.
                </div>
              </>
            )}
          </div>

          {/* Action Row */}
          <div className="flex-between align-center" style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "500" }}>
              {isGuestUser ? "Session Status: Local Clinical Demo" : "Directory Sync Status: Active Connected"}
            </span>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2.5rem", borderRadius: "0.5rem", fontWeight: "600", fontSize: "0.9rem", boxShadow: "0 4px 6px -1px rgba(14, 165, 233, 0.2)" }} disabled={isLoading}>
              {isLoading ? "Saving changes..." : "Save Practitioner Record"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }} className="flex-column gap-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "600" }}>Account Information & Settings</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Manage contact details, clinical preferences, and secure profile parameters.
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
          <span>
            {isGuestUser 
              ? "Local Demo changes saved successfully! (Not synced with cloud in guest mode)." 
              : "Your profile has been successfully saved and synced with your secure Supabase database."}
          </span>
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
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="card" style={{ padding: "2.5rem", borderRadius: "1rem" }}>
        <form onSubmit={handleSubmit} className="flex-column gap-4">
          
          {/* Profile Badge Header */}
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "700" }}>
              {name ? name.charAt(0).toUpperCase() : <User size={32} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600" }}>{name || "User Profile"}</h3>
              <p className="text-secondary-color" style={{ fontSize: "0.75rem", margin: "0.25rem 0 0 0" }}>
                Logged in as: <strong style={{ color: "var(--primary)" }}>{role.toUpperCase()}</strong>
              </p>
            </div>
          </div>

          {/* Form grid */}
          <div className="grid-2" style={{ marginTop: "0.5rem", gap: "1.5rem" }}>
            
            <div className="form-group">
              <label className="form-label" htmlFor="settings-name" style={{ fontWeight: "500" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <User size={16} />
                </span>
                <input 
                  type="text" 
                  id="settings-name"
                  className="form-input" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: "2.5rem", width: "100%" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-email" style={{ fontWeight: "500" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  id="settings-email"
                  className="form-input" 
                  value={email}
                  disabled
                  style={{ paddingLeft: "2.5rem", width: "100%", backgroundColor: "#f3f4f6", cursor: "not-allowed", color: "#6b7280" }}
                  title="Email cannot be modified directly (linked to auth account)"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-phone" style={{ fontWeight: "500" }}>Phone / Mobile Number</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <Phone size={16} />
                </span>
                <input 
                  type="tel" 
                  id="settings-phone"
                  className="form-input" 
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: "2.5rem", width: "100%" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-location" style={{ fontWeight: "500" }}>Location</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <MapPin size={16} />
                </span>
                <input 
                  type="text" 
                  id="settings-location"
                  className="form-input" 
                  placeholder="e.g. New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ paddingLeft: "2.5rem", width: "100%" }}
                />
              </div>
            </div>

            {role === "patient" ? (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-dob" style={{ fontWeight: "500" }}>Date of Birth</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                      <Calendar size={16} />
                    </span>
                    <input 
                      type="date" 
                      id="settings-dob"
                      className="form-input" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%" }}
                    />
                  </div>
                  {dob && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                      Age: {calculateAge(dob)} years old
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-blood" style={{ fontWeight: "500" }}>Blood Group</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                      <Heart size={16} />
                    </span>
                    <select
                      id="settings-blood"
                      className="form-input"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%" }}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-emergency-name" style={{ fontWeight: "500" }}>Emergency Contact Name</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                      <User size={16} />
                    </span>
                    <input 
                      type="text" 
                      id="settings-emergency-name"
                      className="form-input" 
                      placeholder="e.g. John Doe"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-emergency-phone" style={{ fontWeight: "500" }}>Emergency Contact Phone</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                      <Phone size={16} />
                    </span>
                    <input 
                      type="tel" 
                      id="settings-emergency-phone"
                      className="form-input" 
                      placeholder="e.g. +1 (555) 000-0000"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%" }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-specialty" style={{ fontWeight: "500" }}>Medical Specialty</label>
                  <input 
                    type="text" 
                    id="settings-specialty"
                    className="form-input" 
                    placeholder="e.g. Cardiologist"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ width: "100%" }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-license" style={{ fontWeight: "500" }}>Medical License Number</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                      <FileText size={16} />
                    </span>
                    <input 
                      type="text" 
                      id="settings-license"
                      className="form-input" 
                      placeholder="e.g. LIC-123456"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      style={{ paddingLeft: "2.5rem", width: "100%" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-experience" style={{ fontWeight: "500" }}>Clinical Experience (Years)</label>
                  <input 
                    type="number" 
                    id="settings-experience"
                    className="form-input" 
                    placeholder="e.g. 10"
                    value={experience.replace(" years", "")}
                    onChange={(e) => setExperience(e.target.value ? `${e.target.value} years` : "")}
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-fee" style={{ fontWeight: "500" }}>Consultation Fee (₹)</label>
                  <input 
                    type="number" 
                    id="settings-fee"
                    className="form-input" 
                    placeholder="e.g. 500"
                    value={consultationFee ? consultationFee.replace("$", "").replace("₹", "") : ""}
                    onChange={(e) => setConsultationFee(e.target.value ? `₹${e.target.value}` : "")}
                    style={{ width: "100%" }}
                  />
                </div>
              </>
            )}

          </div>

          {/* Alert Security Indicator */}
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
            {isGuestUser ? (
              <>
                <ShieldCheck size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                <div>
                  <strong>Demo Mode Sandbox:</strong> You are currently logged in with a local guest account. Changes will only update your temporary session storage. Use the tab options at sign-in to register a permanent profile.
                </div>
              </>
            ) : (
              <>
                <ShieldCheck size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
                <div>
                  <strong>Cloud Database Synchronized:</strong> Changes are saved securely in your private cloud data store. All connected reports, consultation sessions, and charts will dynamically adapt to these attributes.
                </div>
              </>
            )}
          </div>

          <div className="flex-between m-t-2">
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {isGuestUser ? "Session status: Local Guest" : "Cloud status: Connected"}
            </span>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2rem", fontWeight: "600" }} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProfileSettings = () => {
  const { user } = useAuth();
  return <ProfileSettingsForm key={user?.id || "guest"} />;
};

export default ProfileSettings;
