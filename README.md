# 🩺 Virtual Vaidya
> **Telehealth & AI-Powered Health Intelligence Platform**
> 
> *A unified, premium clinical ecosystem connecting patients and medical practitioners with instant AI report diagnostics, biometric trend lines, and secure video consultation rooms.*

---

## 👥 Hackathon Team (Team [Your Team Name])
Please fill in your team details below:

| Name | Role | GitHub / LinkedIn |

| :--- | :--- | :--- |
| **[Team Member 1 Name]** | Frontend Lead & UI Developer | [GitHub](https://github.com/) / [LinkedIn](https://linkedin.com/) |
| **[Team Member 2 Name]** | Backend Engineer & Database Architect | [GitHub](https://github.com/) / [LinkedIn](https://linkedin.com/) |
| **[Team Member 3 Name]** | AI & OCR Specialist | [GitHub](https://github.com/) / [LinkedIn](https://linkedin.com/) |
| **[Team Member 4 Name]** | Product Design & QA Engineer | [GitHub](https://github.com/) / [LinkedIn](https://linkedin.com/) |

---

## 💡 The Problem
Healthcare access remains highly fragmented:
1. **Uninterpretable Lab Reports:** Patients receive laboratory test sheets (PDFs/images) containing complex chemical abbreviations and numbers without clear context, leading to anxiety or missed warning signs.
2. **Disconnected Doctor Consultations:** Telehealth services often lack direct synchronization. Doctors consult on one app, prescribe on another, and patients must track their medical instructions manually.
3. **Information Silos:** Biometric charts, previous diagnostic panels, emergency advisories, and daily medication checklists rarely talk to each other.

---

## 🚀 Our Solution: Virtual Vaidya
**Virtual Vaidya** bridges the gap between patient diagnostics and professional medical care by building a double-sided portal (for Patients and Doctors) driven by AI analysis. 

### 1. For Patients:
* **Instant AI Report Scanning (OCR + LLM):** Drag and drop standard laboratory PDFs or image scans. The app parses the file, extracts medical metrics (such as Fasting Glucose, Cholesterol, BP), flags danger levels, and explains them in layman's terms.
* **Interactive Biometric Trends:** No external charting libraries that bloat the client. An inline, responsive, custom SVG graphing module plots blood sugar, lipid panels, and blood pressure trends over time.
* **Smart Care Regimen:** A synchronized daily checklist for upcoming medications, diet tips, and clinical treatments.
* **Practitioner Search & Scheduling:** Filter doctors by specialty, view availability slots, and book video/chat consultations.
* **Emergency Alert System:** Instant visual alerts for regional health hazards (such as air pollution or local virus outbreaks) with simulated SOS location broadcasts.

### 2. For Doctors:
* **Interactive Workspace:** View upcoming consultations, start instant video calls, and access connected patients' entire medical histories on a single panel.
* **Rx Prescribing & Diagnostic Portal:** Log medical findings and write prescriptions that auto-populate the patient's daily checklist in real-time.

---

## 🛠️ Technology Stack
* **Frontend:** React 19 (SPA), Vite 8, Vanilla CSS (designed for high-contrast accessibility), Lucide React (icons), Recharts / Custom SVGs.
* **Backend:** Python (Flask), PyPDF2 (PDF scraping), OpenAI API (structured GPT-4o-mini diagnostics).
* **Database & Auth:** Supabase (PostgreSQL client for real-time user session sync, profile configuration, and secure medical report storage).

---

## 📂 Project Architecture

```text
├── backend/                   # Python Flask Server
│   ├── main.py                # Main API endpoints (Upload, SOS, Reports query)
│   ├── requirements.txt       # Python dependencies
│   ├── services/              # Business logic helpers
│   │   ├── ocr_service.py     # PDF parser integration
│   │   ├── nlp_service.py     # LLM parsing pipeline
│   │   └── twilio_service.py  # Notification integrations
│   └── virtual_vaidya.db      # Local mock SQLite DB
│
├── src/                       # Frontend React Application
│   ├── components/            # Reusable UI widgets
│   │   ├── cards/             # Specialized widgets (Alerts, Reminders, Custom Charts)
│   │   ├── Navbar.jsx         # Header and notification drawer
│   │   ├── Sidebar.jsx        # Navigation sidebar for Patients & Doctors
│   │   └── Modal.jsx          # Overlay portals
│   ├── context/               # Global state contexts
│   │   ├── AuthContext.jsx    # Session management (Supabase / Guest credentials)
│   │   └── HealthContext.jsx  # Syncs medical records, reminders, and alerts
│   ├── pages/                 # Full Page Routes
│   │   ├── Home.jsx           # Landing page
│   │   ├── PatientAuth.jsx    # Patient login & sign up forms
│   │   ├── DoctorAuth.jsx     # Doctor registration portal
│   │   ├── PatientDashboard.jsx# Unified patient workspace
│   │   ├── DoctorDashboard.jsx# Attending physician desk
│   │   ├── PatientReports.jsx # Lab report upload & trends
│   │   ├── Consultation.jsx   # Telehealth video room
│   │   └── ProfileSettings.jsx# User settings
│   ├── styles/                # Styling variables and design system
│   │   └── global.css         # Typography, light/dark modes, premium glassmorphism variables
│   ├── App.jsx                # Router & Provider wrapper
│   └── main.jsx               # Entry mountpoint
```

---

## ⚙️ Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+)
* [Python 3.10+](https://www.python.org/)

---

### Step 1: Clone and Configure Environment

Create a `.env` file in the `backend/` directory:
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

Create a `.env` file in the root directory (for the React frontend):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### Step 2: Running the Backend (Python Flask API)

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend server:
   ```bash
   python main.py
   ```
   *The Flask API will run on [http://localhost:8000](http://localhost:8000).*

---

### Step 3: Running the Frontend (React + Vite)

1. Open a new terminal in the root directory:
   ```bash
   npm install
   ```
2. Launch the development server:
   ```bash
   npm run dev
   ```
   *The web application will open on [http://localhost:5173](http://localhost:5173).*

---

## 🔍 Hackathon Evaluation Points & Walkthrough
To evaluate our project, judges can follow this user flow:

1. **Quick Guest Login:**
   * Go to the login page and click **"Login as Guest"** for either the **Patient** or the **Doctor**.
2. **Uploading a Lab Report (AI Diagnostic Extraction):**
   * As a Patient, navigate to **Reports** and upload a lab sheet PDF (e.g. `sample_report.txt` in the root).
   * The backend triggers a structured GPT-4o-mini parser, returning parsed biometric values (such as Blood Sugar, Blood Pressure) and generating an easy-to-read health summary.
3. **Inspect Interactive Charts:**
   * View the biometric graph updates instantly in your profile after the report is saved. Hover over data nodes to inspect historical vitals.
4. **Trigger Doctor Appointment:**
   * Search for a practitioner, schedule a consultation slot, and enter the **Telehealth Room** for live chat/video simulations.
5. **Doctor Workspace Integration:**
   * Log in as a Doctor, click on the appointment to start the video session, write clinical treatment notes, and enter prescriptions.
   * Log back in as a Patient to see the prescribed medications automatically added to your daily compliance check-list!

---

## 🔮 Future Roadmap
* **Wearable Integration:** Direct sync with Apple HealthKit, Google Fit, and continuous glucose monitors (CGMs) for real-time alerts.
* **LLM Agent Diagnostics:** Advanced multi-agent diagnostics comparing new lab reports to five-year historical records for early detection of chronic diseases.
* **Encrypted Medical Sharing:** Decentralized, patient-controlled sharing of health records to third-party practitioners.
