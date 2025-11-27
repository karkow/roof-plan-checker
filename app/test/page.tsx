"use client";

import MarkedImage from "@/components/MarkedImage";

// Mock differences for testing
const mockDifferences = [
  {
    id: 1,
    location: "Obere linke Ecke",
    description: "Einbauteil fehlt im CAD-Plan",
    severity: "critical" as const,
    coordinates: { x: 15, y: 20 },
  },
  {
    id: 2,
    location: "Mitte rechts",
    description: "Maße weichen ab",
    severity: "major" as const,
    coordinates: { x: 75, y: 45 },
  },
  {
    id: 3,
    location: "Unterer Bereich",
    description: "Kleine Positionsabweichung",
    severity: "minor" as const,
    coordinates: { x: 40, y: 80 },
  },
];

export default function TestPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Test: MarkedImage Komponente</h1>
        <p className="text-gray-600 mb-8">
          Testseite für Lupe und Vergleichs-Slider ohne KI-Wartezeit
        </p>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Markierter Plan</h3>
          <MarkedImage
            cadImageUrl="/cad.png"
            handdrawnImageUrl="/handdrawn.jpg"
            differences={mockDifferences}
          />
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Test-Markierungen</h3>
          <div className="space-y-2 text-sm">
            {mockDifferences.map((diff) => (
              <div key={diff.id} className="flex gap-2">
                <span className="font-bold">#{diff.id}</span>
                <span className={
                  diff.severity === "critical" ? "text-red-600" :
                  diff.severity === "major" ? "text-orange-600" : "text-blue-600"
                }>
                  [{diff.severity}]
                </span>
                <span>{diff.location}: {diff.description}</span>
                <span className="text-gray-400">({diff.coordinates.x}%, {diff.coordinates.y}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
