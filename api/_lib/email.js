export const ADMIN_EMAIL =
  process.env.CONTACT_TO_EMAIL || "Admin@optometryconcierge.com";

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

/**
 * Send an email to the admin inbox via Resend (preferred) or FormSubmit.
 * @param {{ subject: string, replyTo?: string, name?: string, text: string, fields?: Record<string, string> }} options
 */
export async function sendAdminEmail({
  subject,
  replyTo,
  name = "Website Notification",
  text,
  fields = {},
}) {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend({ subject, replyTo, text });
  }
  return sendWithFormSubmit({ subject, replyTo, name, text, fields });
}

async function sendWithResend({ subject, replyTo, text }) {
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    "Optometry Concierge <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [ADMIN_EMAIL],
      reply_to: replyTo || undefined,
      subject,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Resend failed to send email");
  }
  return data;
}

async function sendWithFormSubmit({ subject, replyTo, name, text, fields }) {
  const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name,
      email: replyTo || ADMIN_EMAIL,
      _subject: subject,
      _replyto: replyTo || ADMIN_EMAIL,
      _template: "table",
      _captcha: "false",
      ...fields,
      details: text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === "false" || data.success === false) {
    throw new Error(data.message || "Unable to deliver email");
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
