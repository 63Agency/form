import { NextResponse } from "next/server";

import {
  createCalendarEvent,
  GoogleCalendarError,
  type CalendarEventData,
} from "@/lib/googleCalendar";

function isCalendarEventData(value: unknown): value is CalendarEventData {
  if (!value || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;

  return (
    typeof body.title === "string" &&
    typeof body.startDateTime === "string" &&
    typeof body.endDateTime === "string" &&
    (body.description === undefined || typeof body.description === "string")
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isCalendarEventData(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid request body. Required: title, startDateTime, endDateTime.",
        },
        { status: 400 },
      );
    }

    const event = await createCalendarEvent(body);

    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (err) {
    if (err instanceof GoogleCalendarError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    console.error("[POST /api/calendar/create]", err);
    return NextResponse.json(
      { error: "Failed to create calendar event." },
      { status: 500 },
    );
  }
}
