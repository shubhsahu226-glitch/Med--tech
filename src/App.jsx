import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { HealthProvider } from "./context/HealthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import "./styles/global.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <HealthProvider>
          <DashboardLayout />
        </HealthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
