import { Link } from "react-router-dom";
import { Suspense, lazy } from "react";
import "./ConnectivitySection.css";

const ConnectivityScene3D = lazy(() => import("./ConnectivityScene3D"));

const bullets = [
  "Coordinate Virtual Operations & Team Schedules.",
  "Real-time, Secure Enterprise Messaging & Direct Chat.",
  "Premium, GDPR-Compliant End-to-End Encrypted Video Consultations.",
  "Access Comprehensive EHR/PHR Histories & Real-time Data.",
];

export default function ConnectivitySection() {
  return (
    <section className="conn-section">
      {/* ── left text ── */}
      <div className="conn-content">
        <span className="conn-eyebrow">Doctor-Patient Connectivity</span>
        <h2 className="conn-title">
          Specialist-Managed<br />Connectivity
        </h2>

        <ul className="conn-bullets">
          {bullets.map((b) => (
            <li key={b}>
              <span className="conn-bullet-dot" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="conn-actions">
          <Link to="/patient/auth" className="conn-btn-primary">Start Consultation</Link>
          <Link to="/patient/reports" className="conn-btn-secondary">View Reports</Link>
        </div>
      </div>

      {/* ── right visual ── */}
      <div className="conn-visual">

        {/* 3-D canvas behind everything */}
        <div className="conn-canvas-wrap">
          <Suspense fallback={<div className="conn-scene-loader" />}>
            <ConnectivityScene3D />
          </Suspense>
        </div>

        {/* floating video card */}
        <div className="conn-video-card">
          <div className="conn-video-card__header">
            <span className="conn-video-card__dot" />
            <span className="conn-video-card__label">Live Consultation</span>
          </div>
          <div className="conn-video-card__grid">
            <div className="conn-video-card__thumb conn-video-card__thumb--a">
              <span>DR</span>
            </div>
            <div className="conn-video-card__thumb conn-video-card__thumb--b">
              <span>PT</span>
            </div>
          </div>
          <div className="conn-video-card__footer">
            <span className="conn-video-card__time">00:04:32</span>
            <span className="conn-video-card__status">Encrypted</span>
          </div>
        </div>

        {/* stat badge */}
        <div className="conn-stat-badge">
          <span className="conn-stat-badge__num">2.4k+</span>
          <span className="conn-stat-badge__label">Active Consultations Today</span>
        </div>
      </div>
    </section>
  );
}
