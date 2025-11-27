# Dachplan-Prüfer (Roof Plan Checker)

## Overview

A Next.js app using Google Gemini 2.5 Flash to compare hand-drawn and CAD roof plans. The UI and AI responses are in German.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS, shadcn/ui
- Google Gemini 2.5 Flash

## Project Structure

```
app/
├── api/compare-plans/route.ts  # POST endpoint for image comparison
├── page.tsx                     # Main UI (German, client component)
├── layout.tsx
└── globals.css

components/
├── ImageUploader.tsx            # File upload with preview
└── MarkedImage.tsx              # Canvas with markers, magnifier & comparison slider

lib/
└── gemini.ts                    # Gemini API client (German prompts)
```

## Key Files

- `lib/gemini.ts` - `compareRoofPlans()` sends two images to Gemini with German prompts; returns structured JSON with differences. Uses term "Einbauteile" for roof components (windows, vents, chimneys).
- `app/api/compare-plans/route.ts` - Handles multipart form upload, converts to base64, calls Gemini
- `components/MarkedImage.tsx` - Draws numbered circles on canvas, includes:
  - **Magnifying glass**: 2.5x zoom on mouse hover
  - **Comparison slider**: Drag to compare handdrawn (left) vs CAD (right)
  - Three view modes: CAD-Plan, Handzeichnung, Vergleichs-Slider

## API Response Format

```typescript
interface ComparisonResult {
  summary: string;
  totalDifferences: number;
  differences: Array<{
    id: number;
    location: string;
    type: string;
    description: string;
    severity: "critical" | "major" | "minor";
    coordinates?: { x: number; y: number };  // percentage from top-left
  }>;
  recommendation: string;
}
```

## Commands

```bash
npm run dev    # Development server
npm run build  # Production build
npm run start  # Start production
npm run lint   # ESLint
```

## Environment Variables

```
GOOGLE_AI_API_KEY=...  # Required - Google AI Studio API key
```

## Terminology

- **Einbauteile**: Roof components like skylights, vents, chimneys (squares/rectangles in roof plans)
- Severity levels: kritisch (critical), schwerwiegend (major), geringfügig (minor)
