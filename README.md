# Virtual Vaidya 🩺
**A Next-Generation Telehealth & Healthcare Intelligence Platform**

Virtual Vaidya is a comprehensive, responsive, and highly secure telemedicine platform designed to bridge the gap between patients and medical practitioners. Built with a premium, minimalist UI and robust architecture, the platform offers seamless appointment booking, real-time video consultations, health trend analytics, and intelligent report management.

![Virtual Vaidya Concept](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200)

---

## 🌟 Key Features

### For Patients
- **Unified Authentication:** Seamless single-form sign-up and login powered by Supabase Auth.
- **Smart Dashboard:** Track upcoming appointments, health trends, and real-time alerts.
- **Find Specialists:** Browse a directory of verified doctors, filter by specialty, and book consultation slots instantly.
- **Live Telehealth:** Secure, browser-based WebRTC video and chat rooms for virtual consultations.
- **Health Analytics:** Visual charts tracking vital signs (Glucose, Blood Pressure, Cholesterol).
- **Report Management:** Upload and manage lab reports and prescriptions securely.

### For Clinical Doctors
- **Doctor Workspace:** A dedicated portal to manage daily schedules and patient queues.
- **Patient Directory:** Access comprehensive medical histories and past consultation logs of assigned patients.
- **Virtual Clinic:** Initiate secure video calls with scheduled patients directly from the dashboard.
- **Prescription Console:** Log clinical findings and manage patient prescriptions digitally.

---

## 🛠️ Technology Stack

- **Frontend Framework:** React.js (Bootstrapped with Vite for high-speed HMR)
- **Routing:** React Router v6 (SPA Navigation)
- **Styling:** Custom CSS3 with Premium Glassmorphism UI tokens, Lucide-React Icons
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security)
- **Authentication:** Supabase Auth (JWT-based secure sessions)
- **Real-Time Video/Audio:** PeerJS (WebRTC protocol for P2P connection)
- **Deployment & CI/CD:** Vercel

---

## 👥 Meet the Team

This project was built and architected by a dedicated team of developers and visionaries:

- **Shaket Raj** — *Team Leader & Full Stack Developer*
- **Shreya Pardhi** — *Core Contributor & UI/UX*
- **Shubh Sahu** — *Core Contributor & Integration*
- **Siddharth Saurabh** — *Core Contributor & Architecture*

---

## 🚀 Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shaketraj156-ops/med-tech.git
   cd med-tech
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

*Built with ❤️ for a healthier tomorrow.*
