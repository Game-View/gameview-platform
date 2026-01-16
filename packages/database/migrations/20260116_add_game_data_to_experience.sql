-- Phase 3: Sprint 18 - Add game data fields to Experience table
-- Run this migration on existing databases to add interactive playback support

-- Add scenesData column (stores placed objects, interactions per scene)
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "scenesData" JSONB;

-- Add gameConfig column (stores inventory, scoring, win conditions, objectives)
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "gameConfig" JSONB;

-- Add briefId column (reference to source brief in Supabase)
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "briefId" TEXT;

-- Create index on briefId for efficient lookups
CREATE INDEX IF NOT EXISTS "Experience_briefId_idx" ON "Experience"("briefId");

-- Add comment for documentation
COMMENT ON COLUMN "Experience"."scenesData" IS 'JSON array of scene data: [{id, splatUrl, placedObjects, interactions, portals, spawnPoints}]';
COMMENT ON COLUMN "Experience"."gameConfig" IS 'Game configuration: {inventory, scoring, winConditions, objectives, rewards, etc.}';
COMMENT ON COLUMN "Experience"."briefId" IS 'Reference to original brief in Supabase for re-publishing updates';

-- Add play session result fields to PlayHistory (Sprint 18.3)
ALTER TABLE "PlayHistory" ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayHistory" ADD COLUMN IF NOT EXISTS "collectibles" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayHistory" ADD COLUMN IF NOT EXISTS "hasWon" BOOLEAN NOT NULL DEFAULT false;
