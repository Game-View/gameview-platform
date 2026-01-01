# Game View Brand Assets

Place logo files in this directory:

## Required Files

- `logo.png` - Main logo (the rabbit, ~200x200 or larger)
- `logo-icon.png` - Icon version (square, 64x64 or 128x128)
- `favicon.ico` - Favicon for browser tabs (should be in /public root)

## Logo Specifications

- **Primary Color**: Coral/Orange gradient (#f97066 → #fbbf24)
- **Outline**: Dark blue (#1e293b)
- **Style**: Stylized running rabbit

## Usage in Code

```tsx
// In Next.js components
import Image from 'next/image';

<Image src="/images/brand/logo.png" alt="Game View" width={200} height={200} />
```

## Clerk Dashboard Upload

Upload `logo.png` to:
- Clerk Dashboard → Customization → Branding → Logo

## Sizes Needed

| Purpose          | Recommended Size |
|-----------------|------------------|
| Favicon         | 32x32, 16x16     |
| App Icon        | 192x192, 512x512 |
| Clerk Logo      | 200x200 min      |
| Social sharing  | 1200x630         |
