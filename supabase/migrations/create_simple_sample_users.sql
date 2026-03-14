-- ROBUST USER CREATION SCRIPT
-- This script handles existing Triggers and Foreign Key constraints safely.

-- Step 1: Safe Cleanup (Delete children first to avoid Foreign Key errors)
-- 1a. Delete appointments for these test users
DELETE FROM public.appointments 
WHERE patient_id IN (SELECT id FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com'))
   OR provider_id IN (SELECT id FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com'));

-- 1b. Delete provider profiles
DELETE FROM public.providers 
WHERE user_id IN (SELECT id FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com'));

-- 1c. Delete public users
DELETE FROM public.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');

-- 1d. Delete auth users (Finally)
DELETE FROM auth.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');

-- Step 2: Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 3: Create Auth Users
-- We store the IDs in variables or just use subqueries later. 
-- Here we insert them. If they somehow exist (shouldn't after delete), we do nothing.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES 
-- Patient
(
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'patient@test.com', crypt('TestPatient123!', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{"name": "John Patient", "role": "patient"}', false, NOW(), NOW()
),
-- Provider
(
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'provider@test.com', crypt('TestProvider123!', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{"name": "Dr. Sarah Provider", "role": "provider"}', false, NOW(), NOW()
),
-- Admin
(
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
  'admin@test.com', crypt('TestAdmin123!', gen_salt('bf')), NOW(), 
  '{"provider": "email", "providers": ["email"]}', '{"name": "Admin User", "role": "admin"}', true, NOW(), NOW()
);

-- Step 4: Upsert Public Users (Handles "Trigger already created this" case)
-- We use ON CONFLICT DO UPDATE to ensure the data is correct even if a trigger created the row.
INSERT INTO public.users (id, email, name, role, phone, created_at, updated_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name', 
  raw_user_meta_data->>'role', 
  CASE WHEN email = 'patient@test.com' THEN '+1-555-0123' 
       WHEN email = 'provider@test.com' THEN '+1-555-0124' 
       ELSE '+1-555-0125' END,
  NOW(), 
  NOW()
FROM auth.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Step 5: Upsert Provider Profile
INSERT INTO public.providers (
  user_id, specialty, license_number, years_of_experience, education, bio, 
  consultation_fee, is_verified, availability, created_at, updated_at
)
SELECT 
  id, 
  'General Practice', 'MD-2024-001', 10, 'MD - Harvard Medical School', 
  'Experienced general practitioner with 10+ years in family medicine.', 
  150.00, true, 
  '{"monday": ["09:00", "10:00"], "tuesday": ["09:00", "10:00"]}'::jsonb, 
  NOW(), NOW()
FROM auth.users 
WHERE email = 'provider@test.com'
ON CONFLICT (user_id) DO UPDATE SET
  specialty = EXCLUDED.specialty,
  is_verified = true;

-- Step 6: Create Sample Appointment
INSERT INTO public.appointments (
  patient_id, provider_id, appointment_date, appointment_time, duration_minutes, 
  status, appointment_type, notes, created_at, updated_at
)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'patient@test.com'),
  (SELECT id FROM auth.users WHERE email = 'provider@test.com'),
  CURRENT_DATE + INTERVAL '1 day', '10:00:00', 30, 'scheduled', 'video', 
  'Initial consultation', NOW(), NOW()
-- We can't easily do ON CONFLICT here without a known ID, but since we deleted appointments in Step 1, this should be fine.
;

-- Step 7: Verify
SELECT email, role FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');