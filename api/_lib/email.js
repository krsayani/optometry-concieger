import { Resend } from "resend";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export const ADMIN_EMAIL = normalizeEmail(
  process.env.CONTACT_TO_EMAIL || "admin@optometryconcierge.com",
);

const BRAND = {
  navy: "#051C3F",
  teal: "#2A9D9D",
  cream: "#F7F9FC",
  border: "#E2E8F0",
  muted: "#64748B",
  white: "#FFFFFF",
  text: "#0F172A",
};

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(", ");
    return joined || null;
  }
  return String(value);
}

function formatReplyTo(email, name) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return undefined;
  const cleanName = String(name || "")
    .trim()
    .replace(/[<>"]/g, "");
  return cleanName ? `${cleanName} <${cleanEmail}>` : cleanEmail;
}

function phoneDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function mailtoHref(email, { subject, body } = {}) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${cleanEmail}${query ? `?${query}` : ""}`;
}

function telHref(phone) {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:+${digits}`;
}

function renderRows(rows) {
  return rows
    .map(({ label, value }) => {
      const shown = displayValue(value);
      if (!shown) return "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};width:38%;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND.muted};">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid ${BRAND.border};vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${BRAND.text};font-weight:600;">
            ${escapeHtml(shown)}
          </td>
        </tr>`;
    })
    .join("");
}

function renderSections(sections) {
  return (sections || [])
    .map((section) => {
      const rowsHtml = renderRows(section.rows || []);
      if (!rowsHtml.trim()) return "";
      return `
        <tr>
          <td style="padding:28px 32px 0;">
            <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.navy};">
              ${escapeHtml(section.title)}
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${rowsHtml}
            </table>
          </td>
        </tr>`;
    })
    .join("");
}

/**
 * Build a branded HTML email for admin notifications.
 */
export function buildAdminNotificationHtml({
  badge,
  title,
  subtitle,
  replyName,
  replyEmail,
  replyPhone,
  replySubject,
  highlight,
  sections,
  footerNote,
}) {
  const replyMail = mailtoHref(replyEmail, {
    subject: replySubject || `Re: ${title}`,
    body: `Hi ${replyName || "there"},\n\nThanks for submitting your profile on Optometry Concierge. `,
  });
  const callLink = telHref(replyPhone);
  const safeEmail = normalizeEmail(replyEmail);
  const safePhone = displayValue(replyPhone);

  const ctaButtons = [
    replyMail
      ? `<a href="${replyMail}" style="display:inline-block;background:${BRAND.teal};color:${BRAND.white};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:14px 22px;border-radius:999px;margin:0 8px 8px 0;">
          Reply by email
        </a>`
      : "",
    callLink
      ? `<a href="${callLink}" style="display:inline-block;background:${BRAND.navy};color:${BRAND.white};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:14px 22px;border-radius:999px;margin:0 8px 8px 0;">
          Call ${escapeHtml(safePhone)}
        </a>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const highlightBlock = highlight
    ? `<tr>
        <td style="padding:0 32px 8px;">
          <div style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:16px;padding:16px 18px;">
            <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.teal};">
              ${escapeHtml(highlight.label || "Quick note")}
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.text};white-space:pre-wrap;">
              ${escapeHtml(highlight.value)}
            </p>
          </div>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${BRAND.white};border-radius:24px;overflow:hidden;border:1px solid ${BRAND.border};">
          <tr>
            <td style="background:${BRAND.navy};padding:28px 32px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.teal};">
                Optometry Concierge
              </p>
              <span style="display:inline-block;background:rgba(42,157,157,0.18);color:${BRAND.teal};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:6px 10px;border-radius:999px;margin-bottom:12px;">
                ${escapeHtml(badge || "New submission")}
              </span>
              <h1 style="margin:12px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;color:${BRAND.white};font-weight:800;">
                ${escapeHtml(title)}
              </h1>
              ${
                subtitle
                  ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:rgba(255,255,255,0.82);">
                      ${escapeHtml(subtitle)}
                    </p>`
                  : ""
              }
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">
                      Reply to submitter
                    </p>
                    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:${BRAND.navy};">
                      ${escapeHtml(replyName || "Website visitor")}
                    </p>
                    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.text};">
                      ${
                        safeEmail
                          ? `<a href="${mailtoHref(safeEmail)}" style="color:${BRAND.teal};font-weight:700;text-decoration:none;">${escapeHtml(safeEmail)}</a>`
                          : "No email provided"
                      }
                      ${
                        safePhone
                          ? `<span style="color:${BRAND.muted};"> · </span><a href="${callLink || "#"}" style="color:${BRAND.navy};font-weight:700;text-decoration:none;">${escapeHtml(safePhone)}</a>`
                          : ""
                      }
                    </p>
                    <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};">
                      Hit <strong>Reply</strong> in your inbox to email them directly, or use a button below.
                    </p>
                    <div>${ctaButtons}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${highlightBlock}
          ${renderSections(sections)}

          <tr>
            <td style="padding:28px 32px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                ${escapeHtml(
                  footerNote ||
                    "This notification was sent from the Optometry Concierge website. Replying goes to the submitter.",
                )}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPlainTextFromSections({
  intro,
  replyName,
  replyEmail,
  replyPhone,
  sections,
}) {
  const lines = [intro, ""];

  if (replyName || replyEmail || replyPhone) {
    lines.push("REPLY TO SUBMITTER");
    if (replyName) lines.push(`Name: ${replyName}`);
    if (replyEmail) lines.push(`Email: ${replyEmail}`);
    if (replyPhone) lines.push(`Phone: ${replyPhone}`);
    lines.push("Tip: Hit Reply in your email app to respond directly.", "");
  }

  for (const section of sections || []) {
    const rows = (section.rows || [])
      .map(({ label, value }) => {
        const shown = displayValue(value);
        return shown ? `${label}: ${shown}` : null;
      })
      .filter(Boolean);
    if (!rows.length) continue;
    lines.push(section.title.toUpperCase());
    lines.push(...rows, "");
  }

  lines.push(`Delivered to: ${ADMIN_EMAIL}`);
  return lines.join("\n");
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY. Add your Resend API key to the environment.",
    );
  }
  return new Resend(apiKey);
}

function getFromAddress() {
  return (
    process.env.CONTACT_FROM_EMAIL ||
    "Optometry Concierge <notifications@optometryconcierge.com>"
  );
}

async function sendWithResend(payload) {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error("[sendWithResend] Resend error:", error);
    throw new Error(error.message || "Resend failed to send email");
  }

  if (!data?.id) {
    throw new Error("Resend accepted the request but returned no email id.");
  }

  return data;
}

/**
 * Send an email to the admin inbox via Resend.
 * @param {{ subject: string, replyTo?: string, replyName?: string, text: string, html?: string }} options
 */
export async function sendAdminEmail({
  subject,
  replyTo,
  replyName,
  text,
  html,
}) {
  if (!ADMIN_EMAIL) {
    throw new Error("Missing CONTACT_TO_EMAIL admin recipient.");
  }

  const payload = {
    from: getFromAddress(),
    to: [ADMIN_EMAIL],
    subject,
    text,
    html: html || undefined,
  };

  const formattedReplyTo = formatReplyTo(replyTo, replyName);
  if (formattedReplyTo) {
    payload.replyTo = formattedReplyTo;
  }

  const data = await sendWithResend(payload);

  console.info("[sendAdminEmail] Sent", {
    id: data.id,
    to: ADMIN_EMAIL,
    subject,
    replyTo: formattedReplyTo || null,
  });

  return data;
}

/**
 * Send an email to a site user via Resend.
 * @param {{ to: string, subject: string, text: string, html?: string }} options
 */
export async function sendUserEmail({ to, subject, text, html }) {
  const recipient = normalizeEmail(to);
  if (!recipient) {
    throw new Error("Missing recipient email.");
  }

  const data = await sendWithResend({
    from: getFromAddress(),
    to: [recipient],
    subject,
    text,
    html: html || undefined,
  });

  console.info("[sendUserEmail] Sent", {
    id: data.id,
    to: recipient,
    subject,
  });

  return data;
}

export function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    "https://www.optometryconcierge.com"
  ).replace(/\/$/, "");
}

/**
 * Branded "create your account" email for OD / practice submitters.
 */
export function buildAccountInviteHtml({
  name,
  type,
  createAccountUrl,
}) {
  const isPractice = type === "practice";
  const audience = isPractice ? "practice" : "optometrist";
  const greetingName = String(name || "").trim() || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Create your Optometry Concierge account</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${BRAND.white};border-radius:24px;overflow:hidden;border:1px solid ${BRAND.border};">
          <tr>
            <td style="background:${BRAND.navy};padding:28px 32px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.teal};">
                Optometry Concierge
              </p>
              <h1 style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.25;color:${BRAND.white};font-weight:800;">
                Create your account
              </h1>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:rgba(255,255,255,0.82);">
                We received your ${audience} profile. Set a password to access your dashboard.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.text};">
                Hi ${escapeHtml(greetingName)},
              </p>
              <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.text};">
                Thanks for submitting your profile to Optometry Concierge. Click below to create your account password and open your private dashboard.
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${escapeHtml(createAccountUrl)}" style="display:inline-block;background:${BRAND.teal};color:${BRAND.white};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px;">
                  Create my account
                </a>
              </p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${BRAND.muted};">
                If the button doesn’t work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.teal};word-break:break-all;">
                ${escapeHtml(createAccountUrl)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                Questions? Reply to this email or contact Admin@optometryconcierge.com.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

export function formatList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || null;
  return value || null;
}
