/*
  # Flora AI Study Platform - Initial Schema

  ## Overview
  Creates the core database schema for the Flora platform including:
  
  1. New Tables
    - `profiles` - User profile data linked to auth.users
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
    
    - `study_sessions` - Individual study sessions per user
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `mode` (text) - One of: explain, quiz, review, flashcard
      - `topic` (text) - Session topic/title
      - `messages` (jsonb) - Array of chat messages
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `usage_tracking` - Tracks session count per user per month
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `month_year` (text) - Format: YYYY-MM
      - `session_count` (integer) - Number of sessions created this month
      - UNIQUE constraint on (user_id, month_year)

  2. Security
    - RLS enabled on all tables
    - Users can only read/write their own data
    - Profiles auto-created on user signup via trigger

  3. Notes
    - Free tier limited to 20 sessions per month (enforced in app)
    - Messages stored as JSONB for flexibility
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'explain',
  topic text DEFAULT '',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can view own sessions') THEN
    CREATE POLICY "Users can view own sessions" ON study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can insert own sessions') THEN
    CREATE POLICY "Users can insert own sessions" ON study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can update own sessions') THEN
    CREATE POLICY "Users can update own sessions" ON study_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'study_sessions' AND policyname = 'Users can delete own sessions') THEN
    CREATE POLICY "Users can delete own sessions" ON study_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  session_count integer DEFAULT 0,
  UNIQUE(user_id, month_year)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_tracking' AND policyname = 'Users can view own usage') THEN
    CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_tracking' AND policyname = 'Users can insert own usage') THEN
    CREATE POLICY "Users can insert own usage" ON usage_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_tracking' AND policyname = 'Users can update own usage') THEN
    CREATE POLICY "Users can update own usage" ON usage_tracking FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month_year);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
