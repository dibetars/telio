# 🚨 CRITICAL: Database Setup Required

The "false positives" you are seeing are because the application was assuming the database users existed when they didn't. I have updated the code to stop doing that.

**To fix the "Users don't exist" error, you MUST run the following SQL script in your Supabase Dashboard.**

I cannot run this for you because I do not have direct access to your database console.

## Step 1: Open Supabase SQL Editor
1. Go to your Supabase Project Dashboard.
2. Click on the **SQL Editor** icon (on the left sidebar).
3. Click **New Query**.

## Step 2: Copy and Paste this Script
Copy the entire block below and paste it into the SQL Editor:

```sql
-- SQL Script to Create Sample Users for Telio Health Platform
-- Run this in your Supabase SQL Editor

-- Step 1: Clean up any existing test users (optional)
DELETE FROM auth.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');
DELETE FROM public.users WHERE email IN ('patient@test.com', 'provider@test.com', 'admin@test.com');
DELETE FROM public.providers WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'provider@test.com'
);

-- Step 2: Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 3: Create Patient User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'patient@test.com',
  crypt('TestPatient123!', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "John Patient", "role": "patient"}',
  false,
  NOW(),
  NOW()
);

-- Step 4: Create Provider User  
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'provider@test.com',
  crypt('TestProvider123!', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Dr. Sarah Provider", "role": "provider"}',
  false,
  NOW(),
  NOW()
);

-- Step 5: Create Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('TestAdmin123!', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User", "role": "admin"}',
  true,
  NOW(),
  NOW()
);

-- Step 6: Create User Profiles in public.users table
INSERT INTO public.users (id, email, name, role, phone, created_at, updated_at) VALUES
  ((SELECT id FROM auth.users WHERE email = 'patient@test.com'), 'patient@test.com', 'John Patient', 'patient', '+1-555-0123', NOW(), NOW()),
  ((SELECT id FROM auth.users WHERE email = 'provider@test.com'), 'provider@test.com', 'Dr. Sarah Provider', 'provider', '+1-555-0124', NOW(), NOW()),
  ((SELECT id FROM auth.users WHERE email = 'admin@test.com'), 'admin@test.com', 'Admin User', 'admin', '+1-555-0125', NOW(), NOW());

-- Step 7: Create Provider Profile
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

-- Step 8: Create Sample Appointment
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

-- Step 9: Verify the users were created
SELECT 
  u.email,
  u.raw_user_meta_data->>'name' as name,
  u.raw_user_meta_data->>'role' as role,
  us.name as profile_name,
  us.role as profile_role
FROM auth.users u
LEFT JOIN public.users us ON u.id = us.id
WHERE u.email IN ('patient@test.com', 'provider@test.com', 'admin@test.com')
ORDER BY u.email;
```

## Step 3: Run the Script
Click the **Run** button (bottom right of the editor).

## Step 4: Test Login
Go back to your application and try to login with:
- **Patient**: `patient@test.com` / `TestPatient123!`
- **Provider**: `provider@test.com` / `TestProvider123!`
