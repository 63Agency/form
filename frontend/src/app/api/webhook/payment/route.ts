import { NextResponse } from "next/server";

import {
  createCalendlyEvent,
  sendConfirmationEmailPlaceholder,
} from "@/lib/calendly";
import { verifyPayzoneWebhookSignature } from "@/lib/payzone";
import { sendPaymentFailure } from "@/lib/mailer";
import { supabase } from "@/lib/supabase";
import {
  isPayzonePaymentApproved,
  isPayzonePaymentFailed,
  isPayzoneWebhookBody,
  isValidUuid,
  type PayzoneWebhookBody,
} from "@/types/booking";

type BookingForWebhook = {
  id: string;
  full_name: string;
  email: string;
  selected_date: string;
  calendly_event_uri: string | null;
};

function getCallbackSignature(request: Request): string | null {
  return (
    request.headers.get("x-callback-signature") ??
    request.headers.get("X-Callback-Signature")
  );
}

async function handleSuccessfulPayment(
  bookingId: string,
  notification: PayzoneWebhookBody["notification"],
  fullPayload: PayzoneWebhookBody,
): Promise<void> {
  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("id, full_name, email, selected_date, calendly_event_uri")
    .eq("id", bookingId)
    .maybeSingle();

  if (findError || !booking) {
    console.error("[POST /api/webhook/payment] booking not found", findError);
    return;
  }

  const bookingRow = booking as BookingForWebhook;

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "paid",
      payzone_charge_id: notification.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[POST /api/webhook/payment] paid update", updateError);
    return;
  }

  const { error: logError } = await supabase.from("payment_logs").insert({
    booking_id: bookingId,
    event_type: "payment_success",
    payzone_status: notification.status,
    payload: fullPayload,
  });

  if (logError) {
    console.error("[POST /api/webhook/payment] success log", logError);
  }

  if (bookingRow.calendly_event_uri) {
    return;
  }

  try {
    const calendlyResult = await createCalendlyEvent({
      full_name: bookingRow.full_name,
      email: bookingRow.email,
      selected_date: bookingRow.selected_date,
    });

    if (calendlyResult.event_uri) {
      const { error: calendlyUpdateError } = await supabase
        .from("bookings")
        .update({
          calendly_event_uri: calendlyResult.event_uri,
          calendly_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (calendlyUpdateError) {
        console.error(
          "[POST /api/webhook/payment] calendly update",
          calendlyUpdateError,
        );
        return;
      }
    }

    sendConfirmationEmailPlaceholder({
      to: bookingRow.email,
      fullName: bookingRow.full_name,
      selectedDate: bookingRow.selected_date,
      eventUri: calendlyResult.event_uri,
      schedulingUrl: calendlyResult.scheduling_url,
    });
  } catch (calendlyErr) {
    console.error("[POST /api/webhook/payment] calendly", calendlyErr);
  }
}

async function handleFailedPayment(
  bookingId: string,
  notification: PayzoneWebhookBody["notification"],
  fullPayload: PayzoneWebhookBody,
): Promise<void> {
  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("full_name, email, selected_date, selected_time")
    .eq("id", bookingId)
    .maybeSingle();

  if (findError || !booking) {
    console.error("[POST /api/webhook/payment] booking not found", findError);
    return;
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      payment_status: "failed",
      payzone_charge_id: notification.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("[POST /api/webhook/payment] failed update", updateError);
  }

  const { error: logError } = await supabase.from("payment_logs").insert({
    booking_id: bookingId,
    event_type: "payment_failed",
    payzone_status: notification.status,
    payload: fullPayload,
  });

  if (logError) {
    console.error("[POST /api/webhook/payment] failed log", logError);
  }

  try {
    await sendPaymentFailure({
      full_name: booking.full_name,
      email: booking.email,
      selected_date: booking.selected_date,
      selected_time: booking.selected_time,
    });
  } catch (mailErr) {
    console.error("[POST /api/webhook/payment] failure email", mailErr);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = getCallbackSignature(request);

  if (!verifyPayzoneWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      console.error("[POST /api/webhook/payment] invalid JSON");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!isPayzoneWebhookBody(parsed)) {
      console.error("[POST /api/webhook/payment] invalid payload shape");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { notification } = parsed;
    const bookingId = notification.id;

    if (!isValidUuid(bookingId)) {
      console.error("[POST /api/webhook/payment] invalid booking id", bookingId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (isPayzonePaymentApproved(notification)) {
      await handleSuccessfulPayment(bookingId, notification, parsed);
    } else if (isPayzonePaymentFailed(notification.status)) {
      await handleFailedPayment(bookingId, notification, parsed);
    } else {
      console.info(
        "[POST /api/webhook/payment] unhandled status",
        notification.status,
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/webhook/payment]", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
