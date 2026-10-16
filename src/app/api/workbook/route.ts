import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationEmail, makeToken } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  source: z
    .enum([
      "tracing-workbook",
      "coloring-book",
      "numbers-workbook",
      "alphabet-workbook"
    ])
    .default("tracing-workbook")
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter your name and a valid email." },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const source = parsed.data.source;
    const db = createAdminClient();

    // 1. Save the download record (for our records)
    const { error: insertErr } = await db.from("workbook_downloads").insert({
      name,
      email,
      source
    });

    if (insertErr) {
      console.error("[workbook download insert]", insertErr);
      return NextResponse.json(
        { error: "Could not save your details." },
        { status: 500 }
      );
    }

    // 2. Create a verification token
    const token = makeToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenErr } = await db.from("email_verifications").insert({
      email,
      name,
      token,
      source,
      expires_at: expires
    });

    if (tokenErr) {
      console.error("[workbook verification token insert]", tokenErr);
      // Still return ok - the download record is saved.
      // But log loudly so we can debug.
      return NextResponse.json(
        {
          error:
            "We saved your details but could not create the confirmation link. Please try again."
        },
        { status: 500 }
      );
    }

    // 3. Send the verification email
    try {
      await sendVerificationEmail({ to: email, name, token, source });
    } catch (sendErr) {
      console.error("[workbook send verification]", sendErr);
      return NextResponse.json(
        {
          error:
            "We could not send the confirmation email. Please check your email address and try again."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[workbook unexpected]", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}