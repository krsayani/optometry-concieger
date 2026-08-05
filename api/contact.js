import {
  readJsonBody,
  sendAdminEmail,
  buildAdminNotificationHtml,
  buildPlainTextFromSections,
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

    // Honeypot — bots fill this; humans leave it empty.
    // Do not name this "website"/"url" — password managers autofill those.
    if (body.company_fax_hp) {
      return res.status(200).json({ ok: true });
    }

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const audience =
      body.audience === "practice" ? "Practice" : "Optometrist";

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: "Message is too long." });
    }

    const replyName = `${firstName} ${lastName}`.trim();
    const sections = [
      {
        title: "Inquiry details",
        rows: [
          { label: "I am a", value: audience },
          { label: "Subject", value: subject },
          { label: "Email", value: email },
          { label: "Phone", value: phone },
        ],
      },
    ];

    const sent = await sendAdminEmail({
      subject: `Contact inquiry — ${subject} (${replyName})`,
      replyTo: email,
      replyName,
      html: buildAdminNotificationHtml({
        badge: "Contact form",
        title: replyName,
        subtitle: `${audience} reached out through the website contact form.`,
        replyName,
        replyEmail: email,
        replyPhone: phone,
        replySubject: `Re: ${subject}`,
        highlight: { label: "Message", value: message },
        sections,
        footerNote:
          "Reply to this email to write them directly. Their address is set as Reply-To.",
      }),
      text: buildPlainTextFromSections({
        intro: "New contact inquiry from the Optometry Concierge website.",
        replyName,
        replyEmail: email,
        replyPhone: phone,
        sections: [
          ...sections,
          { title: "Message", rows: [{ label: "Message", value: message }] },
        ],
      }),
    });

    return res.status(200).json({
      ok: true,
      id: sent?.id,
      message: "Inquiry sent to the admin team.",
    });
  } catch (error) {
    console.error("[contact API]", error);
    return res.status(500).json({
      error:
        error?.message ||
        "We could not send your message. Please email Admin@optometryconcierge.com directly.",
    });
  }
}
