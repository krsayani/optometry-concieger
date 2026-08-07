import {
  getResendClient,
  fetchReceivedEmail,
  parseFromAddress,
  forwardReceivedEmailToWorkspace,
  WORKSPACE_NOTIFY_EMAIL,
  ADMIN_EMAIL,
} from "./_lib/email.js";
import { getServiceRoleClient } from "./_lib/supabase-admin.js";

// Keep raw body for Svix signature verification on Vercel.
export const config = {
  api: {
    bodyParser: false,
  },
};

function asEmailArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v || "").trim().toLowerCase())
      .filter(Boolean);
  }
  return [String(value).trim().toLowerCase()].filter(Boolean);
}

async function readRawBody(req) {
  if (typeof req.rawBody === "string") return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function alreadyDeliveredToWorkspace({ toEmails, receivedFor, ccEmails }) {
  const workspace = WORKSPACE_NOTIFY_EMAIL || ADMIN_EMAIL;
  if (!workspace) return false;
  const haystack = new Set([
    ...asEmailArray(toEmails),
    ...asEmailArray(ccEmails),
    ...asEmailArray(receivedFor),
  ]);
  return haystack.has(workspace);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, svix-id, svix-timestamp, svix-signature",
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawBody = await readRawBody(req);
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    let event;

    if (webhookSecret) {
      const resend = getResendClient();
      event = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: req.headers?.["svix-id"] || req.headers?.["Svix-Id"] || "",
          timestamp:
            req.headers?.["svix-timestamp"] ||
            req.headers?.["Svix-Timestamp"] ||
            "",
          signature:
            req.headers?.["svix-signature"] ||
            req.headers?.["Svix-Signature"] ||
            "",
        },
        webhookSecret,
      });
    } else {
      event = rawBody ? JSON.parse(rawBody) : {};
      console.warn(
        "[resend-inbound] RESEND_WEBHOOK_SECRET not set — skipping signature verification",
      );
    }

    if (event?.type !== "email.received") {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const meta = event.data || {};
    const emailId = meta.email_id;
    if (!emailId) {
      return res.status(400).json({ error: "Missing email_id" });
    }

    const admin = getServiceRoleClient();
    if (!admin) {
      console.error("[resend-inbound] Missing SUPABASE_SERVICE_ROLE_KEY");
      return res.status(503).json({ error: "Inbox storage is not configured." });
    }

    let full = null;
    try {
      full = await fetchReceivedEmail(emailId);
    } catch (err) {
      console.error("[resend-inbound] fetch content failed", err);
    }

    const fromRaw = full?.from || meta.from || "";
    const { from_email, from_name } = parseFromAddress(fromRaw);
    if (!from_email) {
      return res.status(400).json({ error: "Missing from email" });
    }

    const toEmails = asEmailArray(full?.to || meta.to);
    const ccEmails = asEmailArray(full?.cc || meta.cc);
    const receivedFor = asEmailArray(meta.received_for || full?.received_for);
    const subject = full?.subject || meta.subject || "(no subject)";

    const row = {
      resend_email_id: emailId,
      message_id: full?.message_id || meta.message_id || null,
      from_email,
      from_name: from_name || null,
      to_emails: toEmails,
      cc_emails: ccEmails,
      subject,
      text_body: full?.text || null,
      html_body: full?.html || null,
      attachments: full?.attachments || meta.attachments || [],
      received_at:
        meta.created_at || full?.created_at || new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("inbound_emails")
      .upsert(row, { onConflict: "resend_email_id" })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[resend-inbound] upsert failed", error);
      return res.status(500).json({ error: error.message });
    }

    // In-app admin dashboard alert
    try {
      await admin.from("admin_notifications").insert({
        title: "New inbox email",
        content: `${from_name || from_email} — ${subject}`,
      });
    } catch (notifyErr) {
      console.error("[resend-inbound] admin_notifications insert failed", notifyErr);
    }

    // Optional Resend → Workspace forward. Off by default — Admin@ stays on
    // Google MX, and the Apps Script syncs Workspace → website inbox instead.
    // Never forward to inbox.optometryconcierge.com (no MX; causes delivery delays).
    let forwarded = false;
    const forwardEnabled = process.env.INBOUND_FORWARD_ENABLED === "true";
    const skipForward =
      !forwardEnabled ||
      alreadyDeliveredToWorkspace({ toEmails, receivedFor, ccEmails }) ||
      String(WORKSPACE_NOTIFY_EMAIL || "").includes("@inbox.");

    if (!skipForward && WORKSPACE_NOTIFY_EMAIL) {
      try {
        await forwardReceivedEmailToWorkspace(emailId, WORKSPACE_NOTIFY_EMAIL);
        forwarded = true;
      } catch (fwdErr) {
        console.error("[resend-inbound] workspace forward failed", fwdErr);
      }
    }

    return res.status(200).json({
      ok: true,
      id: data?.id,
      emailId,
      forwarded,
      workspace: WORKSPACE_NOTIFY_EMAIL || null,
    });
  } catch (error) {
    console.error("[resend-inbound]", error);
    return res.status(400).json({
      error: error?.message || "Webhook processing failed",
    });
  }
}
