import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SightWordsPDF } from "@/lib/tools/sightwords-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const pdf = await renderToBuffer(<SightWordsPDF />);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="learnzo-sight-words.pdf"`
      }
    });
  } catch (e) {
    console.error("[tools/sightwords]", e);
    return NextResponse.json({ error: "Could not build the flashcards." }, { status: 500 });
  }
}