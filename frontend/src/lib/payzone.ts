import { createHash, createHmac } from "node:crypto";

export type BookingData = {
  id: string;
  full_name: string;
  email: string;
};

export type PayzonePayload = {
  merchantAccount: string;
  timestamp: number;
  skin: string;
  customerId: string;
  customerCountry: string;
  customerLocale: string;
  customerName: string;
  customerEmail: string;
  chargeId: string;
  orderId: string;
  price: string;
  currency: string;
  description: string;
  mode: string;
  paymentMethod: string;
  showPaymentProfiles: boolean;
  callbackUrl: string;
  successUrl: string;
  failureUrl: string;
  cancelUrl: string;
};

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }
  return url.replace(/\/$/, "");
}

function getMerchantAccount(): string {
  const account = process.env.PAYZONE_MERCHANT_ACCOUNT?.trim();
  if (!account) {
    throw new Error("PAYZONE_MERCHANT_ACCOUNT is not configured.");
  }
  return account;
}

function getSecretKey(): string {
  const key = process.env.PAYZONE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("PAYZONE_SECRET_KEY is not configured.");
  }
  return key;
}

function resolveCustomerEmail(email: string): string {
  const normalized = email.trim();
  if (!normalized) {
    throw new Error("Payzone payload requires a non-empty customer email.");
  }
  return normalized;
}

function buildUnixTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function assertPayzonePayloadShape(payload: Record<string, unknown>): void {
  if ("customerID" in payload) {
    throw new Error(
      'Payzone payload must use "customerId" (lowercase d), not "customerID".',
    );
  }

  if (typeof payload.customerId !== "string" || !payload.customerId) {
    throw new Error("Payzone payload requires a non-empty customerId string.");
  }

  if (typeof payload.timestamp !== "number" || !Number.isFinite(payload.timestamp)) {
    throw new Error(
      `Payzone timestamp must be a JSON number (Unix seconds), got ${typeof payload.timestamp}.`,
    );
  }

  if (payload.timestamp > 1_000_000_000_000) {
    throw new Error(
      "Payzone timestamp must be Unix epoch seconds, not milliseconds.",
    );
  }
}

export function buildPayzonePayload(booking: BookingData): PayzonePayload {
  const appUrl = getAppUrl();
  const customerEmail = resolveCustomerEmail(booking.email);
  const customerName = booking.full_name.trim();
  const timestamp = buildUnixTimestampSeconds();

  const payload: PayzonePayload = {
    merchantAccount: getMerchantAccount(),
    timestamp,
    skin: "vps-1-vue",
    customerId: booking.id,
    customerCountry: "MA",
    customerLocale: "fr_FR",
    customerName,
    customerEmail,
    chargeId: booking.id,
    orderId: booking.id,
    price: "500",
    currency: "MAD",
    description: "Consultation orientation études à l'étranger - 500 DH",
    mode: "DEEP_LINK",
    paymentMethod: "CREDIT_CARD",
    showPaymentProfiles: false,
    callbackUrl: `${appUrl}/api/webhook/payment`,
    successUrl: `${appUrl}/success?booking=${booking.id}`,
    failureUrl: `${appUrl}/failure`,
    cancelUrl: `${appUrl}/cancel`,
  };

  assertPayzonePayloadShape(payload as unknown as Record<string, unknown>);

  return payload;
}

/**
 * Payzone paywall signature (NOT HMAC):
 *   SHA256( paywallSecretKey + jsonPayload ) → 64-char lowercase hex
 *
 * Webhook verification uses HMAC separately in verifyPayzoneWebhookSignature().
 */
export function signPayload(jsonPayload: string): string {
  const paywallSecretKey = getSecretKey();
  const signature = createHash("sha256")
    .update(paywallSecretKey + jsonPayload)
    .digest("hex");

  if (signature.length !== 64) {
    throw new Error(
      `Payzone signature must be exactly 64 hex characters, got ${signature.length}`,
    );
  }

  return signature;
}

/**
 * Matches what the browser sends: JSON.parse(apiResponse).payzonePayload then
 * JSON.stringify(...) — same round-trip as the form's hidden payload field.
 */
export function serializePayloadForPaywallForm(
  payload: PayzonePayload,
  apiEnvelope: Record<string, unknown>,
): string {
  const serialized = JSON.stringify(apiEnvelope);
  const parsed = JSON.parse(serialized) as { payzonePayload: PayzonePayload };
  return JSON.stringify(parsed.payzonePayload);
}

export function getPaywallUrl(): string {
  const url = process.env.PAYZONE_PAYWALL_URL?.trim();
  if (!url) {
    throw new Error("PAYZONE_PAYWALL_URL is not configured.");
  }
  return url;
}

export function verifyPayzoneWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const notificationKey = process.env.PAYZONE_NOTIFICATION_KEY?.trim();
  if (!notificationKey || !signatureHeader?.trim()) {
    return false;
  }

  const expected = createHmac("sha256", notificationKey)
    .update(rawBody)
    .digest("hex");

  const received = signatureHeader.trim().toLowerCase();
  return expected.toLowerCase() === received;
}

export type PayzoneApiResponseFields = {
  bookingId: string;
  paywallUrl: string;
};

export function buildSignedPayzoneRequest(
  booking: BookingData,
  apiFields?: PayzoneApiResponseFields,
): {
  payload: PayzonePayload;
  jsonPayload: string;
  signature: string;
} {
  const payload = buildPayzonePayload(booking);

  const jsonPayload = apiFields
    ? serializePayloadForPaywallForm(payload, {
        bookingId: apiFields.bookingId,
        payzonePayload: payload,
        signature: "",
        paywallUrl: apiFields.paywallUrl,
      })
    : JSON.stringify(payload);

  assertPayzonePayloadShape(JSON.parse(jsonPayload) as Record<string, unknown>);

  const signature = signPayload(jsonPayload);

  return {
    payload: JSON.parse(jsonPayload) as PayzonePayload,
    jsonPayload,
    signature,
  };
}
