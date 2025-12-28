/*
  # Fix Matches RLS Policies for Anonymous Users

  ## Changes
  - Updated matches table policies to allow anonymous users to insert and update matches
  - This allows the matching system to work for non-authenticated users
*/

DROP POLICY IF EXISTS "System can insert matches" ON matches;

CREATE POLICY "Allow system to insert matches"
  ON matches FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own matches" ON matches;

CREATE POLICY "Allow users to read any matches"
  ON matches FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Users can update own matches" ON matches;

CREATE POLICY "Allow users to update any matches"
  ON matches FOR UPDATE
  TO anon
  WITH CHECK (true);
