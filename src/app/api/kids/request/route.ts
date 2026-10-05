import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { KIDS_PDF_URL } from "@/lib/config/kids-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email().max(200)
});

export async function POST(req: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent") ?? null;

    const db = createAdminClient();
    const { error } = await db.from("email_leads").insert({
      email,
      source: "kids-download",
      ip_address: ip,
      user_agent: ua
    });

    if (error) {
      console.error("[kids/request]", error);
      // Still return the download â€” do not block a parent over a DB hiccup
    }

    return NextResponse.json({
      ok: true,
      downloadUrl: KIDS_PDF_URL
    });
  } catch (e) {
    console.error("[kids/request]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}