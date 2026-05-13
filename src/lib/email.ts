/**
 * Transactional email via Nodemailer.
 *
 * Configure via env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If SMTP_HOST is unset, sendEmail is a no-op (logged warning). This keeps
 * local dev runnable without an SMTP server and degrades the production
 * notification path gracefully if mail is temporarily misconfigured.
 */
import nodemailer, { type Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  _transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return _transporter;
}

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(input: SendEmailInput) {
  const tx = getTransporter();
  if (!tx) {
    console.warn("[email] SMTP_HOST not configured — skipping:", input.subject);
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM ?? "ULAW VB2-TX <noreply@ulawvb2tx.com>";
  await tx.sendMail({
    from,
    to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? stripHtml(input.html),
  });
  return { sent: true };
}

function stripHtml(html: string) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
