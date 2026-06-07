import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabase";

export const DoctorAuth = () => {
  const { login, signup, loginGuest } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("Cardiologist");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = () => {
    loginGuest("doctor");
    navigate("/doctor/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !password || !name || !experience || !location || !consultationFee) {
      setError("Please fill in all clinical credentials.");
      return;
    }

    setIsLoading(true);

    // 1. Try to sign up user in Supabase Auth
    const { data: signupData, error: signupError } = await signup(email, password);

    // If user already exists, automatically log them in
    if (signupError && signupError.message === "User already registered") {
      const { data: loginData, error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message || "Invalid password for existing account.");
        setIsLoading(false);
        return;
      }
      
      navigate("/doctor/dashboard");
      return;
    }

    // If other signup errors occur
    if (signupError) {
      setError(signupError.message || "Failed to create provider account.");
      setIsLoading(false);
      return;
    }

    // 2. New user successfully signed up - Insert into DB
    if (signupData?.user) {
      const doctorId = signupData.user.id;

      // Insert into doctors table so patients can find them
      const { error: docError } = await supabase.from('doctors').insert({
        id: doctorId,
        name: `Dr. ${name.replace('Dr. ', '')}`,
        specialty,
        experience: `${experience} years`,
        education: "Medical Degree", // default placeholder since user didn't want this field
        rating: 5.0,
        reviews: 0,
        availability: JSON.stringify(["Monday 09:00 - 17:00", "Wednesday 09:00 - 17:00"]),
        slots: JSON.stringify(["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]),
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
        about: `Dr. ${name.replace('Dr. ', '')} is a certified ${specialty.toLowerCase()} dedicated to providing advanced care.`,
        location,
        consultationFee: `$${consultationFee}`,
      });

      if (docError) {
        console.error("Failed to insert doctor:", docError);
      }

      // Insert a basic profile so they don't get trapped in patient onboarding guards (if any exist)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: doctorId,
        name: `Dr. ${name.replace('Dr. ', '')}`,
        mobile_number: "Doctor Account",
        location,
        dob: "1980-01-01",
      });

      if (profileError) {
        console.error("Failed to insert profile:", profileError);
      }

      // If email confirmation is disabled, session exists -> auto login
      if (signupData.session) {
        setSuccessMsg("Account Created! Logging you in...");
        setTimeout(() => {
          navigate("/doctor/dashboard");
        }, 800);
      } else {
        // If email confirmation is enabled
        setSuccessMsg("Account Created successfully!");
        setError("Important: Please check your email inbox to confirm your account before logging in. (If testing, disable 'Confirm Email' in Supabase settings).");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.5rem" }}>
        <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", gap: "0.5rem" }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", margin: "2rem 0" }}>
        <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "2.5rem", boxShadow: "var(--shadow-lg)" }}>
          <div className="text-center m-b-6">
            <div className="flex-center m-b-2" style={{ color: "var(--primary)" }}>
              <Stethoscope size={40} fill="var(--primary-light)" />
            </div>
            <h2>Medical Provider Portal</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>
              Enter your clinical details. If you already have an account, we'll log you right in!
            </p>
          </div>

          {error && (
            <div style={{ padding: "1rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", marginBottom: "1.25rem", borderLeft: "4px solid var(--danger)" }}>
              <strong>Notice:</strong> {error}
            </div>
          )}
          
          {successMsg && (
            <div style={{ padding: "1rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", marginBottom: "1.25rem", borderLeft: "4px solid var(--success)" }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="doctor-name">Dr. Full Name</label>
              <input type="text" id="doctor-name" className="form-input" placeholder="Sarah Jenkins" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
              <div>
                <label className="form-label" htmlFor="doctor-specialty">Specialty</label>
                <select id="doctor-specialty" className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  <option>Cardiologist</option>
                  <option>Neurologist</option>
                  <option>Pediatrician</option>
                  <option>Dermatologist</option>
                  <option>General Physician</option>
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="doctor-experience">Experience (Years)</label>
                <input type="number" id="doctor-experience" className="form-input" placeholder="10" value={experience} onChange={(e) => setExperience(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
              <div>
                <label className="form-label" htmlFor="doctor-location">Clinic/Hospital Location</label>
                <input type="text" id="doctor-location" className="form-input" placeholder="Family First Clinic" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="form-label" htmlFor="doctor-fee">Consultation Fee ($)</label>
                <input type="number" id="doctor-fee" className="form-input" placeholder="120" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doctor-email">Clinical Email Address</label>
              <input type="email" id="doctor-email" className="form-input" placeholder="sarah.jenkins@hospital.org" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="doctor-password">Password</label>
              <input type="password" id="doctor-password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary w-full m-t-4" style={{ padding: "0.75rem" }} disabled={isLoading}>
              {isLoading ? "Processing..." : "Continue"}
            </button>

            <button 
              type="button" 
              onClick={handleGuestLogin} 
              className="btn btn-secondary w-full m-t-2" 
              style={{ padding: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Guest Doctor Login (Demo bypass)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default DoctorAuth;
