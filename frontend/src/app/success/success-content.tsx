"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import type { BookingRow } from "@/types/booking";

function formatDateFr(isoDate: string): string {
  try {
    const date = new Date(`${isoDate}T12:00:00`);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDate;
  }
}

export function SuccessLoadingCard() {
  return (
    <div className="mx-auto w-full max-w-md text-center sm:max-w-lg lg:max-w-xl">
      <Card className="w-full border shadow-sm">
        <CardContent className="flex flex-col items-center px-5 py-10 sm:px-8 sm:py-12">
          <div
            className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <CardTitle className="text-center text-lg sm:text-xl">
            Chargement...
          </CardTitle>
          <CardDescription className="mt-2 text-center text-base sm:text-sm">
            Vérification de votre réservation en cours.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");

  const [loading, setLoading] = useState(Boolean(bookingId));
  const [booking, setBooking] = useState<BookingRow | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBooking() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (!response.ok) {
          if (!cancelled) setBooking(null);
          return;
        }
        const data = (await response.json()) as BookingRow;
        if (!cancelled) setBooking(data);

        // Fallback: finalize + send email if Payzone webhook was delayed
        if (!cancelled) {
          try {
            const finalizeRes = await fetch(`/api/bookings/${bookingId}/finalize`, {
              method: "POST",
            });
            console.log("[success] finalize response", finalizeRes.status);
          } catch (finalizeErr) {
            console.error("[success] finalize failed", finalizeErr);
          }
        }
      } catch {
        if (!cancelled) setBooking(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return <SuccessLoadingCard />;
  }

  const hasBooking = Boolean(booking?.full_name && booking?.selected_date);

  return (
    <div className="mx-auto w-full max-w-md text-center sm:max-w-lg lg:max-w-xl">
      <Card className="w-full border shadow-sm">
        <CardContent className="flex flex-col items-center px-5 py-10 sm:px-8 sm:py-12">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-green-600">
            🎉
          </div>
          <CardTitle className="text-center text-lg sm:text-xl">
            Paiement confirmé ! 🎉
          </CardTitle>
          <CardDescription className="mt-3 text-center text-base leading-relaxed sm:text-sm">
            {hasBooking ? (
              <>
                Merci {booking!.full_name}, votre réservation pour le{" "}
                {formatDateFr(booking!.selected_date)} est confirmée.
                <br />
                <span className="mt-2 block">
                  Vous recevrez un email de confirmation sous peu.
                </span>
              </>
            ) : (
              <>
                Votre paiement a bien été enregistré.
                <br />
                <span className="mt-2 block">
                  Vous recevrez un email de confirmation sous peu.
                </span>
              </>
            )}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
