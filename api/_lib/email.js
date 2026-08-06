import { Resend } from "resend";
import { getServiceRoleClient } from "./supabase-admin.js";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export const ADMIN_EMAIL = normalizeEmail(
  process.env.CONTACT_TO_EMAIL || "admin@optometryconcierge.com",
);

/** Google Workspace / Gmail address (Admin@) — primary mailbox. */
export const WORKSPACE_NOTIFY_EMAIL = normalizeEmail(
  process.env.INBOUND_FORWARD_TO ||
    process.env.CONTACT_TO_EMAIL ||
    "admin@optometryconcierge.com",
);

/**
 * Resend receiving address that feeds the website inbox.
 * Prefer a Resend-managed `*.resend.app` address so Admin@ can stay on Google Workspace.
 * Set via INBOUND_RECEIVE_EMAIL after copying it from Resend → Receiving.
 */
export const INBOUND_RECEIVE_EMAIL = normalizeEmail(
  process.env.INBOUND_RECEIVE_EMAIL || "",
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

function renderCellValue(value, href) {
  const shown = displayValue(value);
  if (!shown) return "";

  const link = href || (/^https?:\/\//i.test(shown) ? shown : null);
  if (link) {
    const label =
      /resume|supabase\.co\/storage/i.test(link) || /resume/i.test(shown)
        ? "View resume"
        : shown.length > 64
          ? `${shown.slice(0, 56)}…`
          : shown;
    return `<a href="${escapeHtml(link)}" style="color:${BRAND.teal};font-weight:700;text-decoration:none;" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shown)) {
    return `<a href="mailto:${escapeHtml(shown)}" style="color:${BRAND.teal};font-weight:700;text-decoration:none;">${escapeHtml(shown)}</a>`;
  }

  return escapeHtml(shown);
}

function renderRows(rows) {
  return rows
    .map(({ label, value, href }) => {
      const cell = renderCellValue(value, href);
      if (!cell) return "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};width:34%;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">
            ${escapeHtml(label)}
          </td>
          <td style="padding:12px 0 12px 18px;border-bottom:1px solid ${BRAND.border};vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:${BRAND.text};font-weight:600;">
            ${cell}
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
          <td style="padding:22px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:18px;">
              <tr>
                <td style="padding:16px 18px 6px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND.navy};">
                    ${escapeHtml(section.title)}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 18px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    ${rowsHtml}
                  </table>
                </td>
              </tr>
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
            <td style="background:${BRAND.navy};padding:28px 32px;background-image:linear-gradient(135deg,${BRAND.navy} 0%,#0a2f5c 55%,#164e63 100%);">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.teal};">
                Optometry Concierge
              </p>
              <span style="display:inline-block;background:rgba(42,157,157,0.22);color:#9FE7E7;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:7px 12px;border-radius:999px;margin-bottom:12px;">
                ${escapeHtml(badge || "New submission")}
              </span>
              <h1 style="margin:14px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;color:${BRAND.white};font-weight:800;">
                ${escapeHtml(title)}
              </h1>
              ${
                subtitle
                  ? `<p style="margin:0;max-width:520px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:rgba(255,255,255,0.86);">
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

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY. Add your Resend API key to the environment.",
    );
  }
  return new Resend(apiKey);
}

export async function fetchReceivedEmail(emailId) {
  const resend = getResendClient();
  const { data, error } = await resend.emails.receiving.get(emailId);
  if (error) {
    throw new Error(error.message || "Failed to fetch received email");
  }
  return data;
}

/**
 * Forward a received email to Google Workspace / Gmail so admins see it
 * outside the website inbox too.
 */
export async function forwardReceivedEmailToWorkspace(emailId, to = WORKSPACE_NOTIFY_EMAIL) {
  const recipient = normalizeEmail(to);
  if (!recipient) {
    throw new Error("Missing workspace notify email.");
  }

  const resend = getResendClient();
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    "Optometry Concierge <Admin@optometryconcierge.com>";

  const { data, error } = await resend.emails.receiving.forward({
    emailId,
    to: recipient,
    from,
    passthrough: true,
  });

  if (error) {
    throw new Error(error.message || "Failed to forward inbound email");
  }
  return data;
}

export function parseFromAddress(from) {
  const raw = String(from || "").trim();
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      from_name: match[1].trim().replace(/^"|"$/g, "") || null,
      from_email: normalizeEmail(match[2]),
    };
  }
  return { from_name: null, from_email: normalizeEmail(raw) };
}

function getFromAddress() {
  return (
    process.env.CONTACT_FROM_EMAIL ||
    "Optometry Concierge <Admin@optometryconcierge.com>"
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
 * Mirror an admin notification into the website Inbox (/admin/inbox).
 * Contact/intake emails are sent TO Admin@ (Gmail) — they do not hit the
 * Resend inbound webhook, so we store them here as well.
 */
async function mirrorAdminEmailToWebsiteInbox({
  resendId,
  subject,
  replyTo,
  replyName,
  text,
  html,
}) {
  const admin = getServiceRoleClient();
  if (!admin) {
    console.warn(
      "[sendAdminEmail] SUPABASE_SERVICE_ROLE_KEY missing — website inbox not updated",
    );
    return;
  }

  const fromEmail = normalizeEmail(replyTo) || "noreply@optometryconcierge.com";
  const fromName = String(replyName || "").trim() || null;
  const row = {
    resend_email_id: resendId || `admin-${Date.now()}`,
    message_id: resendId ? `<${resendId}@resend.dev>` : null,
    from_email: fromEmail,
    from_name: fromName,
    to_emails: ADMIN_EMAIL ? [ADMIN_EMAIL] : [],
    cc_emails: [],
    subject: subject || "(no subject)",
    text_body: text || null,
    html_body: html || null,
    attachments: [],
    is_read: false,
    received_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("inbound_emails")
    .upsert(row, { onConflict: "resend_email_id" });

  if (error) {
    console.error("[sendAdminEmail] website inbox upsert failed", error);
    return;
  }

  try {
    await admin.from("admin_notifications").insert({
      title: "New inbox email",
      content: `${fromName || fromEmail} — ${subject || "(no subject)"}`,
    });
  } catch (notifyErr) {
    console.error("[sendAdminEmail] admin_notifications insert failed", notifyErr);
  }
}

/**
 * Send an email to the admin inbox via Resend.
 * Also mirrors into the website Admin → Inbox.
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

  // Best-effort: Gmail already has the message; also show it in /admin/inbox
  try {
    await mirrorAdminEmailToWebsiteInbox({
      resendId: data.id,
      subject,
      replyTo,
      replyName,
      text,
      html,
    });
  } catch (mirrorErr) {
    console.error("[sendAdminEmail] mirror to website inbox failed", mirrorErr);
  }

  return data;
}

/**
 * Send an email to a site user via Resend.
 * @param {{
 *   to: string | string[],
 *   subject: string,
 *   text: string,
 *   html?: string,
 *   cc?: string | string[],
 *   bcc?: string | string[],
 *   replyTo?: string,
 *   replyName?: string,
 * }} options
 */
export async function sendUserEmail({
  to,
  subject,
  text,
  html,
  cc,
  bcc,
  replyTo,
  replyName,
  headers,
}) {
  const recipients = (Array.isArray(to) ? to : [to])
    .map(normalizeEmail)
    .filter(Boolean);
  if (!recipients.length) {
    throw new Error("Missing recipient email.");
  }

  const payload = {
    from: getFromAddress(),
    to: recipients,
    subject,
    text,
    html: html || undefined,
  };

  const ccList = (Array.isArray(cc) ? cc : cc ? [cc] : [])
    .map(normalizeEmail)
    .filter(Boolean);
  const bccList = (Array.isArray(bcc) ? bcc : bcc ? [bcc] : [])
    .map(normalizeEmail)
    .filter(Boolean);
  if (ccList.length) payload.cc = ccList;
  if (bccList.length) payload.bcc = bccList;

  const formattedReplyTo = formatReplyTo(replyTo, replyName);
  if (formattedReplyTo) {
    payload.replyTo = formattedReplyTo;
  }

  if (headers && typeof headers === "object") {
    payload.headers = headers;
  }

  const data = await sendWithResend(payload);

  console.info("[sendUserEmail] Sent", {
    id: data.id,
    to: recipients,
    subject,
    cc: ccList,
    bcc: bccList,
  });

  return data;
}

const SCHOOL_INTRO_URL = "https://www.optometryconcierge.com/intro";
const SCHOOL_INTRO_POSTER =
  "https://www.optometryconcierge.com/videos/school-outreach-poster.jpg";

const SITE_HOME_URL = "https://www.optometryconcierge.com";

function linkStyle() {
  return `color:${BRAND.teal};font-weight:700;text-decoration:underline;`;
}

function linkifyEscapedText(escaped) {
  // URLs first
  let html = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) =>
      `<a href="${url}" style="${linkStyle()}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );
  // Brand name → homepage (skip if somehow already inside a tag attribute)
  html = html.replace(
    /Optometry Concierge/g,
    `<a href="${SITE_HOME_URL}" style="${linkStyle()}" target="_blank" rel="noopener noreferrer">Optometry Concierge</a>`,
  );
  return html;
}

function renderVideoCtaBlock() {
  return `<div style="margin:8px 0 20px;">
  <a href="${SCHOOL_INTRO_URL}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};">
    <img src="${SCHOOL_INTRO_POSTER}" alt="Watch our short intro video" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;" />
    <div style="background:${BRAND.navy};padding:14px 18px;text-align:center;">
      <span style="display:inline-block;background:${BRAND.teal};color:${BRAND.navy};font-weight:800;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;padding:10px 18px;border-radius:999px;">▶ Watch our short intro</span>
    </div>
  </a>
  <p style="margin:10px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
    Or open: <a href="${SCHOOL_INTRO_URL}" style="${linkStyle()}">${SCHOOL_INTRO_URL}</a>
  </p>
</div>`;
}

/** Plain outreach email → simple branded HTML. */
export function buildPlainOutreachHtml({ subject, body, includeSchoolVideo }) {
  const rawBody = String(body || "");
  const shouldEmbedVideo =
    includeSchoolVideo === true ||
    /optometryconcierge\.com\/intro/i.test(rawBody) ||
    /school-outreach\.mp4/i.test(rawBody) ||
    /\[video\]/i.test(rawBody);

  const cleanedBody = rawBody
    .replace(/\[video\]/gi, "")
    .replace(
      /https?:\/\/(www\.)?optometryconcierge\.com\/(intro|videos\/school-outreach\.mp4)\s*/gi,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = cleanedBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const html = linkifyEscapedText(
        escapeHtml(block).replace(/\n/g, "<br/>"),
      );
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.text};">${html}</p>`;
    });

  // Insert video CTA after the paragraph that mentions "video" when present,
  // otherwise after the second paragraph.
  let videoInserted = false;
  if (shouldEmbedVideo) {
    const videoIdx = paragraphs.findIndex((p) => /video/i.test(p));
    const insertAt = videoIdx >= 0 ? videoIdx + 1 : Math.min(2, paragraphs.length);
    paragraphs.splice(insertAt, 0, renderVideoCtaBlock());
    videoInserted = true;
  }
  if (shouldEmbedVideo && !videoInserted) {
    paragraphs.push(renderVideoCtaBlock());
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
    <div style="background:${BRAND.white};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
      <div style="background:${BRAND.navy};padding:18px 24px;">
        <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.teal};font-weight:700;">
          <a href="${SITE_HOME_URL}" style="color:${BRAND.teal};font-weight:700;text-decoration:none;" target="_blank" rel="noopener noreferrer">Optometry Concierge</a>
        </p>
        <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:${BRAND.white};">${escapeHtml(subject || "Message")}</p>
      </div>
      <div style="padding:28px 24px;">${paragraphs.join("")}</div>
    </div>
    <p style="margin:16px 8px 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
      Sent by <a href="${SITE_HOME_URL}" style="color:${BRAND.teal};font-weight:700;text-decoration:underline;" target="_blank" rel="noopener noreferrer">Optometry Concierge</a>
    </p>
  </div>
</body>
</html>`;
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

/**
 * Branded "your account is ready" email after password setup.
 */
export function buildAccountReadyHtml({ name, type, dashboardUrl }) {
  const isPractice = type === "practice";
  const audience = isPractice ? "practice" : "career";
  const greetingName = String(name || "").trim() || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your Optometry Concierge account is ready</title>
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
                Your account is ready
              </h1>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:rgba(255,255,255,0.82);">
                You can sign in anytime to access your ${audience} dashboard.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.text};">
                Hi ${escapeHtml(greetingName)},
              </p>
              <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.text};">
                Your Optometry Concierge account is confirmed. Open your dashboard to review your profile and next steps.
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:${BRAND.teal};color:${BRAND.white};text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;padding:14px 28px;border-radius:999px;">
                  Open dashboard
                </a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                Questions? Contact Admin@optometryconcierge.com.
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
