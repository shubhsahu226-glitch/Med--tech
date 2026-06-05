import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HealthProvider } from "./context/HealthContext";

// Components
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";

// Pages
import { Home } from "./pages/Home";
import { PatientAuth } from "./pages/PatientAuth";
import { DoctorAuth } from "./pages/DoctorAuth";
import { PatientDashboard } from "./pages/PatientDashboard";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { ReportUpload } from "./pages/ReportUpload";
import { ReportAnalysis } from "./pages/ReportAnalysis";
import { MedicalHistory } from "./pages/MedicalHistory";
import { DoctorSearch } from "./pages/DoctorSearch";
import { AppointmentBooking } from "./pages/AppointmentBooking";
import { Consultation } from "./pages/Consultation";
import { MedicationReminder } from "./pages/MedicationReminder";
import { EmergencyAlerts } from "./pages/EmergencyAlerts";
import { ProfileSettings } from "./pages/ProfileSettings";

// Styling
import "./styles/global.css";

// Layout wrapper representing the app routing layout
const AppLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: "100vh", backgroundColor: "var(--bg-secondary)" }}>
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
  const showDashboardFrame = user && !isAuthPage && !isHomePage;

  return (
    <div className="app-container">
      {/* Show Navbar on all routes except isolated auth pages */}
      {!isAuthPage && (
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      )}

      {showDashboardFrame ? (
        <div className="dashboard-layout">
          <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
          <main className="main-content">
            <Routes>
              {/* Patient Protected Routes */}
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/upload" element={<ReportUpload />} />
              <Route path="/patient/analysis" element={<ReportAnalysis />} />
              <Route path="/patient/history" element={<MedicalHistory />} />
              <Route path="/patient/doctors" element={<DoctorSearch />} />
              <Route path="/patient/book" element={<AppointmentBooking />} />
              <Route path="/patient/consult" element={<Consultation />} />
              <Route path="/patient/reminders" element={<MedicationReminder />} />
              <Route path="/patient/alerts" element={<EmergencyAlerts />} />
              <Route path="/patient/settings" element={<ProfileSettings />} />

              {/* Doctor Protected Routes */}
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/consult" element={<Consultation />} />
              <Route path="/doctor/settings" element={<ProfileSettings />} />

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      )}

      {/* Footer on Homepage only */}
      {isHomePage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <HealthProvider>
          <AppLayout />
        </HealthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
