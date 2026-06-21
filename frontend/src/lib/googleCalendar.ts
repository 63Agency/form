import fs from "node:fs";
import path from "node:path";

import { google, type calendar_v3 } from "googleapis";

const CALENDAR_TIMEZONE = "Africa/Casablanca";
const CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar"];

export type CalendarEventData = {
  title: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
};

export type CalendarEventResult = {
  id: string;
  htmlLink: string | null;
  summary: string | null;
  start: string | null;
  end: string | null;
};

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    readonly statusCode = 500,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

function resolveKeyPath(): string {
  const keyPath = process.env.GOOGLE_PRIVATE_KEY_PATH?.trim();
  if (!keyPath) {
    throw new GoogleCalendarError("GOOGLE_PRIVATE_KEY_PATH is not configured.", 500);
  }

  return path.isAbsolute(keyPath) ? keyPath : path.join(process.cwd(), keyPath);
}

function getCalendarId(): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (!calendarId) {
    throw new GoogleCalendarError("GOOGLE_CALENDAR_ID is not configured.", 500);
  }

  return calendarId;
}

function getCalendarClient(): calendar_v3.Calendar {
  const keyFilePath = resolveKeyPath();

  if (!fs.existsSync(keyFilePath)) {
    throw new GoogleCalendarError(
      `Google service account key file not found: ${keyFilePath}`,
      500,
    );
  }

  const expectedEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  if (expectedEmail) {
    try {
      const keyFile = JSON.parse(
        fs.readFileSync(keyFilePath, "utf8"),
      ) as { client_email?: string };

      if (keyFile.client_email && keyFile.client_email !== expectedEmail) {
        console.warn(
          "[GoogleCalendar] GOOGLE_SERVICE_ACCOUNT_EMAIL does not match key file client_email",
          { expectedEmail, keyEmail: keyFile.client_email },
        );
      }
    } catch (err) {
      throw new GoogleCalendarError(
        "Invalid Google service account JSON key file.",
        500,
        err,
      );
    }
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: CALENDAR_SCOPES,
  });

  return google.calendar({ version: "v3", auth });
}

function buildEventResource(data: CalendarEventData): calendar_v3.Schema$Event {
  return {
    summary: data.title,
    description: data.description,
    start: {
      dateTime: data.startDateTime,
      timeZone: CALENDAR_TIMEZONE,
    },
    end: {
      dateTime: data.endDateTime,
      timeZone: CALENDAR_TIMEZONE,
    },
  };
}

function toCalendarEventResult(
  event: calendar_v3.Schema$Event,
): CalendarEventResult {
  return {
    id: event.id ?? "",
    htmlLink: event.htmlLink ?? null,
    summary: event.summary ?? null,
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
  };
}

function wrapGoogleError(err: unknown, action: string): never {
  console.error(`[GoogleCalendar] ${action} failed`, err);

  if (err instanceof GoogleCalendarError) {
    throw err;
  }

  const message =
    err instanceof Error ? err.message : `Failed to ${action} calendar event.`;

  throw new GoogleCalendarError(message, 500, err);
}

/** Creates a new event on the configured Google Calendar. */
export async function createCalendarEvent(
  eventData: CalendarEventData,
): Promise<CalendarEventResult> {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.events.insert({
      calendarId,
      requestBody: buildEventResource(eventData),
      sendUpdates: "none",
    });

    if (!response.data.id) {
      throw new GoogleCalendarError("Google Calendar did not return an event id.", 500);
    }

    console.log("[GoogleCalendar] event created", {
      id: response.data.id,
      title: eventData.title,
    });

    return toCalendarEventResult(response.data);
  } catch (err) {
    wrapGoogleError(err, "create");
  }
}

/** Fetches events within a date/time range. */
export async function getCalendarEvents(
  startDate: string,
  endDate: string,
): Promise<CalendarEventResult[]> {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate,
      timeMax: endDate,
      singleEvents: true,
      orderBy: "startTime",
    });

    const items = response.data.items ?? [];

    return items
      .filter((event) => Boolean(event.id))
      .map((event) => toCalendarEventResult(event));
  } catch (err) {
    wrapGoogleError(err, "list");
  }
}

/** Deletes an event by Google Calendar event id. */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log("[GoogleCalendar] event deleted", { eventId });
  } catch (err) {
    wrapGoogleError(err, "delete");
  }
}

/** Updates an existing event by Google Calendar event id. */
export async function updateCalendarEvent(
  eventId: string,
  eventData: CalendarEventData,
): Promise<CalendarEventResult> {
  try {
    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: buildEventResource(eventData),
      sendUpdates: "none",
    });

    if (!response.data.id) {
      throw new GoogleCalendarError("Google Calendar did not return an event id.", 500);
    }

    console.log("[GoogleCalendar] event updated", { eventId: response.data.id });

    return toCalendarEventResult(response.data);
  } catch (err) {
    wrapGoogleError(err, "update");
  }
}

const SESSION_DURATION_MINUTES = 30;

/** Builds local datetimes for a coaching session from booking date/time fields. */
export function buildCoachingSessionDateTimes(
  selectedDate: string,
  selectedTime: string | null,
  durationMinutes = SESSION_DURATION_MINUTES,
): { startDateTime: string; endDateTime: string } {
  const date = selectedDate.trim().slice(0, 10);
  const time = (selectedTime ?? "09:00").slice(0, 5);
  const [hours, minutes] = time.split(":").map(Number);

  const startTotalMinutes = hours * 60 + minutes;
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  const endHours = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    startDateTime: `${date}T${pad(hours)}:${pad(minutes)}:00`,
    endDateTime: `${date}T${pad(endHours)}:${pad(endMinutes)}:00`,
  };
}

/** Creates a coaching session event from booking details. */
export async function createCoachingSessionEvent(input: {
  fullName: string;
  email: string;
  selectedDate: string;
  selectedTime: string | null;
  sessionType?: string;
  notes?: string;
}): Promise<CalendarEventResult> {
  const sessionType = input.sessionType?.trim() || "Consultation Unicoach";
  const { startDateTime, endDateTime } = buildCoachingSessionDateTimes(
    input.selectedDate,
    input.selectedTime,
  );

  const descriptionLines = [
    `Client: ${input.fullName}`,
    `Email: ${input.email}`,
    input.notes?.trim(),
  ].filter(Boolean);

  return createCalendarEvent({
    title: `${input.fullName} — ${sessionType}`,
    startDateTime,
    endDateTime,
    description: descriptionLines.join("\n"),
  });
}
