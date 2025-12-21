# Game View Platform

Unified monorepo for all Game View products using React, TypeScript, and Tauri.

## Architecture

```
gameview-platform/
├── apps/
│   ├── desktop/     # Tauri desktop application
│   ├── hub/         # Game View Hub (Next.js) - coming soon
│   ├── studio/      # Game View Studio (Next.js) - coming soon
│   └── player/      # Game View Player (Next.js) - coming soon
├── packages/
│   ├── ui/          # Shared React components (@gameview/ui)
│   ├── types/       # TypeScript types (@gameview/types)
│   ├── config/      # Shared configs (@gameview/config)
│   ├── api/         # API client (@gameview/api)
│   └── splat/       # 3D Gaussian Splat viewer (@gameview/splat)
└── core/            # gvcore-cli reference (C++)
```

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

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run desktop app in development
pnpm --filter desktop dev

# Run with Tauri
pnpm --filter desktop tauri:dev
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

- **Frontend**: React 18, TypeScript 5, Tailwind CSS 3
- **Desktop**: Tauri 2 (Rust)
- **Build**: Turborepo, Vite, tsup
- **State**: Zustand
- **3D**: Three.js, React Three Fiber

## Processing Engine

The desktop app uses `gvcore-cli` for video processing:
- Frame extraction (OpenCV/FFmpeg)
- Structure from Motion (COLMAP)
- 3D Gaussian Splatting (Brush)

See `core/` for CLI source code and documentation.

## License

Proprietary - Game View Technology
