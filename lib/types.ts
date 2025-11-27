export interface Difference {
  id: number;
  location: string;
  type: string;
  description: string;
  severity: "critical" | "major" | "minor";
  coordinates?: { x: number; y: number };
}

export interface ComparisonResult {
  summary: string;
  totalDifferences: number;
  differences: Difference[];
  recommendation: string;
  images: {
    handdrawn: string;
    cad: string;
  };
}

export const SEVERITY_LABELS: Record<Difference["severity"], string> = {
  critical: "Kritisch",
  major: "Schwerwiegend",
  minor: "Geringfügig",
};

export const SEVERITY_COLORS: Record<Difference["severity"], string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  major: "bg-orange-100 text-orange-800 border-orange-300",
  minor: "bg-blue-100 text-blue-800 border-blue-300",
};

// File upload constraints
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
];
