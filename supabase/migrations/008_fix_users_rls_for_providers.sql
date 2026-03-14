-- ============================================================
-- Migration 008: Fix users RLS so providers can read patient profiles
-- Uses JWT user_metadata to avoid infinite recursion
-- Run this in the Supabase SQL Editor
-- ============================================================

DROP POLICY IF EXISTS "Providers can view patient profiles" ON users;

-- Use JWT metadata (set at signup) — no table lookup, no recursion
CREATE POLICY "Providers can view patient profiles" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'provider'
  );
