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
    const savedUser = safeGetItem("virtualvaidya_user");
    const savedRole = safeGetItem("virtualvaidya_role");

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Failed to read auth session:", error);
          restoreLocalUser();
          return;
        }

        if (session?.user) {
          await handleSession(session);
        } else {
          restoreLocalUser();
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
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

    let resolvedRole = "patient";
    let doctorDetails = null;
    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!doctorError && doctorData?.id) {
        resolvedRole = "doctor";
        doctorDetails = doctorData;
      }
    } catch (err) {
      console.error("Doctor role lookup failed:", err);
    }

    setRole(resolvedRole);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      if (resolvedRole === "doctor") {
        setProfile({
          id: session.user.id,
          name: data.name,
          email: session.user.email,
          phone: data.mobile_number,
          location: data.location || doctorDetails?.hospital,
          specialty: doctorDetails?.specialization || "General Physician",
          experience: doctorDetails?.license_number ? "5 years" : "Unknown",
          hospital: doctorDetails?.hospital || "City Central Clinic",
          licenseNumber: doctorDetails?.license_number,
          slots: typeof doctorDetails?.slots === "string" ? JSON.parse(doctorDetails.slots) : doctorDetails?.slots || [],
          availability: typeof doctorDetails?.availability === "string" ? JSON.parse(doctorDetails.availability) : doctorDetails?.availability || [],
          rating: doctorDetails?.rating || 5.0,
          reviews_count: doctorDetails?.reviews_count || 0,
          image: doctorDetails?.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200"
        });
      } else {
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
      }
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

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data?.session) {
      await handleSession(data.session);
    } else if (data?.user) {
      setUser(data.user);
      setRole("patient");
      setLoading(false);
    }

    if (error) {
      setLoading(false);
    }

    return { data, error };
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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole("guest");
    safeRemoveItem("virtualvaidya_user");
    safeRemoveItem("virtualvaidya_role");
  };

  const saveProfile = async (profileData) => {
    setLoading(true);
    
    // 1. Build profile fields corresponding to public.profiles table
    const profileFields = {
      id: user.id,
      name: profileData.name,
      mobile_number: profileData.phone || profileData.mobile_number,
      location: profileData.location,
      dob: profileData.dob || null
    };

    const { data: pData, error: pError } = await supabase
      .from("profiles")
      .upsert(profileFields)
      .select()
      .single();

    if (pError) {
      console.error("Error saving base profile:", pError);
      setLoading(false);
      return false;
    }

    // 2. Build doctor fields corresponding to public.doctors table
    if (role === "doctor") {
      const doctorFields = {
        id: user.id,
        specialization: profileData.specialty || profileData.specialization || "General Physician",
        hospital: profileData.hospital || profileData.location || "City Central Clinic",
        license_number: profileData.licenseNumber || profileData.license_number || null
      };

      const { error: dError } = await supabase
        .from("doctors")
        .upsert(doctorFields);

      if (dError) {
        console.error("Error saving doctor details:", dError);
        setLoading(false);
        return false;
      }
    }

    // Refresh the active session profile state
    await handleSession({ user: rawUser || user });
    return true;
  };

  const updateUserProfile = (updatedData) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    safeSetItem("virtualvaidya_user", JSON.stringify(updatedUser));
  };

  const loginGuest = (loginRole = "patient") => {
    setLoading(true);

    if (loginRole === "doctor") {
      const doctor = mockDoctors[0];
      setUser(doctor);
      setRole("doctor");
      safeSetItem("virtualvaidya_user", JSON.stringify(doctor));
      safeSetItem("virtualvaidya_role", "doctor");
    } else {
      const patient = mockPatients[0];
      setUser(patient);
      setRole("patient");
      safeSetItem("virtualvaidya_user", JSON.stringify(patient));
      safeSetItem("virtualvaidya_role", "patient");
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
