# Dachplan-Prüfer (Roof Plan Checker)

## Overview

A Next.js app using Google Gemini 2.5 Flash to compare hand-drawn and CAD roof plans. The UI and AI responses are in German. Supports both image and PDF uploads.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS, shadcn/ui
- Google Gemini 2.5 Flash
- pdf2pic (ImageMagick) for PDF conversion

## System Requirements

For PDF support, the server needs:
- ImageMagick
- Ghostscript
- ImageMagick policy configured to allow PDF processing

See README.md for detailed installation instructions.

## Project Structure

```
app/
├── api/compare-plans/route.ts  # POST endpoint, handles PDF conversion
├── page.tsx                     # Main UI (German, client component)
├── test/page.tsx                # Test page for MarkedImage component
├── layout.tsx
└── globals.css

components/
├── ImageUploader.tsx            # File upload with preview (images + PDF)
└── MarkedImage.tsx              # Canvas with markers, magnifier & comparison slider

lib/
├── gemini.ts                    # Gemini API client (German prompts)
└── pdf-to-image.ts              # PDF to JPEG conversion using ImageMagick
```

## Key Files

- `lib/gemini.ts` - `compareRoofPlans()` sends two images to Gemini with German prompts; returns structured JSON with differences. Uses term "Einbauteile" for roof components (windows, vents, chimneys).
- `lib/pdf-to-image.ts` - Converts PDF first page to JPEG using pdf2pic/ImageMagick
- `app/api/compare-plans/route.ts` - Handles multipart form upload, converts PDFs to images, calls Gemini, returns results with converted images
- `components/MarkedImage.tsx` - Draws numbered circles on canvas, includes:
  - **Magnifying glass**: 2.5x zoom on mouse hover (uses full image resolution)
  - **Comparison slider**: Drag to compare handdrawn (left) vs CAD (right)
  - Three view modes: CAD-Plan, Handzeichnung, Vergleichs-Slider
  - Magnifier shows correct image based on slider position

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
  images: {
    handdrawn: string;  // data URL (base64)
    cad: string;        // data URL (base64)
  };
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

## Test Page

Access `/test` to test the MarkedImage component with sample images without waiting for AI analysis.
