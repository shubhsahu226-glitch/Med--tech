import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { Suspense, lazy } from "react";
import "./HeroBanner.css";

const HeroScene3D = lazy(() => import("./HeroScene3D"));

const FloatingScene = () => (
  <div className="hero-banner__scene">
    <div className="hero-scene-3d-canvas">
      <Suspense fallback={<div className="hero-3d-loader" />}>
        <HeroScene3D />
      </Suspense>
    </div>
  </div>
);

export const HeroBanner = () => {
  const bullets = [
    "Enterprise Virtual Clinics & Managed Medical Solutions.",
    "Integrated Data Analytics & AI Diagnostics.",
    "Scalable & Customizable Care Programs.",
  ];

  return (
    <section className="hero-banner">
      <div className="hero-banner__glow hero-banner__glow--1" />
      <div className="hero-banner__glow hero-banner__glow--2" />

      <div className="hero-banner__inner">
        <div className="hero-banner__content animate-slide-up">
          <span className="hero-banner__eyebrow">Introduction: Virtual Vaidya</span>
          <h1 className="hero-banner__title">Virtual Vaidya</h1>
          <p className="hero-banner__subtitle">Advanced Telehealth for Modern Healthcare</p>

          <ul className="hero-banner__bullets">
            {bullets.map((text) => (
              <li key={text}>
                <span className="hero-banner__bullet-dot" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="hero-banner__actions">
            <Link to="/patient/auth" className="hero-banner__btn-patient">
              <Stethoscope size={18} />
              Patient Login
            </Link>
            <Link to="/doctor/auth" className="hero-banner__btn-doctor">
              Doctor Login
            </Link>
          </div>
        </div>

        <FloatingScene />
      </div>
    </section>
  );
};

export default HeroBanner;
