# Game View Studio - Developer Guide

**AI-powered creative platform for building 3D experiences**

Version: 1.0.0 (Phase 1 Complete)
Last Updated: December 24, 2024

---

## Overview

Game View Studio is the creator-facing application where users:
1. **SPARK** - Describe their vision through AI conversation
2. **BUILD** - Upload videos and construct 3D scenes (Phase 2)
3. **PUBLISH** - Share experiences to the marketplace (Phase 3)

---

## Quick Start

```bash
cd gameview-platform
pnpm install
pnpm --filter studio dev
```

Open http://localhost:3000

---

## Architecture

### Directory Structure

```
studio/src/
├── app/                              # Next.js App Router
│   ├── api/                          # API Routes
│   │   ├── chat/route.ts             # Claude AI streaming endpoint
│   │   ├── brief/
│   │   │   └── extract/route.ts      # Extract brief from conversation
│   │   ├── briefs/
│   │   │   ├── route.ts              # GET all, POST new brief
│   │   │   └── [id]/route.ts         # GET, PATCH, DELETE brief
│   │   └── profile/route.ts          # User profile CRUD
│   ├── dashboard/page.tsx            # Project dashboard
│   ├── spark/page.tsx                # AI conversation (SPARK)
│   ├── settings/page.tsx             # User settings
│   ├── onboarding/page.tsx           # Creator onboarding flow
│   ├── sign-in/[[...sign-in]]/       # Clerk sign-in
│   ├── sign-up/[[...sign-up]]/       # Clerk sign-up
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Landing page
│   └── globals.css                   # Global styles
├── components/
│   ├── brief/
│   │   ├── BriefPanel.tsx            # Slide-out brief drawer
│   │   └── EditableField.tsx         # Inline edit components
│   ├── chat/
│   │   ├── ChatInput.tsx             # Message input with submit
│   │   ├── ChatMessage.tsx           # Message bubble component
│   │   └── SparkWelcome.tsx          # Initial welcome screen
│   ├── providers/
│   │   └── AppProviders.tsx          # Global providers wrapper
│   └── ui/
│       ├── CommandPalette.tsx        # Cmd+K quick actions
│       ├── ConfirmModal.tsx          # Confirmation dialogs
│       └── Toast.tsx                 # Toast notifications
├── hooks/
│   └── useKeyboardShortcut.ts        # Keyboard shortcut hook
├── lib/
│   ├── claude.ts                     # Claude API client
│   ├── briefs.ts                     # Brief database operations
│   ├── profile.ts                    # Profile database operations
│   ├── spark-prompt.ts               # AI system prompt
│   └── supabase.ts                   # Supabase client
├── stores/
│   ├── chat-store.ts                 # Chat state (Zustand)
│   └── toast-store.ts                # Toast state (Zustand)
├── middleware.ts                     # Auth middleware
└── supabase/
    └── migrations/
        ├── 001_create_profiles.sql   # Profiles table
        └── 002_create_briefs.sql     # Briefs table
```

---

## Key Components

### 1. Chat System (`/spark`)

The SPARK page enables AI-powered conversations to discover project requirements.

#### Chat Store (`stores/chat-store.ts`)

```typescript
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  conversationPhase: ConversationPhase;
  extractedBrief: ExtractedBrief | null;
  addMessage: (role, content) => void;
  startStreaming: (messageId) => void;
  appendToStream: (messageId, content) => void;
  finishStreaming: (messageId) => void;
  loadMessages: (savedMessages) => void;
  clearMessages: () => void;
}
```

#### Claude Integration (`lib/claude.ts`)

```typescript
export async function* streamMessage(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): AsyncGenerator<string> {
  // Streams responses using SSE from /api/chat
}
```

#### API Route (`api/chat/route.ts`)

- Model: `claude-sonnet-4-20250514`
- Max tokens: 4096
- Streaming: Server-Sent Events (SSE)

### 2. Brief System

Briefs are structured project specifications extracted from conversations.

#### Brief Interface

```typescript
interface ExtractedBrief {
  name: string;
  tagline: string;
  concept: string;
  experienceType: string;
  venueType: string;
  playerMode: 'single' | 'multiplayer' | 'both';
  keyFeatures: string[];
  targetAudience: string;
  winCondition: string;
  collectibles: string[];
  estimatedScenes: number;
  completeness: number;
}
```

#### Brief Extraction (`api/brief/extract/route.ts`)

Uses Claude to analyze conversation and extract structured brief:

```typescript
// Returns:
{
  brief: ExtractedBrief,
  missingElements: string[],
  suggestedQuestions: string[]
}
```

#### Brief CRUD (`lib/briefs.ts`)

```typescript
export async function createBrief(userId, data): Promise<Brief>
export async function getBriefById(id): Promise<Brief | null>
export async function getBriefsByUser(userId): Promise<Brief[]>
export async function updateBrief(id, data): Promise<Brief>
export async function archiveBrief(id): Promise<Brief>
```

### 3. Dashboard (`/dashboard`)

Project management with search, filter, and CRUD operations.

#### Features
- Search by name, tagline, concept
- Filter by status (All, Drafts, In Progress, Ready, Archived)
- Archive/restore projects
- Delete with confirmation
- Continue editing with "Continue with Spark"
- Completeness progress bars

### 4. Toast Notifications

Global toast system for user feedback.

#### Usage

```typescript
import { toast } from '@/stores/toast-store';

// Success
toast.success('Saved!', 'Your brief has been saved');

// Error
toast.error('Error', 'Failed to save brief');

// Info
toast.info('Tip', 'Press Cmd+K for quick actions');

// Warning
toast.warning('Warning', 'Unsaved changes will be lost');
```

### 5. Command Palette

Keyboard-driven quick actions (Cmd/Ctrl+K).

#### Available Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| Start with Spark | Begin new AI conversation | S |
| Go to Dashboard | View projects | D |
| New Project | Create blank project | N |
| Settings | Manage account | - |
| View All Projects | Browse saved projects | - |

### 6. Keyboard Shortcuts

#### Hook Usage

```typescript
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

useKeyboardShortcut({
  key: 'k',
  modifiers: ['meta'], // or 'ctrl' - cross-platform
  callback: () => setIsOpen(true),
  disabled: false,
});
```

---

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  name TEXT,
  creator_type TEXT,             -- 'musician', 'brand', etc.
  experience_type TEXT,          -- 'treasure_hunt', 'tour', etc.
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Briefs Table

```sql
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT,
  tagline TEXT,
  concept TEXT,
  experience_type TEXT,
  venue_type TEXT,
  player_mode TEXT,
  key_features TEXT[],
  target_audience TEXT,
  win_condition TEXT,
  collectibles TEXT[],
  estimated_scenes INTEGER,
  completeness INTEGER,
  status TEXT DEFAULT 'draft',
  conversation_history JSONB,     -- Stored messages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_briefs_user_id ON briefs(user_id);
CREATE INDEX idx_briefs_status ON briefs(status);
```

---

## API Reference

### POST /api/chat

Stream AI conversation responses.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "I want to create a treasure hunt" }
  ]
}
```

**Response:** Server-Sent Events stream

### POST /api/brief/extract

Extract brief from conversation.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "brief": { ... },
  "missingElements": ["venue type", "win condition"],
  "suggestedQuestions": ["What venue will this take place in?"]
}
```

### GET /api/briefs

Get all briefs for current user.

### POST /api/briefs

Create new brief.

### GET /api/briefs/[id]

Get specific brief.

### PATCH /api/briefs/[id]

Update brief fields.

### DELETE /api/briefs/[id]

Delete brief.

---

## Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Design Tokens

### Colors (Tailwind)

```css
/* Use in className */
bg-gv-neutral-900      /* #0f172a - Main background */
bg-gv-neutral-800      /* #1e293b - Cards, panels */
border-gv-neutral-700  /* #334155 - Borders */
text-gv-neutral-500    /* #64748b - Muted text */
text-gv-neutral-400    /* #94a3b8 - Secondary text */

bg-gv-primary-500      /* #f97066 - Primary accent */
text-gv-primary-400    /* Lighter primary */
```

### Border Radius

```css
rounded-gv             /* 8px - Standard */
rounded-gv-lg          /* 12px - Cards */
```

---

## Phase 2 Integration Points

### Video Upload

```typescript
// Planned: apps/studio/src/app/api/videos/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const videos = formData.getAll('videos');
  // Upload to storage, trigger gvcore-cli processing
}
```

### CLI Integration

```typescript
// Planned: apps/studio/src/lib/processing.ts
export async function processVideos(briefId: string, videos: string[]) {
  // Call gvcore-cli run
  // Parse progress from stdout
  // Update brief with processing status
}
```

### 3D Viewer

```typescript
// Planned: apps/studio/src/components/viewer/SplatViewer.tsx
import { Canvas } from '@react-three/fiber';
import { GaussianSplats } from '@gameview/splat';

export function SplatViewer({ plyUrl }: { plyUrl: string }) {
  return (
    <Canvas>
      <GaussianSplats url={plyUrl} />
    </Canvas>
  );
}
```

---

## Testing

```bash
# Run linting
pnpm --filter studio lint

# Type check
pnpm --filter studio typecheck

# Build
pnpm --filter studio build
```

---

## Deployment

### Vercel

```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

### Environment Setup

1. Add all environment variables in Vercel dashboard
2. Configure Clerk allowed origins
3. Configure Supabase URL allowlist

---

## Troubleshooting

### "Clerk authentication error"

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Check Clerk dashboard for allowed domains

### "Supabase connection failed"

- Verify `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
- Check RLS policies if using anon key

### "Claude API error"

- Verify `ANTHROPIC_API_KEY` is valid
- Check rate limits

### "ESLint errors"

- Use `&ldquo;` and `&rdquo;` for quotes in JSX
- Run `pnpm --filter studio lint --fix`

---

## Related Documentation

- [Game View Guide](/docs/GAME_VIEW_GUIDE.md) - Platform overview
- [CLI README](/cli/README.md) - Processing CLI
- [Phase 2 Sprint Plan](#) - Upcoming features

---

*Film your venue. Describe your vision. Publish your experience.*
