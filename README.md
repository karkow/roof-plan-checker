# Dachplan-Prüfer (Roof Plan Checker)

Eine Next.js-Anwendung, die Google Gemini Vision AI verwendet, um handgezeichnete und CAD-Dachpläne zu vergleichen und Unterschiede zu identifizieren.

## Features

- Upload von handgezeichneten Referenzplänen und CAD-Plänen
- KI-gestützter Vergleich mit Gemini 2.5 Flash
- Deutsche Benutzeroberfläche und KI-Antworten
- Visuelle Markierungen auf erkannten Unterschieden
- Schweregrad-Klassifizierung (kritisch, schwerwiegend, geringfügig)
- **Lupe**: Vergrößerungsglas beim Hover über das Bild für Details
- **Vergleichs-Slider**: Interaktiver Slider zum Vergleich von Handzeichnung und CAD-Plan
- Detaillierte Analyse mit Empfehlungen

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Google Gemini 2.5 Flash
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Google AI API key:
   ```
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

   Get a key at: https://makersuite.google.com/app/apikey

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Usage

1. Handgezeichneten Dachplan hochladen (Referenz)
2. CAD-Plan hochladen (zu prüfen)
3. "Pläne vergleichen" klicken
4. Analyseergebnisse und markierte Unterschiede prüfen
5. Lupe und Vergleichs-Slider nutzen für detaillierte Inspektion

## Project Structure

```
├── app/
│   ├── api/compare-plans/route.ts  # API endpoint
│   ├── page.tsx                     # Main page (German UI)
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ImageUploader.tsx            # Image upload component
│   └── MarkedImage.tsx              # Image with markers, magnifier & comparison slider
├── lib/
│   └── gemini.ts                    # Gemini API client (German prompts)
└── .env.local                       # Environment variables
```

## License

MIT
