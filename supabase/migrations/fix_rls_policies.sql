-- Fix RLS Policies for Telehealth Platform
-- This script grants proper access to tables for authentication to work

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