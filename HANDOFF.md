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

### Phase 2: BUILD (Sprints 11-18) - COMPLETE ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Video Upload | Complete | Signed URL uploads to Supabase |
| 3D Processing | Complete | OpenSplat via Modal (8hr timeout, A10G GPU) |
| Scene Viewer | Complete | Three.js Gaussian Splat viewer |
| Import API | Complete | Desktop-rendered PLY import |
| Object Library | Complete | UI, API, categories, search, drag-drop |
| Object Placement | Complete | Placement, transforms, GLTF rendering |
| Interaction Setup | Complete | 9 trigger types, 11 actions, click/look runtime |
| Game Logic | Complete | Win conditions, scoring, inventory, objectives, rewards |
| Testing Mode | Complete | First-person controls, GLTF models, audio, debug tools |
| Portal Navigation | Complete | Scene transitions, spawn points, portal editor |
| Testing Checklist | Complete | Auto-generated validation |
| Publish Flow | Complete | Pre-publish validation, shareable URLs |

**Phase 2 Exit Criteria Met:** Creator can upload video, process to 3D, place objects, configure interactions, define win conditions, and test the complete experience — without writing code.

### Phase 3: PLATFORM (Sprints 19-22) - READY TO START

| Feature | Status | Notes |
|---------|--------|-------|
| Publishing Flow | Partially Done | API exists, modal created, needs player app integration |
| Discovery/Browse | Not Started | Player app needs experience browser |
| Player Experience | Not Started | Player app needs playable experience viewer |
| Analytics | Not Started | Creator analytics dashboard |
| Player Payments | Not Started | Stripe integration for paid experiences |
| Prize Pools | Not Started | Competitive experience rewards |

---

## 5. IMMEDIATE PRIORITIES

1. Test Phase 2 end-to-end (video → 3D → objects → interactions → playtest)
2. Begin Phase 3: PLATFORM development
3. Integrate publish flow with player app
4. Build discovery/browse for player app

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
