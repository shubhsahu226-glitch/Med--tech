-- Migration: 20260610000000_create_report_analyzer_schema.sql
-- Create report analyzer tables and relationships

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile_number TEXT,
    location TEXT,
    dob DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_type TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialization TEXT,
    license_number TEXT,
    hospital TEXT,
    slots JSONB DEFAULT '[]'::jsonb,
    availability JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL, -- Can be UUID from profiles or 'guest'
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Reviewed' NOT NULL,
    ai_summary TEXT,
    metrics_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Report Files Table
CREATE TABLE IF NOT EXISTS public.report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase storage
    file_size INTEGER,
    content_type TEXT,
    ocr_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Report Sections Table
CREATE TABLE IF NOT EXISTS public.report_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL, -- Blood, Sugar, Lipid, Kidney, Other
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Report Parameters Table
CREATE TABLE IF NOT EXISTS public.report_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.report_sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    status TEXT, -- Normal, High, Low, Abnormal
    reference_range_min NUMERIC,
    reference_range_max NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Parameter History Table
CREATE TABLE IF NOT EXISTS public.parameter_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    status TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL, -- High, Medium, Low
    description TEXT,
    status TEXT DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    doctor_id TEXT,
    patient_name TEXT,
    doctor_name TEXT,
    date TEXT,
    time TEXT,
    reason TEXT,
    status TEXT DEFAULT 'Upcoming' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Treatments Table
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    doctor_id TEXT,
    doctor_name TEXT,
    diagnosis TEXT,
    notes TEXT,
    prescription TEXT,
    follow_up_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_reports_patient ON public.reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_report ON public.report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_params_section ON public.report_parameters(section_id);
CREATE INDEX IF NOT EXISTS idx_param_history_patient_name ON public.parameter_history(patient_id, parameter_name);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON public.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON public.treatments(patient_id);
