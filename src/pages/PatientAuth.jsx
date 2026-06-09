import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabase";

export const PatientAuth = () => {
  const { login, signup, loginGuest } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = () => {
    setIsLoading(true);
    loginGuest("patient");
    navigate("/patient/dashboard");
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    if (!name && !dob && !mobile && !location) {
      // User is trying to login
      const { data: loginData, error: loginError } = await login(email, password);
      if (loginError) {
        setError(loginError.message || "Invalid login credentials. If you are new, please fill all fields to sign up.");
      } else {
        navigate("/patient/dashboard");
      }
      setIsLoading(false);
      return;
    }

    // User is trying to sign up
    if (!email || !password || !name || !dob || !mobile || !location) {
      setError("Please fill in all details to create a new account, or just Email & Password to login.");
      setIsLoading(false);
      return;
    }

    // 1. Try to sign up the user
    const { data: signupData, error: signupError } = await signup(email, password);

    // If already registered, automatically fall back to login
    if (signupError && signupError.message === "User already registered") {
      const { data: loginData, error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message || "Invalid password for existing account.");
        setIsLoading(false);
        return;
      }
      
      navigate("/patient/dashboard");
      return;
    }

    // If some other signup error
    if (signupError) {
      setError(signupError.message || "Failed to process request.");
      setIsLoading(false);
      return;
    }

    // 2. New user successfully created - insert their profile details
    if (signupData?.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signupData.user.id,
        name,
        mobile_number: mobile,
        dob,
        location
      });

      if (profileError) {
        console.error("Failed to insert profile:", profileError);
      }

      // If email confirmation is disabled, session exists -> auto login
      if (signupData.session) {
        setSuccessMsg("Account Created! Logging you in...");
        setTimeout(() => {
          navigate("/patient/dashboard");
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
              <HeartPulse size={40} fill="var(--primary-light)" />
            </div>
            <h2>Patient Portal</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem" }}>
              Enter your details. If you already have an account, we'll log you right in!
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
              <label className="form-label" htmlFor="patient-name">Full Name</label>
              <input type="text" id="patient-name" className="form-input" placeholder="Alex Mercer" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-group">
              <div>
                <label className="form-label" htmlFor="patient-dob">Date of Birth</label>
                <input type="date" id="patient-dob" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div>
                <label className="form-label" htmlFor="patient-mobile">Mobile Number</label>
                <input type="tel" id="patient-mobile" className="form-input" placeholder="+1 234 567 8900" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-location">Location</label>
              <input type="text" id="patient-location" className="form-input" placeholder="New York, NY" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-email">Email Address</label>
              <input type="email" id="patient-email" className="form-input" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="patient-password">Password</label>
              <input type="password" id="patient-password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full m-t-4" style={{ padding: "0.75rem" }}>
              {isLoading ? "Processing..." : "Continue"}
            </button>
            
            <button 
              type="button" 
              onClick={handleGuestLogin} 
              className="btn btn-secondary w-full m-t-2" 
              style={{ padding: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Guest Patient Login (Demo bypass)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default PatientAuth;
