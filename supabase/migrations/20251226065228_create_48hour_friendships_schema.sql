/*
  # 48-Hour Friendships Schema

  ## New Tables
  
  ### `users`
  - `id` (uuid, primary key) - Unique user identifier
  - `name` (text) - User's display name
  - `vibe` (text) - Conversation vibe preference
  - `interests` (text[]) - Array of selected interests
  - `communication_style` (text) - Communication style preference
  - `is_matched` (boolean) - Whether user is currently in an active match
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `matches`
  - `id` (uuid, primary key) - Unique match identifier
  - `user1_id` (uuid, foreign key) - First user in the match
  - `user2_id` (uuid, foreign key) - Second user in the match
  - `created_at` (timestamptz) - When the match was created
  - `expires_at` (timestamptz) - When the 48-hour period ends
  - `is_active` (boolean) - Whether the match is still active
  
  ### `messages`
  - `id` (uuid, primary key) - Unique message identifier
  - `match_id` (uuid, foreign key) - The match this message belongs to
  - `sender_id` (uuid, foreign key) - User who sent the message
  - `content` (text) - Message content
  - `created_at` (timestamptz) - When the message was sent
  
  ## Security
  - Enable RLS on all tables
  - Users can read their own profile
  - Users can update their own profile
  - Users can read matches they're part of
  - Users can read messages from their matches
  - Users can insert messages to their active matches
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vibe text NOT NULL,
  interests text[] NOT NULL,
  communication_style text NOT NULL,
  is_matched boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES users(id) NOT NULL,
  user2_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) NOT NULL,
  sender_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages from their matches"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their matches"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      AND matches.is_active = true
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_users_is_matched ON users(is_matched);