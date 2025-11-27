import { NextRequest, NextResponse } from "next/server";
import { compareRoofPlans } from "@/lib/gemini";
import { pdfToImage, isPdf } from "@/lib/pdf-to-image";

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
    mimeType: file.type,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const handdrawnFile = formData.get("handdrawn") as File;
    const cadFile = formData.get("cad") as File;

    if (!handdrawnFile || !cadFile) {
      return NextResponse.json(
        { error: "Beide Dateien werden benötigt" },
        { status: 400 }
      );
    }

    // Convert files to base64 (handles PDFs automatically)
    const [handdrawnData, cadData] = await Promise.all([
      fileToBase64(handdrawnFile),
      fileToBase64(cadFile),
    ]);

    // Compare using Gemini
    const results = await compareRoofPlans(handdrawnData.base64, cadData.base64);

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
    return NextResponse.json(
      { error: "Fehler beim Vergleichen der Pläne" },
      { status: 500 }
    );
  }
}
