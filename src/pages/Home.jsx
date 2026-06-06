import React from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, Calendar, MessageSquare, Clock, 
  ShieldAlert, History, ArrowRight, ShieldCheck, Zap, HeartPulse,
  UserRound, Stethoscope
} from "lucide-react";
import { FeatureCard, WorkflowCard } from "../components/CardComponents";

export const Home = () => {
  const features = [
    {
      title: "AI Diagnostic Insights",
      description: "Upload report images or PDFs to receive immediate summaries, highlight abnormal values, and track biometric trends.",
      icon: Sparkles,
      color: "#38bdf8"
    },
    {
      title: "Virtual Consultations",
      description: "Start secure high-definition chat or video appointments directly with medical specialists from the comfort of home.",
      icon: MessageSquare,
      color: "#34d399"
    },
    {
      title: "Unified Medical History",
      description: "Keep all diagnoses, past reports, vaccinations, and treatment plans organized in a single, secure medical timeline.",
      icon: History,
      color: "#818cf8"
    },
    {
      title: "Medication Reminders",
      description: "Receive interactive schedules and pill checklists to track current treatment, dosage logs, and refill reminders.",
      icon: Clock,
      color: "#fbbf24"
    },
    {
      title: "Emergency Network Alerts",
      description: "Real-time alerts regarding local health risks, weather/pollution hazards, and clinical status updates.",
      icon: ShieldAlert,
      color: "#f87171"
    },
    {
      title: "Doctor Appointment Scheduler",
      description: "Search specialized physicians, read patient reviews, check slot availability, and book slots in under a minute.",
      icon: Calendar,
      color: "#fb923c"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Create Secure Account",
      description: "Patients and doctors sign up with encrypted credentials and register initial health preferences."
    },
    {
      step: "02",
      title: "Add Health Parameters",
      description: "Upload laboratory files or medical history; AI highlights trends and potential clinical issues."
    },
    {
      step: "03",
      title: "Consult with Specialists",
      description: "Book appointments, launch video/chat channels, and get personalized diagnostic notes."
    },
    {
      step: "04",
      title: "Continuous Management",
      description: "Track medications daily, view safety alerts, and monitor biometric improvements over time."
    }
  ];

  return (
    <div>
      <section className="hero-section">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="hero-content">
          <div className="hero-badge">
            <HeartPulse size={16} />
            <span>Intelligent Healthcare Network</span>
          </div>
          
          <h1 className="hero-title">
            Connecting Patients & Doctors through{" "}
            <span className="gradient-text">AI-Powered</span> Clinical Insights
          </h1>
          
          <p className="hero-subtitle">
            Upload reports for instant AI-generated explanations, manage medications, 
            and consult certified doctors on a single, secure platform.
          </p>

          <div className="portal-grid">
            <div className="card portal-card" style={{ "--accent": "#38bdf8" }}>
              <div className="portal-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
                <UserRound size={28} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>For Patients</h3>
              <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginBottom: "1.5rem", minHeight: "52px" }}>
                Upload lab reports, view AI summaries, schedule consultations, and log daily medications.
              </p>
              <Link to="/patient/auth" className="btn btn-primary w-full">
                Patient Portal <ArrowRight size={16} />
              </Link>
            </div>

            <div className="card portal-card" style={{ "--accent": "#818cf8" }}>
              <div className="portal-icon" style={{ background: "rgba(129, 140, 248, 0.12)", color: "#818cf8" }}>
                <Stethoscope size={28} />
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>For Medical Doctors</h3>
              <p className="text-secondary-color" style={{ fontSize: "0.85rem", marginBottom: "1.5rem", minHeight: "52px" }}>
                Review patient charts, manage consultations, and write digital prescriptions.
              </p>
              <Link to="/doctor/auth" className="btn btn-secondary w-full">
                Doctor Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="trust-grid">
          <div className="trust-item">
            <div className="trust-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>HIPAA Compliant</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>End-to-end encryption</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <Zap size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Instant AI Review</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>Report breakdown in seconds</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
              <HeartPulse size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>24/7 Consultations</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>Connect when you need help</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-block">
        <div className="section-header">
          <h2>How the Platform Works</h2>
          <p>A streamlined clinical journey for patients and primary care physicians</p>
        </div>
        <div className="grid-4">
          {steps.map((st, i) => (
            <WorkflowCard key={i} step={st.step} title={st.title} description={st.description} />
          ))}
        </div>
      </section>

      <section id="features" className="section-block alt">
        <div className="section-inner">
          <div className="section-header">
            <h2>Comprehensive Health Features</h2>
            <p>Everything required for intelligent healthcare interaction</p>
          </div>
          <div className="grid-3">
            {features.map((f, i) => (
              <FeatureCard key={i} title={f.title} description={f.description} icon={f.icon} color={f.color} />
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Ready to Take Control of Your Health?</h2>
          <p className="text-secondary-color" style={{ marginBottom: "1.5rem" }}>
            Sign up as a patient to upload lab reports and view AI trends, or register as a doctor to start accepting appointments.
          </p>
          <div className="flex-center gap-3 flex-wrap">
            <Link to="/patient/auth" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem" }}>
              Get Started as Patient
            </Link>
            <Link to="/doctor/auth" className="btn btn-secondary" style={{ padding: "0.75rem 1.75rem" }}>
              Join as Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home;
