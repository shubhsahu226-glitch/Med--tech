-- Migration: 20260611000000_fix_schema_and_add_missing_tables.sql
-- Purpose: Fix schema mismatches, add missing tables, add role column,
--          enable RLS, and add performance indexes.
-- This migration is fully idempotent and preserves all existing data.

-- ============================================================
-- 1. ADD ROLE COLUMN TO PROFILES (Primary fix for login routing bug)
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'patient';

-- Back-fill: mark existing doctors so they route correctly on login
UPDATE public.profiles SET role = 'doctor'
WHERE id IN (SELECT id::uuid FROM public.doctors WHERE id IS NOT NULL)
  AND (role IS NULL OR role = 'patient');

-- ============================================================
-- 2. CREATE PATIENTS TABLE (separate from doctors)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_type TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Back-fill patients: any profile that is NOT a doctor gets a patients row
INSERT INTO public.patients (id)
SELECT p.id FROM public.profiles p
LEFT JOIN public.doctors d ON d.id::text = p.id::text
WHERE d.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. NORMALIZE DOCTORS TABLE — add migration-expected columns
-- ============================================================
-- Add columns that the migration file defined but the live DB lacks
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Back-fill from existing columns so no data is lost
UPDATE public.doctors SET specialization = specialty WHERE specialization IS NULL AND specialty IS NOT NULL;
UPDATE public.doctors SET hospital = location WHERE hospital IS NULL AND location IS NOT NULL;
UPDATE public.doctors SET reviews_count = reviews WHERE reviews_count IS NULL OR reviews_count = 0;

-- ============================================================
-- 4. CREATE TREATMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    doctor_id TEXT,
    doctor_name TEXT,
    diagnosis TEXT,
    notes TEXT,
    prescription TEXT,
    follow_up_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- 5. CREATE ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,  -- High, Medium, Low
    description TEXT,
    status TEXT DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- 6. CREATE REPORT_SECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,  -- Blood, Sugar, Lipid, Kidney, Other
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- 7. CREATE REPORT_PARAMETERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES public.report_sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    status TEXT,  -- Normal, High, Low, Abnormal
    reference_range_min NUMERIC,
    reference_range_max NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- 8. CREATE PARAMETER_HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parameter_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    status TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- 9. CREATE REPORT_FILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    ocr_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================
-- 10. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_patients_id ON public.patients(id);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON public.reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_report_sections_report ON public.report_sections(report_id);
CREATE INDEX IF NOT EXISTS idx_report_params_section ON public.report_parameters(section_id);
CREATE INDEX IF NOT EXISTS idx_param_history_patient_name ON public.parameter_history(patient_id, parameter_name);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON public.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON public.treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_doctor ON public.treatments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_report_files_report ON public.report_files(report_id);

-- ============================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. RLS POLICIES
-- ============================================================

-- profiles: users can read/update their own profile; doctors can read patient profiles
CREATE POLICY IF NOT EXISTS "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Doctors can read connected patient profiles"
    ON public.profiles FOR SELECT
    USING (
        id IN (
            SELECT DISTINCT patient_id::uuid FROM public.appointments
            WHERE doctor_id = auth.uid()::text
        )
    );

-- doctors: publicly readable (for patient directory browsing), self-writable
CREATE POLICY IF NOT EXISTS "Anyone can read doctors"
    ON public.doctors FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "Doctors can update own record"
    ON public.doctors FOR UPDATE
    USING (id::text = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Doctors can insert own record"
    ON public.doctors FOR INSERT
    WITH CHECK (id::text = auth.uid()::text);

-- patients: self read/write, doctors can read connected patients
CREATE POLICY IF NOT EXISTS "Patients can read own record"
    ON public.patients FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Patients can update own record"
    ON public.patients FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Patients can insert own record"
    ON public.patients FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Doctors can read connected patients"
    ON public.patients FOR SELECT
    USING (
        id IN (
            SELECT DISTINCT patient_id::uuid FROM public.appointments
            WHERE doctor_id = auth.uid()::text
        )
    );

-- reports: patients can read/write own reports
CREATE POLICY IF NOT EXISTS "Users can read own reports"
    ON public.reports FOR SELECT
    USING (patient_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can insert own reports"
    ON public.reports FOR INSERT
    WITH CHECK (patient_id = auth.uid()::text OR patient_id = 'guest');

CREATE POLICY IF NOT EXISTS "Doctors can read connected patient reports"
    ON public.reports FOR SELECT
    USING (
        patient_id IN (
            SELECT DISTINCT patient_id FROM public.appointments
            WHERE doctor_id = auth.uid()::text
        )
    );

-- treatments: doctors can insert, patients/doctors can read
CREATE POLICY IF NOT EXISTS "Patients can read own treatments"
    ON public.treatments FOR SELECT
    USING (patient_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Doctors can read connected patient treatments"
    ON public.treatments FOR SELECT
    USING (doctor_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Doctors can insert treatments"
    ON public.treatments FOR INSERT
    WITH CHECK (doctor_id = auth.uid()::text);

-- alerts: patients can read own, doctors can read/insert/update for connected patients
CREATE POLICY IF NOT EXISTS "Patients can read own alerts"
    ON public.alerts FOR SELECT
    USING (patient_id = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Doctors can read connected patient alerts"
    ON public.alerts FOR SELECT
    USING (
        patient_id IN (
            SELECT DISTINCT patient_id FROM public.appointments
            WHERE doctor_id = auth.uid()::text
        )
    );

CREATE POLICY IF NOT EXISTS "Anyone can insert alerts"
    ON public.alerts FOR INSERT
    WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Doctors can update alerts"
    ON public.alerts FOR UPDATE
    USING (
        patient_id IN (
            SELECT DISTINCT patient_id FROM public.appointments
            WHERE doctor_id = auth.uid()::text
        )
    );
