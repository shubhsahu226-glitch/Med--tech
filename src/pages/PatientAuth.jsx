import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, ArrowLeft, Mail, Lock, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabase";

export const PatientAuth = () => {
  const { login, signup, loginGuest } = useAuth();
  const navigate = useNavigate();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
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

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    if (!isSignUp) {
      // 1. Sign In Flow
      const { data: loginData, error: loginError } = await login(email, password);
      if (loginError) {
        setError(loginError.message || "Invalid email or password.");
        setIsLoading(false);
      } else {
        navigate("/patient/dashboard");
      }
      return;
    }

    // 2. Sign Up Flow
    if (!name) {
      setError("Please enter your full name.");
      setIsLoading(false);
      return;
    }

    // Try to sign up the user
    const { data: signupData, error: signupError } = await signup(email, password);

    // If user already registered, fall back to login
    if (signupError && signupError.message === "User already registered") {
      const { data: loginData, error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message || "This email is already registered, and the password entered was incorrect.");
        setIsLoading(false);
        return;
      }
      
      navigate("/patient/dashboard");
      return;
    }

    if (signupError) {
      setError(signupError.message || "Failed to create account.");
      setIsLoading(false);
      return;
    }

    // New user created -> Create default minimal profile in Supabase profiles table
    if (signupData?.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signupData.user.id,
        name: name,
        mobile_number: null,
        dob: null,
        location: null
      });

      if (profileError) {
        console.error("Failed to insert profile record:", profileError);
      }

      if (signupData.session) {
        setSuccessMsg("Account created! Logging you in...");
        setTimeout(() => {
          navigate("/patient/dashboard");
        }, 800);
      } else {
        setSuccessMsg("Account created successfully!");
        setError("Check your inbox to verify your email address before logging in (or disable 'Confirm Email' in your Supabase Auth configuration).");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)" }}>
      <div style={{ padding: "1.5rem" }}>
        <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", background: "white", boxShadow: "var(--shadow-sm)" }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem", borderRadius: "1.25rem", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)", background: "white" }}>
          
          {/* Header */}
          <div className="text-center m-b-6">
            <div className="flex-center m-b-2" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", margin: "0 auto 1rem auto" }}>
              <HeartPulse size={32} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111827", margin: "0 0 0.25rem 0" }}>Patient Portal</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem", margin: 0 }}>
              Access your medical metrics & scan reports
            </p>
          </div>

          {/* Tab Selection */}
          <div style={{ display: "flex", background: "#f3f4f6", padding: "0.25rem", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(""); setSuccessMsg(""); }}
              style={{
                flex: 1,
                padding: "0.5rem 1rem",
                background: !isSignUp ? "white" : "transparent",
                border: "none",
                borderRadius: "0.375rem",
                color: !isSignUp ? "var(--primary)" : "#4b5563",
                fontWeight: !isSignUp ? "600" : "500",
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: !isSignUp ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                transition: "all 0.2s"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(""); setSuccessMsg(""); }}
              style={{
                flex: 1,
                padding: "0.5rem 1rem",
                background: isSignUp ? "white" : "transparent",
                border: "none",
                borderRadius: "0.375rem",
                color: isSignUp ? "var(--primary)" : "#4b5563",
                fontWeight: isSignUp ? "600" : "500",
                fontSize: "0.875rem",
                cursor: "pointer",
                boxShadow: isSignUp ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                transition: "all 0.2s"
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{ padding: "0.875rem 1rem", background: "#fee2e2", color: "#991b1b", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem", borderLeft: "4px solid #ef4444" }}>
              {error}
            </div>
          )}
          
          {successMsg && (
            <div style={{ padding: "0.875rem 1rem", background: "#d1fae5", color: "#065f46", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem", borderLeft: "4px solid #10b981" }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" htmlFor="patient-name" style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: "500" }}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                    <User size={18} />
                  </span>
                  <input 
                    type="text" 
                    id="patient-name" 
                    className="form-input" 
                    placeholder="Alex Mercer" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={{ paddingLeft: "2.75rem", width: "100%" }}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" htmlFor="patient-email" style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: "500" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  id="patient-email" 
                  className="form-input" 
                  placeholder="email@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  required
                  style={{ paddingLeft: "2.75rem", width: "100%" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="patient-password" style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: "500" }}>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex" }}>
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  id="patient-password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  required
                  style={{ paddingLeft: "2.75rem", width: "100%" }}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full" style={{ padding: "0.75rem", fontSize: "0.95rem", fontWeight: "600", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
              {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
            
            <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "#e5e7eb" }}>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
              <span style={{ padding: "0 0.75rem", fontSize: "0.75rem", color: "#9ca3af", fontWeight: "500", textTransform: "uppercase" }}>Demo Account</span>
              <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }}></div>
            </div>

            <button 
              type="button" 
              onClick={handleGuestLogin} 
              className="btn btn-secondary w-full" 
              style={{ 
                padding: "0.75rem", 
                borderColor: "rgba(34, 197, 94, 0.3)", 
                color: "var(--success)", 
                background: "rgba(34, 197, 94, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                fontWeight: "600"
              }}
            >
              <Sparkles size={16} /> Explore with Demo Patient
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default PatientAuth;
