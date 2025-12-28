/*
  # Fix RLS Policies for Anonymous Users

  ## Changes
  - Updated users table INSERT policy to allow anonymous users to create profiles
  - This is safe since we're only storing non-sensitive onboarding data
  - User identification is handled via localStorage, not authentication
*/

DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Allow anonymous users to create profiles"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);
