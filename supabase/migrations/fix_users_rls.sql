-- Quick Fix for Users Table RLS Registration Issue
-- This script specifically addresses the "new row violates row-level security policy" error

-- Step 1: Grant basic permissions to anon role for registration
GRANT SELECT ON users TO anon;
GRANT INSERT ON users TO anon;

-- Step 2: Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Step 3: Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create essential RLS policies for user registration and management

-- Allow anonymous users to register (create new user records)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to delete their own profile (optional)
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- Step 5: Verify permissions are set correctly
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Step 6: Check RLS policies on users table
SELECT polname, polcmd, polqual, polwithcheck
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY polname;