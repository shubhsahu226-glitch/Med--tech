import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, MapPin, Settings, CheckCircle2, ShieldCheck, Calendar, FileText, AlertCircle, Heart } from "lucide-react";

export const ProfileSettings = () => {
  const { user, role, updateUserProfile, saveProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
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

  // Keep state inputs synced if user object asynchronously loads from Supabase
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || user.mobile_number || "");
      setDob(user.dob || "");
      setLocation(user.location || "");
      setConsultationFee(user.consultationFee || "");
      setSpecialty(user.specialty || user.specialization || "General Physician");
      setExperience(user.experience || "");
      setLicenseNumber(user.licenseNumber || user.license_number || "");
      setBloodGroup(user.bloodGroup || "");
      setEmergencyContactName(user.emergencyContactName || "");
      setEmergencyContactPhone(user.emergencyContactPhone || "");
    }
  }, [user]);

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
                  <label className="form-label" htmlFor="settings-fee" style={{ fontWeight: "500" }}>Consultation Fee ($)</label>
                  <input 
                    type="number" 
                    id="settings-fee"
                    className="form-input" 
                    placeholder="e.g. 150"
                    value={consultationFee.replace("$", "")}
                    onChange={(e) => setConsultationFee(e.target.value ? `$${e.target.value}` : "")}
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
export default ProfileSettings;
