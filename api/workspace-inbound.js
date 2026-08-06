import {
  readJsonBody,
  parseFromAddress,
  ADMIN_EMAIL,
  WORKSPACE_NOTIFY_EMAIL,
} from "./_lib/email.js";
import { getServiceRoleClient } from "./_lib/supabase-admin.js";

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function asEmailArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => normalizeEmail(v))
      .filter(Boolean);
  }
  return String(value)
    .split(/[,;]/)
    .map((v) => normalizeEmail(v))
    .filter(Boolean);
}

function authorize(req) {
  const secret = String(process.env.WORKSPACE_INBOUND_SECRET || "").trim();
  if (!secret) return false;

  const header = String(req.headers?.authorization || "").trim();
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() === secret;
  }

  const alt = String(
    req.headers?.["x-workspace-inbound-secret"] ||
      req.headers?.["X-Workspace-Inbound-Secret"] ||
      "",
  ).trim();
  return alt === secret;
}

function selfMailboxSet() {
  return new Set(
    [ADMIN_EMAIL, WORKSPACE_NOTIFY_EMAIL, "admin@optometryconcierge.com"]
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

/**
 * Ingest emails that already landed in Google Workspace / Gmail.
 * Called by the Apps Script in scripts/gmail-workspace-sync.gs
 * so Admin@ messages also appear in /admin/inbox.
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Workspace-Inbound-Secret",
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!authorize(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const admin = getServiceRoleClient();
  if (!admin) {
    return res.status(503).json({ error: "Inbox storage is not configured." });
  }

  try {
    const body = await readJsonBody(req);
    const items = Array.isArray(body?.emails)
      ? body.emails
      : Array.isArray(body)
        ? body
        : [body];

    const selfMailboxes = selfMailboxSet();
    const results = [];

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      const gmailId = String(item.gmail_id || item.id || "").trim();
      const messageId = String(item.message_id || "").trim() || null;
      const fromRaw = item.from || item.from_email || "";
      const parsed = parseFromAddress(fromRaw);
      const from_email = parsed.from_email;
      const from_name =
        parsed.from_name ||
        (item.from_name ? String(item.from_name).trim() : null) ||
        null;

      if (!from_email) {
        results.push({ ok: false, error: "Missing from email", gmailId });
        continue;
      }

      // Contact/intake alerts are already mirrored when sent — skip self-mail.
      if (selfMailboxes.has(from_email)) {
        results.push({ ok: true, skipped: "self_mailbox", gmailId, from_email });
        continue;
      }

      const externalId = gmailId
        ? `gmail:${gmailId}`
        : messageId
          ? `gmail-msgid:${messageId}`
          : `gmail-fallback:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (messageId) {
        const { data: existingByMsg } = await admin
          .from("inbound_emails")
          .select("id")
          .eq("message_id", messageId)
          .maybeSingle();
        if (existingByMsg?.id) {
          results.push({
            ok: true,
            skipped: "duplicate_message_id",
            id: existingByMsg.id,
            gmailId,
          });
          continue;
        }
      }

      const toEmails = asEmailArray(item.to || item.to_emails);
      const ccEmails = asEmailArray(item.cc || item.cc_emails);
      const subject = String(item.subject || "").trim() || "(no subject)";
      const textBody =
        item.text_body != null
          ? String(item.text_body)
          : item.text != null
            ? String(item.text)
            : null;
      const htmlBody =
        item.html_body != null
          ? String(item.html_body)
          : item.html != null
            ? String(item.html)
            : null;

      const receivedAt = item.received_at || item.date || new Date().toISOString();

      const row = {
        resend_email_id: externalId,
        message_id: messageId,
        from_email,
        from_name,
        to_emails: toEmails.length
          ? toEmails
          : ADMIN_EMAIL
            ? [ADMIN_EMAIL]
            : [],
        cc_emails: ccEmails,
        subject,
        text_body: textBody,
        html_body: htmlBody,
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        received_at: new Date(receivedAt).toISOString(),
      };

      const { data, error } = await admin
        .from("inbound_emails")
        .upsert(row, { onConflict: "resend_email_id" })
        .select("id")
        .maybeSingle();

      if (error) {
        results.push({ ok: false, error: error.message, gmailId });
        continue;
      }

      try {
        await admin.from("admin_notifications").insert({
          title: "New inbox email",
          content: `${row.from_name || from_email} — ${subject}`,
        });
      } catch {
        // non-fatal
      }

      results.push({ ok: true, id: data?.id, gmailId, externalId });
    }

    const imported = results.filter((r) => r.ok && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const failed = results.filter((r) => !r.ok).length;

    return res.status(200).json({
      ok: failed === 0,
      imported,
      skipped,
      failed,
      results,
    });
  } catch (error) {
    console.error("[workspace-inbound]", error);
    return res.status(400).json({
      error: error?.message || "Failed to import workspace email",
    });
  }
}
