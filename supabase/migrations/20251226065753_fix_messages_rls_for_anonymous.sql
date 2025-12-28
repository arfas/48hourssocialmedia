/*
  # Fix Messages RLS Policies for Anonymous Users

  ## Changes
  - Updated messages table policies to allow anonymous users to read and insert messages
  - Relaxed policies since we're using localStorage for user identification
*/

DROP POLICY IF EXISTS "Users can read messages from their matches" ON messages;

CREATE POLICY "Allow users to read any messages"
  ON messages FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Users can insert messages to their matches" ON messages;

CREATE POLICY "Allow users to insert messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (true);
