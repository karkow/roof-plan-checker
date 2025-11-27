"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import MarkedImage from "@/components/MarkedImage";
import {
  ComparisonResult,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/types";

export default function Home() {
  const [handdrawnFile, setHanddrawnFile] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Datei zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      return "Ungültiger Dateityp. Erlaubt: Bilder oder PDF";
    }
    return null;
  };

  const handleHanddrawnSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setHanddrawnFile(file);
  };

  const handleCadSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCadFile(file);
  };

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Vergleich fehlgeschlagen");
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
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
            onImageSelect={handleHanddrawnSelect}
          />
          <ImageUploader
            label="CAD-Plan (zu prüfen)"
            onImageSelect={handleCadSelect}
          />
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !handdrawnFile || !cadFile}
          aria-busy={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? "Analysiere..." : "Pläne vergleichen"}
        </button>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {error}
          </div>
        )}

        {results && (
          <div className="mt-8 space-y-6" aria-live="polite">
            <section className="bg-white p-6 rounded-lg shadow" aria-labelledby="results-heading">
              <h2 id="results-heading" className="text-2xl font-bold mb-4">Analyseergebnisse</h2>
              <p className="text-gray-700 mb-4">{results.summary}</p>
              <p className="text-lg font-medium">
                Gefundene Unterschiede: <span aria-label={`${results.totalDifferences} Unterschiede`}>{results.totalDifferences}</span>
              </p>
            </section>

            <section className="bg-white p-6 rounded-lg shadow" aria-labelledby="comparison-heading">
              <h3 id="comparison-heading" className="text-xl font-bold mb-4">Planvergleich</h3>
              <MarkedImage
                cadImageUrl={results.images.cad}
                handdrawnImageUrl={results.images.handdrawn}
                differences={results.differences}
              />
            </section>

            {results.totalDifferences > 0 && (
              <>
                <section className="bg-white p-6 rounded-lg shadow" aria-labelledby="differences-heading">
                  <h3 id="differences-heading" className="text-xl font-bold mb-4">Detaillierte Unterschiede</h3>
                  <ul className="space-y-4" role="list">
                    {results.differences.map((diff) => (
                      <li
                        key={diff.id}
                        className={`p-4 border rounded-lg ${SEVERITY_COLORS[diff.severity]}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold"
                            aria-hidden="true"
                          >
                            {diff.id}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold">{diff.location}</h4>
                              <span className="text-xs px-2 py-1 rounded bg-white">
                                {SEVERITY_LABELS[diff.severity]}
                              </span>
                            </div>
                            <p className="text-sm mb-1">
                              <strong>Art:</strong> {diff.type}
                            </p>
                            <p className="text-sm">{diff.description}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-white p-6 rounded-lg shadow" aria-labelledby="recommendation-heading">
                  <h3 id="recommendation-heading" className="text-xl font-bold mb-2">Empfehlung</h3>
                  <p className="text-gray-700">{results.recommendation}</p>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
