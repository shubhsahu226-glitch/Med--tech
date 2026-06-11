-- Migration: 20260612000000_final_normalization.sql
-- Purpose: Remove redundant data, add explicit patient-doctor connections.

-- ============================================================
-- 1. CREATE PATIENT-DOCTOR CONNECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.patient_doctor_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(patient_id, doctor_id)
);

-- ============================================================
-- 2. ALTER APPOINTMENTS TABLE
-- ============================================================
-- Drop redundant name columns
ALTER TABLE public.appointments DROP COLUMN IF EXISTS patient_name;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS doctor_name;

-- Ensure doctor_id is UUID (patient_id is already UUID)
-- ============================================================
-- 1. PRE-REQUISITE: DROP CONSTRAINTS AND POLICIES
-- ============================================================
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE public.treatments DROP CONSTRAINT IF EXISTS treatments_doctor_id_fkey;
ALTER TABLE public.treatments DROP CONSTRAINT IF EXISTS treatments_patient_id_fkey;

DROP POLICY IF EXISTS "Doctors can update own record" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can insert own record" ON public.doctors;

-- Drop old implicit appointment-based policies that depend on doctor_id/patient_id types
DROP POLICY IF EXISTS "Doctors can read connected patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can read connected patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can read connected patient reports" ON public.reports;
DROP POLICY IF EXISTS "Doctors can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Doctors can read connected patient alerts" ON public.alerts;

-- ============================================================
-- 1.5. TYPE CASTING (Convert TEXT IDs to UUID)
-- ============================================================
ALTER TABLE public.doctors ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE public.appointments ALTER COLUMN doctor_id TYPE UUID USING doctor_id::uuid;

ALTER TABLE public.appointments ALTER COLUMN doctor_id TYPE UUID USING doctor_id::uuid;

-- Add Foreign Keys
ALTER TABLE public.appointments
    ADD CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

-- Add foreign key from doctors to profiles
ALTER TABLE public.doctors
    ADD CONSTRAINT fk_doctors_profile FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Recreate policies for doctors
CREATE POLICY "Doctors can update own record"
    ON public.doctors FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Doctors can insert own record"
    ON public.doctors FOR INSERT
    WITH CHECK (id = auth.uid());


-- ============================================================
-- 3. ALTER TREATMENTS TABLE
-- ============================================================
-- Drop redundant doctor_name
ALTER TABLE public.treatments DROP COLUMN IF EXISTS doctor_name;

-- Add appointment_id
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Ensure IDs are UUIDs
ALTER TABLE public.treatments ALTER COLUMN patient_id TYPE UUID USING patient_id::uuid;
ALTER TABLE public.treatments ALTER COLUMN doctor_id TYPE UUID USING doctor_id::uuid;

-- Add Foreign Keys
ALTER TABLE public.treatments
    ADD CONSTRAINT fk_treatments_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_treatments_doctor FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

-- ============================================================
-- 4. UPDATE RLS POLICIES FOR EXPLICIT ACCESS
-- ============================================================

-- Create new explicit connection-based policies
CREATE POLICY "Doctors can read connected patient profiles"
    ON public.profiles FOR SELECT
    USING (
        id IN (
            SELECT patient_id FROM public.patient_doctor_connections
            WHERE doctor_id = auth.uid() AND status = 'Active'
        )
    );

CREATE POLICY "Doctors can read connected patients"
    ON public.patients FOR SELECT
    USING (
        id IN (
            SELECT patient_id FROM public.patient_doctor_connections
            WHERE doctor_id = auth.uid() AND status = 'Active'
        )
    );

CREATE POLICY "Doctors can read connected patient reports"
    ON public.reports FOR SELECT
    USING (
        patient_id::uuid IN (
            SELECT patient_id FROM public.patient_doctor_connections
            WHERE doctor_id = auth.uid() AND status = 'Active'
        )
    );

CREATE POLICY "Doctors can read connected patient alerts"
    ON public.alerts FOR SELECT
    USING (
        patient_id::uuid IN (
            SELECT patient_id FROM public.patient_doctor_connections
            WHERE doctor_id = auth.uid() AND status = 'Active'
        )
    );

CREATE POLICY "Doctors can update connected patient alerts"
    ON public.alerts FOR UPDATE
    USING (
        patient_id::uuid IN (
            SELECT patient_id FROM public.patient_doctor_connections
            WHERE doctor_id = auth.uid() AND status = 'Active'
        )
    );

-- Also enable RLS on the new table
ALTER TABLE public.patient_doctor_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own connections"
    ON public.patient_doctor_connections FOR SELECT
    USING (patient_id = auth.uid());

CREATE POLICY "Patients can insert own connections"
    ON public.patient_doctor_connections FOR INSERT
    WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own connections"
    ON public.patient_doctor_connections FOR UPDATE
    USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view own connections"
    ON public.patient_doctor_connections FOR SELECT
    USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can insert own connections"
    ON public.patient_doctor_connections FOR INSERT
    WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update own connections"
    ON public.patient_doctor_connections FOR UPDATE
    USING (doctor_id = auth.uid());
