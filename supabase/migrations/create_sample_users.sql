-- Create Sample Users for Testing
-- This script creates test users for the telehealth platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create Patient User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'patient@test.com',
  crypt('TestPatient123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "John Patient", "role": "patient"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
);

-- Create Provider User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'provider@test.com',
  crypt('TestProvider123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Dr. Sarah Provider", "role": "provider"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
);

-- Create Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('TestAdmin123!', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User", "role": "admin"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
);

-- Create User Profiles in public.users table
INSERT INTO public.users (id, email, name, role, phone, medical_history, created_at, updated_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name',
  raw_user_meta_data->>'role',
  CASE 
    WHEN email = 'provider@test.com' THEN '+1-555-0123'
    ELSE '+1-555-0124'
  END,
  '{}',
  created_at,
  updated_at
FROM auth.users 
WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');

-- Create Provider Profile
INSERT INTO public.providers (
  user_id,
  specialty,
  license_number,
  years_of_experience,
  education,
  bio,
  consultation_fee,
  is_verified,
  availability,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'provider@test.com'),
  'General Practice',
  'MD-2024-001',
  10,
  'MD - Harvard Medical School',
  'Experienced general practitioner with 10+ years in family medicine.',
  150.00,
  true,
  '{"monday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "tuesday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "wednesday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "thursday": ["09:00", "10:00", "11:00", "14:00", "15:00"], "friday": ["09:00", "10:00", "11:00", "14:00", "15:00"]}',
  NOW(),
  NOW()
);

-- Create Sample Appointment
INSERT INTO public.appointments (
  patient_id,
  provider_id,
  appointment_date,
  appointment_time,
  duration_minutes,
  status,
  appointment_type,
  notes,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'patient@test.com'),
  (SELECT id FROM auth.users WHERE email = 'provider@test.com'),
  CURRENT_DATE + INTERVAL '1 day',
  '10:00:00',
  30,
  'scheduled',
  'video',
  'Initial consultation',
  NOW(),
  NOW()
);

-- Grant necessary permissions
GRANT ALL ON auth.users TO anon;
GRANT ALL ON auth.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.providers TO anon;
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.appointments TO anon;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.consultations TO anon;
GRANT ALL ON public.consultations TO authenticated;