import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Sparkles, Calendar, MessageSquare, Clock, 
  ShieldAlert, History, ArrowRight, ShieldCheck, Zap, HeartPulse 
} from "lucide-react";
import { FeatureCard, WorkflowCard } from "../components/cards";

export const Home = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (role === "doctor") {
        navigate("/doctor/dashboard");
      } else if (role === "patient") {
        navigate("/patient/dashboard");
      }
    }
  }, [user, role, navigate]);
  const features = [
    {
      title: "AI Diagnostic Insights",
      description: "Upload report images or PDFs to receive immediate summaries, highlight abnormal values, and track biometric trends.",
      icon: Sparkles,
      color: "#3b82f6"
    },
    {
      title: "Virtual Consultations",
      description: "Start secure high-definition chat or video appointments directly with medical specialists from the comfort of home.",
      icon: MessageSquare,
      color: "#0f766e"
    },
    {
      title: "Unified Medical History",
      description: "Keep all diagnoses, past reports, vaccinations, and treatment plans organized in a single, secure medical timeline.",
      icon: History,
      color: "#8b5cf6"
    },
    {
      title: "Medication Reminders",
      description: "Receive interactive schedules and pill checklists to track current treatment, dosage logs, and refill reminders.",
      icon: Clock,
      color: "#10b981"
    },
    {
      title: "Emergency Network Alerts",
      description: "Real-time alerts regarding local health risks, weather/pollution hazards, and clinical status updates.",
      icon: ShieldAlert,
      color: "#ef4444"
    },
    {
      title: "Doctor Appointment Scheduler",
      description: "Search specialized physicians, read patient reviews, check slot availability, and book slots in under a minute.",
      icon: Calendar,
      color: "#f59e0b"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Create Secure Account",
      description: "Patients and doctors sign up with their credentials, credentials are encrypted, and initial preferences are registered."
    },
    {
      step: "02",
      title: "Add Health Parameters",
      description: "Patients upload recent laboratory files or medical history; AI highlights trends and potential issues."
    },
    {
      step: "03",
      title: "Consult with Specialists",
      description: "Book appointments, launch video/chat channels, and get personalized diagnostic notes and prescriptions."
    },
    {
      step: "04",
      title: "Continuous Health Management",
      description: "Check medication checklist daily, view safety alerts, and verify biometric chart improvements over time."
    }
  ];

  return (
    <div style={{ background: "white" }}>
      {/* Hero Section */}
      <section 
        style={{
          padding: "5rem 2rem",
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem"
        }}
      >
        <div 
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--primary-light)",
            color: "var(--primary)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.875rem",
            fontWeight: "600"
          }}
        >
          <HeartPulse size={16} />
          <span>Intelligent Healthcare Network</span>
        </div>
        
        <h1 style={{ maxWidth: "800px", fontSize: "3rem", fontWeight: "800", lineHeight: 1.15 }}>
          Connecting Patients & Doctors through <span style={{ color: "var(--primary)" }}>AI-Powered</span> Clinical Insights
        </h1>
        
        <p className="text-secondary-color" style={{ maxWidth: "650px", fontSize: "1.125rem" }}>
          Upload reports for instant AI-generated explanations, manage medications, and consult certified doctors on a single, secure platform.
        </p>

        {/* Call to Actions - Side by Side Entry Points */}
        <div className="flex-center flex-wrap gap-4 m-t-4" style={{ width: "100%" }}>
          <div 
            className="card flex-column align-center text-center" 
            style={{ width: "320px", padding: "2rem", border: "1px solid var(--border-color)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👤</div>
            <h3 style={{ fontSize: "1.25rem" }}>For Patients</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginBottom: "1.5rem", minHeight: "60px" }}>
              Upload lab reports, view AI summaries, schedule consultations, and log daily medications.
            </p>
            <Link to="/patient/auth" className="btn btn-primary w-full">
              Patient Portal <ArrowRight size={16} />
            </Link>
          </div>

          <div 
            className="card flex-column align-center text-center" 
            style={{ width: "320px", padding: "2rem", border: "1px solid var(--border-color)" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🩺</div>
            <h3 style={{ fontSize: "1.25rem" }}>For Medical Doctors</h3>
            <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginBottom: "1.5rem", minHeight: "60px" }}>
              Review connected patient charts, manage incoming consultations, and write prescriptions.
            </p>
            <Link to="/doctor/auth" className="btn btn-secondary w-full">
              Doctor Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Elements */}
      <section style={{ backgroundColor: "var(--bg-secondary)", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "2rem" }}>
          <div className="align-center gap-3">
            <ShieldCheck size={28} style={{ color: "var(--success)" }} />
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>HIPAA Compliant</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Secure data encryption</p>
            </div>
          </div>
          <div className="align-center gap-3">
            <Zap size={28} style={{ color: "var(--primary)" }} />
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Instant AI Diagnostic Review</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Report breakdown in seconds</p>
            </div>
          </div>
          <div className="align-center gap-3">
            <HeartPulse size={28} style={{ color: "var(--danger)" }} />
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>24/7 Consultation Channels</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>Connect instantly when needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: "5rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2rem" }}>How the Platform Works</h2>
          <p className="text-secondary-color" style={{ fontSize: "0.95rem" }}>A streamlined clinical journey for patients and primary care physicians</p>
        </div>
        <div className="grid-4">
          {steps.map((st, i) => (
            <WorkflowCard key={i} step={st.step} title={st.title} description={st.description} />
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" style={{ backgroundColor: "var(--bg-secondary)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 style={{ fontSize: "2rem" }}>Comprehensive Health Features</h2>
            <p className="text-secondary-color" style={{ fontSize: "0.95rem" }}>Everything required for intelligent healthcare interaction</p>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <FeatureCard key={i} title={f.title} description={f.description} icon={f.icon} color={f.color} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "2.25rem" }}>Ready to Take Control of Your Health?</h2>
          <p className="text-secondary-color">Sign up now as a patient to upload your laboratory report and view AI trends, or register your medical license as a doctor to start accepting appointments.</p>
          <div className="flex-center gap-3 m-t-4">
            <Link to="/patient/auth" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Get Started as Patient</Link>
            <Link to="/doctor/auth" className="btn btn-secondary" style={{ padding: "0.75rem 1.5rem" }}>Join as Provider</Link>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home;
