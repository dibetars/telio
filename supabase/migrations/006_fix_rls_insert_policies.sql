-- Allow newly registered users to insert their own profile row.
-- auth.uid() matches the id they pass in (set explicitly from data.user.id).
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow providers to insert their own provider record during registration.
CREATE POLICY "Providers can insert their own record"
  ON providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);
