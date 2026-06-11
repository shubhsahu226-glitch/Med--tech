export const mockDoctors = [
  {
    id: "7a02fa0d-9719-4261-bd98-1c3d54238c2f",
    name: "Dr. Sarah Jenkins",
    specialty: "Cardiologist",
    hospital: "City Heart Institute",
    experience: "12 Years",
    rating: 4.8,
    reviews: 124,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150",
    about: "Dr. Jenkins is a board-certified cardiologist specializing in preventive cardiology and hypertension management.",
    slots: ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"],
    availability: ["Monday", "Wednesday", "Friday"],
    fee: "₹1500"
  },
  {
    id: "87c80d20-6401-4f07-a421-fd012c847992",
    name: "Dr. Amit Patel",
    specialty: "Neurologist",
    hospital: "NeuroCare Center",
    experience: "8 Years",
    rating: 4.9,
    reviews: 89,
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150",
    about: "Specializing in neurological disorders, migraines, and nerve health. Known for thorough diagnostic approaches.",
    slots: ["10:00 AM", "11:30 AM", "01:00 PM", "03:30 PM"],
    availability: ["Tuesday", "Thursday", "Saturday"],
    fee: "₹1800"
  }
];

export const mockPatients = [
  {
    id: "6bbc3a1a-2b12-48cd-b04d-8974ca01264a",
    name: "Alex Mercer",
    age: 34,
    gender: "Male",
    bloodGroup: "O+",
    phone: "+1 (555) 019-2834",
    email: "alex.mercer@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    condition: "Hypertension (Controlled)",
    lastVisit: "May 12, 2026",
    reportsCount: 4,
    recentAlerts: 0,
    history: [
      { id: "h1", date: "May 12, 2026", type: "Cardiology", diagnosis: "Essential Hypertension", notes: "Patient shows good response to Lisinopril. BP stable at 122/80.", doctor: "Dr. Sarah Jenkins" },
      { id: "h2", date: "Jan 18, 2026", type: "General Lab", diagnosis: "Hypercholesterolemia", notes: "Elevated LDL. Initiated Lipitor 10mg daily and dietary changes.", doctor: "Dr. Amit Patel" }
    ],
    reports: [
      {
        id: "rep1",
        date: "May 28, 2026",
        title: "Comprehensive Blood Panel",
        type: "Blood Test",
        status: "Reviewed",
        aiSummary: "The analysis shows overall healthy values. There is a slight elevation in Cholesterol levels (LDL is 134 mg/dL, which is borderline high). Fasting Blood Glucose is normal at 88 mg/dL. Kidney and liver function indicators are fully within normal ranges.",
        metrics: [
          { name: "Systolic BP", value: 122, unit: "mmHg", status: "Normal", min: 90, max: 129 },
          { name: "Diastolic BP", value: 80, unit: "mmHg", status: "Normal", min: 60, max: 84 },
          { name: "LDL Cholesterol", value: 134, unit: "mg/dL", status: "Borderline High", min: 50, max: 99 },
          { name: "HDL Cholesterol", value: 54, unit: "mg/dL", status: "Normal", min: 40, max: 90 },
          { name: "Fasting Glucose", value: 88, unit: "mg/dL", status: "Normal", min: 70, max: 99 },
          { name: "HbA1c", value: 5.4, unit: "%", status: "Normal", min: 4.0, max: 5.6 }
        ]
      },
      {
        id: "rep2",
        date: "Jan 15, 2026",
        title: "Lipid Profile & Metabolic Panel",
        type: "Blood Test",
        status: "Reviewed",
        aiSummary: "Cholesterol levels are elevated with LDL at 152 mg/dL. Fasting blood sugar is normal at 92 mg/dL. Initial indicators suggest lifestyle and dietary adjustments or low-dose statin therapy.",
        metrics: [
          { name: "Systolic BP", value: 138, unit: "mmHg", status: "Pre-hypertension", min: 90, max: 129 },
          { name: "Diastolic BP", value: 88, unit: "mmHg", status: "Pre-hypertension", min: 60, max: 84 },
          { name: "LDL Cholesterol", value: 152, unit: "mg/dL", status: "Abnormal", min: 50, max: 99 },
          { name: "HDL Cholesterol", value: 48, unit: "mg/dL", status: "Normal", min: 40, max: 90 },
          { name: "Fasting Glucose", value: 92, unit: "mg/dL", status: "Normal", min: 70, max: 99 },
          { name: "HbA1c", value: 5.6, unit: "%", status: "Normal", min: 4.0, max: 5.6 }
        ]
      }
    ]
  },
  {
    id: "pat2",
    name: "Emily Watson",
    age: 28,
    gender: "Female",
    bloodGroup: "A-",
    phone: "+1 (555) 014-9988",
    email: "emily.watson@yahoo.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    condition: "Migraine (Chronic)",
    lastVisit: "May 25, 2026",
    reportsCount: 2,
    recentAlerts: 1,
    history: [
      { id: "h3", date: "May 25, 2026", type: "Neurology", diagnosis: "Migraine with Aura", notes: "Prescribed Sumatriptan for acute attacks and Propranolol for prophylaxis. Advised headache diary.", doctor: "Dr. Marcus Chen" }
    ],
    reports: [
      {
        id: "rep3",
        date: "May 24, 2026",
        title: "Brain MRI (Contrast)",
        type: "MRI Scan",
        status: "Reviewed",
        aiSummary: "The brain magnetic resonance imaging scans reveal no acute ischemic infarct, hemorrhage, or mass effect. Ventricles and sulci are normal for age. The scan is completely normal with no structural abnormalities explaining the chronic migraines, which aligns with primary migraine disorder.",
        metrics: [
          { name: "Ventricular Size", value: 1.0, unit: "Index", status: "Normal", min: 0.8, max: 1.2 },
          { name: "Midline Shift", value: 0.0, unit: "mm", status: "Normal", min: 0.0, max: 0.1 }
        ]
      }
    ]
  },
  {
    id: "pat3",
    name: "Michael Vance",
    age: 62,
    gender: "Male",
    bloodGroup: "B+",
    phone: "+1 (555) 017-4581",
    email: "mvance62@outlook.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    condition: "Type 2 Diabetes",
    lastVisit: "April 02, 2026",
    reportsCount: 5,
    recentAlerts: 2,
    history: [
      { id: "h4", date: "Apr 02, 2026", type: "Endocrinology", diagnosis: "Type 2 Diabetes Mellitus", notes: "HbA1c at 7.2%. Adjusted Metformin to 1000mg BID. Encouraged aerobic exercise.", doctor: "Dr. Amit Patel" }
    ],
    reports: [
      {
        id: "rep4",
        date: "Mar 30, 2026",
        title: "Fasting Blood Sugar & HbA1c",
        type: "Blood Test",
        status: "Reviewed",
        aiSummary: "HbA1c is at 7.2%, which is above the target of <7.0% for diabetic patients. Fasting Glucose is elevated at 145 mg/dL. Requires treatment review, medication adjustment, and strict glycemic monitoring.",
        metrics: [
          { name: "Systolic BP", value: 135, unit: "mmHg", status: "Pre-hypertension", min: 90, max: 129 },
          { name: "Diastolic BP", value: 84, unit: "mmHg", status: "Normal", min: 60, max: 84 },
          { name: "LDL Cholesterol", value: 104, unit: "mg/dL", status: "Normal", min: 50, max: 99 },
          { name: "Fasting Glucose", value: 145, unit: "mg/dL", status: "Abnormal", min: 70, max: 99 },
          { name: "HbA1c", value: 7.2, unit: "%", status: "Abnormal", min: 4.0, max: 5.6 }
        ]
      }
    ]
  }
];

export const mockMedicationReminders = [
  { id: "rem1", name: "Lisinopril", dosage: "10mg", frequency: "Once daily (Morning)", time: "08:00 AM", taken: true },
  { id: "rem2", name: "Lipitor (Atorvastatin)", dosage: "10mg", frequency: "Once daily (Night)", time: "09:00 PM", taken: false },
  { id: "rem3", name: "Multi-Vitamin", dosage: "1 capsule", frequency: "Once daily (Morning)", time: "08:30 AM", taken: true },
  { id: "rem4", name: "Omega-3 Fish Oil", dosage: "1000mg", frequency: "Twice daily", time: "01:00 PM", taken: false },
  { id: "rem5", name: "Omega-3 Fish Oil", dosage: "1000mg", frequency: "Twice daily", time: "08:00 PM", taken: false }
];

export const mockEmergencyAlerts = [
  {
    id: "al1",
    title: "High Air Quality Alert (AQI: 168)",
    severity: "high",
    date: "June 05, 2026",
    description: "Outdoor air quality in your region has reached unhealthy levels due to ozone pollution. Individuals with asthma or heart conditions are advised to stay indoors and keep windows closed.",
    action: "Limit strenuous outdoor activities. Ensure inhaler/medication availability."
  },
  {
    id: "al2",
    title: "Local Influenza Surge Notice",
    severity: "medium",
    date: "June 01, 2026",
    description: "Health authorities report a 25% increase in influenza cases in county clinics. Free flu shots are available at our partner pharmacies this week.",
    action: "Wash hands frequently. Book a flu vaccine if not immunized."
  },
  {
    id: "al3",
    title: "Extreme Heat Warning",
    severity: "medium",
    date: "May 29, 2026",
    description: "Temperatures are expected to exceed 98°F (37°C) for three consecutive days. Risk of heat exhaustion and heatstroke is elevated.",
    action: "Stay hydrated. Avoid direct sun exposure between 11:00 AM and 04:00 PM."
  }
];

// Historical laboratory metric trends for graphics
export const mockReportTrends = [
  { month: "Jan", ldl: 152, glucose: 92, systolic: 138, hba1c: 5.6 },
  { month: "Feb", ldl: 146, glucose: 90, systolic: 134, hba1c: 5.5 },
  { month: "Mar", ldl: 141, glucose: 89, systolic: 129, hba1c: 5.5 },
  { month: "Apr", ldl: 138, glucose: 87, systolic: 124, hba1c: 5.4 },
  { month: "May", ldl: 134, glucose: 88, systolic: 122, hba1c: 5.4 }
];
