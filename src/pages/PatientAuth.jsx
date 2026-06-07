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

          <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="btn w-full" 
            style={{ 
              backgroundColor: "white", 
              color: "var(--text-primary)", 
              border: "1px solid var(--border-color)", 
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </button>

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
