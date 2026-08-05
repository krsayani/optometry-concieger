import {
  readJsonBody,
  sendUserEmail,
  buildPlainOutreachHtml,
  ADMIN_EMAIL,
} from "./_lib/email.js";
import { assertSuperAdmin } from "./_lib/supabase-admin.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getBearerToken(req) {
  const header =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    req.headers?.get?.("authorization");
  if (!header) return null;
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: "Missing auth token." });
    }

    const auth = await assertSuperAdmin(accessToken);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const body = await readJsonBody(req);
    const inboundId = String(body.inboundId || "").trim();
    const replyBody = String(body.body || body.message || "").trim();

    if (!inboundId) {
      return res.status(400).json({ error: "Missing inbound email id." });
    }
    if (!replyBody) {
      return res.status(400).json({ error: "Reply body is required." });
    }
    if (replyBody.length > 20000) {
      return res.status(400).json({ error: "Reply is too long." });
    }

    const { data: inbound, error: fetchError } = await auth.client
      .from("inbound_emails")
      .select("*")
      .eq("id", inboundId)
      .maybeSingle();

    if (fetchError || !inbound) {
      return res.status(404).json({ error: "Inbox message not found." });
    }

    if (!isValidEmail(inbound.from_email)) {
      return res.status(400).json({ error: "Original sender email is invalid." });
    }

    const subject = inbound.subject?.startsWith("Re:")
      ? inbound.subject
      : `Re: ${inbound.subject || "Your message"}`;

    const headers = {};
    if (inbound.message_id) {
      headers["In-Reply-To"] = inbound.message_id;
      headers.References = inbound.message_id;
    }

    const sent = await sendUserEmail({
      to: inbound.from_email,
      subject,
      text: replyBody,
      html: buildPlainOutreachHtml({ subject, body: replyBody }),
      replyTo: auth.user.email || ADMIN_EMAIL,
      replyName: "Optometry Concierge",
      headers: Object.keys(headers).length ? headers : undefined,
    });

    const { error: updateError } = await auth.client
      .from("inbound_emails")
      .update({
        is_read: true,
        replied_at: new Date().toISOString(),
      })
      .eq("id", inboundId);

    if (updateError) {
      console.error("[inbox-reply] mark replied failed", updateError);
    }

    return res.status(200).json({
      ok: true,
      id: sent?.id,
      to: inbound.from_email,
      subject,
    });
  } catch (error) {
    console.error("[inbox-reply]", error);
    return res.status(500).json({
      error: error?.message || "Failed to send reply.",
    });
  }
}
