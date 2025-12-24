-- Create profiles table for Game View Studio
-- Run this in Supabase SQL Editor or via migrations

-- Create enum types for constrained fields
CREATE TYPE creator_type AS ENUM (
  'musician',
  'content_creator',
  'brand_agency',
  'sports_entertainment',
  'venue_events',
  'other'
);

CREATE TYPE experience_level AS ENUM (
  'new',
  'some_experience',
  'professional'
);

CREATE TYPE creation_goal AS ENUM (
  'fan_experiences',
  'virtual_tours',
  'treasure_hunts',
  'branded_content',
  'still_exploring'
);

CREATE TYPE footage_status AS ENUM (
  'have_footage',
  'no_footage',
  'need_guidance'
);

CREATE TYPE team_size AS ENUM (
  'solo',
  'small_team',
  'agency'
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clerkId" TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  "displayName" TEXT,

  -- Required onboarding fields
  "creatorType" creator_type NOT NULL,
  "experienceLevel" experience_level NOT NULL,
  "creationGoals" creation_goal[] NOT NULL DEFAULT '{}',
  "footageStatus" footage_status NOT NULL,

  -- Optional fields
  "socialLinks" JSONB DEFAULT '{}',
  "teamSize" team_size,
  "referralSource" TEXT,

  -- Metadata
  "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on clerkId for fast lookups
CREATE INDEX idx_profiles_clerk_id ON profiles("clerkId");

-- Create index on email
CREATE INDEX idx_profiles_email ON profiles(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile (via service role for API)
-- Note: Since we're using Clerk auth, we'll use service role key for all operations
-- and handle auth checks in the API layer

-- Allow service role full access
CREATE POLICY "Service role has full access" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- For direct client access (if needed later), users can read their own profile
-- This requires passing the Clerk user ID somehow - typically via a custom JWT claim
-- For now, we rely on the API with service role
