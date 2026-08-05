import {
  readJsonBody,
  sendUserEmail,
  getSiteUrl,
  buildAccountInviteHtml,
} from "./_lib/email.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const name = String(body.name || "").trim();
    const type = body.type === "practice" ? "practice" : "od";
    const origin = String(body.origin || "")
      .trim()
      .replace(/\/$/, "");

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const params = new URLSearchParams({
      email,
      type,
    });
    if (name) params.set("name", name);

    const siteUrl =
      origin && /^https?:\/\//i.test(origin) ? origin : getSiteUrl();
    const createAccountUrl = `${siteUrl}/create-account?${params.toString()}`;
    const audience = type === "practice" ? "practice" : "optometrist";
    const subject = "Create your Optometry Concierge account";

    const text = [
      `Hi ${name || "there"},`,
      "",
      `Thanks for submitting your ${audience} profile to Optometry Concierge.`,
      "Create your account password here to access your dashboard:",
      createAccountUrl,
      "",
      "Questions? Email Admin@optometryconcierge.com.",
    ].join("\n");

    const sent = await sendUserEmail({
      to: email,
      subject,
      text,
      html: buildAccountInviteHtml({
        name,
        type,
        createAccountUrl,
      }),
    });

    return res.status(200).json({ ok: true, id: sent?.id });
  } catch (error) {
    console.error("[account-invite API]", error);
    return res.status(500).json({
      error: error?.message || "Failed to send account invite email.",
    });
  }
}
