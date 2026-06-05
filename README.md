# MedTech AI - Telehealth & Health Intelligence Platform

MedTech AI is a complete, premium, responsive React-based frontend designed to connect patients and clinical doctors through AI-driven insights. Built with a clean, high-contrast, minimalistic white aesthetic, this dashboard platform prioritizes readability, data accessibility, and clear medical hierarchy.

## Key Features

### For Patients
- **AI Report Upload & Processing:** Drag and drop laboratory sheets (PDFs, images) to trigger simulated OCR diagnostic scans.
- **Biometric Trend Charts:** View interactive SVG graphs tracking Fasting Glucose, Cholesterol, and Blood Pressure history with node-by-node inspection logs.
- **Consultation Scheduler:** Search specialized medical practitioners by department and book consultation slots.
- **Integrated Reminders:** A daily medication checklist synchronized with prescriptions written by attending physicians.
- **Emergency Notifications:** Banners reflecting pollution hazards, influenza notices, and local clinic advisories.

### For Clinical Doctors
- **Interactive Schedule:** Check calendars and start telehealth video/chat consultations with a single click.
- **Patient Directory:** View connected patients, expand clinical profiles, and inspect historical trend files.
- **Prescription & Diagnostic Console:** Log findings, write Rx prescriptions (which auto-populate in patient checklists), and schedule follow-ups.

---

## Folder Structure

Our codebase strictly adheres to the requested folder architecture:

```text
src/
├── components/          # Reusable UI widgets
│   ├── CardComponents.jsx # Features, Doctors, Reminders, and Custom SVG Graphs
│   ├── Navbar.jsx         # Header & notification drawer
│   ├── Sidebar.jsx        # Navigation drawers for Doctor/Patient
│   └── Modal.jsx          # Overlay portals
├── context/             # Dynamic global state handlers
│   ├── AuthContext.jsx    # User session, login, and profile updates
│   └── HealthContext.jsx  # Mock DB updates (appointments, reports, reminders)
├── data/                # Initial seed data
│   └── mockData.js        # Doctor credentials, medical logs, and laboratory ranges
├── pages/               # Full screen routes
│   ├── Home.jsx           # Landing page
│   ├── PatientAuth.jsx    # Patient login & sign up forms
│   ├── DoctorAuth.jsx     # Doctor registration & clinical details
│   ├── PatientDashboard.jsx # Patient home overview
│   ├── DoctorDashboard.jsx  # Doctor workspace
│   ├── ReportUpload.jsx   # OCR loading simulator
│   ├── ReportAnalysis.jsx # AI Diagnostic summaries
│   ├── MedicalHistory.jsx # Clinical timelines
│   ├── DoctorSearch.jsx   # Practitioner filter searches
│   ├── AppointmentBooking.jsx # Scheduling calendars
│   ├── Consultation.jsx   # Telehealth video & chat room
│   ├── MedicationReminder.jsx # Daily medication tracking
│   ├── EmergencyAlerts.jsx # Weather alerts & clinic warning trigger simulations
│   └── ProfileSettings.jsx # Profile updates
├── styles/              # Design tokens and custom stylesheets
│   └── global.css         # Premium spacing, minimalistic layout cards, and layout variables
├── App.jsx              # Main routing hub
└── main.jsx             # DOM mounting coordinates
```

---

## How to Run & Build

Ensure you have [Node.js](https://nodejs.org/) installed (v20+ recommended).

### 1. Installation
To install project dependencies (including `react-router-dom` and `lucide-react`):
```bash
npm install
```

### 2. Development Server
To launch the hot-reloading development server locally:
```bash
npm run dev
```
By default, the application will mount on [http://localhost:5173](http://localhost:5173).

### 3. Production Build
To verify the React compiler output and bundle static files for deployment:
```bash
npm run build
```

---

## Technical Details

- **Custom SVG Charting:** Our biometric trend lines are generated entirely with inline SVG math. This ensures maximum responsiveness and guarantees that builds will never fail due to node-canvas or library version mismatches.
- **Dynamic Session Cache:** The authentication session and settings forms sync with your browser's `localStorage` in real-time, preserving newly uploaded reports and booking slots across tab reloads.
