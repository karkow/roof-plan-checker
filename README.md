# Dachplan-Prüfer (Roof Plan Checker)

Eine Next.js-Anwendung, die Google Gemini Vision AI verwendet, um handgezeichnete und CAD-Dachpläne zu vergleichen und Unterschiede zu identifizieren.

## Features

- Upload von handgezeichneten Referenzplänen und CAD-Plänen (Bilder und PDF)
- KI-gestützter Vergleich mit Gemini 2.5 Flash
- Deutsche Benutzeroberfläche und KI-Antworten
- Visuelle Markierungen auf erkannten Unterschieden
- Schweregrad-Klassifizierung (kritisch, schwerwiegend, geringfügig)
- **Lupe**: Vergrößerungsglas beim Hover über das Bild für Details
- **Vergleichs-Slider**: Interaktiver Slider zum Vergleich von Handzeichnung und CAD-Plan
- **PDF-Support**: Automatische Konvertierung von PDF zu Bild
- Detaillierte Analyse mit Empfehlungen

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Google Gemini 2.5 Flash
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **PDF Processing**: pdf2pic (ImageMagick)

## Setup

### 1. System Dependencies (for PDF support)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install imagemagick ghostscript
```

**CentOS/RHEL/Fedora:**
```bash
sudo dnf install ImageMagick ghostscript
```

**Arch Linux:**
```bash
sudo pacman -S imagemagick ghostscript
```

**ImageMagick Policy Fix (required for PDF processing):**

Edit the ImageMagick policy file:
```bash
sudo nano /etc/ImageMagick-6/policy.xml
# or
sudo nano /etc/ImageMagick-7/policy.xml
```

Find and change:
```xml
<policy domain="coder" rights="none" pattern="PDF" />
```
To:
```xml
<policy domain="coder" rights="read|write" pattern="PDF" />
```

Verify installation:
```bash
convert --version
gs --version
```

### 2. Node.js Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` with your Google AI API key:
```
GOOGLE_AI_API_KEY=your_api_key_here
```

Get a key at: https://makersuite.google.com/app/apikey

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

## Usage

1. Handgezeichneten Dachplan hochladen (Referenz) - Bild oder PDF
2. CAD-Plan hochladen (zu prüfen) - Bild oder PDF
3. "Pläne vergleichen" klicken
4. Analyseergebnisse und markierte Unterschiede prüfen
5. Lupe und Vergleichs-Slider nutzen für detaillierte Inspektion

## Project Structure

```
├── app/
│   ├── api/compare-plans/route.ts  # API endpoint (handles PDF conversion)
│   ├── page.tsx                     # Main page (German UI)
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ImageUploader.tsx            # Image/PDF upload component
│   └── MarkedImage.tsx              # Image with markers, magnifier & comparison slider
├── lib/
│   ├── gemini.ts                    # Gemini API client (German prompts)
│   └── pdf-to-image.ts              # PDF to image conversion
└── .env.local                       # Environment variables
```

## License

MIT
