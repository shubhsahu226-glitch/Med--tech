import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { mockPatients, mockDoctors } from "../data/mockData";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

  const safeGetItem = (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage read blocked by security sandbox:", e);
      return null;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage write blocked by security sandbox:", e);
    }
  };

  const safeRemoveItem = (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage delete blocked by security sandbox:", e);
    }
  };

  const restoreLocalUser = () => {
    const savedUser = safeGetItem("medtech_user");
    const savedRole = safeGetItem("medtech_role");

    if (savedUser && savedRole) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    } else {
      const defaultPatient = mockPatients[0];
      setUser(defaultPatient);
      setRole("patient");
    }
    setLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleSession(session);
      } else {
        restoreLocalUser();
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSession(session);
      } else {
        setUser(null);
        setProfile(null);
        setRole("guest");
        setLoading(false);
      }
    });

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  function calculateAge(dobString) {
    if (!dobString) return 30;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  const handleSession = async (session) => {
    setLoading(true);
    setUser(session.user);
    setRole("patient");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      const basePatient = mockPatients[0];
      setProfile({
        ...basePatient,
        id: session.user.id,
        name: data.name,
        email: session.user.email,
        phone: data.mobile_number,
        location: data.location,
        dob: data.dob,
        age: calculateAge(data.dob),
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error("Google login error:", error);
    return !error;
  };

  const login = async (email, password, loginRole = "patient") => {
    if (loginRole === "doctor") {
      const doctor = mockDoctors[0];
      setUser(doctor);
      setRole("doctor");
      safeSetItem("medtech_user", JSON.stringify(doctor));
      safeSetItem("medtech_role", "doctor");
      return { data: { user: doctor }, error: null };
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const signup = async (emailOrUserData, passwordOrRole, signupRole = "patient") => {
    if (typeof emailOrUserData === "object") {
      const userData = emailOrUserData;
      const role = passwordOrRole || "doctor";
      const newUser = {
        id: role === "patient" ? `pat_${Date.now()}` : `doc_${Date.now()}`,
        avatar:
          role === "patient"
            ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
            : "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
        reports: role === "patient" ? [] : undefined,
        history: role === "patient" ? [] : undefined,
        ...userData,
      };

      setUser(newUser);
      setRole(role);
      safeSetItem("medtech_user", JSON.stringify(newUser));
      safeSetItem("medtech_role", role);
      setLoading(false);
      return { data: { user: newUser }, error: null };
    }

    const email = emailOrUserData;
    const password = passwordOrRole;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole("guest");
    safeRemoveItem("medtech_user");
    safeRemoveItem("medtech_role");
  };

  const saveProfile = async (profileData) => {
    setLoading(true);
    const newProfile = {
      id: user.id,
      ...profileData,
    };

    const { data, error } = await supabase.from("profiles").upsert(newProfile).select().single();

    if (!error) {
      await handleSession({ user });
      return true;
    }

    console.error("Error saving profile:", error);
    setLoading(false);
    return false;
  };

  const updateUserProfile = (updatedData) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    safeSetItem("medtech_user", JSON.stringify(updatedUser));
  };

  const loginGuest = (loginRole = "patient") => {
    setLoading(true);
    if (loginRole === "doctor") {
      const doctor = mockDoctors[0];
      setUser(doctor);
      setRole("doctor");
      safeSetItem("medtech_user", JSON.stringify(doctor));
      safeSetItem("medtech_role", "doctor");
    } else {
      const patient = mockPatients[0];
      setUser(patient);
      setRole("patient");
      safeSetItem("medtech_user", JSON.stringify(patient));
      safeSetItem("medtech_role", "patient");
    }
    setLoading(false);
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile || user,
        profile,
        rawUser: user,
        role,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        saveProfile,
        updateUserProfile,
        loginGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
