import { NextRequest, NextResponse } from "next/server";
import { compareRoofPlans } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const handdrawnFile = formData.get("handdrawn") as File;
    const cadFile = formData.get("cad") as File;

    if (!handdrawnFile || !cadFile) {
      return NextResponse.json(
        { error: "Both images are required" },
        { status: 400 }
      );
    }

    // Convert files to base64
    const handdrawnBuffer = await handdrawnFile.arrayBuffer();
    const cadBuffer = await cadFile.arrayBuffer();

    const handdrawnBase64 = Buffer.from(handdrawnBuffer).toString("base64");
    const cadBase64 = Buffer.from(cadBuffer).toString("base64");

    // Compare using Gemini
    const results = await compareRoofPlans(handdrawnBase64, cadBase64);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json(
      { error: "Failed to compare plans" },
      { status: 500 }
    );
  }
}
