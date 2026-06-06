import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, ArrowLeft, Users, Video, FileText } from "lucide-react";

export const DoctorAuth = () => {
  const { login, signup } = useAuth();
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (!email || !password) {
        setError("Please enter your credentials.");
        return;
      }
      const success = login(email, password, "doctor");
      if (success) navigate("/doctor/dashboard");
      else setError("Login failed. Check your password or email.");
    } else {
      if (!email || !password || !name || !experience || !education || !location || !consultationFee) {
        setError("Please fill in all clinical credentials.");
        return;
      }
      const success = signup({
        name, email, specialty,
        experience: `${experience} years`,
        education, location,
        consultationFee: `$${consultationFee}`,
        about: about || `Dr. ${name} is a certified ${specialty.toLowerCase()} dedicated to providing advanced care.`,
        rating: 5.0, reviews: 0,
        availability: ["Monday 09:00 - 17:00", "Wednesday 09:00 - 17:00"],
        slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
      }, "doctor");

      if (success) navigate("/doctor/dashboard");
      else setError("Failed to create provider account.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel" style={{ background: "linear-gradient(160deg, rgba(129, 140, 248, 0.12) 0%, rgba(15, 23, 42, 0.8) 50%, var(--bg-primary) 100%)" }}>
        <div className="auth-brand-content">
          <div className="hero-badge" style={{ marginBottom: "1.5rem", alignSelf: "flex-start", color: "#818cf8", background: "rgba(129, 140, 248, 0.12)", borderColor: "rgba(129, 140, 248, 0.2)" }}>
            <Stethoscope size={16} />
            <span>Provider Portal</span>
          </div>
          <h1>Practice medicine,<br />digitally empowered</h1>
          <p>
            Review patient charts with AI insights, conduct secure video consultations, 
            and manage prescriptions from a unified clinical dashboard.
          </p>
          <div className="auth-features">
            {[
              { icon: Users, text: "Connected patient health records" },
              { icon: Video, text: "HD telehealth consultation rooms" },
              { icon: FileText, text: "Digital prescription & care notes" },
            ].map((f, i) => (
              <div key={i} className="auth-feature-item">
                <span className="auth-feature-dot" style={{ background: "#818cf8", boxShadow: "0 0 8px #818cf8" }} />
                <f.icon size={14} style={{ color: "#818cf8" }} />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-back">
          <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", gap: "0.5rem", fontSize: "0.85rem" }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div className="card auth-card" style={{ maxWidth: "480px" }}>
          <div className="text-center m-b-6">
            <div className="auth-logo" style={{ background: "rgba(129, 140, 248, 0.12)", color: "#818cf8" }}>
              <Stethoscope size={28} />
            </div>
            <h2>{isLogin ? "Provider Sign In" : "Join Our Network"}</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>
              {isLogin ? "Access your clinical dashboard" : "Register your medical credentials"}
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "var(--danger-light)", color: "var(--danger)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem", border: "1px solid rgba(248,113,113,0.25)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="doctor-name">Dr. Full Name</label>
                <input type="text" id="doctor-name" className="form-input" placeholder="Sarah Jenkins" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="doctor-email">Clinical Email</label>
              <input type="email" id="doctor-email" className="form-input" placeholder="sarah.jenkins@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} />
              {isLogin && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Demo: click Sign In with any credentials</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doctor-password">Password</label>
              <input type="password" id="doctor-password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {!isLogin && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="doctor-specialty">Specialty</label>
                    <select id="doctor-specialty" className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                      {["Cardiologist","Neurologist","Pediatrician","Dermatologist","General Physician"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="doctor-experience">Experience (Yrs)</label>
                    <input type="number" id="doctor-experience" className="form-input" placeholder="10" value={experience} onChange={(e) => setExperience(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="doctor-education">Education / Degree</label>
                  <input type="text" id="doctor-education" className="form-input" placeholder="MD - Harvard Medical School" value={education} onChange={(e) => setEducation(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="doctor-location">Clinic Location</label>
                    <input type="text" id="doctor-location" className="form-input" placeholder="Family First Clinic" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="doctor-fee">Fee ($)</label>
                    <input type="number" id="doctor-fee" className="form-input" placeholder="120" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="doctor-about">Short Bio</label>
                  <textarea id="doctor-about" className="form-input" rows="2" placeholder="Describe your medical approach..." value={about} onChange={(e) => setAbout(e.target.value)} />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full m-t-4" style={{ padding: "0.8rem" }}>
              {isLogin ? "Sign In" : "Register Credentials"}
            </button>
          </form>

          <div className="text-center m-t-6" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
              {isLogin ? "Want to join?" : "Registered already?"}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="btn-text" style={{ fontWeight: "600", marginLeft: "0.35rem", padding: "0.15rem 0.4rem" }}>
                {isLogin ? "Apply here" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DoctorAuth;
