"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import MarkedImage from "@/components/MarkedImage";

interface ComparisonResult {
  summary: string;
  totalDifferences: number;
  differences: Array<{
    id: number;
    location: string;
    type: string;
    description: string;
    severity: "critical" | "major" | "minor";
    coordinates?: { x: number; y: number };
  }>;
  recommendation: string;
  images: {
    handdrawn: string;
    cad: string;
  };
}

const severityLabels = {
  critical: "Kritisch",
  major: "Schwerwiegend",
  minor: "Geringfügig",
};

export default function Home() {
  const [handdrawnFile, setHanddrawnFile] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!handdrawnFile || !cadFile) {
      setError("Bitte laden Sie beide Bilder hoch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("handdrawn", handdrawnFile);
      formData.append("cad", cadFile);

      const response = await fetch("/api/compare-plans", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Vergleich fehlgeschlagen");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    major: "bg-orange-100 text-orange-800 border-orange-300",
    minor: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Plan Vergleich</h1>
        <p className="text-gray-600 mb-8">
          Laden Sie handgezeichnete und CAD-Dachpläne hoch, um Unterschiede zu erkennen
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ImageUploader
            label="Handzeichnung (Referenz)"
            onImageSelect={setHanddrawnFile}
          />
          <ImageUploader
            label="CAD-Plan (zu prüfen)"
            onImageSelect={setCadFile}
          />
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !handdrawnFile || !cadFile}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {loading ? "Analysiere..." : "Pläne vergleichen"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-8 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">Analyseergebnisse</h2>
              <p className="text-gray-700 mb-4">{results.summary}</p>
              <p className="text-lg font-medium">
                Gefundene Unterschiede: {results.totalDifferences}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Planvergleich</h3>
              <MarkedImage
                cadImageUrl={results.images.cad}
                handdrawnImageUrl={results.images.handdrawn}
                differences={results.differences}
              />
            </div>

            {results.totalDifferences > 0 && (
              <>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-4">Detaillierte Unterschiede</h3>
                  <div className="space-y-4">
                    {results.differences.map((diff) => (
                      <div
                        key={diff.id}
                        className={`p-4 border rounded-lg ${severityColors[diff.severity]}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold">
                            {diff.id}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold">{diff.location}</h4>
                              <span className="text-xs px-2 py-1 rounded bg-white">
                                {severityLabels[diff.severity]}
                              </span>
                            </div>
                            <p className="text-sm mb-1">
                              <strong>Art:</strong> {diff.type}
                            </p>
                            <p className="text-sm">{diff.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-2">Empfehlung</h3>
                  <p className="text-gray-700">{results.recommendation}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
