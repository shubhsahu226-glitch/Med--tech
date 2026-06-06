import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, UserPlus } from "lucide-react";

export const Onboarding = () => {
  const { user, saveProfile } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !mobile || !location || !dob) {
      setError("All fields are mandatory to secure your account.");
      return;
    }

    setIsLoading(true);

    const success = await saveProfile({
      name,
      mobile_number: mobile,
      location,
      dob
    });

    if (success) {
      navigate("/patient/dashboard");
    } else {
      setError("Failed to save profile. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "2.5rem", boxShadow: "var(--shadow-lg)" }}>
        <div className="text-center m-b-6">
          <div className="flex-center m-b-3" style={{ color: "var(--warning)" }}>
            <ShieldAlert size={48} />
          </div>
          <h2>Complete Your Profile</h2>
          <p className="text-secondary-color" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            To comply with healthcare regulations, we require a few more details before you can access the portal.
          </p>
        </div>

        {error && (
          <div style={{ padding: "0.75rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">Full Name</label>
            <input 
              type="text" 
              id="profile-name"
              className="form-input" 
              placeholder="Alex Mercer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profile-mobile">Mobile Number</label>
            <input 
              type="tel" 
              id="profile-mobile"
              className="form-input" 
              placeholder="+1 (555) 000-0000"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profile-location">City / Location</label>
            <input 
              type="text" 
              id="profile-location"
              className="form-input" 
              placeholder="New York, USA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profile-dob">Date of Birth</label>
            <input 
              type="date" 
              id="profile-dob"
              className="form-input" 
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full m-t-4" style={{ padding: "0.85rem", fontSize: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <UserPlus size={18} />
            {isLoading ? "Saving..." : "Secure My Account"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default Onboarding;
