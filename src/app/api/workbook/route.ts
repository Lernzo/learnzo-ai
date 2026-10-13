import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  source: z.enum(["tracing-workbook", "coloring-book"]).default("tracing-workbook")
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter your name and a valid email address." },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    const { error } = await db.from("workbook_downloads").insert({
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      source: parsed.data.source
    });

    if (error) {
      console.error("[workbook]", error);
      return NextResponse.json(
        { error: "Could not save your details. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[workbook]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}