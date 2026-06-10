import { createContext, useContext, useState, useEffect } from "react";
import { 
  mockPatients, 
  mockDoctors, 
  mockMedicationReminders, 
  mockReportTrends 
} from "../data/mockData";
import { useAuth } from "./AuthContext";
import { supabase } from "../config/supabase";

const generateUUID = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (err) {
    console.debug("Failed to generate UUID natively", err);
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const HealthContext = createContext(null);

export const HealthProvider = ({ children }) => {
  const { user, role, updateUserProfile } = useAuth();
  
  // Data States
  const [patients, setPatients] = useState(mockPatients);
  const [doctors, setDoctors] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [treatments, setTreatments] = useState([]);

  const fetchDoctors = async () => {
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('doctors')
      .select('*');
      
    if (doctorsData && !doctorsError && doctorsData.length > 0) {
      const doctorIds = doctorsData.map(d => d.id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, mobile_number, location')
        .in('id', doctorIds);
        
      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(p => { profilesMap[p.id] = p; });
      }

      const parsedDoctors = doctorsData.map(doc => {
        const profile = profilesMap[doc.id] || {};
        return {
          ...doc,
          name: profile.name || doc.name || "Doctor",
          specialty: doc.specialty || doc.specialization || "General Physician",
          location: profile.location || doc.location || doc.hospital || "City Central Clinic",
          slots: typeof doc.slots === 'string' ? JSON.parse(doc.slots) : doc.slots || [],
          availability: typeof doc.availability === 'string' ? JSON.parse(doc.availability) : doc.availability || []
        };
      });
      setDoctors(parsedDoctors);
    } else {
      if (doctorsError) console.error("Failed to fetch doctors:", doctorsError);
      setDoctors(mockDoctors);
    }
  };

  // Fetch doctors on mount and when user changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDoctors();
  }, [user]);

  // Fetch reports for the logged in user
  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('date', { ascending: false });
        
      if (data && !error) {
        // Parse the metrics_json which was saved as a string by the backend
        const parsedReports = data.map(r => ({
          ...r,
          metrics: r.metrics_json ? JSON.parse(r.metrics_json) : [],
          aiSummary: r.ai_summary
        }));
        
        // Push this into the patients state for the current user
        setPatients(prev => {
          const newPatients = [...prev];
          const existingIdx = newPatients.findIndex(p => p.id === user.id);
          
          if (existingIdx >= 0) {
            newPatients[existingIdx] = { ...newPatients[existingIdx], reports: parsedReports, reportsCount: parsedReports.length };
          } else {
            newPatients.push({ id: user.id, reports: parsedReports, reportsCount: parsedReports.length, history: [] });
          }
          return newPatients;
        });
      }
    };
    
    fetchReports();
  }, [user]);

  // Fetch alerts, reminders, and treatments for the logged in user
  useEffect(() => {
    const fetchAlertsAndReminders = async () => {
      if (!user?.id) {
        setAlerts([]);
        setReminders([]);
        setTreatments([]);
        return;
      }

      // 1. Reminders (Show mock reminders ONLY for demo patient, otherwise start empty)
      if (user.id === "pat1") {
        setReminders(mockMedicationReminders);
      } else {
        setReminders([]);
      }

      // 2. Alerts (Query active clinical alerts from Supabase, or mock clinical alert for demo user)
      if (user.id === "pat1" || user.id === "pat2" || user.id === "pat3") {
        setAlerts([
          {
            id: "al_mock1",
            title: "Abnormal LDL Cholesterol",
            severity: "medium",
            description: "Fasting lipid profile shows LDL level of 134 mg/dL which is borderline high.",
            action: "Review dietary saturated fat intake and schedule a follow-up test in 3 months."
          }
        ]);
      } else {
        const { data, error } = await supabase
          .from('alerts')
          .select('*')
          .eq('patient_id', user.id)
          .eq('status', 'Active');

        if (data && !error) {
          setAlerts(data.map(a => ({
            id: a.id,
            title: a.title,
            severity: a.severity?.toLowerCase() || "medium",
            description: a.description,
            action: "Review metrics details inside the Reports center."
          })));
        } else {
          setAlerts([]);
        }
      }

      // 3. Treatments (Query active treatments from Supabase, or mock treatment for demo user)
      if (user.id === "pat1") {
        setTreatments([
          {
            id: "t_mock1",
            patient_id: user.id,
            doctor_name: "Dr. Sarah Jenkins",
            diagnosis: "Hypertension Therapy Regimen",
            notes: "Blood pressure reading logs show steady improvement. Please continue tracking readings twice weekly and maintain the current schedule.",
            prescription: "Lisinopril 10mg daily",
            follow_up_date: "July 12, 2026"
          }
        ]);
      } else {
        const { data, error } = await supabase
          .from('treatments')
          .select('*')
          .eq('patient_id', user.id);

        if (data && !error) {
          setTreatments(data);
        } else {
          setTreatments([]);
        }
      }
    };

    fetchAlertsAndReminders();
  }, [user]);

  const [appointments, setAppointments] = useState([]);
  const [consultations] = useState([]);
  const [trends, setTrends] = useState(mockReportTrends);

  // Sync state if user reports modify
  const uploadReport = (patientId, reportTitle, reportType, metrics, summary, dbId, dbDate) => {
    const newReport = {
      id: dbId || `rep_${Date.now()}`,
      date: dbDate || new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' }),
      title: reportTitle,
      type: reportType,
      status: "Reviewed",
      aiSummary: summary || "AI Analysis: All major parameters lie within optimal values. No critical anomalies identified.",
      metrics: metrics || [
        { name: "Blood Glucose", value: 90, unit: "mg/dL", status: "Normal", min: 70, max: 99 },
        { name: "Systolic BP", value: 120, unit: "mmHg", status: "Normal", min: 90, max: 129 },
        { name: "Diastolic BP", value: 80, unit: "mmHg", status: "Normal", min: 60, max: 84 }
      ]
    };

    let foundPatient = false;
    setPatients(prevPatients => {
      const newPatients = prevPatients.map(pat => {
        if (pat.id === patientId) {
          foundPatient = true;
          return {
            ...pat,
            reports: [newReport, ...(pat.reports || [])],
            reportsCount: (pat.reportsCount || 0) + 1
          };
        }
        return pat;
      });
      
      if (!foundPatient) {
        newPatients.push({
          id: patientId,
          reports: [newReport],
          reportsCount: 1,
          history: []
        });
      }
      return newPatients;
    });

    if (user && user.id === patientId && updateUserProfile) {
      updateUserProfile({
        reports: [newReport, ...(user.reports || [])],
        reportsCount: (user.reportsCount || 0) + 1
      });
    }

    // If report has systolic/diastolic or glucose metrics, append to trends for the demo!
    const sys = metrics?.find(m => m.name.includes("Systolic"))?.value || 120;
    const gluc = metrics?.find(m => m.name.includes("Glucose"))?.value || 90;
    const ldl = metrics?.find(m => m.name.includes("LDL"))?.value || 110;
    
    setTrends(prev => [
      ...prev,
      {
        month: new Date().toLocaleDateString("en-US", { month: 'short' }),
        ldl,
        glucose: gluc,
        systolic: sys,
        hba1c: 5.4
      }
    ]);

    return newReport;
  };

  const fetchAppointments = async () => {
    if (!user?.id) return;
    const isDoctor = role === 'doctor';
    const column = isDoctor ? 'doctor_id' : 'patient_id';
    
    // 1. Fetch from localStorage first
    let localApts = [];
    try {
      const localAptsStr = localStorage.getItem("virtualvaidya_local_appointments") || "[]";
      localApts = JSON.parse(localAptsStr).map(d => ({
        ...d,
        patientId: d.patient_id,
        doctorId: d.doctor_id,
        patientName: d.patient_name,
        doctorName: d.doctor_name
      }));
    } catch (e) {
      console.warn("Failed to read localStorage appointments:", e);
    }

    const isGuest = user.id === "pat1" || user.id === "doc1";
    if (isGuest) {
      const filtered = localApts.filter(apt => isDoctor ? apt.doctorId === user.id : apt.patientId === user.id);
      setAppointments(filtered);
      return;
    }

    // 2. Fetch from Supabase for real users
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq(column, user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const dbApts = data.map(d => ({
          ...d,
          patientId: d.patient_id,
          doctorId: d.doctor_id,
          patientName: d.patient_name,
          doctorName: d.doctor_name
        }));
        
        // Merge avoiding duplicates
        const allApts = [...dbApts];
        localApts.forEach(localApt => {
          if (localApt[column] === user.id && !allApts.find(a => a.id === localApt.id)) {
            allApts.push(localApt);
          }
        });
        
        setAppointments(allApts);
      } else {
        setAppointments(localApts.filter(apt => isDoctor ? apt.doctorId === user.id : apt.patientId === user.id));
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setAppointments(localApts.filter(apt => isDoctor ? apt.doctorId === user.id : apt.patientId === user.id));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  const addAppointment = async (appointmentData) => {
    const { patientId, doctorId, patientName, doctorName, date, time, reason, meetingType } = appointmentData;
    const newAptId = generateUUID();
    const newAptObj = {
      id: newAptId,
      patient_id: patientId,
      doctor_id: doctorId,
      patient_name: patientName,
      doctor_name: doctorName,
      date,
      time,
      reason,
      meetingType: meetingType || "Video",
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    const mappedApt = {
      ...newAptObj,
      patientId: newAptObj.patient_id,
      doctorId: newAptObj.doctor_id,
      patientName: newAptObj.patient_name,
      doctorName: newAptObj.doctor_name
    };

    setAppointments(prev => [mappedApt, ...prev]);

    try {
      const localAptsStr = localStorage.getItem("virtualvaidya_local_appointments") || "[]";
      const localApts = JSON.parse(localAptsStr);
      localApts.push(newAptObj);
      localStorage.setItem("virtualvaidya_local_appointments", JSON.stringify(localApts));
    } catch (e) {
      console.warn("Failed to write appointment to localStorage:", e);
    }

    const isGuest = patientId === "pat1" || doctorId === "doc1";
    if (!isGuest) {
      try {
        await supabase.from('appointments').insert([newAptObj]);
      } catch (err) {
        console.error("Supabase insert failed, fell back to local storage:", err);
      }
    }
    return mappedApt;
  };

  const updateAppointmentStatus = async (aptId, status) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === aptId ? { ...apt, status } : apt)
    );

    try {
      const localAptsStr = localStorage.getItem("virtualvaidya_local_appointments") || "[]";
      const localApts = JSON.parse(localAptsStr);
      const updated = localApts.map(apt => apt.id === aptId ? { ...apt, status } : apt);
      localStorage.setItem("virtualvaidya_local_appointments", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to update localStorage appointments:", e);
    }

    const isGuest = user?.id === "pat1" || user?.id === "doc1";
    if (!isGuest) {
      try {
        await supabase.from('appointments').update({ status }).eq('id', aptId);
      } catch (err) {
        console.error("Failed to update appointment status in Supabase:", err);
      }
    }
  };

  const addReminder = (name, dosage, frequency, time) => {
    const newRem = {
      id: `rem_${Date.now()}`,
      name,
      dosage,
      frequency,
      time,
      taken: false
    };
    setReminders(prev => [...prev, newRem]);
    return newRem;
  };

  const toggleReminder = (id) => {
    setReminders(prev => 
      prev.map(rem => rem.id === id ? { ...rem, taken: !rem.taken } : rem)
    );
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(rem => rem.id !== id));
  };

  const triggerEmergencyAlert = (title, severity, description, action) => {
    const newAlert = {
      id: `al_${Date.now()}`,
      title,
      severity, // high, medium, low
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' }),
      description,
      action
    };
    setAlerts(prev => [newAlert, ...prev]);
    return newAlert;
  };

  const addTreatmentNotes = (patientId, doctorName, diagnosis, notes, prescription, followUpDate) => {
    // Add to patient's clinical history
    setPatients(prevPatients => 
      prevPatients.map(pat => {
        if (pat.id === patientId) {
          const newHistory = {
            id: `h_${Date.now()}`,
            date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' }),
            type: "Consultation Review",
            diagnosis,
            notes: `${notes}. Prescription: ${prescription}. Follow-up: ${followUpDate}`,
            doctor: doctorName
          };
          return {
            ...pat,
            condition: diagnosis,
            history: [newHistory, ...pat.history]
          };
        }
        return pat;
      })
    );

    // If prescription has a medicine, automatically add to reminders list for patients!
    if (prescription && patientId === "pat1") {
      // Simple parse for demo: e.g., "Metformin 500mg" -> name: Metformin, dosage: 500mg
      const parts = prescription.split(" ");
      const name = parts[0] || "New Medication";
      const dosage = parts[1] || "1 tab";
      addReminder(name, dosage, "Once daily (Morning)", "08:00 AM");
    }
  };

  return (
    <HealthContext.Provider value={{
      patients,
      doctors,
      appointments,
      reminders,
      alerts,
      trends,
      treatments,
      consultations,
      uploadReport,
      refreshDoctors: fetchDoctors,
      addAppointment,
      updateAppointmentStatus,
      addReminder,
      toggleReminder,
      deleteReminder,
      triggerEmergencyAlert,
      addTreatmentNotes
    }}>
      {children}
    </HealthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within a HealthProvider");
  }
  return context;
};
