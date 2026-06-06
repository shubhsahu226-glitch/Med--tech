import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, ArrowLeft, Sparkles, ShieldCheck, Calendar } from "lucide-react";

export const PatientAuth = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      const success = login(email, password, "patient");
      if (success) {
        navigate("/patient/dashboard");
      } else {
        setError("Invalid credentials. Try alex.mercer@gmail.com with any password.");
      }
    } else {
      if (!email || !password || !name || !age || !phone) {
        setError("Please fill in all details.");
        return;
      }
      const success = signup({
        name, email, age: parseInt(age), gender, bloodGroup, phone, condition: "Healthy"
      }, "patient");
      
      if (success) navigate("/patient/dashboard");
      else setError("Signup failed. Please try again.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="hero-badge" style={{ marginBottom: "1.5rem", alignSelf: "flex-start" }}>
            <HeartPulse size={16} />
            <span>Patient Portal</span>
          </div>
          <h1>Your health,<br />intelligently managed</h1>
          <p>
            Upload lab reports for instant AI analysis, book virtual consultations, 
            and track medications — all in one secure platform.
          </p>
          <div className="auth-features">
            {[
              { icon: Sparkles, text: "AI-powered report analysis" },
              { icon: Calendar, text: "Book doctors in under a minute" },
              { icon: ShieldCheck, text: "HIPAA-compliant data security" },
            ].map((f, i) => (
              <div key={i} className="auth-feature-item">
                <span className="auth-feature-dot" />
                <f.icon size={14} style={{ color: "var(--primary)" }} />
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

        <div className="card auth-card">
          <div className="text-center m-b-6">
            <div className="auth-logo">
              <HeartPulse size={28} />
            </div>
            <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>
              {isLogin ? "Sign in to access your health dashboard" : "Register to start your health journey"}
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
                <label className="form-label" htmlFor="patient-name">Full Name</label>
                <input type="text" id="patient-name" className="form-input" placeholder="Alex Mercer" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="patient-email">Email Address</label>
              <input type="email" id="patient-email" className="form-input" placeholder="alex.mercer@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {isLogin && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Demo: <strong>alex.mercer@gmail.com</strong></span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-password">Password</label>
              <input type="password" id="patient-password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {!isLogin && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="patient-age">Age</label>
                    <input type="number" id="patient-age" className="form-input" placeholder="34" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="patient-gender">Gender</label>
                    <select id="patient-gender" className="form-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="patient-blood">Blood Group</label>
                    <select id="patient-blood" className="form-input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="patient-phone">Phone</label>
                    <input type="tel" id="patient-phone" className="form-input" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full m-t-4" style={{ padding: "0.8rem" }}>
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="text-center m-t-6" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
              {isLogin ? "New here?" : "Have an account?"}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="btn-text" style={{ fontWeight: "600", marginLeft: "0.35rem", padding: "0.15rem 0.4rem" }}>
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PatientAuth;
