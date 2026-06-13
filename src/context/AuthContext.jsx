import { createContext, useContext, useState, useEffect } from "react";
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
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn("sessionStorage read blocked by security sandbox:", e);
      return null;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("sessionStorage write blocked by security sandbox:", e);
    }
  };

  const safeRemoveItem = (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn("sessionStorage delete blocked by security sandbox:", e);
    }
  };

  const restoreLocalUser = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mockRole = params.get("mockRole");
      const mockUserId = params.get("mockUserId");

      if (mockRole && mockUserId) {
        if (mockRole === "doctor") {
          const doc = mockDoctors.find(d => d.id === mockUserId) || mockDoctors[0];
          setUser(doc);
          setRole("doctor");
        } else {
          const pat = mockPatients.find(p => p.id === mockUserId) || mockPatients[0];
          setUser(pat);
          setRole("patient");
        }
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Failed to parse URL mock query params:", e);
    }

    const savedUser = safeGetItem("virtualvaidya_user");
    const savedRole = safeGetItem("virtualvaidya_role");

    if (savedUser && savedRole) {
      setUser(JSON.parse(savedUser));
      setRole(savedRole);
    } else {
      setUser(null);
      setRole("guest");
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleSession(session);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setRole("guest");
        safeRemoveItem("virtualvaidya_user");
        safeRemoveItem("virtualvaidya_role");
        setLoading(false);
      } else {
        restoreLocalUser();
      }
    });

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleSession(session, forcedRole) {
    setLoading(true);
    setUser(session.user);

    let resolvedRole = "patient";
    let doctorDetails = null;
    let patientDetails = null;
    let profileData = null;
    const isMetadataDoctor = session.user.user_metadata?.role === "doctor" || forcedRole === "doctor";

    try {
      // 1. PRIMARY role detection: check profiles.role column (fast, single query)
      const { data: profileRoleData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileRoleData?.role === "doctor" || isMetadataDoctor) {
        resolvedRole = "doctor";
      } else if (profileRoleData?.role) {
        resolvedRole = profileRoleData.role; // 'patient' or other
      }
    } catch (err) {
      console.error("Role detection failed:", err);
    }

    setRole(resolvedRole);

    try {
      // 2. Fetch or self-heal the base profile record
      const { data: existingProfile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (existingProfile) {
        profileData = existingProfile;
      } else {
        // Self-heal: profile record is missing, let's insert it
        const formattedName = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Patient";
        const newProfile = {
          id: session.user.id,
          name: formattedName,
          mobile_number: "Not provided",
          dob: resolvedRole === "doctor" ? "1980-01-01" : "1990-01-01",
          location: resolvedRole === "doctor" ? "City Central Clinic" : "Not provided",
          role: resolvedRole
        };
        
        const { data: insertedProfile, error: insertProfErr } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .maybeSingle();

        if (insertProfErr) {
          console.error("Self-heal profile record insert failed:", insertProfErr);
          profileData = newProfile;
        } else {
          profileData = insertedProfile || newProfile;
        }
      }
    } catch (err) {
      console.error("Profile fetch/healing failed:", err);
    }

    // 3. Ensure role-specific database record exists (self-healing)
    try {
      if (resolvedRole === "doctor") {
        const { data: existingDoctor, error: doctorError } = await supabase
          .from("doctors")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (existingDoctor) {
          doctorDetails = existingDoctor;
        } else {
          // Self-heal: doctor record is missing, let's insert it
          const formattedName = profileData?.name || session.user.user_metadata?.name || "Dr. Clinician";
          const newDoc = {
            id: session.user.id,
            name: formattedName,
            specialty: "General Physician",
            specialization: "General Physician",
            location: profileData?.location || "City Central Clinic",
            hospital: profileData?.location || "City Central Clinic",
            license_number: "LIC-" + Math.floor(100000 + Math.random() * 900000),
            experience: "5 years",
            education: "MBBS",
            slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"],
            availability: ["Monday 09:00 - 17:00", "Wednesday 09:00 - 17:00"],
            rating: 5.0,
            reviews: 0,
            reviews_count: 0,
            image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200"
          };
          
          const { data: insertedDoc, error: insertError } = await supabase
            .from("doctors")
            .insert(newDoc)
            .select()
            .maybeSingle();
            
          doctorDetails = (!insertError && insertedDoc) ? insertedDoc : newDoc;
        }
      } else {
        // resolvedRole === "patient"
        const { data: existingPatient, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (existingPatient) {
          patientDetails = existingPatient;
        } else {
          // Self-heal: patient record is missing, let's insert it
          const newPat = {
            id: session.user.id,
            blood_type: null,
            emergency_contact_name: null,
            emergency_contact_phone: null
          };
          
          const { data: insertedPat, error: insertError } = await supabase
            .from("patients")
            .insert(newPat)
            .select()
            .maybeSingle();
            
          patientDetails = (!insertError && insertedPat) ? insertedPat : newPat;
        }
      }
    } catch (roleErr) {
      console.error("Role details lookup / heal failed:", roleErr);
    }

    // 4. Update the local profile state using the healed records
    if (profileData) {
      if (resolvedRole === "doctor") {
        setProfile({
          id: session.user.id,
          name: profileData.name,
          email: session.user.email,
          phone: profileData.mobile_number,
          location: profileData.location || doctorDetails?.location || "City Central Clinic",
          specialty: doctorDetails?.specialty || "General Physician",
          experience: doctorDetails?.experience || "5 years",
          slots: typeof doctorDetails?.slots === "string" ? JSON.parse(doctorDetails.slots) : doctorDetails?.slots || [],
          availability: typeof doctorDetails?.availability === "string" ? JSON.parse(doctorDetails.availability) : doctorDetails?.availability || [],
          rating: doctorDetails?.rating || 5.0,
          reviews: doctorDetails?.reviews || 0,
          image: doctorDetails?.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
          about: doctorDetails?.about || "",
          consultationFee: doctorDetails?.consultationFee || ""
        });
      } else {
        const basePatient = mockPatients[0];
        setProfile({
          ...basePatient,
          id: session.user.id,
          name: profileData.name,
          email: session.user.email,
          phone: profileData.mobile_number,
          location: profileData.location,
          dob: profileData.dob,
          age: calculateAge(profileData.dob),
          bloodGroup: patientDetails?.blood_type || null,
          emergencyContactName: patientDetails?.emergency_contact_name || null,
          emergencyContactPhone: patientDetails?.emergency_contact_phone || null,
          emergencyContact: patientDetails?.emergency_contact_phone 
            ? `${patientDetails.emergency_contact_name} (${patientDetails.emergency_contact_phone})`
            : null,
        });
      }
    } else {
      setProfile(null);
    }

    setLoading(false);
    return resolvedRole;
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

  const login = async (email, password, forcedRole) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let finalRole = forcedRole;

    if (data?.session) {
      finalRole = await handleSession(data.session, forcedRole);
    } else if (data?.user) {
      setUser(data.user);
      setRole(forcedRole || "patient");
      setLoading(false);
    }

    if (error) {
      setLoading(false);
    }

    return { data, error, role: finalRole };
  };

  const signup = async (email, password, options = {}) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...options
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
      dob: profileData.dob || null,
      role: role // Persist role in profiles table
    };

    const { error: pError } = await supabase
      .from("profiles")
      .upsert(profileFields);

    if (pError) {
      console.error("Error saving base profile:", pError);
      setLoading(false);
      return false;
    }

    // 2. Build doctor fields — write BOTH old and new column names for compatibility
    if (role === "doctor") {
      const doctorFields = {
        id: user.id,
        name: profileData.name,
        specialty: profileData.specialty || "General Physician",
        specialization: profileData.specialty || "General Physician",
        location: profileData.location || "City Central Clinic",
        hospital: profileData.location || profileData.hospital || "City Central Clinic",
        experience: profileData.experience || "5 years",
        consultationFee: profileData.consultationFee || null,
        license_number: profileData.licenseNumber || undefined,
        slots: profileData.slots || undefined,
        availability: profileData.availability || undefined
      };

      // Remove undefined keys
      Object.keys(doctorFields).forEach(key => {
        if (doctorFields[key] === undefined) delete doctorFields[key];
      });

      const { error: dError } = await supabase
        .from("doctors")
        .upsert(doctorFields);

      if (dError) {
        console.error("Error saving doctor details:", dError);
        setLoading(false);
        return false;
      }
    }

    // 3. Build patient fields corresponding to public.patients table
    if (role === "patient") {
      const patientFields = {
        id: user.id,
        blood_type: profileData.bloodGroup || null,
        emergency_contact_name: profileData.emergencyContactName || null,
        emergency_contact_phone: profileData.emergencyContactPhone || null
      };

      const { error: patError } = await supabase
        .from("patients")
        .upsert(patientFields);

      if (patError) {
        console.error("Error saving patient details:", patError);
        setLoading(false);
        return false;
      }
    }

    // Refresh the active session profile state
    await handleSession({ user });
    return true;
  };

  const updateUserProfile = (updatedData) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    safeSetItem("virtualvaidya_user", JSON.stringify(updatedUser));
  };

  const loginGuest = async (loginRole = "patient") => {
    setLoading(true);
    let email, password;
    if (loginRole === "doctor") {
      email = "guest.doctor@virtualvaidya.com";
      password = "Password123";
    } else {
      email = "guest.patient@virtualvaidya.com";
      password = "Password123";
    }

    const { data, error, role: resolvedRole } = await login(email, password, loginRole);
    setLoading(false);
    return { data, error, role: resolvedRole };
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
