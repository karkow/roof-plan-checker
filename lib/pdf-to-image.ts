import { fromBuffer } from "pdf2pic";

interface PdfConversionResult {
  base64: string;
  mimeType: string;
}

/**
 * Convert a PDF buffer to a JPEG image (first page only)
 * @param pdfBuffer - The PDF file as a Buffer
 * @returns Base64 encoded JPEG image
 */
export async function pdfToImage(
  pdfBuffer: Buffer
): Promise<PdfConversionResult> {
  const options = {
    density: 200,           // DPI for good quality
    format: "jpeg",
    width: 2000,            // Max width
    height: 2000,           // Max height
    preserveAspectRatio: true,
    quality: 90,
  };

  const convert = fromBuffer(pdfBuffer, options);

  // Use ImageMagick instead of GraphicsMagick
  convert.setGMClass(true);

  // Convert first page to base64
  const result = await convert(1, { responseType: "base64" });

  if (!result.base64) {
    throw new Error("PDF conversion failed - no output generated");
  }

  return {
    base64: result.base64,
    mimeType: "image/jpeg",
  };
}

/**
 * Check if a file is a PDF based on its mime type or extension
 */
export function isPdf(mimeType: string, filename?: string): boolean {
  if (mimeType === "application/pdf") return true;
  if (filename?.toLowerCase().endsWith(".pdf")) return true;
  return false;
}
