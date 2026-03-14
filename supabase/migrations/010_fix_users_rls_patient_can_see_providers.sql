-- ============================================================
-- Migration 010: Allow patients to view provider user profiles
-- Root cause: migration 009 policy only allowed providers/admins
-- to read other users' records, so patients couldn't see
-- provider names (breaking Find Doctors and Messages pages).
-- Fix: also allow reading rows where role = 'provider' (no join,
-- reads from the row itself — zero recursion risk).
-- ============================================================

DROP POLICY IF EXISTS "Users can view profiles" ON users;

CREATE POLICY "Users can view profiles" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR role = 'provider'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'provider'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
