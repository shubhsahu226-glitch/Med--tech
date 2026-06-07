import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { mockPatients, mockDoctors } from "../data/mockData";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // stores name, mobile, location, dob
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleSession = async (session) => {
    setLoading(true);
    setUser(session.user);
    
    // Check if user is a doctor by querying doctors table
    const { data: doctorData } = await supabase
      .from("doctors")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (doctorData) {
      setRole("doctor");
    } else {
      setRole("patient");
    }
    
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
      return true;
    }
    console.error("Error saving profile:", error);
    setLoading(false);
    return false;
  };

  // The UI expects `user` to hold the profile data (name, avatar, etc)
  // So we pass `profile || user` as the `user` context variable so UI works seamlessly.
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
