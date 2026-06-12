import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip,
} from "recharts";
import "./AnalyticsSection.css";

const AnalyticsScene3D = lazy(() => import("./AnalyticsScene3D"));

/* ── mini chart data ── */
const trendData = [
  { v: 42 }, { v: 58 }, { v: 51 }, { v: 67 }, { v: 60 },
  { v: 75 }, { v: 69 }, { v: 82 }, { v: 78 }, { v: 90 },
];
const barData = [
  { v: 65 }, { v: 80 }, { v: 55 }, { v: 90 }, { v: 70 }, { v: 85 },
];
const pieData = [
  { name: "A", value: 42 },
  { name: "B", value: 28 },
  { name: "C", value: 18 },
  { name: "D", value: 12 },
];
const PIE_COLORS = ["#8f2020", "#c04040", "#d47070", "#ebb0b0"];

const bullets = [
  "AI-Powered Diagnostics & Multi-Model Report Interpretation.",
  "Advanced Biometrics Visualization & Longitudinal Trends.",
  "Predictive Analysis & Alerting Systems for Continuous Care.",
  "Secure, Interoperable EHR Data Management & Export.",
];

export default function AnalyticsSection() {
  return (
    <section className="anl-section">
      {/* ── left text ── */}
      <div className="anl-content">
        <span className="anl-eyebrow">Report Analyzer</span>
        <h2 className="anl-title">Clinical Data Analytics</h2>

        <ul className="anl-bullets">
          {bullets.map((b) => (
            <li key={b}>
              <span className="anl-bullet-dot" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="anl-actions">
          <Link to="/patient/reports" className="anl-btn-primary">Analyze Reports</Link>
          <Link to="/patient/auth" className="anl-btn-secondary">Get Started</Link>
        </div>
      </div>

      {/* ── right visual ── */}
      <div className="anl-visual">
        {/* 3-D chip + scroll canvas */}
        <div className="anl-canvas-wrap">
          <Suspense fallback={<div className="anl-loader" />}>
            <AnalyticsScene3D />
          </Suspense>
        </div>

        {/* dashboard card overlay */}
        <div className="anl-dashboard">
          {/* row 1 */}
          <div className="anl-card">
            <p className="anl-card__title">Trend Indicator</p>
            <ResponsiveContainer width="100%" height={64}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8f2020" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8f2020" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#8f2020" strokeWidth={2} fill="url(#trendGrad)" dot={false} />
                <Tooltip contentStyle={{ display: "none" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="anl-card">
            <p className="anl-card__title">Lab Values</p>
            <ResponsiveContainer width="100%" height={64}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={30}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ display: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* row 2 */}
          <div className="anl-card">
            <p className="anl-card__title">Lab Variants</p>
            <ResponsiveContainer width="100%" height={64}>
              <BarChart data={barData}>
                <Bar dataKey="v" fill="#8f2020" radius={[3, 3, 0, 0]} />
                <Tooltip contentStyle={{ display: "none" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="anl-card">
            <p className="anl-card__title">Amt Cohese</p>
            {/* world map placeholder with red blobs */}
            <div className="anl-map">
              <div className="anl-map__blob" style={{ top: "35%", left: "22%" }} />
              <div className="anl-map__blob anl-map__blob--sm" style={{ top: "28%", left: "48%" }} />
              <div className="anl-map__blob anl-map__blob--lg" style={{ top: "55%", left: "60%" }} />
              <div className="anl-map__blob anl-map__blob--sm" style={{ top: "45%", left: "75%" }} />
              <div className="anl-map__blob" style={{ top: "62%", left: "35%" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
