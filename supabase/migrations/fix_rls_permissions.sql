-- Fix RLS Permissions for Telehealth Platform
-- This script grants proper access to all tables for anon and authenticated roles

-- =============================================
-- USERS TABLE PERMISSIONS
-- =============================================

-- Grant basic permissions to anon role (for registration)
GRANT SELECT ON users TO anon;
GRANT INSERT ON users TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Create RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow new user registration (anon can insert)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- =============================================
-- PROVIDERS TABLE PERMISSIONS
-- =============================================

-- Grant permissions to providers table
GRANT SELECT ON providers TO anon;
GRANT SELECT ON providers TO authenticated;
GRANT INSERT ON providers TO authenticated;
GRANT UPDATE ON providers TO authenticated;

-- Create RLS policies for providers table
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view provider profiles
CREATE POLICY "Anyone can view providers" ON providers
    FOR SELECT USING (true);

-- Providers can update their own profile
CREATE POLICY "Providers can update own profile" ON providers
    FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated users can become providers
CREATE POLICY "Authenticated users can become providers" ON providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- APPOINTMENTS TABLE PERMISSIONS
-- =============================================

-- Grant permissions to appointments table
GRANT SELECT ON appointments TO authenticated;
GRANT INSERT ON appointments TO authenticated;
GRANT UPDATE ON appointments TO authenticated;

-- Create RLS policies for appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = patient_id);

-- Providers can view appointments for their patients
CREATE POLICY "Providers can view patient appointments" ON appointments
    FOR SELECT USING (auth.uid() = provider_id);

-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Providers can update appointment status
CREATE POLICY "Providers can update appointments" ON appointments
    FOR UPDATE USING (auth.uid() = provider_id);

-- =============================================
-- CONSULTATIONS TABLE PERMISSIONS
-- =============================================

-- Grant permissions to consultations table
GRANT SELECT ON consultations TO authenticated;
GRANT INSERT ON consultations TO authenticated;
GRANT UPDATE ON consultations TO authenticated;

-- Create RLS policies for consultations table
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Patients can view their own consultations
CREATE POLICY "Patients can view own consultations" ON consultations
    FOR SELECT USING (auth.uid() = patient_id);

-- Providers can view consultations with their patients
CREATE POLICY "Providers can view patient consultations" ON consultations
    FOR SELECT USING (auth.uid() = provider_id);

-- Providers can create consultation records
CREATE POLICY "Providers can create consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- =============================================
-- MEDICAL_RECORDS TABLE PERMISSIONS
-- =============================================

-- Grant permissions to medical_records table
GRANT SELECT ON medical_records TO authenticated;
GRANT INSERT ON medical_records TO authenticated;
GRANT UPDATE ON medical_records TO authenticated;

-- Create RLS policies for medical_records table
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Patients can view their own medical records
CREATE POLICY "Patients can view own records" ON medical_records
    FOR SELECT USING (auth.uid() = patient_id);

-- Providers can view patient medical records
CREATE POLICY "Providers can view patient records" ON medical_records
    FOR SELECT USING (auth.uid() = provider_id);

-- Providers can create medical records
CREATE POLICY "Providers can create medical records" ON medical_records
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- =============================================
-- MESSAGES TABLE PERMISSIONS
-- =============================================

-- Grant permissions to messages table
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;

-- Create RLS policies for messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- REVIEWS TABLE PERMISSIONS
-- =============================================

-- Grant permissions to reviews table
GRANT SELECT ON reviews TO authenticated;
GRANT INSERT ON reviews TO authenticated;

-- Create RLS policies for reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

-- Patients can create reviews for their providers
CREATE POLICY "Patients can review providers" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- =============================================
-- VERIFICATION CODES TABLE PERMISSIONS
-- =============================================

-- Grant permissions to verification_codes table
GRANT SELECT ON verification_codes TO authenticated;
GRANT INSERT ON verification_codes TO authenticated;
GRANT UPDATE ON verification_codes TO authenticated;

-- Create RLS policies for verification_codes table
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification codes
CREATE POLICY "Users can view own codes" ON verification_codes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create verification codes
CREATE POLICY "Users can create verification codes" ON verification_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- NOTIFICATIONS TABLE PERMISSIONS
-- =============================================

-- Grant permissions to notifications table
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;

-- Create RLS policies for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- VERIFICATION SUMMARY
-- =============================================

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;