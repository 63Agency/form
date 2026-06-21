import { NextResponse } from "next/server";

import { finalizeBookingAfterPayment } from "@/lib/finalize-booking";
import { isValidUuid, type ApiErrorResponse } from "@/types/booking";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Fallback when Payzone webhook is delayed or unreachable.
 * Called from /success after redirect from Payzone.
 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Identifiant de réservation invalide." },
        { status: 400 },
      );
    }

    console.log("[POST /api/bookings/[id]/finalize] triggered for", id);

    const result = await finalizeBookingAfterPayment(id, "success_page");

    console.log("[POST /api/bookings/[id]/finalize] done", result);

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[POST /api/bookings/[id]/finalize]", err);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Impossible de finaliser la réservation." },
      { status: 500 },
    );
  }
}
