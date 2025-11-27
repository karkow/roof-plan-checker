import { GoogleGenerativeAI } from "@google/generative-ai";
import { Difference } from "./types";

// Validate API key at module load
const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GOOGLE_AI_API_KEY is not set");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface GeminiResponse {
  summary: string;
  totalDifferences: number;
  differences: Difference[];
  recommendation: string;
}

function validateGeminiResponse(data: unknown): GeminiResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response: expected object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.summary !== "string") {
    throw new Error("Invalid response: missing or invalid summary");
  }
  if (typeof obj.totalDifferences !== "number") {
    throw new Error("Invalid response: missing or invalid totalDifferences");
  }
  if (!Array.isArray(obj.differences)) {
    throw new Error("Invalid response: missing or invalid differences array");
  }
  if (typeof obj.recommendation !== "string") {
    throw new Error("Invalid response: missing or invalid recommendation");
  }

  // Validate each difference
  for (const diff of obj.differences) {
    if (typeof diff !== "object" || diff === null) {
      throw new Error("Invalid difference object");
    }
    const d = diff as Record<string, unknown>;
    if (typeof d.id !== "number") throw new Error("Invalid difference: missing id");
    if (typeof d.location !== "string") throw new Error("Invalid difference: missing location");
    if (typeof d.description !== "string") throw new Error("Invalid difference: missing description");
    if (!["critical", "major", "minor"].includes(d.severity as string)) {
      throw new Error("Invalid difference: invalid severity");
    }
  }

  return {
    summary: obj.summary,
    totalDifferences: obj.totalDifferences,
    differences: obj.differences as Difference[],
    recommendation: obj.recommendation,
  };
}

export async function compareRoofPlans(
  handdrawnBase64: string,
  cadBase64: string,
  mimeType: string = "image/jpeg"
): Promise<GeminiResponse> {
  if (!genAI) {
    throw new Error("Google AI API key is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Du bist ein Experte für Dachplan-Analyse. Vergleiche diese beiden Dachpläne:

Bild 1: Handgezeichneter Referenzplan (dies ist die korrekte Version)
Bild 2: CAD-Plan (dieser soll auf Fehler überprüft werden)

Analysiere den CAD-Plan und identifiziere ALLE Unterschiede, Fehler oder Abweichungen im Vergleich zum handgezeichneten Plan. Lege Fokus auf die Maße der Kanten und zwischen den Einbauteilen.

Wichtige Terminologie:
- Quadrate oder rechteckige Elemente innerhalb der Dachfläche sind "Einbauteile" (z.B. Dachfenster, Lüftungsöffnungen, Schornsteine)

Für jeden gefundenen Unterschied gib an:
1. Beschreibung der Position (z.B. "nordöstliche Ecke", "Haupteingang", "linke Seite")
2. Art des Unterschieds (fehlendes Element, falsche Maße, falsche Platzierung, fehlendes Einbauteil, etc.)
3. Detaillierte Beschreibung des Fehlers
4. Schweregrad (critical = kritisch, major = schwerwiegend, minor = geringfügig)
5. Ungefähre Koordinaten falls sichtbar (als Prozent von oben-links: x%, y%)

Antworte auf Deutsch und gib deine Antwort in diesem exakten JSON-Format zurück:
{
  "summary": "Kurze Zusammenfassung der Ergebnisse",
  "totalDifferences": number,
  "differences": [
    {
      "id": number,
      "location": "string",
      "type": "string",
      "description": "string",
      "severity": "critical" | "major" | "minor",
      "coordinates": { "x": number, "y": number }
    }
  ],
  "recommendation": "Gesamtbewertung und Empfehlung"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: handdrawnBase64,
      },
    },
    {
      inlineData: {
        mimeType,
        data: cadBase64,
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();

  // Extract JSON from response (Gemini might wrap it in markdown)
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  return validateGeminiResponse(parsed);
}
