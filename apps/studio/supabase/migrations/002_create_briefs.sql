-- Create briefs table for Game View Studio
-- Stores project briefs created through Spark conversations

-- Create enum types for brief fields
CREATE TYPE experience_type AS ENUM (
  'treasure_hunt',
  'virtual_tour',
  'interactive_story',
  'competition',
  'brand_experience'
);

CREATE TYPE brief_status AS ENUM (
  'draft',
  'in_progress',
  'ready',
  'archived'
);

CREATE TYPE difficulty_level AS ENUM (
  'easy',
  'medium',
  'hard',
  'progressive'
);

CREATE TYPE player_mode AS ENUM (
  'single',
  'multiplayer',
  'competitive'
);

CREATE TYPE content_status AS ENUM (
  'has_content',
  'needs_capture',
  'needs_guidance'
);

-- Create briefs table
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL, -- Clerk user ID

  -- Basic Info
  name TEXT,
  tagline TEXT,
  "experienceType" experience_type,

  -- Overview
  concept TEXT,
  "targetAudience" TEXT,
  duration TEXT,
  difficulty difficulty_level,
  "playerMode" player_mode,

  -- Setting & Story
  setting TEXT,
  narrative TEXT,

  -- Interactive Elements
  "interactiveElements" TEXT[] DEFAULT '{}',
  collectibles TEXT,
  "winCondition" TEXT,

  -- Content & Technical
  "contentStatus" content_status,
  "contentDescription" TEXT,
  "estimatedScenes" INTEGER,

  -- Progress tracking
  completeness INTEGER DEFAULT 0 CHECK (completeness >= 0 AND completeness <= 100),
  "missingElements" TEXT[] DEFAULT '{}',

  -- Conversation storage
  "conversationHistory" JSONB DEFAULT '[]', -- Array of {role, content, timestamp}

  -- Status & Metadata
  status brief_status NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_briefs_user_id ON briefs("userId");
CREATE INDEX idx_briefs_status ON briefs(status);
CREATE INDEX idx_briefs_created_at ON briefs("createdAt" DESC);

-- Create updated_at trigger (reuse function from profiles migration)
CREATE TRIGGER update_briefs_updated_at
  BEFORE UPDATE ON briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to briefs" ON briefs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
