import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { mockPatients, mockDoctors } from "../data/mockData";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // stores name, mobile, location, dob
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

<<<<<<< Updated upstream
  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession(session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleSession(session);
      } else {
        setUser(null);
        setProfile(null);
        setRole("guest");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
=======
  // Safe local storage helpers to prevent SecurityError in sandboxes
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

  // Initialize with a mock patient session for easy visual testing
  useEffect(() => {
    const savedUser = safeGetItem("medtech_user");
    const savedRole = safeGetItem("medtech_role");
    
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
>>>>>>> Stashed changes
  }, []);

  const handleSession = async (session) => {
    setLoading(true);
    setUser(session.user);
    setRole("patient"); // Default to patient for this demo
    
    // Fetch profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
      
    if (data) {
      // Merge with mock patient data so the UI doesn't crash expecting arrays
      const basePatient = mockPatients[0];
      setProfile({
        ...basePatient,
        id: session.user.id,
        name: data.name,
        email: session.user.email,
        phone: data.mobile_number,
        location: data.location,
        dob: data.dob,
        age: calculateAge(data.dob)
      });
    } else {
      setProfile(null); // Needs onboarding
    }
    setLoading(false);
  };

<<<<<<< Updated upstream
  const calculateAge = (dobString) => {
    if (!dobString) return 30;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error("Google login error:", error);
    return !error;
  };

  const signup = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    return { data, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const saveProfile = async (profileData) => {
    setLoading(true);
    const newProfile = {
      id: user.id,
      ...profileData
    };
    
    const { data, error } = await supabase
      .from("profiles")
      .upsert(newProfile)
      .select()
      .single();
      
    if (!error) {
      // Reload session to get merged mock data
      await handleSession({ user });
=======
    if (authenticatedUser) {
      setUser(authenticatedUser);
      setRole(loginRole);
      safeSetItem("medtech_user", JSON.stringify(authenticatedUser));
      safeSetItem("medtech_role", loginRole);
      setLoading(false);
>>>>>>> Stashed changes
      return true;
    }
    console.error("Error saving profile:", error);
    setLoading(false);
    return false;
  };

<<<<<<< Updated upstream
  // The UI expects `user` to hold the profile data (name, avatar, etc)
  // So we pass `profile || user` as the `user` context variable so UI works seamlessly.
=======
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
    safeSetItem("medtech_user", JSON.stringify(newUser));
    safeSetItem("medtech_role", signupRole);
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setRole("guest");
    safeRemoveItem("medtech_user");
    safeRemoveItem("medtech_role");
  };

  const updateUserProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    safeSetItem("medtech_user", JSON.stringify(updatedUser));
  };

>>>>>>> Stashed changes
  return (
    <AuthContext.Provider value={{ 
      user: profile || user, 
      profile, 
      rawUser: user, 
      role, 
      loading, 
      login, 
      signup, 
      loginWithGoogle, 
      logout, 
      saveProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
