# Game View Platform

Unified monorepo for all Game View products. Transform 2D video into playable 4D motion experiences.

**Film your venue. Describe your vision. Publish your experience.**

---

## What Makes Game View Different

Game View is the **inverse of traditional game engines**:

| Traditional Engines | Game View |
|---------------------|-----------|
| Build synthetic 3D worlds | Capture real-world 2D video |
| Bolt on real imagery | Reconstruct video into 4D motion |
| Animated/simulated motion | Real, captured, preserved motion |
| Virtual worlds mimicking reality | Real worlds made interactive |

**The Core Technology: 4D Motion Reconstruction**

We reconstruct standard 2D video (HD/4K/8K from any camera) into **4D motion environments** — user-controllable 3D worlds where time and motion are preserved. Players don't explore a frozen snapshot; they're inside living footage, controlling their viewpoint while the world moves around them.

> **Motion is the entire value proposition.** Without motion, we're "just another 3D viewer." With motion, we're creating an entirely new category of content.

---

## Architecture

```
gameview-platform/
├── apps/
│   ├── studio/      # Game View Studio (Next.js) - Creator platform
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router pages
│   │   │   ├── components/    # React components (viewers, editor, timeline)
│   │   │   ├── lib/           # API clients, frame playback, utilities
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── stores/        # Zustand state stores
│   │   └── docs/              # Studio documentation
│   ├── hub/         # Game View Hub (Next.js) - coming soon
│   └── player/      # Game View Player (Next.js) - "YouTube for 3D"
├── packages/
│   ├── ui/          # Shared React components (@gameview/ui)
│   ├── types/       # TypeScript types (@gameview/types)
│   ├── config/      # Shared configs (@gameview/config)
│   ├── api/         # API client (@gameview/api)
│   └── processing/  # GPU processing workers (Modal)
├── docs/            # Platform documentation
│   ├── SPRINT_4D_MOTION.md        # Active sprint plan
│   ├── 4D_MOTION_ARCHITECTURE.md  # Technical research
│   ├── 4D_HANDOFF.md              # Session handoff notes
│   └── PRODUCT_BRIEF.md           # Product vision
└── CLAUDE.md        # AI assistant instructions (read first!)
```

---

## Spark: The Persistent AI Companion

Spark is not a feature — **Spark is always present**.

Powered by Anthropic's Claude, Spark is the AI companion that understands what creators want to build and **codes their game in the background**. Creators never write code. They describe, arrange, and publish.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SPARK                                          │
│            Persistent AI companion across the entire journey                │
└─────────────────────────────────────────────────────────────────────────────┘
        │                    │                    │                    │
        ▼                    ▼                    ▼                    ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ CAPTURE │          │  BRIEF  │          │ STUDIO  │          │ PUBLISH │
   └─────────┘          └─────────┘          └─────────┘          └─────────┘

"How should I         "I want a treasure   "Add a timer and     "How do players
 record my venue?"     hunt for my class"   scoring system"      access this?"
```

| Feature | Description |
|---------|-------------|
| **Capture Guidance** | Spark advises on camera angles, lighting, coverage |
| **Brief Creation** | AI conversation to discover and refine project vision |
| **Auto-Implementation** | Spark generates game mechanics, scoring, interactions from the brief |
| **In-Editor Assistance** | "Add a 10-minute timer" → Spark builds it |
| **Publishing Support** | Guidance on distribution, access links, launch |

---

## The Pipeline: 2D Video → 4D Motion → Game

```
2D VIDEO              RECONSTRUCT              STUDIO                 PLAYER
   │                      │                       │                      │
   ▼                      ▼                       ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ HD/4K/8K     │    │ 4DGaussians  │    │ 4D motion        │    │ Game View    │
│ Multi-camera │───▶│ COLMAP       │───▶│ + Objects        │───▶│ Player       │
│ Any camera   │    │ FFmpeg       │    │ + Spark logic    │    │              │
│              │    │              │    │ + Interactions   │    │ "YouTube     │
│              │    │ (Modal GPU)  │    │                  │    │  for 3D"     │
└──────────────┘    └──────────────┘    └──────────────────┘    └──────────────┘
```

**Processing Pipeline:**
1. **Frame extraction** (FFmpeg) — Extract frames with timestamps
2. **Structure from Motion** (COLMAP) — Compute camera poses
3. **4D Gaussian Splatting** (4DGaussians) — Train temporal model
4. **Per-frame export** — Standard PLY files per timestamp
5. **Upload** — Frame sequence to Supabase Storage

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run Studio in development
pnpm --filter studio dev

# Open http://localhost:3000
```

### Prerequisites

- Node.js 20+
- pnpm 9+

### Development Commands

```bash
pnpm build        # Build all packages
pnpm lint         # Run linting
pnpm typecheck    # Type check
pnpm format       # Format code
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5, Tailwind CSS 3 |
| **Framework** | Next.js 14 (App Router) |
| **Auth** | Clerk |
| **Database** | Supabase (PostgreSQL), Prisma ORM |
| **AI** | Claude API (Anthropic) — powers Spark |
| **State** | Zustand |
| **4D Rendering** | Three.js, React Three Fiber, @mkkellogg/gaussian-splats-3d |
| **4D Processing** | 4DGaussians, COLMAP, FFmpeg |
| **GPU** | Modal (A10G instances) |
| **Build** | Turborepo, pnpm workspaces |
| **Deploy** | Vercel |

---

## Current Development Focus

**Active Sprint:** 4D Motion Implementation

The platform currently supports static 3D rendering. We're implementing true 4D motion where objects and people move in 3D space — matching the desktop app capability.

| Status | Component |
|--------|-----------|
| ✅ Complete | Spark brief creation |
| ✅ Complete | Static splat rendering |
| ✅ Complete | First-person controls (WASD, mouse look) |
| ✅ Complete | Timeline UI |
| 🔄 In Progress | **4D motion playback** |
| 🔄 In Progress | **Timeline ↔ Viewer connection** |
| ⏳ Next | Object placement in 4D scenes |
| ⏳ Next | Spark game logic integration |

**See:** `docs/SPRINT_4D_MOTION.md` for detailed task list

---

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | **Read first** — AI assistant instructions |
| [Sprint Plan](./docs/SPRINT_4D_MOTION.md) | Active sprint tasks and progress |
| [4D Architecture](./docs/4D_MOTION_ARCHITECTURE.md) | Technical research and decisions |
| [Handoff Notes](./docs/4D_HANDOFF.md) | Session context for continuity |
| [Product Brief](./docs/PRODUCT_BRIEF.md) | Product vision and requirements |

---

## For AI Assistants (Claude Code)

**Before writing any code, read `CLAUDE.md` in the repo root.**

Key points:
1. **4D motion is the foundation** — not static 3D Gaussian Splatting
2. **Spark is persistent** — not just a Phase 1 feature
3. **Production ID connects everything** — Spark, Studio, Player
4. **Check the sprint plan** — `docs/SPRINT_4D_MOTION.md` has current tasks

If your implementation produces a frozen/static scene, it's wrong.

---

## License

Proprietary - Game View Technology
