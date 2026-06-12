-- Migration: 20260612000001_add_doctor_profiles_policy.sql
-- Purpose: Allow anyone (including patients and guest users) to read doctor profiles so the patient portal can display accurate names and locations from the profiles table.

CREATE POLICY "Anyone can view doctor profiles"
    ON public.profiles FOR SELECT
    USING (role = 'doctor');
