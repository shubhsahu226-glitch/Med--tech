import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const DoctorAuth = () => {
  const { login, signup, loginGuest } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("Cardiologist");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [location, setLocation] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [about, setAbout] = useState("");
  const [error, setError] = useState("");

  const handleGuestLogin = () => {
    loginGuest("doctor");
    navigate("/doctor/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (!email || !password) {
        setError("Please enter your credentials.");
        return;
      }
      const { data, error } = await login(email, password, "doctor");
      if (!error && data) {
        navigate("/doctor/dashboard");
      } else {
        setError(error?.message || "Login failed. Check your password or email.");
      }
    } else {
      if (!email || !password || !name || !experience || !education || !location || !consultationFee) {
        setError("Please fill in all clinical credentials.");
        return;
      }
      const { data, error } = await signup(
        {
          name,
          email,
          specialty,
          experience: `${experience} years`,
          education,
          location,
          consultationFee: `$${consultationFee}`,
          about: about || `Dr. ${name} is a certified ${specialty.toLowerCase()} dedicated to providing advanced care.`,
          rating: 5.0,
          reviews: 0,
          availability: ["Monday 09:00 - 17:00", "Wednesday 09:00 - 17:00"],
          slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"],
        },
        "doctor"
      );

      if (!error && data) {
        navigate("/doctor/dashboard");
      } else {
        setError(error?.message || "Failed to create provider account.");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.5rem" }}>
        <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", gap: "0.5rem" }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "2.5rem", boxShadow: "var(--shadow-lg)" }}>
          <div className="text-center m-b-6">
            <div className="flex-center m-b-2" style={{ color: "var(--primary)" }}>
              <Stethoscope size={40} fill="var(--primary-light)" />
            </div>
            <h2>{isLogin ? "Medical Provider Login" : "Join Medical Provider Network"}</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>
              {isLogin ? "Sign in to review patient charts and start video calls" : "Register your clinical credentials to consult patients"}
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="doctor-name">Dr. Full Name</label>
                <input 
                  type="text" 
                  id="doctor-name"
                  className="form-input" 
                  placeholder="Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="doctor-email">Clinical Email Address</label>
              <input 
                type="email" 
                id="doctor-email"
                className="form-input" 
                placeholder="sarah.jenkins@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {isLogin && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Demo Tip: Click Sign In to log in as default provider</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doctor-password">Password</label>
              <input 
                type="password" 
                id="doctor-password"
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="doctor-specialty">Specialty</label>
                    <select 
                      id="doctor-specialty"
                      className="form-input"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    >
                      <option>Cardiologist</option>
                      <option>Neurologist</option>
                      <option>Pediatrician</option>
                      <option>Dermatologist</option>
                      <option>General Physician</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="doctor-experience">Experience (Years)</label>
                    <input 
                      type="number" 
                      id="doctor-experience"
                      className="form-input" 
                      placeholder="10"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="doctor-education">Education / Degree</label>
                  <input 
                    type="text" 
                    id="doctor-education"
                    className="form-input" 
                    placeholder="MD - Harvard Medical School"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="doctor-location">Clinic/Hospital Location</label>
                    <input 
                      type="text" 
                      id="doctor-location"
                      className="form-input" 
                      placeholder="Family First Clinic"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="doctor-fee">Consultation Fee ($)</label>
                    <input 
                      type="number" 
                      id="doctor-fee"
                      className="form-input" 
                      placeholder="120"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="doctor-about">Short Bio</label>
                  <textarea 
                    id="doctor-about"
                    className="form-input" 
                    rows="2"
                    placeholder="Describe your medical approach..."
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full m-t-4" style={{ padding: "0.75rem" }}>
              {isLogin ? "Provider Sign In" : "Register Credentials"}
            </button>

            {isLogin && (
              <button 
                type="button" 
                onClick={handleGuestLogin} 
                className="btn btn-secondary w-full m-t-2" 
                style={{ padding: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Guest Doctor Login (Demo bypass)
              </button>
            )}
          </form>

          <div className="text-center m-t-6" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
              {isLogin ? "Want to join our medical network?" : "Registered already?"}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(""); }} 
                className="btn-text" 
                style={{ fontWeight: "600", color: "var(--primary)", marginLeft: "0.25rem", padding: 0 }}
              >
                {isLogin ? "Apply here" : "Sign in here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DoctorAuth;
