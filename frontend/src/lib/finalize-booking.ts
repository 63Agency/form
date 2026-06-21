import { createCalendlyEvent } from "@/lib/calendly";
import { sendBookingConfirmation } from "@/lib/mailer";
import { supabase } from "@/lib/supabase";

type BookingToFinalize = {
  id: string;
  full_name: string;
  email: string;
  selected_date: string;
  selected_time: string | null;
  payment_status: string;
  calendly_event_uri: string | null;
};

export type FinalizeBookingResult = {
  bookingId: string;
  paymentStatus: string;
  emailSent: boolean;
  calendlyCreated: boolean;
  alreadyFinalized: boolean;
};

async function wasConfirmationEmailSent(bookingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("payment_logs")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("event_type", "confirmation_email_sent")
    .maybeSingle();

  if (error) {
    console.error("[finalize-booking] email log check", error);
    return false;
  }

  return Boolean(data);
}

async function markConfirmationEmailSent(bookingId: string): Promise<void> {
  const { error } = await supabase.from("payment_logs").insert({
    booking_id: bookingId,
    event_type: "confirmation_email_sent",
    payzone_status: "SENT",
    payload: { source: "finalize-booking" },
  });

  if (error) {
    console.error("[finalize-booking] email log insert", error);
  }
}

/**
 * Runs after successful payment (webhook or success-page fallback):
 * mark paid → Calendly → confirmation email.
 */
export async function finalizeBookingAfterPayment(
  bookingId: string,
  source: "webhook" | "success_page",
): Promise<FinalizeBookingResult> {
  console.log(`[finalize-booking] start bookingId=${bookingId} source=${source}`);

  const { data: booking, error: findError } = await supabase
    .from("bookings")
    .select(
      "id, full_name, email, selected_date, selected_time, payment_status, calendly_event_uri",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (findError || !booking) {
    console.error("[finalize-booking] booking not found", { bookingId, findError });
    throw new Error("Booking not found");
  }

  const row = booking as BookingToFinalize;
  const alreadyPaid = row.payment_status === "paid";
  let calendlyCreated = false;

  console.log("[finalize-booking] booking loaded", {
    bookingId: row.id,
    email: row.email,
    payment_status: row.payment_status,
    selected_date: row.selected_date,
    selected_time: row.selected_time,
  });

  if (!alreadyPaid) {
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("[finalize-booking] paid update failed", updateError);
      throw new Error("Failed to update booking payment status");
    }

    console.log("[finalize-booking] payment_status updated to paid", bookingId);
  } else {
    console.log("[finalize-booking] booking already paid", bookingId);
  }

  if (!row.calendly_event_uri) {
    try {
      console.log("[finalize-booking] creating Calendly event", bookingId);
      const calendlyResult = await createCalendlyEvent({
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        selected_date: row.selected_date,
        selected_time: row.selected_time,
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
          console.error("[finalize-booking] calendly update failed", calendlyUpdateError);
        } else {
          calendlyCreated = true;
          console.log("[finalize-booking] Calendly event saved", calendlyResult.event_uri);
        }
      } else {
        console.warn("[finalize-booking] Calendly returned no event_uri", bookingId);
      }
    } catch (calendlyErr) {
      console.error("[finalize-booking] Calendly error", calendlyErr);
    }
  } else {
    console.log("[finalize-booking] Calendly already exists", row.calendly_event_uri);
  }

  let emailSent = false;
  const emailAlreadySent = await wasConfirmationEmailSent(bookingId);

  if (emailAlreadySent) {
    console.log("[finalize-booking] confirmation email already sent", bookingId);
  } else {
    try {
      console.log("[finalize-booking] sending confirmation email to", row.email);
      await sendBookingConfirmation({
        full_name: row.full_name,
        email: row.email,
        selected_date: row.selected_date,
        selected_time: row.selected_time,
      });
      await markConfirmationEmailSent(bookingId);
      emailSent = true;
      console.log("[finalize-booking] confirmation email sent OK", {
        bookingId,
        to: row.email,
      });
    } catch (mailErr) {
      console.error("[finalize-booking] confirmation email FAILED", {
        bookingId,
        to: row.email,
        error: mailErr,
      });
    }
  }

  return {
    bookingId,
    paymentStatus: "paid",
    emailSent,
    calendlyCreated,
    alreadyFinalized: alreadyPaid && emailAlreadySent,
  };
}
