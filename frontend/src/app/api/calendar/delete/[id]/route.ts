import { NextResponse } from "next/server";

import { deleteCalendarEvent, GoogleCalendarError } from "@/lib/googleCalendar";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id?.trim()) {
      return NextResponse.json(
        { error: "Event id is required." },
        { status: 400 },
      );
    }

    await deleteCalendarEvent(id.trim());

    return NextResponse.json({ ok: true, deletedEventId: id.trim() });
  } catch (err) {
    if (err instanceof GoogleCalendarError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    console.error("[DELETE /api/calendar/delete/[id]]", err);
    return NextResponse.json(
      { error: "Failed to delete calendar event." },
      { status: 500 },
    );
  }
}
