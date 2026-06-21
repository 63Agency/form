import { NextResponse } from "next/server";

import { getCalendarEvents, GoogleCalendarError } from "@/lib/googleCalendar";

function toIsoDateTime(value: string, endOfDay = false): string | null {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return endOfDay
      ? `${trimmed}T23:59:59.999Z`
      : `${trimmed}T00:00:00.000Z`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Query parameters startDate and endDate are required." },
        { status: 400 },
      );
    }

    const timeMin = toIsoDateTime(startDate);
    const timeMax = toIsoDateTime(endDate, true);

    if (!timeMin || !timeMax) {
      return NextResponse.json(
        { error: "Invalid startDate or endDate format." },
        { status: 400 },
      );
    }

    const events = await getCalendarEvents(timeMin, timeMax);

    return NextResponse.json({ ok: true, events });
  } catch (err) {
    if (err instanceof GoogleCalendarError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    console.error("[GET /api/calendar/events]", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar events." },
      { status: 500 },
    );
  }
}
