-- Complete RLS Policy Fix for Telehealth Platform
-- This script drops existing policies and creates comprehensive ones

-- DROP EXISTING POLICIES (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.users;
DROP POLICY IF EXISTS "Providers can update own profile" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can view patient appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can update patient appointments" ON public.appointments;
DROP POLICY IF EXISTS "Providers can create consultations" ON public.consultations;
DROP POLICY IF EXISTS "Patients can view own consultations" ON public.consultations;
DROP POLICY IF EXISTS "Providers can view patient consultations" ON public.consultations;
DROP POLICY IF EXISTS "Providers can update consultations" ON public.consultations;

-- USERS TABLE POLICIES
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to view provider profiles (for appointments)
CREATE POLICY "Authenticated users can view providers" ON public.users
    FOR SELECT USING (role = 'provider' AND auth.role() = 'authenticated');

-- PROVIDERS TABLE POLICIES
-- Allow providers to update their own profile
CREATE POLICY "Providers can update own profile" ON public.providers
    FOR ALL USING (
        user_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    );

-- Allow authenticated users to view provider profiles
CREATE POLICY "Authenticated users can view providers" ON public.providers
    FOR SELECT USING (auth.role() = 'authenticated');

-- APPOINTMENTS TABLE POLICIES
-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        patient_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'patient')
    );

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments
    FOR SELECT USING (patient_id = auth.uid());

-- Providers can view appointments for their patients
CREATE POLICY "Providers can view patient appointments" ON public.appointments
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()) AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    );

-- Patients can update their own appointments (cancel/reschedule)
CREATE POLICY "Patients can update own appointments" ON public.appointments
    FOR UPDATE USING (patient_id = auth.uid());

-- Providers can update appointments for their patients
CREATE POLICY "Providers can update patient appointments" ON public.appointments
    FOR UPDATE USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()) AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    );

-- CONSULTATIONS TABLE POLICIES
-- Providers can create consultations
CREATE POLICY "Providers can create consultations" ON public.consultations
    FOR INSERT WITH CHECK (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()) AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    );

-- Patients can view their own consultations
CREATE POLICY "Patients can view own consultations" ON public.consultations
    FOR SELECT USING (patient_id = auth.uid());

-- Providers can view consultations for their patients
CREATE POLICY "Providers can view patient consultations" ON public.consultations
    FOR SELECT USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()) AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    );

-- Providers can update consultations
CREATE POLICY "Providers can update consultations" ON public.consultations
    FOR UPDATE USING (
        provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()) AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'provider')
    );

-- GRANT BASIC PERMISSIONS
-- Grant SELECT on all tables to anon and authenticated roles
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.providers TO anon, authenticated;
GRANT SELECT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.consultations TO anon, authenticated;

-- Grant INSERT, UPDATE, DELETE to authenticated users where policies allow
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.consultations TO authenticated;

-- CREATE FUNCTION TO HANDLE USER REGISTRATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', 'New User'), 'patient');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER FOR NEW USER REGISTRATION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();