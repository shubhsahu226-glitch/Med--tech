import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, ArrowLeft, Mail, Lock, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabase";

export const DoctorAuth = () => {
  const { user, role, login, signup, loginGuest } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      if (role === "doctor") {
        navigate("/doctor/dashboard", { replace: true });
      } else {
        navigate("/patient/dashboard", { replace: true });
      }
    }
  }, [user, role, navigate]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = () => {
    setIsLoading(true);
    loginGuest("doctor");
    navigate("/doctor/dashboard");
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
      const { error: loginError, role } = await login(email, password, "doctor");
      if (loginError) {
        setError(loginError.message || "Invalid clinical email or password.");
        setIsLoading(false);
      } else {
        if (role === "patient") {
          navigate("/patient/dashboard");
        } else {
          navigate("/doctor/dashboard");
        }
      }
      return;
    }

    // 2. Sign Up Flow
    if (!name) {
      setError("Please enter your name.");
      setIsLoading(false);
      return;
    }

    // Try to sign up user in Supabase Auth
    const formattedName = name.startsWith("Dr.") ? name : `Dr. ${name}`;
    const { data: signupData, error: signupError } = await signup(email, password, {
      options: {
        data: {
          name: formattedName,
          role: "doctor"
        }
      }
    });

    // If user already exists, automatically log them in
    if (signupError && signupError.message === "User already registered") {
      const { error: loginError } = await login(email, password, "doctor");
      
      if (loginError) {
        setError(loginError.message || "This email is already registered, and the password entered was incorrect.");
        setIsLoading(false);
        return;
      }
      
      navigate("/doctor/dashboard");
      return;
    }

    if (signupError) {
      setError(signupError.message || "Failed to create provider account.");
      setIsLoading(false);
      return;
    }

    // New doctor created -> Create profile & doctor table rows
    if (signupData?.user) {
      const doctorId = signupData.user.id;

      // Insert into profiles first
      const { error: profileError } = await supabase.from('profiles').insert({
        id: doctorId,
        name: formattedName,
        mobile_number: "Not provided",
        dob: "1980-01-01",
        location: "City Central Clinic",
        role: "doctor"
      });

      if (profileError) {
        console.error("Failed to insert profile for doctor:", profileError);
      }

      // Insert into doctors table
      const { error: docError } = await supabase.from('doctors').insert({
        id: doctorId,
        name: formattedName,
        specialty: "General Physician",
        specialization: "General Physician",
        experience: "5 years",
        education: "MBBS",
        location: "City Central Clinic",
        hospital: "City Central Clinic",
        license_number: "LIC-" + Math.floor(100000 + Math.random() * 900000),
        slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"],
        availability: ["Monday 09:00 - 17:00", "Wednesday 09:00 - 17:00"],
        rating: 5.0,
        reviews: 0,
        reviews_count: 0,
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200"
      });

      if (docError) {
        console.error("Failed to insert doctor record:", docError);
      }

      if (signupData.session) {
        setSuccessMsg("Provider account created! Logging you in...");
        setTimeout(() => {
          navigate("/doctor/dashboard");
        }, 800);
      } else {
        setSuccessMsg("Provider account created successfully!");
        setError("Check your inbox to verify your email address before logging in.");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container animate-slide-up" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent" }}>
      <div style={{ padding: "1.5rem" }}>
        <Link to="/" className="btn btn-secondary" style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem", borderRadius: "1.25rem" }}>
          
          {/* Header */}
          <div className="text-center m-b-6">
            <div className="flex-center m-b-2 icon-bounce" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", margin: "0 auto 1rem auto" }}>
              <Stethoscope size={32} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: "0 0 0.25rem 0" }}>Medical Provider</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.875rem", margin: 0 }}>
              Access clinical records and patient consultations
            </p>
          </div>

          {/* Tab Selection */}
          <div style={{ display: "flex", background: "var(--bg-tertiary)", padding: "0.25rem", borderRadius: "0.5rem", marginBottom: "1.5rem", border: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(""); setSuccessMsg(""); }}
              style={{
                flex: 1,
                padding: "0.5rem 1rem",
                background: !isSignUp ? "var(--bg-primary)" : "transparent",
                border: "none",
                borderRadius: "0.375rem",
                boxShadow: !isSignUp ? "var(--shadow-sm)" : "none",
                color: !isSignUp ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: !isSignUp ? "600" : "500",
                fontSize: "0.875rem",
                cursor: "pointer",
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
                background: isSignUp ? "var(--bg-primary)" : "transparent",
                border: "none",
                borderRadius: "0.375rem",
                boxShadow: isSignUp ? "var(--shadow-sm)" : "none",
                color: isSignUp ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: isSignUp ? "600" : "500",
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{ padding: "0.875rem 1rem", background: "var(--danger-light)", color: "var(--danger-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem", borderLeft: "4px solid var(--danger)" }}>
              {error}
            </div>
          )}
          
          {successMsg && (
            <div style={{ padding: "0.875rem 1rem", background: "var(--success-light)", color: "var(--success-dark)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem", borderLeft: "4px solid var(--success)" }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" htmlFor="doctor-name" style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: "500" }}>Dr. Full Name</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                    <User size={18} />
                  </span>
                  <input 
                    type="text" 
                    id="doctor-name" 
                    className="form-input" 
                    placeholder="Sarah Jenkins" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={{ paddingLeft: "2.75rem", width: "100%" }}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" htmlFor="doctor-email" style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: "500" }}>Clinical Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  id="doctor-email" 
                  className="form-input" 
                  placeholder="sarah.jenkins@hospital.org" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  required
                  style={{ paddingLeft: "2.75rem", width: "100%" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="doctor-password" style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", fontWeight: "500" }}>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  id="doctor-password" 
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
              {isLoading ? "Processing..." : isSignUp ? "Create Provider Account" : "Clinical Sign In"}
            </button>
            
            <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "var(--border-color)" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
              <span style={{ padding: "0 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>Demo Account</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
            </div>

            <button 
              type="button" 
              onClick={handleGuestLogin} 
              className="btn btn-secondary w-full" 
              style={{ 
                padding: "0.75rem", 
                borderColor: "rgba(16, 185, 129, 0.2)", 
                color: "var(--success-dark)", 
                background: "rgba(16, 185, 129, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                fontWeight: "600"
              }}
            >
              <Sparkles size={16} /> Explore with Demo Doctor
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default DoctorAuth;
