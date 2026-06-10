import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { HealthProvider } from "./context/HealthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import "./styles/global.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <AuthProvider>
      <HealthProvider>
        <Router>
          <ErrorBoundary>
            <DashboardLayout />
          </ErrorBoundary>
        </Router>
      </HealthProvider>
    </AuthProvider>
  );
}

export default App;
