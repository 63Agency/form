import type { PayzonePayload } from "@/lib/payzone";

/** Matches the client form state in study-abroad-form.tsx */
export type FormStatePayload = {
  age: string;
  status: string;
  educationLevel: string;
  fieldChoice: string;
  countries: string[];
  consultation: string;
  consultationFormat: string;
  investment500: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  reservationDate: string;
  reservationTime: string;
  email: string;
};

/** API body may send selectedDate/selectedTime instead of / in addition to reservation fields */
export type CreateBookingRequest = FormStatePayload & {
  selectedDate?: string;
  selectedTime?: string;
};

export type PaymentStatus = "pending" | "paid" | "failed";

export type BookingRow = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  selected_date: string;
  selected_time: string | null;
  age: string | null;
  status: string | null;
  education_level: string | null;
  field_choice: string | null;
  countries: string[] | null;
  consultation: string | null;
  consultation_format: string | null;
  investment500: string | null;
  payment_status: PaymentStatus;
  payzone_charge_id: string | null;
  payzone_order_id: string | null;
  calendly_event_uri: string | null;
  calendly_status: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingInsert = {
  full_name: string;
  email: string;
  whatsapp: string | null;
  selected_date: string;
  selected_time: string | null;
  age: string | null;
  status: string | null;
  education_level: string | null;
  field_choice: string | null;
  countries: string[] | null;
  consultation: string | null;
  consultation_format: string | null;
  investment500: string | null;
  payment_status: PaymentStatus;
  payzone_charge_id: string | null;
  payzone_order_id: string | null;
};

export type CreateBookingResponse = {
  bookingId: string;
  /** Exact JSON string signed and POSTed to Payzone as `payload`. */
  payload: string;
  payzonePayload: PayzonePayload;
  signature: string;
  paywallUrl: string;
};

export type ApiErrorResponse = {
  error: string;
};

export type PayzoneWebhookTransaction = {
  state?: string;
};

export type PayzoneWebhookNotification = {
  status: string;
  id: string;
  transactions?: PayzoneWebhookTransaction[];
};

export type PayzoneWebhookBody = {
  notification: PayzoneWebhookNotification;
};

export const ALLOWED_RESERVATION_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

export type AllowedReservationTime = (typeof ALLOWED_RESERVATION_TIMES)[number];

export function resolveSelectedDate(payload: CreateBookingRequest): string {
  const date = payload.selectedDate?.trim() || payload.reservationDate?.trim();
  return date;
}

export function resolveSelectedTime(
  payload: CreateBookingRequest,
): string | null {
  const time = payload.selectedTime?.trim() || payload.reservationTime?.trim();
  return time || null;
}

export function formStateToBookingInsert(
  payload: CreateBookingRequest,
): BookingInsert {
  const full_name = [payload.firstName, payload.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  return {
    full_name,
    email: payload.email.trim(),
    whatsapp: payload.whatsapp.trim() || null,
    selected_date: resolveSelectedDate(payload),
    selected_time: resolveSelectedTime(payload),
    age: payload.age || null,
    status: payload.status || null,
    education_level: payload.educationLevel || null,
    field_choice: payload.fieldChoice || null,
    countries: payload.countries.length > 0 ? payload.countries : null,
    consultation: payload.consultation || null,
    consultation_format: payload.consultationFormat || null,
    investment500: payload.investment500 || null,
    payment_status: "pending",
    payzone_charge_id: null,
    payzone_order_id: null,
  };
}

export function validateFormStatePayload(
  payload: CreateBookingRequest,
): string | null {
  const full_name = [payload.firstName, payload.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  if (!full_name) {
    return "Le prénom et le nom sont obligatoires.";
  }

  if (!payload.email?.trim()) {
    return "L'e-mail est obligatoire.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    return "Adresse e-mail invalide.";
  }

  const selectedDate = resolveSelectedDate(payload);
  if (!selectedDate) {
    return "La date de réservation est obligatoire.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    return "Format de date invalide (attendu : AAAA-MM-JJ).";
  }

  if (payload.investment500 === "yes") {
    const selectedTime = resolveSelectedTime(payload);
    if (!selectedTime) {
      return "L'heure de consultation est obligatoire.";
    }

    if (
      !ALLOWED_RESERVATION_TIMES.includes(
        selectedTime as AllowedReservationTime,
      )
    ) {
      return "Heure de consultation invalide.";
    }
  }

  return null;
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function isPayzonePaymentApproved(
  notification: PayzoneWebhookNotification,
): boolean {
  if (notification.status !== "CHARGED") {
    return false;
  }

  const transactions = notification.transactions ?? [];
  if (transactions.length === 0) {
    return false;
  }

  const lastState = transactions[transactions.length - 1]?.state;
  return lastState === "APPROVED";
}

export function isPayzonePaymentFailed(status: string): boolean {
  return status === "DECLINED" || status === "ERROR" || status === "CANCELLED";
}

export function isPayzoneWebhookBody(value: unknown): value is PayzoneWebhookBody {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (!o.notification || typeof o.notification !== "object") return false;
  const n = o.notification as Record<string, unknown>;
  return typeof n.status === "string" && typeof n.id === "string";
}
