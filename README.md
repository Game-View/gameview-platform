# Game View Platform

Unified monorepo for all Game View products. Transform video into playable 3D experiences.

**Film your venue. Describe your vision. Publish your experience.**

## Architecture

```
gameview-platform/
├── apps/
│   ├── studio/      # Game View Studio (Next.js) - Phase 1 COMPLETE
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # API clients, utilities
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── stores/        # Zustand state stores
│   │   └── docs/              # Studio documentation
│   ├── hub/         # Game View Hub (Next.js) - coming soon
│   └── player/      # Game View Player (Next.js) - coming soon
├── packages/
│   ├── ui/          # Shared React components (@gameview/ui)
│   ├── types/       # TypeScript types (@gameview/types)
│   ├── config/      # Shared configs (@gameview/config)
│   ├── api/         # API client (@gameview/api)
│   └── splat/       # 3D Gaussian Splat viewer (@gameview/splat)
└── core/            # gvcore-cli reference (C++)
```

## Game View Studio (Phase 1 Complete)

The AI-powered creator platform:

| Feature | Description |
|---------|-------------|
| **SPARK** | AI conversation to discover project vision |
| **Brief Extraction** | Auto-extract project specs from chat |
| **Dashboard** | Manage, search, filter projects |
| **Inline Editing** | Edit briefs directly |
| **Command Palette** | Cmd/Ctrl+K quick actions |
| **Toast Notifications** | User feedback system |

### Quick Start - Studio

```bash
# Install dependencies
pnpm install

# Run Studio in development
pnpm --filter studio dev
```

Open http://localhost:3000

See [Studio Developer Guide](apps/studio/docs/STUDIO_GUIDE.md) for complete documentation.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Rust 1.75+ (for Tauri desktop app)

### Platform-Specific

**Windows:**
- Visual Studio Build Tools

**Linux:**
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
```

## Development

### Package Scripts

```bash
# Build all packages
pnpm build

# Run linting
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format
```

### Run Individual Apps

```bash
# Studio (Next.js)
pnpm --filter studio dev

# Desktop (Tauri) - coming soon
pnpm --filter desktop tauri:dev
```

### Adding a New Package

1. Create directory in `packages/` or `apps/`
2. Add `package.json` with `workspace:*` dependencies
3. Run `pnpm install` to link packages

### Shared Components

The `@gameview/ui` package contains all shared React components:

```tsx
import { Button, Card, ProcessingProgress } from '@gameview/ui';
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript 5, Tailwind CSS 3 |
| **Framework** | Next.js 14 (App Router) |
| **Auth** | Clerk |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Claude API (Anthropic) |
| **State** | Zustand |
| **3D** | Three.js, React Three Fiber |
| **Build** | Turborepo, pnpm workspaces |

## Processing Engine

The `gvcore-cli` processes video into 3D Gaussian Splats:

```bash
gvcore-cli run \
  --input video1.mp4 \
  --input video2.mp4 \
  --output ./output \
  --brush-path /path/to/brush_app
```

Pipeline stages:
1. Frame extraction (FFmpeg)
2. Structure from Motion (COLMAP)
3. 3D Gaussian Splatting (Brush)

See [CLI Documentation](/cli/README.md) for details.

## Documentation

| Document | Description |
|----------|-------------|
| [Game View Guide](/docs/GAME_VIEW_GUIDE.md) | Complete platform overview |
| [Studio Guide](apps/studio/docs/STUDIO_GUIDE.md) | Studio developer documentation |
| [CLI README](/cli/README.md) | Processing CLI documentation |

## Development Phases

### Phase 1: SPARK (Complete)
- AI conversation for project discovery
- Brief extraction and persistence
- Project dashboard with management

### Phase 2: BUILD (Next)
- Video upload and processing
- 3D Gaussian Splat viewer
- Scene building tools
- Interaction placement

### Phase 3: PLATFORM (Future)
- Experience publishing
- Creator marketplace
- Player experience

## License

Proprietary - Game View Technology
