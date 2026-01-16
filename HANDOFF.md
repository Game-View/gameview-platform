# GAME VIEW STUDIO - SESSION HANDOFF DOCUMENT

## 1. PROJECT OVERVIEW

**Game View Studio** transforms real-world spaces into playable 3D experiences. Creators upload video footage of their venues, describe their vision through AI conversation, and publish interactive experiences their audiences can explore.

**Tagline:** Film your venue. Describe your vision. Publish your experience.

---

## 2. REPOSITORY STRUCTURE

### GitHub Organization: Game-View
https://github.com/Game-View

| Repository | Purpose | Primary Language | URL |
|------------|---------|------------------|-----|
| gameview-platform | Web platform (Studio, Player, API) | TypeScript | https://github.com/Game-View/gameview-platform |
| gvdw | Desktop application (C++ Qt) | C++ | https://github.com/Game-View/gvdw |
| gvdw-research | Research and experimental work | Python | https://github.com/Game-View/gvdw-research |

### Local Development Paths (Windows)

| Project | Local Path |
|---------|------------|
| Web Platform | C:\Users\james\gameview-platform-repo |
| Desktop App (legacy) | C:\Users\james\gvdw |

### Branch Strategy for gameview-platform

| Branch | Purpose |
|--------|---------|
| main | Production-ready code |
| development | Active development |
| claude/* | Claude Code working branches |

---

## 3. TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript 5, Tailwind CSS 3 |
| Framework | Next.js 14 (App Router) |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) + Prisma |
| AI | Claude API (Anthropic) |
| State | Zustand |
| 3D Rendering | Three.js, React Three Fiber |
| 3D Processing | OpenSplat (Gaussian Splatting) |
| GPU Compute | Modal (serverless GPU) |
| Build | Turborepo, pnpm workspaces |
| Deployment | Vercel |

---

## 4. CURRENT STATUS AUDIT (January 2026)

### Phase 1: SPARK (Sprints 1-10) - COMPLETE

| Feature | Status | Notes |
|---------|--------|-------|
| Spark Chat | Complete | AI conversation for vision discovery |
| Brief Generation | Complete | Auto-extract project specs |
| Brief Editing | Complete | Inline editing capability |
| Project Dashboard | Complete | Manage, search, filter projects |
| Command Palette | Complete | Cmd/Ctrl+K quick actions |
| Auth (Clerk) | Complete | User authentication |
| Database | Complete | Supabase + Prisma |

### Phase 2: BUILD (Sprints 11-18) - IN PROGRESS (~78%)

| Feature | Status | Notes |
|---------|--------|-------|
| Video Upload | Complete | Signed URL uploads to Supabase |
| 3D Processing | Complete | OpenSplat via Modal (8hr timeout, A10G GPU) |
| Scene Viewer | Complete | Three.js Gaussian Splat viewer |
| Import API | Complete | Desktop-rendered PLY import |
| Object Library | Implemented | UI, API, categories, search - needs drag-drop integration |
| Object Placement | Implemented | Placement works, transforms work - renders as boxes in playtest |
| Interaction Setup | Implemented | 9 trigger types, 11 actions - needs click/look runtime |
| Game Logic | Implemented | Win conditions, scoring, inventory, objectives, rewards |
| Testing Mode | Implemented | First-person controls, debug tools - **CRITICAL: objects render as boxes** |

**Critical Gap:** PlacedObjectsRenderer renders blue boxes instead of GLTF models during playtest. See `docs/SPRINT_PLAN_PHASE2.md` for fix plan.

### Phase 3: PLATFORM (Sprints 19-22) - NOT STARTED

Publishing Flow, Discovery/Browse, Player Experience, Analytics, Player Payments, Prize Pools

---

## 5. IMMEDIATE PRIORITIES

1. Connect Vercel to gameview-platform repo
2. Configure environment variables
3. Sprint plan for Phase 2 completion

---

## 6. ENVIRONMENT VARIABLES NEEDED

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
MODAL_ENDPOINT_URL=

---

## 7. STARTING A NEW CLAUDE CODE SESSION

1. Go to https://claude.ai/code
2. Start new session
3. Connect to Game-View/gameview-platform on development branch
4. Paste context about current state

---

Document Version: 1.0
Last Updated: January 16, 2026
