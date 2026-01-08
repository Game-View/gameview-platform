-- Update seeded objects with real GLB model URLs for beta
-- Uses free CC0/public domain models from various sources

-- NOTE: For beta, we'll use a mix of:
-- 1. Kenney's low-poly assets (CC0) - hosted on GitHub
-- 2. Three.js examples - MIT licensed samples
-- 3. Google Model Viewer samples - Apache 2.0

-- ============================================
-- COLLECTIBLES - Essential for scavenger hunt
-- ============================================

-- Update Gold Coin to use a real model
-- Using a simple torus as coin placeholder
UPDATE objects SET
  "modelUrl" = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb',
  description = 'A collectible gold coin'
WHERE name = 'Gold Coin' AND source = 'system';

-- For beta, let's mark which objects are ready with real models
-- and which are still placeholders

-- Add a column to track if model is a real file or placeholder
-- (This is non-destructive - just adds metadata)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'objects' AND column_name = 'modelStatus'
  ) THEN
    ALTER TABLE objects ADD COLUMN "modelStatus" TEXT DEFAULT 'placeholder';
  END IF;
END $$;

-- Mark all system objects as placeholders initially
UPDATE objects SET "modelStatus" = 'placeholder' WHERE source = 'system';

-- ============================================
-- BETA STARTER OBJECTS
-- Using Three.js/Khronos sample models (MIT/Apache licensed)
-- ============================================

-- Create beta-ready collectibles with working models
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic", "interactionType", "modelStatus")
VALUES
  -- Sample collectibles using Khronos sample models
  ('Mystery Box', 'A mysterious treasure box to collect', 'collectibles',
   ARRAY['box', 'treasure', 'mystery', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
   NULL, true, 'collectible', 'ready'),

  ('Duck Trophy', 'A rubber duck trophy', 'collectibles',
   ARRAY['duck', 'trophy', 'fun', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
   NULL, true, 'collectible', 'ready'),

  ('Avocado Prize', 'A delicious avocado to collect', 'collectibles',
   ARRAY['avocado', 'food', 'fun', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF-Binary/Avocado.glb',
   NULL, true, 'collectible', 'ready'),

  ('Damaged Helmet', 'A mysterious damaged helmet', 'collectibles',
   ARRAY['helmet', 'sci-fi', 'treasure', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
   NULL, true, 'collectible', 'ready'),

  ('Water Bottle', 'A refreshing water bottle', 'collectibles',
   ARRAY['bottle', 'water', 'drink', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
   NULL, true, 'collectible', 'ready')

ON CONFLICT DO NOTHING;

-- ============================================
-- PROPS - Decorative objects
-- ============================================

INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic", "interactionType", "modelStatus")
VALUES
  ('Toy Car', 'A small toy car decoration', 'props',
   ARRAY['car', 'toy', 'decoration', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb',
   NULL, true, NULL, 'ready'),

  ('Lantern', 'An atmospheric lantern', 'props',
   ARRAY['lantern', 'light', 'decoration', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Lantern/glTF-Binary/Lantern.glb',
   NULL, true, NULL, 'ready'),

  ('Antique Camera', 'A vintage camera prop', 'props',
   ARRAY['camera', 'vintage', 'antique', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
   NULL, true, NULL, 'ready')

ON CONFLICT DO NOTHING;

-- ============================================
-- INTERACTIVE - Objects with special behaviors
-- ============================================

INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic", "interactionType", "modelStatus")
VALUES
  ('Treasure Chest', 'A treasure chest that can be opened', 'interactive',
   ARRAY['chest', 'treasure', 'container', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
   NULL, true, 'trigger', 'ready'),

  ('Boom Box', 'A boombox that plays music', 'interactive',
   ARRAY['boombox', 'music', 'audio', 'beta'], 'system',
   'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoomBox/glTF-Binary/BoomBox.glb',
   NULL, true, 'audio', 'ready')

ON CONFLICT DO NOTHING;

-- Comment: For full production, we should:
-- 1. Host models on Supabase Storage or CDN
-- 2. Generate thumbnails for all models
-- 3. Add more variety from sources like:
--    - Kenney.nl (CC0 game assets)
--    - Poly.pizza (CC0 models)
--    - Sketchfab (various licenses)
