import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  mockPatients, 
  mockDoctors, 
  mockMedicationReminders, 
  mockEmergencyAlerts, 
  mockReportTrends 
} from "../data/mockData";
import { useAuth } from "./AuthContext";
import { supabase } from "../config/supabase";

const HealthContext = createContext(null);

export const HealthProvider = ({ children }) => {
  const { user, role, updateUserProfile } = useAuth();
  
  // Data States
  const [patients, setPatients] = useState(mockPatients);
  const [doctors, setDoctors] = useState([]);
  const [reminders, setReminders] = useState(mockMedicationReminders);
  const [alerts, setAlerts] = useState(mockEmergencyAlerts);

  // Fetch doctors from Supabase on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase.from('doctors').select('*');
      if (data && !error) {
        const parsedDoctors = data.map(doc => ({
          ...doc,
          slots: typeof doc.slots === 'string' ? JSON.parse(doc.slots) : doc.slots || [],
          availability: typeof doc.availability === 'string' ? JSON.parse(doc.availability) : doc.availability || []
        }));
        setDoctors(parsedDoctors);
      } else {
        console.error("Failed to fetch doctors:", error);
        setDoctors(mockDoctors);
      }
    };
    fetchDoctors();
  }, []);

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

  const [appointments, setAppointments] = useState([
    {
      id: "apt1",
      patientId: "pat1",
      patientName: "Alex Mercer",
      doctorId: "doc1",
      doctorName: "Dr. Sarah Jenkins",
      doctorSpecialty: "Cardiologist",
      date: "2026-06-12",
      time: "10:00 AM",
      status: "Upcoming",
      reason: "Quarterly hypertension checkup",
      meetingType: "Video"
    },
    {
      id: "apt2",
      patientId: "pat2",
      patientName: "Emily Watson",
      doctorId: "doc2",
      doctorName: "Dr. Marcus Chen",
      doctorSpecialty: "Neurologist",
      date: "2026-06-15",
      time: "11:00 AM",
      status: "Upcoming",
      reason: "Chronic migraine follow-up",
      meetingType: "Chat"
    }
  ]);
  const [consultations, setConsultations] = useState([]);
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

  const addAppointment = (appointmentData) => {
    const newApt = {
      id: `apt_${Date.now()}`,
      status: "Upcoming",
      ...appointmentData
    };
    setAppointments(prev => [newApt, ...prev]);
    return newApt;
  };

  const updateAppointmentStatus = (aptId, status) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === aptId ? { ...apt, status } : apt)
    );
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
      consultations,
      uploadReport,
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

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used within a HealthProvider");
  }
  return context;
};
