import { NextResponse } from "next/server";

import {
  buildSignedPayzoneRequest,
  getPaywallUrl,
} from "@/lib/payzone";
import { supabase } from "@/lib/supabase";
import {
  formStateToBookingInsert,
  validateFormStatePayload,
  type ApiErrorResponse,
  type CreateBookingRequest,
  type CreateBookingResponse,
} from "@/types/booking";

function isCreateBookingRequest(value: unknown): value is CreateBookingRequest {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.age === "string" &&
    typeof o.status === "string" &&
    typeof o.educationLevel === "string" &&
    typeof o.fieldChoice === "string" &&
    Array.isArray(o.countries) &&
    o.countries.every((c) => typeof c === "string") &&
    typeof o.consultation === "string" &&
    typeof o.consultationFormat === "string" &&
    typeof o.investment500 === "string" &&
    typeof o.firstName === "string" &&
    typeof o.lastName === "string" &&
    typeof o.whatsapp === "string" &&
    typeof o.reservationDate === "string" &&
    typeof o.reservationTime === "string" &&
    typeof o.email === "string" &&
    (o.selectedDate === undefined || typeof o.selectedDate === "string") &&
    (o.selectedTime === undefined || typeof o.selectedTime === "string")
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isCreateBookingRequest(body)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: "Corps de requête invalide." },
        { status: 400 },
      );
    }

    const validationError = validateFormStatePayload(body);
    if (validationError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: validationError },
        { status: 400 },
      );
    }

    const insert = formStateToBookingInsert(body);

    const { data, error } = await supabase
      .from("bookings")
      .insert(insert)
      .select("id, full_name, email")
      .single();

    if (error || !data) {
      console.error("[POST /api/bookings]", error);
      return NextResponse.json<ApiErrorResponse>(
        { error: "Impossible de créer la réservation." },
        { status: 500 },
      );
    }

    console.log("[POST /api/bookings] pending booking saved (payment not yet done)", {
      bookingId: data.id,
      email: insert.email,
      selected_date: insert.selected_date,
      selected_time: insert.selected_time,
      note: "Confirmation email will be sent AFTER successful payment",
    });

    const paywallUrl = getPaywallUrl();
    const { payload: payzonePayload, jsonPayload, signature } =
      buildSignedPayzoneRequest(
        {
          id: data.id,
          full_name: insert.full_name,
          email: insert.email,
        },
        {
          bookingId: data.id,
          paywallUrl,
        },
      );

    return NextResponse.json<CreateBookingResponse>(
      {
        bookingId: data.id,
        payload: jsonPayload,
        payzonePayload,
        signature,
        paywallUrl,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    const message =
      err instanceof Error ? err.message : "Requête invalide.";
    return NextResponse.json<ApiErrorResponse>(
      { error: message },
      { status: 400 },
    );
  }
}
