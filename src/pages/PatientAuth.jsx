import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HeartPulse, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const PatientAuth = () => {
  const { login, signup, loginWithGoogle, loginGuest } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = () => {
    setIsLoading(true);
    loginGuest("patient");
    navigate("/patient/dashboard");
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    if (isLogin) {
      const { error } = await login(email, password);
      if (!error) {
        navigate("/patient/dashboard");
      } else {
        setError(error.message || "Invalid credentials.");
      }
    } else {
      const { data, error } = await signup(email, password);
      if (!error) {
        if (data?.session) {
          navigate("/patient/dashboard");
        } else {
          setError("Success! Please check your email to confirm your account before logging in. Or, disable 'Confirm Email' in your Supabase Auth settings to bypass this.");
        }
      } else {
        setError(error.message || "Signup failed. Please try again.");
      }
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  return (
    <div className="auth-page-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
              {isLogin ? "Access your records & AI analysis" : "Register to track your health"}
            </p>
          </div>

          {error && (
            <div style={{ padding: "0.75rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="patient-email">Email Address</label>
              <input 
                type="email" 
                id="patient-email"
                className="form-input" 
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full m-t-4" style={{ padding: "0.75rem" }}>
              {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Register with Email")}
            </button>
            
            {isLogin && (
              <button 
                type="button" 
                onClick={handleGuestLogin} 
                className="btn btn-secondary w-full m-t-2" 
                style={{ padding: "0.75rem", borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Guest Patient Login (Demo bypass)
              </button>
            )}
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
