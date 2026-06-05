import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
      // Simulate login
      const success = login(email, password, "patient");
      if (success) {
        navigate("/patient/dashboard");
      } else {
        setError("Invalid credentials. Try using any patient email (e.g. alex.mercer@gmail.com).");
      }
    } else {
      if (!email || !password || !name || !age || !phone) {
        setError("Please fill in all details.");
        return;
      }
      // Simulate signup
      const success = signup({
        name,
        email,
        age: parseInt(age),
        gender,
        bloodGroup,
        phone,
        condition: "Healthy"
      }, "patient");
      
      if (success) {
        navigate("/patient/dashboard");
      } else {
        setError("Signup failed. Please try again.");
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
        <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem", boxShadow: "var(--shadow-lg)" }}>
          <div className="text-center m-b-6">
            <div className="flex-center m-b-2" style={{ color: "var(--primary)" }}>
              <HeartPulse size={40} fill="var(--primary-light)" />
            </div>
            <h2>{isLogin ? "Patient Login" : "Patient Sign Up"}</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>
              {isLogin ? "Access your records, AI analysis & doctor bookings" : "Register to track reports & book virtual consultations"}
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
                <label className="form-label" htmlFor="patient-name">Full Name</label>
                <input 
                  type="text" 
                  id="patient-name"
                  className="form-input" 
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="patient-email">Email Address</label>
              <input 
                type="email" 
                id="patient-email"
                className="form-input" 
                placeholder="alex.mercer@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {isLogin && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Demo Tip: Use <strong>alex.mercer@gmail.com</strong> or any custom text</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-password">Password</label>
              <input 
                type="password" 
                id="patient-password"
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
                    <label className="form-label" htmlFor="patient-age">Age</label>
                    <input 
                      type="number" 
                      id="patient-age"
                      className="form-input" 
                      placeholder="34"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="patient-gender">Gender</label>
                    <select 
                      id="patient-gender"
                      className="form-input"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
                  <div>
                    <label className="form-label" htmlFor="patient-blood">Blood Group</label>
                    <select 
                      id="patient-blood"
                      className="form-input"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                      <option>O+</option>
                      <option>O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="patient-phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="patient-phone"
                      className="form-input" 
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full m-t-4" style={{ padding: "0.75rem" }}>
              {isLogin ? "Sign In" : "Register"}
            </button>
          </form>

          <div className="text-center m-t-6" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem" }}>
              {isLogin ? "New to the platform?" : "Already have an account?"}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(""); }} 
                className="btn-text" 
                style={{ fontWeight: "600", color: "var(--primary)", marginLeft: "0.25rem", padding: 0 }}
              >
                {isLogin ? "Create an account" : "Sign in here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PatientAuth;
