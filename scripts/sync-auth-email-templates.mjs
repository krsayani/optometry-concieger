/**
 * Sync branded Auth email templates to Supabase.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN  — dashboard personal access token or session JWT
 *   SUPABASE_PROJECT_REF   — optional; derived from VITE_SUPABASE_URL
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... VITE_SUPABASE_URL=https://xxxx.supabase.co \
 *   node scripts/sync-auth-email-templates.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  projectRefFromUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

if (!accessToken || !projectRef) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN or project ref (SUPABASE_PROJECT_REF / VITE_SUPABASE_URL).",
  );
  process.exit(1);
}

const confirmationHtml = readFileSync(
  join(root, "supabase/templates/confirmation.html"),
  "utf8",
);

const body = {
  mailer_subjects_confirmation:
    "Welcome aboard — confirm your Optometry Concierge email",
  mailer_templates_confirmation_content: confirmationHtml,
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
  console.error("Failed to sync templates:", response.status, text);
  process.exit(1);
}

console.log("Auth confirmation email template synced.");
console.log(`Project: ${projectRef}`);
console.log(`Subject: ${body.mailer_subjects_confirmation}`);
