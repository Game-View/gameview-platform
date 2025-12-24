-- Create scenes table for Game View Studio
-- Stores processed 3D scenes from video uploads

-- Create enum for processing status
CREATE TYPE processing_status AS ENUM (
  'pending',
  'uploading',
  'processing',
  'frame_extraction',
  'colmap',
  'brush',
  'metadata',
  'completed',
  'failed'
);

-- Create scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "briefId" UUID NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL, -- Clerk user ID

  -- Scene Info
  name TEXT NOT NULL,
  description TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0, -- For multi-scene ordering

  -- Video Sources
  "videoFiles" JSONB DEFAULT '[]', -- Array of {filename, url, size, duration, uploadedAt}
  "totalVideoSize" BIGINT DEFAULT 0, -- Total size in bytes

  -- Processing
  "processingStatus" processing_status NOT NULL DEFAULT 'pending',
  "processingProgress" INTEGER DEFAULT 0 CHECK ("processingProgress" >= 0 AND "processingProgress" <= 100),
  "processingMessage" TEXT,
  "processingStartedAt" TIMESTAMPTZ,
  "processingCompletedAt" TIMESTAMPTZ,
  "processingError" TEXT,

  -- Output Files
  "splatUrl" TEXT, -- URL to scene.ply file
  "thumbnailUrl" TEXT, -- URL to thumbnail.jpg
  "metadataUrl" TEXT, -- URL to metadata.json
  "outputSize" BIGINT, -- Size of output files in bytes

  -- Scene Settings (for viewer)
  "cameraPosition" JSONB, -- {x, y, z}
  "cameraTarget" JSONB, -- {x, y, z}
  "lightingPreset" TEXT DEFAULT 'default',

  -- Placed Objects (Sprint 14)
  "placedObjects" JSONB DEFAULT '[]', -- Array of placed objects with positions

  -- Interactions (Sprint 15)
  interactions JSONB DEFAULT '[]', -- Array of interaction definitions

  -- Metadata
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_scenes_brief_id ON scenes("briefId");
CREATE INDEX idx_scenes_user_id ON scenes("userId");
CREATE INDEX idx_scenes_processing_status ON scenes("processingStatus");
CREATE INDEX idx_scenes_order ON scenes("briefId", "orderIndex");

-- Create updated_at trigger
CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to scenes" ON scenes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create processing_jobs table for tracking CLI jobs
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sceneId" UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,

  -- Job Info
  status processing_status NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  "currentStage" TEXT,
  message TEXT,

  -- CLI Parameters
  "cliCommand" TEXT,
  "outputDir" TEXT,
  "preset" TEXT DEFAULT 'Balanced',

  -- Timing
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "estimatedTimeRemaining" INTEGER, -- Seconds

  -- Error Handling
  "errorMessage" TEXT,
  "retryCount" INTEGER DEFAULT 0,
  "lastRetryAt" TIMESTAMPTZ,

  -- Metadata
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for processing_jobs
CREATE INDEX idx_processing_jobs_scene_id ON processing_jobs("sceneId");
CREATE INDEX idx_processing_jobs_user_id ON processing_jobs("userId");
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);

-- Create updated_at trigger for processing_jobs
CREATE TRIGGER update_processing_jobs_updated_at
  BEFORE UPDATE ON processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to processing_jobs" ON processing_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
