import nodemailer from "nodemailer";

export type MailBooking = {
  full_name: string;
  email: string;
  selected_date: string;
  selected_time: string | null;
};

const SMTP_USER = "unicoach@63agency.ma";

function getMailPassword(): string {
  const password = process.env.MAIL_PASSWORD?.trim();
  if (!password) {
    throw new Error("MAIL_PASSWORD is not configured.");
  }
  return password;
}

function createTransport() {
  return nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: getMailPassword(),
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function formatTimeFr(time: string | null): string {
  if (!time) return "Non précisée";
  return time.slice(0, 5);
}

export async function sendBookingConfirmation(
  booking: MailBooking,
): Promise<void> {
  const transporter = createTransport();
  const dateLabel = formatDateFr(booking.selected_date);
  const timeLabel = formatTimeFr(booking.selected_time);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="color: #2563eb;">Confirmation de votre réservation</h2>
      <p>Bonjour ${escapeHtml(booking.full_name)},</p>
      <ul>
        <li><strong>Nom complet :</strong> ${escapeHtml(booking.full_name)}</li>
        <li><strong>Date de consultation :</strong> ${escapeHtml(dateLabel)}</li>
        <li><strong>Heure de consultation :</strong> ${escapeHtml(timeLabel)}</li>
      </ul>
      <p>Votre réservation est confirmée. Notre équipe vous contactera sur WhatsApp pour confirmer les détails.</p>
      <p style="color: #666; font-size: 14px;">Unicoach — 63 Agency</p>
    </div>
  `.trim();

  await transporter.sendMail({
    from: `"Unicoach" <${SMTP_USER}>`,
    to: booking.email,
    subject: "Confirmation de votre réservation - Unicoach",
    html,
  });
}

export async function sendPaymentFailure(booking: MailBooking): Promise<void> {
  const transporter = createTransport();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="color: #dc2626;">Problème de paiement</h2>
      <p>Bonjour ${escapeHtml(booking.full_name)},</p>
      <p>Votre paiement n'a pas été traité. Veuillez réessayer ou contacter notre équipe.</p>
      <p style="color: #666; font-size: 14px;">Unicoach — 63 Agency</p>
    </div>
  `.trim();

  await transporter.sendMail({
    from: `"Unicoach" <${SMTP_USER}>`,
    to: booking.email,
    subject: "Problème de paiement - Unicoach",
    html,
  });
}
