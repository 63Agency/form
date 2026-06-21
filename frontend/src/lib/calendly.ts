const CALENDLY_API_BASE = "https://api.calendly.com";
const CALENDLY_TIMEZONE = "Africa/Casablanca";

export type CalendlyBookingInput = {
  id?: string;
  full_name: string;
  email: string;
  selected_date: string;
  selected_time?: string | null;
};

export type CalendlyEventResult = {
  event_uri: string | null;
  scheduling_url: string | null;
};

type OneOffEventTypeResource = {
  uri?: string;
  scheduling_url?: string;
};

type OneOffEventTypeResponse = {
  resource?: OneOffEventTypeResource;
};

function calendlyHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Ensures YYYY-MM-DD for Calendly date_setting. */
function toYyyyMmDd(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function extractOneOffResource(body: unknown): OneOffEventTypeResource | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const resource = (body as OneOffEventTypeResponse).resource;
  if (!resource || typeof resource !== "object") {
    return null;
  }

  return resource;
}

/**
 * Creates a one-off Calendly event type constrained to the booking date.
 * Returns the one-off event type URI and scheduling URL for the client.
 */
export async function createCalendlyEvent(
  booking: CalendlyBookingInput,
): Promise<CalendlyEventResult> {
  console.log("[Calendly] Starting event creation for booking:", booking.id);
  console.log("[Calendly] Using user URI:", process.env.CALENDLY_USER_URI);
  console.log("[Calendly] selected_date:", booking.selected_date);
  console.log("[Calendly] selected_time:", booking.selected_time);

  const apiKey = process.env.CALENDLY_API_KEY?.trim();
  const host = process.env.CALENDLY_USER_URI?.trim();

  if (!apiKey) {
    console.error("[Calendly] CALENDLY_API_KEY is not configured.");
    return { event_uri: null, scheduling_url: null };
  }

  if (!host) {
    console.error("[Calendly] CALENDLY_USER_URI is not configured.");
    return { event_uri: null, scheduling_url: null };
  }

  const eventDate = toYyyyMmDd(booking.selected_date);
  if (!eventDate) {
    console.error("[Calendly] Invalid selected_date:", booking.selected_date);
    return { event_uri: null, scheduling_url: null };
  }

  const requestBody = {
    name: `Consultation - ${booking.full_name.trim()}`,
    host,
    duration: 30,
    timezone: CALENDLY_TIMEZONE,
    date_setting: {
      type: "date_range",
      start_date: eventDate,
      end_date: eventDate,
    },
    location: {
      kind: "custom",
      location: "À distance / Présentielle",
    },
  };

  console.log(
    "[Calendly] POST one_off_event_types request:",
    JSON.stringify(requestBody),
  );

  try {
    const response = await fetch(`${CALENDLY_API_BASE}/one_off_event_types`, {
      method: "POST",
      headers: calendlyHeaders(apiKey),
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // keep raw text for logging
    }

    console.log(
      "[Calendly] POST one_off_event_types response:",
      response.status,
      responseBody,
    );

    if (!response.ok) {
      console.error(
        `[Calendly] one_off_event_types failed (${response.status}):`,
        responseText,
      );
      return { event_uri: null, scheduling_url: null };
    }

    const resource = extractOneOffResource(responseBody);
    if (!resource) {
      console.error("[Calendly] Response missing resource object:", responseBody);
      return { event_uri: null, scheduling_url: null };
    }

    const event_uri = resource.uri ?? null;
    const scheduling_url = resource.scheduling_url ?? null;

    if (!event_uri || !scheduling_url) {
      console.error("[Calendly] Response missing uri or scheduling_url:", resource);
      return { event_uri, scheduling_url };
    }

    console.log("[Calendly] one-off event type created", {
      event_uri,
      scheduling_url,
    });

    return { event_uri, scheduling_url };
  } catch (err) {
    console.error("[Calendly] createCalendlyEvent error:", err);
    return { event_uri: null, scheduling_url: null };
  }
}

export function sendConfirmationEmailPlaceholder(details: {
  to: string;
  fullName: string;
  selectedDate: string;
  eventUri: string | null;
  schedulingUrl: string | null;
}): void {
  console.log("[confirmation email]", {
    to: details.to,
    subject: "Confirmation de votre consultation",
    body: {
      greeting: `Bonjour ${details.fullName},`,
      message:
        "Votre paiement a été confirmé. Voici le lien pour finaliser votre rendez-vous.",
      selectedDate: details.selectedDate,
      calendlyEventUri: details.eventUri,
      calendlySchedulingUrl: details.schedulingUrl,
    },
  });
}
