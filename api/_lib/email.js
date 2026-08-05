import { Resend } from "resend";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export const ADMIN_EMAIL = normalizeEmail(
  process.env.CONTACT_TO_EMAIL || "admin@optometryconcierge.com",
);

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
 * @param {{ subject: string, replyTo?: string, text: string, html?: string }} options
 */
export async function sendAdminEmail({ subject, replyTo, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY. Add your Resend API key to the environment.",
    );
  }

  if (!ADMIN_EMAIL) {
    throw new Error("Missing CONTACT_TO_EMAIL admin recipient.");
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    "Optometry Concierge <notifications@optometryconcierge.com>";

  const payload = {
    from,
    to: [ADMIN_EMAIL],
    subject,
    text,
    html: html || textToHtml(text),
  };

  const cleanReplyTo = normalizeEmail(replyTo);
  if (cleanReplyTo) {
    payload.replyTo = cleanReplyTo;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error("[sendAdminEmail] Resend error:", error);
    throw new Error(error.message || "Resend failed to send email");
  }

  if (!data?.id) {
    throw new Error("Resend accepted the request but returned no email id.");
  }

  console.info("[sendAdminEmail] Sent", {
    id: data.id,
    to: ADMIN_EMAIL,
    subject,
  });

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
