# CLAUDE.md - Game View Platform

> **Read this document completely before writing any code.**
> **This document takes precedence over all other documentation in this repository.**

---

## 1. What Game View Is

Game View transforms real-world 2D video into playable 4D motion experiences.

**The core technology:** We reconstruct standard 2D video footage (HD, 4K, 8K — what any camera captures) into **4D motion environments** — user-controllable 3D worlds where time and motion are preserved.

This is the inverse of traditional game engines:

| Traditional Game Engines | Game View |
|--------------------------|-----------|
| Build synthetic 3D worlds | Capture real-world video |
| Bolt on real imagery (textures, photos) | Reconstruct real footage into explorable 4D |
| Motion is animated/simulated | Motion is real, captured, preserved |
| Virtual worlds that mimic reality | Real worlds made interactive |

**When a player enters a Game View experience, they are inside reconstructed reality — not a simulation of it.**

---

## 2. What 4D Motion Means

### CRITICAL: This is NOT static 3D Gaussian Splatting.

| Static 3DGS (NOT what we're building) | 4D Motion (WHAT WE ARE BUILDING) |
|---------------------------------------|----------------------------------|
| A "3D photo" — frozen moment in time | A living environment with motion |
| User controls camera in a still scene | User controls camera while the world moves |
| No temporal dimension | Time is a core dimension |
| Like Google Street View in 3D | Like being inside a video, controlling your viewpoint |

**4D = 3D space + time.** The reconstruction preserves motion: people walking, lights changing, atmosphere shifting, the world alive. The user controls their position and perspective while the captured motion continues around them.

### If your implementation freezes the scene, it is wrong. Motion is the foundation.

**Motion is the ENTIRE value proposition.** Without motion, Game View is "just another 3D viewer." With motion, we're creating an entirely new category of content.

---

## 3. Spark: The Persistent AI Companion

### Spark is NOT a step in the workflow. Spark is ALWAYS present.

Powered by Anthropic, Spark is the AI companion that understands what the creator wants to build and **codes their game in the background** — so they never have to write code.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPARK                                          │
│            Persistent AI companion across the entire journey                │
│                                                                             │
│        Advises. Understands. Designs. Builds. Supports. Always there.       │
└─────────────────────────────────────────────────────────────────────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ CAPTURE │          │  BRIEF  │          │ STUDIO  │          │ PUBLISH │
   └─────────┘          └─────────┘          └─────────┘          └─────────┘

"How should I         "I want a treasure   "Add a timer and     "How do players
 record my venue?"     hunt for my class"   scoring system"      access this?"
```

**Spark adapts to context:**

| When the creator is... | Spark helps by... |
|------------------------|-------------------|
| Planning capture | Advising on camera angles, lighting, coverage |
| Defining their vision | Collaborating on game design, asking clarifying questions |
| Creating the brief | Translating intent into structured, buildable specifications |
| Working in Studio | Generating game logic, mechanics, interactions — automatically |
| Adding elements | Implementing scoring, timers, win conditions through conversation |
| Ready to publish | Guiding distribution, generating access links, supporting launch |

**The No-Code Promise:**

Creators describe what they want. Spark builds it. The creator never writes code, never configures complex logic, never learns a programming language. They talk to Spark. They arrange elements visually. Spark handles everything else.

### The Brief is Not Documentation — It's the Build Contract

When Spark generates a brief, that brief becomes the **agreed contract** between creator and AI. Spark then **implements** that brief automatically:
- Game mechanics are generated from the brief
- Scoring systems are built from the brief
- Win conditions are coded from the brief
- All tied to the Production ID

---

## 4. The Production ID: Universal Connector

Every project has a **Production ID** — the thread that connects everything across Spark, Studio, and Player.

```
Production ID: "prod_abc123"
        │
        ├── Spark Context
        │   └── Full conversation history
        │   └── Creator's intent and preferences
        │
        ├── Brief
        │   └── Agreed game design
        │   └── Experience type, mechanics, win conditions
        │
        ├── 4D Assets
        │   └── Reconstructed motion environments
        │   └── Source video references
        │   └── Frame sequences (per-timestamp PLYs)
        │
        ├── Library Objects
        │   └── Placed 3D objects and graphics
        │   └── Positions, scales, relationships
        │
        ├── Game Logic (Spark-generated)
        │   └── Scoring, timers, interactions, progression
        │   └── Win/loss conditions
        │   └── All implemented automatically from brief
        │
        └── Published Experience
            └── Player-facing version on Game View Player
            └── Analytics, engagement data
```

**Two paths into Studio:**

| Path | What Happens |
|------|--------------|
| **Spark → Studio** | Creator worked with Spark first. Brief exists. When 4D motion loads, Spark already knows the game design. Logic scaffolding is ready. |
| **Direct to Studio** | Creator skipped Spark. No brief yet. 4D motion loads as blank canvas. Creator can invoke Spark anytime to start designing. |

**Spark always has access to Production ID context.** When a creator says "add scoring," Spark knows what project they mean, what the brief says, and what's already built.

---

## 5. The Complete Pipeline

```
INPUT                    PROCESS                  CREATE                   SHIP
  │                         │                        │                       │
  ▼                         ▼                        ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ 2D Video      │     │ 2D → 4D       │     │ Studio        │     │ Game View     │
│               │     │ Reconstruction│     │               │     │ Player        │
│ • HD/4K/8K    │────▶│               │────▶│ • 4D motion   │────▶│               │
│ • Multi-camera│     │ • FFmpeg      │     │ • + Objects   │     │ "YouTube      │
│ • Standard    │     │ • COLMAP      │     │ • + Graphics  │     │  for 3D"      │
│   formats     │     │ • 4DGaussians │     │ • + Game logic│     │               │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
                                                    │
                                    ┌───────────────┴───────────────┐
                                    │            SPARK              │
                                    │   (Building in background)    │
                                    │                               │
                                    │ • Generates game mechanics    │
                                    │ • Implements scoring/timers   │
                                    │ • Creates interactions        │
                                    │ • Handles progression logic   │
                                    │ • All from natural language   │
                                    └───────────────────────────────┘
```

**Creator workflow (no code):**

1. **Talk to Spark** — "I want to build a treasure hunt for my students about local history"
2. **Create Brief** — Spark asks questions, refines the design, creator agrees
3. **Capture Video** — Shoot 2D footage (Spark advises on technique)
4. **Upload & Reconstruct** — Load 2D video → system creates 4D motion
5. **Arrange** — Drag/drop objects and graphics from library into 4D scene
6. **Refine with Spark** — "Add a 15-minute timer" / "Make scoring visible" / "Add hints"
7. **Publish** — Ship to Game View Player ("YouTube for 3D")

**At no point does the creator write code.**

---

## 6. Current Development Focus: 4D Motion in Browser

**Objective:** Render 4D motion reconstruction in the web-based Studio editor, with motion playback working.

### 6.1 What "Done" Looks Like

- [ ] User uploads 2D video files
- [ ] System reconstructs 2D → 4D motion (via Modal worker with 4DGaussians)
- [ ] Studio loads the 4D motion environment
- [ ] **Motion plays** — the scene is alive, not frozen
- [ ] User controls camera position/angle while motion continues
- [ ] User can play/pause/scrub timeline
- [ ] Timeline is connected to viewer (scrubbing changes the frame)

### 6.2 Current Implementation Approach

Per `docs/SPRINT_4D_MOTION.md`, we're using **per-frame PLY export**:
- 4DGaussians trains a model with temporal deformation
- `export_perframe_3DGS.py` exports standard PLY files per timestamp
- Existing `@mkkellogg/gaussian-splats-3d` viewer can load these PLYs
- Timeline scrubbing switches which PLY is displayed
- This gives us motion without building a custom WebGL renderer

### 6.3 Key Files

**Viewer:**
- `apps/studio/src/components/viewer/SceneViewer.tsx` — Main splat viewer
- `apps/studio/src/components/viewer/TemporalSceneViewer.tsx` — Frame-aware viewer (for motion)
- `apps/studio/src/lib/frame-playback.ts` — Playback controller

**Processing:**
- `packages/processing/modal_worker_4d.py` — 4D processing worker (uses 4DGaussians)
- `packages/processing/modal_worker.py` — Static 3D worker (legacy, for non-motion)

**Documentation:**
- `docs/SPRINT_4D_MOTION.md` — Active sprint plan
- `docs/4D_MOTION_ARCHITECTURE.md` — Technical research
- `docs/4D_HANDOFF.md` — Session handoff notes

### 6.4 Success Criteria

**The acid test:** Load a reconstructed 4D scene of a venue. Can you:
1. See the environment in 3D?
2. Move your viewpoint freely?
3. Watch motion happen around you as you move?
4. Control playback (play/pause/scrub)?

**If the scene is frozen/static, the implementation is not complete.**

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5, Tailwind CSS 3 |
| **Framework** | Next.js 14 (App Router) |
| **Auth** | Clerk |
| **Database** | Supabase (PostgreSQL), Prisma ORM |
| **AI** | Claude API (Anthropic) — powers Spark |
| **State** | Zustand |
| **3D/4D Rendering** | Three.js, React Three Fiber, @mkkellogg/gaussian-splats-3d |
| **4D Processing** | 4DGaussians, COLMAP, FFmpeg |
| **GPU Processing** | Modal (A10G instances) |
| **Build** | Turborepo, pnpm workspaces |
| **Deployment** | Vercel |

---

## 8. Common Mistakes to Avoid

### ❌ Don't treat this as static 3D Gaussian Splatting
The literature and most examples show static 3DGS. We need 4D with temporal motion. If you're implementing something that produces a single static PLY, stop and re-read Section 2.

### ❌ Don't treat Spark as a Phase 1 feature
Spark is persistent across all phases. If you're implementing something that assumes Spark "ends" after brief creation, stop and re-read Section 3.

### ❌ Don't forget the Production ID
Everything ties to the Production ID. If you're implementing something that doesn't reference the project/production context, stop and re-read Section 4.

### ❌ Don't build a custom WebGL 4D renderer (yet)
The current approach uses per-frame PLY export to work with the existing viewer. This is documented in `docs/SPRINT_4D_MOTION.md`. Don't over-engineer.

### ❌ Don't ignore the existing sprint plan
`docs/SPRINT_4D_MOTION.md` has checkboxes showing what's done and what's in progress. Check it before starting new work.

---

## 9. Quick Reference Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm dev              # Run Studio in development
pnpm build            # Build all packages
pnpm lint             # Run linting
pnpm typecheck        # Type check

# Current branch
git checkout claude/fix-splats-rendering-sh1k7

# Key docs to read
cat docs/SPRINT_4D_MOTION.md      # Active sprint plan
cat docs/4D_MOTION_ARCHITECTURE.md # Technical details
cat docs/4D_HANDOFF.md            # Session context
```

---

## 10. Questions? Context Missing?

If something is unclear or you need more context:
1. Check `docs/SPRINT_4D_MOTION.md` for current tasks
2. Check `docs/4D_HANDOFF.md` for recent session notes
3. Check `docs/4D_MOTION_ARCHITECTURE.md` for technical decisions
4. Ask — don't assume static 3D is acceptable

---

*This document should be read at the start of every Claude Code session.*
*Last updated: January 21, 2026*
