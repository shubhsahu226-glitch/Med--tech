import React, { createContext, useContext, useState, useEffect } from "react";
import { mockPatients, mockDoctors } from "../data/mockData";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest"); // guest, patient, doctor
  const [loading, setLoading] = useState(true);

  // Initialize with a mock patient session for easy visual testing
  useEffect(() => {
    const savedUser = localStorage.getItem("medtech_user");
    const savedRole = localStorage.getItem("medtech_role");
    
    if (savedUser && savedRole) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    } else {
      // Auto-login Alex Mercer (Patient) on first load to speed up visual demo,
      // but let users log out to test other pathways.
      const defaultPatient = mockPatients[0];
      setUser(defaultPatient);
      setRole("patient");
    }
    setLoading(false);
  }, []);

  const login = (email, password, loginRole) => {
    setLoading(true);
    let authenticatedUser = null;

    if (loginRole === "patient") {
      authenticatedUser = mockPatients.find(p => p.email.toLowerCase() === email.toLowerCase()) || {
        id: "pat_new",
        name: email.split("@")[0].split(".").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        email: email,
        age: 30,
        gender: "Not specified",
        bloodGroup: "O+",
        phone: "+1 (555) 123-4567",
        condition: "Healthy",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        reports: [],
        history: []
      };
    } else if (loginRole === "doctor") {
      authenticatedUser = mockDoctors.find(d => d.image && d.about) || mockDoctors[0];
    }

    if (authenticatedUser) {
      setUser(authenticatedUser);
      setRole(loginRole);
      localStorage.setItem("medtech_user", JSON.stringify(authenticatedUser));
      localStorage.setItem("medtech_role", loginRole);
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const signup = (userData, signupRole) => {
    setLoading(true);
    const newUser = {
      id: signupRole === "patient" ? `pat_${Date.now()}` : `doc_${Date.now()}`,
      avatar: signupRole === "patient" 
        ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
        : "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
      reports: signupRole === "patient" ? [] : undefined,
      history: signupRole === "patient" ? [] : undefined,
      ...userData
    };

    setUser(newUser);
    setRole(signupRole);
    localStorage.setItem("medtech_user", JSON.stringify(newUser));
    localStorage.setItem("medtech_role", signupRole);
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setRole("guest");
    localStorage.removeItem("medtech_user");
    localStorage.removeItem("medtech_role");
  };

  const updateUserProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem("medtech_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
