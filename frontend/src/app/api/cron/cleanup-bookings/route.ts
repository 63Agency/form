import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

/**
 * Daily cleanup: remove stale pending bookings that were never paid.
 * Trigger via Vercel Cron (see vercel.json) or manual call with CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("payment_status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    console.error("[cron/cleanup-bookings] delete failed", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }

  const deletedCount = data?.length ?? 0;
  console.log("[cron/cleanup-bookings] removed stale pending bookings", {
    deletedCount,
    cutoff,
  });

  return NextResponse.json({ ok: true, deletedCount, cutoff });
}
