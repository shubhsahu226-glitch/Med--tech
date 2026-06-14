import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Components
import { Navbar } from "../components/Navbar";
import PatientCallReceiver from "../components/PatientCallReceiver";

// Pages
import { Home } from "../pages/Home";
import { PatientAuth } from "../pages/PatientAuth";
import { DoctorAuth } from "../pages/DoctorAuth";

// Consolidated Patient Pages
import { PatientDashboard } from "../pages/PatientDashboard";
import { PatientReports } from "../pages/PatientReports";
import { PatientCare } from "../pages/PatientCare";
import { PatientDoctors } from "../pages/PatientDoctors";
import { ProfileSettings } from "../pages/ProfileSettings";

// Consolidated Doctor Pages
import { DoctorDashboard } from "../pages/DoctorDashboard";
import { DoctorClinic } from "../pages/DoctorClinic";
import { DoctorPatients } from "../pages/DoctorPatients";
import { DoctorAppointments } from "../pages/DoctorAppointments";
import { DoctorAlerts } from "../pages/DoctorAlerts";
import { VideoRoom } from "../pages/VideoRoom";

export const DashboardLayout = () => {
  const { user, profile, rawUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: "100vh", backgroundColor: "var(--bg-primary)" }}>
        <div 
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid var(--border-color)",
            borderTop: "3px solid var(--primary)",
            animation: "spin 1s linear infinite"
          }}
        />
      </div>
    );
  }

  // Check if current route is an auth page or homepage where full dashboard frame is NOT needed
  const isAuthPage = location.pathname.includes("/auth");
  const isHomePage = location.pathname === "/";
  const isRoomPage = location.pathname === "/room";
  const showDashboardFrame = user && !isAuthPage && !isHomePage && !isRoomPage;

  return (
    <div className="app-container">
      {/* Show Navbar on all routes except isolated auth pages */}
      {!isAuthPage && !isRoomPage && <Navbar />}

      {/* Global patient call receiver stays mounted across every authenticated patient feature. */}
      {role === "patient" && user && !isAuthPage && !isRoomPage && <PatientCallReceiver />}

      {showDashboardFrame ? (
        <div className="dashboard-layout">
          <main className="main-content">
            <Routes>
              {/* Patient Routes */}
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/reports" element={<PatientReports />} />
              <Route path="/patient/care" element={<PatientCare />} />
              <Route path="/patient/doctors" element={<PatientDoctors />} />
              <Route path="/patient/profile" element={<ProfileSettings />} />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/clinic" element={<DoctorClinic />} />
              <Route path="/doctor/patients" element={<DoctorPatients />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/alerts" element={<DoctorAlerts />} />
              <Route path="/doctor/profile" element={<ProfileSettings />} />

              {/* Fallback inside dashboard frame */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/patient/auth" element={<PatientAuth />} />
            <Route path="/doctor/auth" element={<DoctorAuth />} />
            <Route path="/room" element={<VideoRoom />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      )}
    </div>
  );
};
