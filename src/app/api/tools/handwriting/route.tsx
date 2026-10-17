import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { HandwritingPDF } from "@/lib/tools/handwriting-pdf";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  text: z.string().min(1).max(60),
  style: z.enum(["trace", "copy", "both"]).default("trace"),
  rows: z.coerce.number().int().min(3).max(12).default(8)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter text (1-60 characters)." }, { status: 400 });
    }
    const { text, style, rows } = parsed.data;
    const pdf = await renderToBuffer(<HandwritingPDF text={text} style={style} rows={rows} />);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="learnzo-handwriting-${Date.now()}.pdf"`
      }
    });
  } catch (e) {
    console.error("[tools/handwriting]", e);
    return NextResponse.json({ error: "Could not build the worksheet." }, { status: 500 });
  }
}