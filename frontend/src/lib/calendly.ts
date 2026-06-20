const CALENDLY_API_BASE = "https://api.calendly.com";

export type CalendlyBookingInput = {
  full_name: string;
  email: string;
  selected_date: string;
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

/**
 * Creates a one-off Calendly meeting constrained to the booking date.
 * Returns null URIs on failure so payment flows are not interrupted.
 */
export async function createCalendlyEvent(
  booking: CalendlyBookingInput,
): Promise<CalendlyEventResult> {
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

  const requestBody = {
    name: `Consultation - ${booking.full_name.trim()}`,
    host,
    duration: 30,
    timezone: "Africa/Casablanca",
    date_setting: {
      type: "date_range",
      start_date: booking.selected_date,
      end_date: booking.selected_date,
    },
    location: {
      kind: "custom",
      location: "À distance / Présentielle",
    },
  };

  try {
    const response = await fetch(`${CALENDLY_API_BASE}/one_off_event_types`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `[Calendly] one_off_event_types failed (${response.status}):`,
        responseText,
      );
      return { event_uri: null, scheduling_url: null };
    }

    let data: OneOffEventTypeResponse;
    try {
      data = JSON.parse(responseText) as OneOffEventTypeResponse;
    } catch {
      console.error("[Calendly] Invalid JSON response:", responseText);
      return { event_uri: null, scheduling_url: null };
    }

    const event_uri = data.resource?.uri ?? null;
    const scheduling_url = data.resource?.scheduling_url ?? null;

    if (!event_uri && !scheduling_url) {
      console.error("[Calendly] Response missing event URI and scheduling URL:", data);
    }

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
