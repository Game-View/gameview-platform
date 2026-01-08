# Game View: Beta Sprint Plan

**Version:** 1.0
**Date:** January 2026
**Goal:** 6 beta users, 2 productions each, scavenger hunt game mechanic

---

## Current State Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| Auth/Login | ✅ Working | Clerk integration complete |
| Video Upload | ✅ Working | Supabase storage |
| Productions List | ❌ Not working | Needs fix |
| 3D Viewer | ❌ Not integrated | Component exists, needs wiring |
| Modal Processing | 🔄 In progress | GPU build deploying |
| Object Library | ❌ Not built | Have objects to add |
| Game Mechanics | ❌ Not built | Types may exist |
| Player App | ❌ Not deployed | Frontend designed/built |

---

## Beta Definition

- **Users:** 6 creators max
- **Productions:** 2 per user max
- **Game Type:** Scavenger Hunt
  - Find hidden objects in 3D scene
  - Timer: 3 minutes OR music ends
  - Win: Found all objects
  - Lose: Time ran out

---

## Sprint Structure

### Phase 1: Core Pipeline (Foundation)
*Get video → 3D → viewable working end-to-end*

| # | Task | Depends On | Priority |
|---|------|------------|----------|
| 1.1 | Fix Modal GPU build (COLMAP patch) | - | P0 |
| 1.2 | Fix Productions List display | - | P0 |
| 1.3 | Integrate 3D Viewer in Studio | 1.2 | P0 |
| 1.4 | Test full pipeline: upload → process → view | 1.1, 1.3 | P0 |

**Milestone 1:** Creator uploads video → sees 3D result in Studio

---

### Phase 2: Scene Building (Creator Tools)
*Let creators place objects and configure games*

| # | Task | Depends On | Priority |
|---|------|------------|----------|
| 2.1 | Object Library UI (browse/select objects) | - | P0 |
| 2.2 | Populate Object Library (GLB files) | - | P0 |
| 2.3 | Object Placement in 3D scene | 1.3, 2.1 | P0 |
| 2.4 | Save scene configuration to database | 2.3 | P0 |
| 2.5 | Load scene with placed objects | 2.4 | P0 |

**Milestone 2:** Creator places objects in their 3D scene and saves

---

### Phase 3: Game Mechanics (Scavenger Hunt)
*Add the gameplay layer*

| # | Task | Depends On | Priority |
|---|------|------------|----------|
| 3.1 | Mark objects as "hidden/collectible" | 2.3 | P0 |
| 3.2 | Game settings UI (timer duration, music upload) | - | P0 |
| 3.3 | Save game configuration | 3.1, 3.2 | P0 |
| 3.4 | Preview game in Studio | 3.3 | P1 |

**Milestone 3:** Creator configures scavenger hunt (5 hidden objects, 3 min timer)

---

### Phase 4: Publishing & Sharing
*Get content to players*

| # | Task | Depends On | Priority |
|---|------|------------|----------|
| 4.1 | "Publish" button in Studio | 3.3 | P0 |
| 4.2 | Generate shareable link | 4.1 | P0 |
| 4.3 | Experience detail page (title, thumbnail, creator) | 4.1 | P1 |

**Milestone 4:** Creator publishes and gets a shareable link

---

### Phase 5: Player Experience
*Players can play the games*

| # | Task | Depends On | Priority |
|---|------|------------|----------|
| 5.1 | Deploy Player app to Vercel | - | P0 |
| 5.2 | Load published experience by ID/link | 5.1, 4.2 | P0 |
| 5.3 | 3D Viewer in Player (with navigation) | 5.2 | P0 |
| 5.4 | Game runtime: object collection | 5.3 | P0 |
| 5.5 | Game runtime: timer countdown | 5.4 | P0 |
| 5.6 | Game runtime: music playback | 5.5 | P1 |
| 5.7 | Win/Lose screens | 5.4 | P0 |
| 5.8 | Play again / Share result | 5.7 | P1 |

**Milestone 5:** Player opens link → plays scavenger hunt → sees result

---

## Parallel Work Streams

These can be worked on simultaneously:

```
Stream A (Pipeline):     1.1 → 1.4 ────────────────────────────→
Stream B (UI):           1.2 → 1.3 → 2.1 → 2.3 → 3.1 → 4.1 ───→
Stream C (Player):       ─────────────────────── 5.1 → 5.2 → 5.3 → 5.4
Stream D (Assets):       2.2 (populate objects) ──────────────→
```

---

## Technical Specifications

### Object Placement Data Model

```typescript
interface PlacedObject {
  id: string;
  objectId: string;        // Reference to library object
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  isCollectible: boolean;  // For scavenger hunt
  collectOrder?: number;   // Optional: must collect in order
}

interface GameConfig {
  type: 'scavenger_hunt';
  timerSeconds: number;    // e.g., 180 for 3 minutes
  musicUrl?: string;       // Optional background music
  winMessage: string;
  loseMessage: string;
}

interface Experience {
  id: string;
  productionId: string;    // Link to 3D scene
  title: string;
  description: string;
  thumbnailUrl: string;
  placedObjects: PlacedObject[];
  gameConfig: GameConfig;
  status: 'draft' | 'published';
  publishedAt?: Date;
  creatorId: string;
}
```

### Game Runtime State

```typescript
interface GameState {
  status: 'ready' | 'playing' | 'won' | 'lost';
  timeRemaining: number;
  objectsFound: string[];  // IDs of collected objects
  totalObjects: number;
}
```

### Player Controls

```
- WASD / Arrow keys: Move camera
- Mouse drag: Look around
- Click on object: Collect (if collectible)
- Mobile: Touch + drag to look, tap to collect
```

---

## Object Library Sources

Free CC0 3D assets to populate library:

| Source | URL | Best For |
|--------|-----|----------|
| Smithsonian 3D | https://3d.si.edu/ | Artifacts, fossils |
| Poly Pizza | https://poly.pizza/ | Low-poly game objects |
| Sketchfab CC0 | https://sketchfab.com/search?licenses=322a749bcfa841b29dff1571c1e1cce7 | Variety |
| Kenney Assets | https://kenney.nl/assets | Game props |
| ambientCG | https://ambientcg.com/ | Realistic props |

**Recommended starter objects:**
- 5 coins/gems (collectibles)
- 3 treasure chests
- 5 decorative props (barrels, crates, plants)
- 3 special items (key, scroll, artifact)

---

## Database Schema Additions

```prisma
// Add to schema.prisma

model ObjectLibrary {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String   // "collectible", "prop", "decoration"
  thumbnailUrl String
  modelUrl    String   // GLB file URL
  tags        String[]
  createdAt   DateTime @default(now())
}

model PlacedObject {
  id           String   @id @default(cuid())
  experienceId String
  objectId     String
  positionX    Float
  positionY    Float
  positionZ    Float
  rotationX    Float    @default(0)
  rotationY    Float    @default(0)
  rotationZ    Float    @default(0)
  scale        Float    @default(1)
  isCollectible Boolean @default(false)

  experience   Experience @relation(fields: [experienceId], references: [id])
  object       ObjectLibrary @relation(fields: [objectId], references: [id])
}

model Experience {
  id            String    @id @default(cuid())
  productionId  String    @unique
  creatorId     String
  title         String
  description   String?
  thumbnailUrl  String?
  status        String    @default("draft") // draft, published

  // Game config
  gameType      String    @default("scavenger_hunt")
  timerSeconds  Int       @default(180)
  musicUrl      String?
  winMessage    String    @default("You found them all!")
  loseMessage   String    @default("Time's up!")

  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  placedObjects PlacedObject[]
  production    Production @relation(fields: [productionId], references: [id])
  creator       Creator @relation(fields: [creatorId], references: [id])
}
```

---

## API Endpoints Needed

### Studio (Creator)

```
POST   /api/experiences              Create experience from production
GET    /api/experiences/:id          Get experience details
PUT    /api/experiences/:id          Update experience
POST   /api/experiences/:id/objects  Add placed object
PUT    /api/experiences/:id/objects/:objectId  Update object placement
DELETE /api/experiences/:id/objects/:objectId  Remove object
PUT    /api/experiences/:id/game     Update game config
POST   /api/experiences/:id/publish  Publish experience
```

### Player

```
GET    /api/play/:experienceId       Get published experience for playing
POST   /api/play/:experienceId/start Start game session (optional analytics)
POST   /api/play/:experienceId/complete Record completion (optional)
```

---

## Success Criteria

### Beta Ready Checklist

- [ ] Creator can sign up and log in
- [ ] Creator can upload video(s)
- [ ] Video processes to 3D Gaussian Splat
- [ ] Creator can view 3D result in Studio
- [ ] Creator can browse object library
- [ ] Creator can place objects in scene
- [ ] Creator can mark objects as collectible
- [ ] Creator can set timer duration
- [ ] Creator can publish experience
- [ ] Creator gets shareable link
- [ ] Player can open link
- [ ] Player sees 3D scene with objects
- [ ] Player can navigate scene
- [ ] Player can collect objects
- [ ] Timer counts down
- [ ] Win screen shows when all collected
- [ ] Lose screen shows when time runs out

### Demo Script

1. **Creator Journey** (record this)
   - Log in to Studio
   - Upload video footage
   - Wait for processing (or skip with pre-processed)
   - View 3D scene
   - Add hidden objects from library
   - Configure 3 minute timer
   - Publish
   - Copy link

2. **Player Journey** (investor does this live)
   - Open shared link
   - See game intro
   - Play scavenger hunt
   - Try to find all objects
   - See win/lose result

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| GPU processing takes too long | Use pre-processed scenes for demo |
| 3D viewer performance issues | Limit splat count, test on target devices |
| Object placement UX confusing | Keep it simple: click to place, drag to move |
| Timer too short/long | Make it configurable, default 3 min |

---

## Notes

- **No timeline estimates** - Work through tasks in dependency order
- **Processing time not a blocker** - R&D track handles optimization
- **Keep scope tight** - Scavenger hunt only, no other game types for beta
- **Quality over features** - Better to have one working game type than three broken ones
