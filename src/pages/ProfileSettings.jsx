import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, MapPin, Settings, CheckCircle2, ShieldCheck } from "lucide-react";

export const ProfileSettings = () => {
  const { user, role, updateUserProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [age, setAge] = useState(user?.age || "");
  
  // Role specific states
  const [location, setLocation] = useState(user?.location || "");
  const [consultationFee, setConsultationFee] = useState(user?.consultationFee || "");
  const [specialty, setSpecialty] = useState(user?.specialty || "");
  const [experience, setExperience] = useState(user?.experience || "");

  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);

    const commonData = { name, email, phone };
    const roleSpecificData = role === "patient" 
      ? { age: parseInt(age) } 
      : { location, consultationFee, specialty, experience };

    updateUserProfile({
      ...commonData,
      ...roleSpecificData
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }} className="flex-column gap-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Account Information & Settings</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Manage clinical preferences, contact coordinates, and secure profile parameters.</p>
      </div>

      {success && (
        <div 
          className="card align-center gap-2" 
          style={{ 
            padding: "1rem", 
            background: "var(--success-light)", 
            borderColor: "rgba(16, 185, 129, 0.1)",
            color: "var(--success-dark)",
            fontSize: "0.9rem"
          }}
        >
          <CheckCircle2 size={18} />
          <span>Your clinical profile details have been saved successfully and synced with the active session.</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="card">
        <form onSubmit={handleSubmit} className="flex-column gap-4">
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <img 
              src={user?.avatar || user?.image} 
              alt={name} 
              style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Profile Information</h3>
              <p className="text-secondary-color" style={{ fontSize: "0.75rem" }}>Logged in as: <strong>{role.toUpperCase()}</strong></p>
            </div>
          </div>

          {/* Form grid */}
          <div className="grid-2" style={{ marginTop: "0.5rem" }}>
            
            <div className="form-group">
              <label className="form-label" htmlFor="settings-name">Full Name</label>
              <input 
                type="text" 
                id="settings-name"
                className="form-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-email">Email Address</label>
              <input 
                type="email" 
                id="settings-email"
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-phone">Phone Number</label>
              <input 
                type="tel" 
                id="settings-phone"
                className="form-input" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {role === "patient" ? (
              <div className="form-group">
                <label className="form-label" htmlFor="settings-age">Age (Years)</label>
                <input 
                  type="number" 
                  id="settings-age"
                  className="form-input" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="settings-specialty">Medical Specialty</label>
                <input 
                  type="text" 
                  id="settings-specialty"
                  className="form-input" 
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                />
              </div>
            )}

            {role === "doctor" && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-experience">Clinical Experience</label>
                  <input 
                    type="text" 
                    id="settings-experience"
                    className="form-input" 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="settings-fee">Consultation Fee ($)</label>
                  <input 
                    type="text" 
                    id="settings-fee"
                    className="form-input" 
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label className="form-label" htmlFor="settings-loc">Clinic / Hospital Address</label>
                  <input 
                    type="text" 
                    id="settings-loc"
                    className="form-input" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

          </div>

          <div 
            style={{ 
              display: "flex", 
              gap: "0.5rem", 
              padding: "0.75rem", 
              backgroundColor: "var(--bg-secondary)", 
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)"
            }}
          >
            <ShieldCheck size={18} style={{ color: "var(--success)", flexShrink: 0 }} />
            <div>
              <strong>Security Sandbox:</strong> Changes made here are saved to the client local state. If you sign out or refresh the local storage cache, default values will be reseeded.
            </div>
          </div>

          <div className="flex-between m-t-2">
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Last modified: Just now</span>
            <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProfileSettings;
