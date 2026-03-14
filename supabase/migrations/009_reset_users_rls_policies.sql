-- ============================================================
-- Migration 009: Reset ALL users table RLS policies
-- Drops every known SELECT policy on users and recreates
-- a single safe policy using JWT metadata only (no table joins).
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Drop ALL known SELECT policies on the users table (all naming variants)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Providers can view patient profiles" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view providers" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;

-- Create a single unified SELECT policy — no table lookups, no recursion
CREATE POLICY "Users can view profiles" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'provider'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
