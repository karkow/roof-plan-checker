import { NextRequest, NextResponse } from "next/server";
import { compareRoofPlans } from "@/lib/gemini";
import { pdfToImage, isPdf } from "@/lib/pdf-to-image";
import { MAX_FILE_SIZE, ALLOWED_IMAGE_TYPES } from "@/lib/types";

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `Datei "${file.name}" ist zu groß. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  const isAllowedType = ALLOWED_IMAGE_TYPES.includes(file.type) ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isAllowedType) {
    return `Ungültiger Dateityp für "${file.name}". Erlaubt: Bilder oder PDF`;
  }

  return null;
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Check if it's a PDF and convert to image
  if (isPdf(file.type, file.name)) {
    const result = await pdfToImage(buffer);
    return result;
  }

  // For regular images, just return base64
  return {
    base64: buffer.toString("base64"),
    mimeType: file.type || "image/jpeg",
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const handdrawnFile = formData.get("handdrawn") as File | null;
    const cadFile = formData.get("cad") as File | null;

    if (!handdrawnFile || !cadFile) {
      return NextResponse.json(
        { error: "Beide Dateien werden benötigt" },
        { status: 400 }
      );
    }

    // Validate files
    const handdrawnError = validateFile(handdrawnFile);
    if (handdrawnError) {
      return NextResponse.json({ error: handdrawnError }, { status: 400 });
    }

    const cadError = validateFile(cadFile);
    if (cadError) {
      return NextResponse.json({ error: cadError }, { status: 400 });
    }

    // Convert files to base64 (handles PDFs automatically)
    const [handdrawnData, cadData] = await Promise.all([
      fileToBase64(handdrawnFile),
      fileToBase64(cadFile),
    ]);

    // Compare using Gemini
    const results = await compareRoofPlans(
      handdrawnData.base64,
      cadData.base64,
      handdrawnData.mimeType
    );

    // Return results along with converted images (for PDF support)
    return NextResponse.json({
      ...results,
      images: {
        handdrawn: `data:${handdrawnData.mimeType};base64,${handdrawnData.base64}`,
        cad: `data:${cadData.mimeType};base64,${cadData.base64}`,
      },
    });
  } catch (error) {
    console.error("Comparison error:", error);

    // Return meaningful error message
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    const isUserError = message.includes("API key") ||
      message.includes("Invalid") ||
      message.includes("Failed to parse");

    return NextResponse.json(
      { error: isUserError ? message : "Fehler beim Vergleichen der Pläne" },
      { status: isUserError ? 400 : 500 }
    );
  }
}
