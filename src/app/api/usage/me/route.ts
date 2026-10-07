import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUsage } from "@/lib/usage/limits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ signedIn: false });
    }

    const usage = await getUsage(user.id);

    const solvesLimitReached = usage.used.solves >= usage.limits.solves;

    return NextResponse.json({
      signedIn: true,
      plan: usage.plan,
      used: usage.used,
      remaining: usage.remaining,
      limits: usage.limits,
      solvesLimitReached
    });
  } catch (e) {
    console.error("[usage/me]", e);
    return NextResponse.json({ error: "Could not load usage." }, { status: 500 });
  }
}