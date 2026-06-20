import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";
import {
  isValidUuid,
  type ApiErrorResponse,
  type BookingRow,
} from "@/types/booking";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Identifiant de réservation invalide." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/bookings/[id]]", error);
      return NextResponse.json<ApiErrorResponse>(
        { error: "Impossible de récupérer la réservation." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Réservation introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json<BookingRow>(data as BookingRow);
  } catch (err) {
    console.error("[GET /api/bookings/[id]]", err);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Requête invalide." },
      { status: 400 },
    );
  }
}
