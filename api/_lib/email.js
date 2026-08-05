import { Resend } from "resend";

export const ADMIN_EMAIL =
  process.env.CONTACT_TO_EMAIL || "admin@optometryconcierge.com";

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }

    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function textToHtml(text) {
  const escaped = String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#051c3f;white-space:pre-wrap;">${escaped}</div>`;
}

/**
 * Send an email to the admin inbox via Resend.
 * @param {{ subject: string, replyTo?: string, name?: string, text: string, fields?: Record<string, string>, html?: string }} options
 */
export async function sendAdminEmail({
  subject,
  replyTo,
  text,
  html,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY. Add your Resend API key to the environment.",
    );
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.CONTACT_FROM_EMAIL || "Optometry Concierge <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: [ADMIN_EMAIL],
    replyTo: replyTo || undefined,
    subject,
    text,
    html: html || textToHtml(text),
  });

  if (error) {
    throw new Error(error.message || "Resend failed to send email");
  }

  return data;
}

export function formatFields(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const formatted = Array.isArray(value) ? value.join(", ") : String(value);
      return `${key}: ${formatted}`;
    })
    .join("\n");
}
