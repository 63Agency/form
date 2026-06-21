import { NextResponse } from "next/server";

import { finalizeBookingAfterPayment } from "@/lib/finalize-booking";
import { verifyPayzoneWebhookSignature } from "@/lib/payzone";
import { sendPaymentFailure } from "@/lib/mailer";
import { supabase } from "@/lib/supabase";
import {
  extractPayzoneNotification,
  isPayzonePaymentApproved,
  isPayzonePaymentFailed,
  resolveBookingIdFromNotification,
  type PayzoneWebhookBody,
} from "@/types/booking";

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
  console.log("[webhook/payment] handleSuccessfulPayment", {
    bookingId,
    status: notification.status,
    notificationId: notification.id,
  });

  const { error: chargeUpdateError } = await supabase
    .from("bookings")
    .update({
      payzone_charge_id: notification.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (chargeUpdateError) {
    console.error("[webhook/payment] payzone_charge_id update", chargeUpdateError);
  }

  const { error: logError } = await supabase.from("payment_logs").insert({
    booking_id: bookingId,
    event_type: "payment_success",
    payzone_status: notification.status,
    payload: fullPayload,
  });

  if (logError) {
    console.error("[webhook/payment] success log insert", logError);
  }

  const result = await finalizeBookingAfterPayment(bookingId, "webhook");
  console.log("[webhook/payment] finalize result", result);
}

async function handleFailedPayment(
  bookingId: string,
  notification: PayzoneWebhookBody["notification"],
  fullPayload: PayzoneWebhookBody,
): Promise<void> {
  console.log("[webhook/payment] handleFailedPayment", {
    bookingId,
    status: notification.status,
  });

  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select("full_name, email, selected_date, selected_time")
    .eq("id", bookingId)
    .maybeSingle();

  if (findError || !booking) {
    console.error("[webhook/payment] booking not found for failure", findError);
    return;
  }

  const { error: logError } = await supabase.from("payment_logs").insert({
    booking_id: bookingId,
    event_type: "payment_failed",
    payzone_status: notification.status,
    payload: fullPayload,
  });

  if (logError) {
    console.error("[webhook/payment] failed log insert", logError);
  }

  try {
    console.log("[webhook/payment] sending failure email to", booking.email);
    await sendPaymentFailure({
      full_name: booking.full_name,
      email: booking.email,
      selected_date: booking.selected_date,
      selected_time: booking.selected_time,
    });
    console.log("[webhook/payment] failure email sent OK", booking.email);
  } catch (mailErr) {
    console.error("[webhook/payment] failure email FAILED", mailErr);
  }

  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (deleteError) {
    console.error("[webhook/payment] failed booking delete", deleteError);
  } else {
    console.log("[webhook/payment] failed booking deleted", bookingId);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = getCallbackSignature(request);

  console.log("[webhook/payment] received callback", {
    bodyLength: rawBody.length,
    hasSignature: Boolean(signatureHeader),
    preview: rawBody.slice(0, 300),
  });

  if (!verifyPayzoneWebhookSignature(rawBody, signatureHeader)) {
    console.error("[webhook/payment] INVALID SIGNATURE — check PAYZONE_NOTIFICATION_KEY");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  console.log("[webhook/payment] signature OK");

  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      console.error("[webhook/payment] invalid JSON body");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const notification = extractPayzoneNotification(parsed);
    if (!notification) {
      console.error("[webhook/payment] invalid payload shape", parsed);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    console.log("[webhook/payment] notification parsed", {
      id: notification.id,
      status: notification.status,
      transactions: notification.transactions?.length ?? 0,
    });

    const bookingId = resolveBookingIdFromNotification(notification);
    if (!bookingId) {
      console.error("[webhook/payment] could not resolve booking UUID from", notification);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const fullPayload = parsed as PayzoneWebhookBody;

    if (isPayzonePaymentApproved(notification)) {
      console.log("[webhook/payment] payment APPROVED → finalizing", bookingId);
      console.log(
        "[GoogleCalendar] payment approved — finalize will create calendar event",
        { bookingId },
      );
      await handleSuccessfulPayment(bookingId, notification, fullPayload);
    } else if (isPayzonePaymentFailed(notification.status)) {
      console.log("[webhook/payment] payment FAILED → updating", bookingId);
      await handleFailedPayment(bookingId, notification, fullPayload);
    } else {
      console.info("[webhook/payment] unhandled status", {
        bookingId,
        status: notification.status,
        transactions: notification.transactions,
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[webhook/payment] unexpected error", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
