# @gameview/ui

Shared React UI component library for the Game View platform.

## Installation

```bash
pnpm add @gameview/ui
```

## Usage

```tsx
import { Button, Card, ProcessingProgress } from '@gameview/ui';
import '@gameview/ui/styles.css';

function App() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

## Components

### Core Components

| Component | Description |
|-----------|-------------|
| `Button` | Primary action button with variants |
| `Input` | Text input field |
| `Label` | Form field label |
| `Select` | Dropdown select menu |
| `Progress` | Progress bar indicator |
| `Card` | Container with header/content/footer |
| `Dialog` | Modal dialog overlay |
| `Tabs` | Tabbed content navigation |
| `Table` | Data table with header/body/footer |
| `Toast` | Notification toast messages |
| `Badge` | Status/label badges |
| `Spinner` | Loading spinner |

### Domain Components

| Component | Description |
|-----------|-------------|
| `VideoDropZone` | Drag-and-drop area for video import |
| `VideoThumbnail` | Video preview card with metadata |
| `PresetSelector` | Quality preset dropdown |
| `ProcessingProgress` | Multi-stage progress display |

## Development

### Storybook

Run Storybook for component development:

```bash
pnpm storybook
```

This starts Storybook at `http://localhost:6006`.

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

## Design System

### Colors

The component library uses Game View's color palette:

- **Primary**: Blue (`gv-primary-*`)
- **Accent**: Green (`gv-accent-*`)
- **Neutral**: Gray (`gv-neutral-*`)

### Typography

- Font: Inter (system fallback)
- Monospace: JetBrains Mono

### Theming

Components support light and dark themes via the `dark` class on a parent element:

```tsx
<div className="dark">
  <Button>Dark mode button</Button>
</div>
```

## Examples

### Processing Progress

```tsx
import { ProcessingProgress } from '@gameview/ui';

<ProcessingProgress
  progress={{
    stage: 'running_colmap',
    progress: 55,
    message: 'Running feature matching...',
    currentStep: 2,
    totalSteps: 4,
  }}
/>
```

### Video Thumbnail Grid

```tsx
import { VideoThumbnail } from '@gameview/ui';

<div className="grid grid-cols-3 gap-4">
  {videos.map((video) => (
    <VideoThumbnail
      key={video.id}
      name={video.name}
      duration={video.duration}
      width={video.width}
      height={video.height}
      onRemove={() => handleRemove(video.id)}
    />
  ))}
</div>
```

### Dialog with Form

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label
} from '@gameview/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>New Production</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Production</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input placeholder="My Production" />
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## License

Proprietary - Game View Technology
