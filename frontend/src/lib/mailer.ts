import nodemailer from "nodemailer";

export type MailBooking = {
  full_name: string;
  email: string;
  selected_date: string;
  selected_time: string | null;
};

const COACH_NAME = "Unicoach";
const SESSION_DURATION_MINUTES = 30;
const UNICOACH_LOGO_URL =
  "https://eamnpfvgrolafhxpovxf.supabase.co/storage/v1/object/public/assets/Unicoach.jpg";

function getMailUser(): string {
  const user = process.env.MAIL_USER?.trim();
  if (!user) {
    throw new Error("MAIL_USER is not configured.");
  }
  return user;
}

function getMailPassword(): string {
  const password = process.env.MAIL_PASSWORD?.trim();
  if (!password) {
    throw new Error("MAIL_PASSWORD is not configured.");
  }
  return password;
}

/** Resolves SMTP host from env override or email domain. */
function resolveSmtpHost(email: string): string {
  const hostOverride = process.env.MAIL_SMTP_HOST?.trim();
  if (hostOverride) {
    return hostOverride;
  }

  const domain = email.split("@")[1]?.toLowerCase() ?? "";

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return "smtp.gmail.com";
  }

  if (domain === "63agency.ma") {
    return "smtp.titan.email";
  }

  if (domain.endsWith(".onmicrosoft.com") || domain === "outlook.com") {
    return "smtp.office365.com";
  }

  return "smtp.gmail.com";
}

function createTransport() {
  const user = getMailUser();

  return nodemailer.createTransport({
    host: resolveSmtpHost(user),
    port: 465,
    secure: true,
    auth: {
      user,
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
  const mailUser = getMailUser();

  console.log("[mailer] sendBookingConfirmation start", {
    to: booking.email,
    full_name: booking.full_name,
    selected_date: booking.selected_date,
    selected_time: booking.selected_time,
    smtpHost: resolveSmtpHost(mailUser),
    hasMailPassword: Boolean(process.env.MAIL_PASSWORD?.trim()),
  });

  const transporter = createTransport();
  const dateLabel = formatDateFr(booking.selected_date);
  const timeLabel = formatTimeFr(booking.selected_time);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 560px; margin: 0 auto; background-color: #ffffff; padding: 32px 24px; border-radius: 8px;">
      <img src="${UNICOACH_LOGO_URL}" alt="UniCoach.Me" style="max-width:200px; display:block; margin:0 auto 24px auto;">
      <h2 style="color: #2563eb;">Confirmation de votre session</h2>
      <p>Bonjour ${escapeHtml(booking.full_name)},</p>
      <p>
        Merci pour votre confiance. Votre paiement a bien été reçu et votre session
        de coaching est confirmée.
      </p>
      <ul>
        <li><strong>Client :</strong> ${escapeHtml(booking.full_name)}</li>
        <li><strong>Date de la session :</strong> ${escapeHtml(dateLabel)}</li>
        <li><strong>Heure de la session :</strong> ${escapeHtml(timeLabel)}</li>
        <li><strong>Durée :</strong> ${SESSION_DURATION_MINUTES} minutes</li>
        <li><strong>Coach :</strong> ${COACH_NAME}</li>
      </ul>
      <p>
        Nous avons hâte de vous accompagner dans votre projet. Notre équipe reste
        disponible si vous avez la moindre question.
      </p>
      <p style="color: #666; font-size: 14px;">${COACH_NAME} — 63 Agency</p>
    </div>
  `.trim();

  const info = await transporter.sendMail({
    from: `"${COACH_NAME}" <${mailUser}>`,
    to: booking.email,
    subject: "Confirmation de votre session - Unicoach",
    html,
  });

  console.log("[mailer] sendBookingConfirmation OK", {
    to: booking.email,
    messageId: info.messageId,
    response: info.response,
  });
}

export async function sendPaymentFailure(booking: MailBooking): Promise<void> {
  const mailUser = getMailUser();

  console.log("[mailer] sendPaymentFailure start", { to: booking.email });

  const transporter = createTransport();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="color: #dc2626;">Problème de paiement</h2>
      <p>Bonjour ${escapeHtml(booking.full_name)},</p>
      <p>Votre paiement n'a pas été traité. Veuillez réessayer ou contacter notre équipe.</p>
      <p style="color: #666; font-size: 14px;">${COACH_NAME}</p>
    </div>
  `.trim();

  const info = await transporter.sendMail({
    from: `"${COACH_NAME}" <${mailUser}>`,
    to: booking.email,
    subject: "Problème de paiement - Unicoach",
    html,
  });

  console.log("[mailer] sendPaymentFailure OK", {
    to: booking.email,
    messageId: info.messageId,
  });
}
