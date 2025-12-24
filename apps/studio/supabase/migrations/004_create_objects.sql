-- Create objects table for Game View Studio
-- Stores 3D objects available for placement in scenes

-- Create enum for object categories
CREATE TYPE object_category AS ENUM (
  'collectibles',
  'furniture',
  'props',
  'interactive',
  'decorations',
  'audio',
  'effects',
  'characters',
  'vehicles',
  'nature'
);

-- Create enum for object source
CREATE TYPE object_source AS ENUM (
  'system',      -- Pre-loaded Game View objects
  'user',        -- User uploaded objects
  'marketplace'  -- Objects from marketplace (Phase 3)
);

-- Create objects table
CREATE TABLE objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  "userId" TEXT,                    -- NULL for system objects
  source object_source NOT NULL DEFAULT 'system',

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category object_category NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- 3D Model
  "modelUrl" TEXT NOT NULL,         -- URL to .glb/.gltf file
  "thumbnailUrl" TEXT,              -- Preview image
  "previewUrl" TEXT,                -- Animated preview (optional)

  -- Model Properties
  "fileSize" BIGINT,                -- File size in bytes
  "polyCount" INTEGER,              -- Polygon count
  "hasAnimations" BOOLEAN DEFAULT FALSE,
  "defaultScale" JSONB DEFAULT '{"x": 1, "y": 1, "z": 1}',
  "boundingBox" JSONB,              -- {min: {x,y,z}, max: {x,y,z}}

  -- Interaction Defaults (for interactive objects)
  "interactionType" TEXT,           -- 'collectible', 'trigger', 'audio', etc.
  "interactionConfig" JSONB,        -- Default interaction settings

  -- Visibility
  "isPublic" BOOLEAN DEFAULT FALSE, -- Visible to all users
  "isActive" BOOLEAN DEFAULT TRUE,  -- Soft delete

  -- Usage Stats
  "usageCount" INTEGER DEFAULT 0,   -- How many times placed

  -- Metadata
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_objects_user_id ON objects("userId");
CREATE INDEX idx_objects_source ON objects(source);
CREATE INDEX idx_objects_category ON objects(category);
CREATE INDEX idx_objects_is_public ON objects("isPublic") WHERE "isPublic" = TRUE;
CREATE INDEX idx_objects_is_active ON objects("isActive") WHERE "isActive" = TRUE;
CREATE INDEX idx_objects_tags ON objects USING GIN (tags);

-- Create updated_at trigger
CREATE TRIGGER update_objects_updated_at
  BEFORE UPDATE ON objects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to objects" ON objects
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert starter objects (system library)
-- Collectibles Category
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic", "interactionType") VALUES
  ('Gold Coin', 'A shiny gold coin', 'collectibles', ARRAY['coin', 'gold', 'treasure', 'currency'], 'system', '/objects/collectibles/gold-coin.glb', '/objects/thumbnails/gold-coin.jpg', true, 'collectible'),
  ('Silver Coin', 'A silver coin', 'collectibles', ARRAY['coin', 'silver', 'treasure', 'currency'], 'system', '/objects/collectibles/silver-coin.glb', '/objects/thumbnails/silver-coin.jpg', true, 'collectible'),
  ('Bronze Coin', 'A bronze coin', 'collectibles', ARRAY['coin', 'bronze', 'treasure', 'currency'], 'system', '/objects/collectibles/bronze-coin.glb', '/objects/thumbnails/bronze-coin.jpg', true, 'collectible'),
  ('Gem Red', 'A sparkling red ruby', 'collectibles', ARRAY['gem', 'ruby', 'red', 'treasure', 'jewel'], 'system', '/objects/collectibles/gem-red.glb', '/objects/thumbnails/gem-red.jpg', true, 'collectible'),
  ('Gem Blue', 'A brilliant blue sapphire', 'collectibles', ARRAY['gem', 'sapphire', 'blue', 'treasure', 'jewel'], 'system', '/objects/collectibles/gem-blue.glb', '/objects/thumbnails/gem-blue.jpg', true, 'collectible'),
  ('Gem Green', 'A radiant emerald', 'collectibles', ARRAY['gem', 'emerald', 'green', 'treasure', 'jewel'], 'system', '/objects/collectibles/gem-green.glb', '/objects/thumbnails/gem-green.jpg', true, 'collectible'),
  ('Star Gold', 'A golden star', 'collectibles', ARRAY['star', 'gold', 'reward'], 'system', '/objects/collectibles/star-gold.glb', '/objects/thumbnails/star-gold.jpg', true, 'collectible'),
  ('Key Gold', 'A golden key', 'collectibles', ARRAY['key', 'gold', 'unlock'], 'system', '/objects/collectibles/key-gold.glb', '/objects/thumbnails/key-gold.jpg', true, 'collectible'),
  ('Key Silver', 'A silver key', 'collectibles', ARRAY['key', 'silver', 'unlock'], 'system', '/objects/collectibles/key-silver.glb', '/objects/thumbnails/key-silver.jpg', true, 'collectible'),
  ('Cassette Tape', 'A vintage cassette tape', 'collectibles', ARRAY['cassette', 'tape', 'music', 'audio', 'vintage'], 'system', '/objects/collectibles/cassette-tape.glb', '/objects/thumbnails/cassette-tape.jpg', true, 'collectible'),
  ('Vinyl Record', 'A classic vinyl record', 'collectibles', ARRAY['vinyl', 'record', 'music', 'audio', 'vintage'], 'system', '/objects/collectibles/vinyl-record.glb', '/objects/thumbnails/vinyl-record.jpg', true, 'collectible'),
  ('Trophy Gold', 'A golden trophy', 'collectibles', ARRAY['trophy', 'gold', 'award', 'prize'], 'system', '/objects/collectibles/trophy-gold.glb', '/objects/thumbnails/trophy-gold.jpg', true, 'collectible'),
  ('Medal Gold', 'A gold medal', 'collectibles', ARRAY['medal', 'gold', 'award', 'prize'], 'system', '/objects/collectibles/medal-gold.glb', '/objects/thumbnails/medal-gold.jpg', true, 'collectible'),
  ('Scroll', 'An ancient scroll', 'collectibles', ARRAY['scroll', 'paper', 'document', 'ancient'], 'system', '/objects/collectibles/scroll.glb', '/objects/thumbnails/scroll.jpg', true, 'collectible'),
  ('Crystal Orb', 'A mystical crystal orb', 'collectibles', ARRAY['crystal', 'orb', 'magic', 'mystical'], 'system', '/objects/collectibles/crystal-orb.glb', '/objects/thumbnails/crystal-orb.jpg', true, 'collectible');

-- Furniture Category
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic") VALUES
  ('Wooden Chair', 'A simple wooden chair', 'furniture', ARRAY['chair', 'wood', 'seating'], 'system', '/objects/furniture/chair-wood.glb', '/objects/thumbnails/chair-wood.jpg', true),
  ('Modern Chair', 'A sleek modern chair', 'furniture', ARRAY['chair', 'modern', 'seating'], 'system', '/objects/furniture/chair-modern.glb', '/objects/thumbnails/chair-modern.jpg', true),
  ('Wooden Table', 'A sturdy wooden table', 'furniture', ARRAY['table', 'wood', 'surface'], 'system', '/objects/furniture/table-wood.glb', '/objects/thumbnails/table-wood.jpg', true),
  ('Coffee Table', 'A low coffee table', 'furniture', ARRAY['table', 'coffee', 'modern'], 'system', '/objects/furniture/table-coffee.glb', '/objects/thumbnails/table-coffee.jpg', true),
  ('Bookshelf', 'A tall bookshelf', 'furniture', ARRAY['shelf', 'books', 'storage'], 'system', '/objects/furniture/bookshelf.glb', '/objects/thumbnails/bookshelf.jpg', true),
  ('Couch', 'A comfortable couch', 'furniture', ARRAY['couch', 'sofa', 'seating'], 'system', '/objects/furniture/couch.glb', '/objects/thumbnails/couch.jpg', true),
  ('Desk', 'A work desk', 'furniture', ARRAY['desk', 'work', 'office'], 'system', '/objects/furniture/desk.glb', '/objects/thumbnails/desk.jpg', true),
  ('Bed', 'A comfortable bed', 'furniture', ARRAY['bed', 'bedroom', 'sleep'], 'system', '/objects/furniture/bed.glb', '/objects/thumbnails/bed.jpg', true),
  ('Cabinet', 'A storage cabinet', 'furniture', ARRAY['cabinet', 'storage', 'doors'], 'system', '/objects/furniture/cabinet.glb', '/objects/thumbnails/cabinet.jpg', true),
  ('Lamp Floor', 'A floor lamp', 'furniture', ARRAY['lamp', 'floor', 'light'], 'system', '/objects/furniture/lamp-floor.glb', '/objects/thumbnails/lamp-floor.jpg', true);

-- Props Category
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic") VALUES
  ('Barrel Wood', 'A wooden barrel', 'props', ARRAY['barrel', 'wood', 'container'], 'system', '/objects/props/barrel-wood.glb', '/objects/thumbnails/barrel-wood.jpg', true),
  ('Crate Wood', 'A wooden crate', 'props', ARRAY['crate', 'wood', 'container', 'box'], 'system', '/objects/props/crate-wood.glb', '/objects/thumbnails/crate-wood.jpg', true),
  ('Box Cardboard', 'A cardboard box', 'props', ARRAY['box', 'cardboard', 'container'], 'system', '/objects/props/box-cardboard.glb', '/objects/thumbnails/box-cardboard.jpg', true),
  ('Trash Can', 'A metal trash can', 'props', ARRAY['trash', 'can', 'metal', 'garbage'], 'system', '/objects/props/trash-can.glb', '/objects/thumbnails/trash-can.jpg', true),
  ('Traffic Cone', 'An orange traffic cone', 'props', ARRAY['cone', 'traffic', 'orange', 'safety'], 'system', '/objects/props/traffic-cone.glb', '/objects/thumbnails/traffic-cone.jpg', true),
  ('Fire Hydrant', 'A red fire hydrant', 'props', ARRAY['hydrant', 'fire', 'red', 'city'], 'system', '/objects/props/fire-hydrant.glb', '/objects/thumbnails/fire-hydrant.jpg', true),
  ('Street Light', 'A street lamp', 'props', ARRAY['light', 'street', 'lamp', 'city'], 'system', '/objects/props/street-light.glb', '/objects/thumbnails/street-light.jpg', true),
  ('Bench Park', 'A park bench', 'props', ARRAY['bench', 'park', 'seating', 'outdoor'], 'system', '/objects/props/bench-park.glb', '/objects/thumbnails/bench-park.jpg', true),
  ('Guitar Acoustic', 'An acoustic guitar', 'props', ARRAY['guitar', 'acoustic', 'music', 'instrument'], 'system', '/objects/props/guitar-acoustic.glb', '/objects/thumbnails/guitar-acoustic.jpg', true),
  ('Microphone', 'A stage microphone', 'props', ARRAY['microphone', 'mic', 'music', 'audio', 'stage'], 'system', '/objects/props/microphone.glb', '/objects/thumbnails/microphone.jpg', true);

-- Interactive Category
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic", "interactionType") VALUES
  ('Door Wood', 'A wooden door', 'interactive', ARRAY['door', 'wood', 'entrance'], 'system', '/objects/interactive/door-wood.glb', '/objects/thumbnails/door-wood.jpg', true, 'trigger'),
  ('Door Metal', 'A metal door', 'interactive', ARRAY['door', 'metal', 'entrance'], 'system', '/objects/interactive/door-metal.glb', '/objects/thumbnails/door-metal.jpg', true, 'trigger'),
  ('Chest Treasure', 'A treasure chest', 'interactive', ARRAY['chest', 'treasure', 'container', 'loot'], 'system', '/objects/interactive/chest-treasure.glb', '/objects/thumbnails/chest-treasure.jpg', true, 'trigger'),
  ('Switch Wall', 'A wall switch', 'interactive', ARRAY['switch', 'wall', 'toggle', 'control'], 'system', '/objects/interactive/switch-wall.glb', '/objects/thumbnails/switch-wall.jpg', true, 'trigger'),
  ('Button Red', 'A big red button', 'interactive', ARRAY['button', 'red', 'press', 'trigger'], 'system', '/objects/interactive/button-red.glb', '/objects/thumbnails/button-red.jpg', true, 'trigger'),
  ('Lever', 'A mechanical lever', 'interactive', ARRAY['lever', 'pull', 'mechanism'], 'system', '/objects/interactive/lever.glb', '/objects/thumbnails/lever.jpg', true, 'trigger'),
  ('Portal Blue', 'A blue teleport portal', 'interactive', ARRAY['portal', 'blue', 'teleport', 'magic'], 'system', '/objects/interactive/portal-blue.glb', '/objects/thumbnails/portal-blue.jpg', true, 'teleport'),
  ('Portal Orange', 'An orange teleport portal', 'interactive', ARRAY['portal', 'orange', 'teleport', 'magic'], 'system', '/objects/interactive/portal-orange.glb', '/objects/thumbnails/portal-orange.jpg', true, 'teleport'),
  ('Checkpoint Flag', 'A checkpoint flag', 'interactive', ARRAY['checkpoint', 'flag', 'progress'], 'system', '/objects/interactive/checkpoint-flag.glb', '/objects/thumbnails/checkpoint-flag.jpg', true, 'checkpoint'),
  ('NPC Marker', 'An NPC spawn marker', 'interactive', ARRAY['npc', 'marker', 'spawn', 'character'], 'system', '/objects/interactive/npc-marker.glb', '/objects/thumbnails/npc-marker.jpg', true, 'npc');

-- Decorations Category
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic") VALUES
  ('Poster Frame', 'A framed poster', 'decorations', ARRAY['poster', 'frame', 'wall', 'art'], 'system', '/objects/decorations/poster-frame.glb', '/objects/thumbnails/poster-frame.jpg', true),
  ('Picture Frame', 'A picture frame', 'decorations', ARRAY['picture', 'frame', 'wall', 'photo'], 'system', '/objects/decorations/picture-frame.glb', '/objects/thumbnails/picture-frame.jpg', true),
  ('Rug Round', 'A round rug', 'decorations', ARRAY['rug', 'round', 'floor', 'carpet'], 'system', '/objects/decorations/rug-round.glb', '/objects/thumbnails/rug-round.jpg', true),
  ('Rug Rectangle', 'A rectangular rug', 'decorations', ARRAY['rug', 'rectangle', 'floor', 'carpet'], 'system', '/objects/decorations/rug-rectangle.glb', '/objects/thumbnails/rug-rectangle.jpg', true),
  ('Vase', 'A decorative vase', 'decorations', ARRAY['vase', 'ceramic', 'decoration'], 'system', '/objects/decorations/vase.glb', '/objects/thumbnails/vase.jpg', true),
  ('Candles', 'A set of candles', 'decorations', ARRAY['candles', 'light', 'decoration'], 'system', '/objects/decorations/candles.glb', '/objects/thumbnails/candles.jpg', true),
  ('Clock Wall', 'A wall clock', 'decorations', ARRAY['clock', 'wall', 'time'], 'system', '/objects/decorations/clock-wall.glb', '/objects/thumbnails/clock-wall.jpg', true),
  ('Mirror', 'A wall mirror', 'decorations', ARRAY['mirror', 'wall', 'reflection'], 'system', '/objects/decorations/mirror.glb', '/objects/thumbnails/mirror.jpg', true),
  ('Banner', 'A decorative banner', 'decorations', ARRAY['banner', 'wall', 'fabric'], 'system', '/objects/decorations/banner.glb', '/objects/thumbnails/banner.jpg', true),
  ('Neon Sign', 'A glowing neon sign', 'decorations', ARRAY['neon', 'sign', 'light', 'glow'], 'system', '/objects/decorations/neon-sign.glb', '/objects/thumbnails/neon-sign.jpg', true);

-- Nature Category
INSERT INTO objects (name, description, category, tags, source, "modelUrl", "thumbnailUrl", "isPublic") VALUES
  ('Tree Oak', 'An oak tree', 'nature', ARRAY['tree', 'oak', 'nature', 'outdoor'], 'system', '/objects/nature/tree-oak.glb', '/objects/thumbnails/tree-oak.jpg', true),
  ('Tree Pine', 'A pine tree', 'nature', ARRAY['tree', 'pine', 'nature', 'outdoor'], 'system', '/objects/nature/tree-pine.glb', '/objects/thumbnails/tree-pine.jpg', true),
  ('Bush', 'A green bush', 'nature', ARRAY['bush', 'shrub', 'nature', 'outdoor'], 'system', '/objects/nature/bush.glb', '/objects/thumbnails/bush.jpg', true),
  ('Flower Pot', 'A potted flower', 'nature', ARRAY['flower', 'pot', 'plant', 'indoor'], 'system', '/objects/nature/flower-pot.glb', '/objects/thumbnails/flower-pot.jpg', true),
  ('Rock Large', 'A large rock', 'nature', ARRAY['rock', 'large', 'stone', 'nature'], 'system', '/objects/nature/rock-large.glb', '/objects/thumbnails/rock-large.jpg', true),
  ('Rock Small', 'A small rock', 'nature', ARRAY['rock', 'small', 'stone', 'nature'], 'system', '/objects/nature/rock-small.glb', '/objects/thumbnails/rock-small.jpg', true),
  ('Grass Patch', 'A patch of grass', 'nature', ARRAY['grass', 'patch', 'ground', 'nature'], 'system', '/objects/nature/grass-patch.glb', '/objects/thumbnails/grass-patch.jpg', true),
  ('Mushroom', 'A forest mushroom', 'nature', ARRAY['mushroom', 'fungi', 'nature', 'forest'], 'system', '/objects/nature/mushroom.glb', '/objects/thumbnails/mushroom.jpg', true),
  ('Log', 'A fallen log', 'nature', ARRAY['log', 'wood', 'fallen', 'nature'], 'system', '/objects/nature/log.glb', '/objects/thumbnails/log.jpg', true),
  ('Fence Wood', 'A wooden fence section', 'nature', ARRAY['fence', 'wood', 'barrier', 'outdoor'], 'system', '/objects/nature/fence-wood.glb', '/objects/thumbnails/fence-wood.jpg', true);
