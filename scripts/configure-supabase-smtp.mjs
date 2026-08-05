/**
 * Point Supabase Auth emails (confirm / reset) through Resend SMTP
 * so they send from Admin@optometryconcierge.com instead of
 * noreply@mail.app.supabase.io.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN  — from https://supabase.com/dashboard/account/tokens
 *   RESEND_API_KEY
 *   SUPABASE_PROJECT_REF   — optional; derived from VITE_SUPABASE_URL if set
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... RESEND_API_KEY=re_... \
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co \
 *   node scripts/configure-supabase-smtp.mjs
 */

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const resendKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.SMTP_ADMIN_EMAIL || "Admin@optometryconcierge.com";
const senderName = process.env.SMTP_SENDER_NAME || "Optometry Concierge";

function projectRefFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host.split(".")[0] || null;
  } catch {
    return null;
  }
}

const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  projectRefFromUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

if (!accessToken || !resendKey || !projectRef) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN, RESEND_API_KEY, or project ref (SUPABASE_PROJECT_REF / VITE_SUPABASE_URL).",
  );
  process.exit(1);
}

const body = {
  external_email_enabled: true,
  mailer_secure_email_change_enabled: true,
  smtp_admin_email: fromEmail,
  smtp_host: "smtp.resend.com",
  smtp_port: "465",
  smtp_user: "resend",
  smtp_pass: resendKey,
  smtp_sender_name: senderName,
};

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  },
);

const text = await response.text();
if (!response.ok) {
  console.error("Failed to configure SMTP:", response.status, text);
  process.exit(1);
}

console.log("Supabase Auth SMTP configured.");
console.log(`Sender: ${senderName} <${fromEmail}>`);
console.log(`Project: ${projectRef}`);
console.log("Auth confirmation / reset emails will now go through Resend.");
