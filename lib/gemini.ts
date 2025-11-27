import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function compareRoofPlans(
  handdrawnBase64: string,
  cadBase64: string
) {
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
        mimeType: "image/jpeg",
        data: handdrawnBase64,
      },
    },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cadBase64,
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();

  // Extract JSON from response (Gemini might wrap it in markdown)
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

  return JSON.parse(jsonText);
}
