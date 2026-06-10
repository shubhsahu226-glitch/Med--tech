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
    const isMetadataDoctor = session.user.user_metadata?.role === "doctor" || forcedRole === "doctor";

    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!doctorError && doctorData?.id) {
        resolvedRole = "doctor";
        doctorDetails = doctorData;
      } else if (isMetadataDoctor) {
        // Self-heal: doctor record is missing, let's insert it
        resolvedRole = "doctor";
        const formattedName = session.user.user_metadata?.name || "Dr. Clinician";
        
        // Ensure profile exists first
        const { data: profData } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();
          
        if (!profData) {
          await supabase.from("profiles").insert({
            id: session.user.id,
            name: formattedName,
            mobile_number: "Not provided",
            dob: "1980-01-01",
            location: "City Central Clinic"
          });
        }
        
        const newDoc = {
          id: session.user.id,
          specialization: "General Physician",
          license_number: "LIC-" + Math.floor(100000 + Math.random() * 900000),
          hospital: "City Central Clinic",
          slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"],
          availability: ["Monday 09:00 - 17:00", "Wednesday 09:00 - 17:00"],
          rating: 5.0,
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
    } catch (err) {
      console.error("Doctor role lookup / heal failed:", err);
    }

    setRole(resolvedRole);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profiles:", error);
    }

    if (data) {
      if (resolvedRole === "doctor") {
        setProfile({
          id: session.user.id,
          name: data.name,
          email: session.user.email,
          phone: data.mobile_number,
          location: data.location || doctorDetails?.location || "City Central Clinic",
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
        let patientDetails = null;
        try {
          const { data: patData, error: patError } = await supabase
            .from("patients")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!patError && patData?.id) {
            patientDetails = patData;
          } else {
            // Self-heal patient record
            const formattedName = session.user.user_metadata?.name || data.name || "Patient";
            
            // Ensure profile exists first
            const { data: profData } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", session.user.id)
              .maybeSingle();
              
            if (!profData) {
              await supabase.from("profiles").insert({
                id: session.user.id,
                name: formattedName,
                mobile_number: "Not provided",
                dob: "1990-01-01",
                location: "Not provided"
              });
            }
            
            const newPat = {
              id: session.user.id,
              blood_type: null,
              emergency_contact_name: null,
              emergency_contact_phone: null
            };
            
            const { data: insertedPat } = await supabase
              .from("patients")
              .insert(newPat)
              .select()
              .maybeSingle();
              
            patientDetails = insertedPat || newPat;
          }
        } catch (patErr) {
          console.error("Patient details lookup / heal failed:", patErr);
        }

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

    if (data?.session) {
      await handleSession(data.session, forcedRole);
    } else if (data?.user) {
      setUser(data.user);
      setRole(forcedRole || "patient");
      setLoading(false);
    }

    if (error) {
      setLoading(false);
    }

    return { data, error };
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
      dob: profileData.dob || null
    };

    const { error: pError } = await supabase
      .from("profiles")
      .upsert(profileFields);

    if (pError) {
      console.error("Error saving base profile:", pError);
      setLoading(false);
      return false;
    }

    // 2. Build doctor fields corresponding to public.doctors table
    if (role === "doctor") {
      const doctorFields = {
        id: user.id,
        name: profileData.name,
        specialty: profileData.specialty || "General Physician",
        location: profileData.location || "City Central Clinic",
        experience: profileData.experience || "5 years",
        consultationFee: profileData.consultationFee || null,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
