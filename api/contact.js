const ADMIN_EMAIL = process.env.CONTACT_TO_EMAIL || "Admin@optometryconcierge.com";

function readJsonBody(req) {
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendWithResend(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from =
    process.env.CONTACT_FROM_EMAIL || "Optometry Concierge <onboarding@resend.dev>";

  const text = [
    `New contact inquiry from the website`,
    ``,
    `Name: ${payload.firstName} ${payload.lastName}`,
    `Email: ${payload.email}`,
    payload.phone ? `Phone: ${payload.phone}` : null,
    `I am a: ${payload.audience}`,
    `Subject: ${payload.subject}`,
    ``,
    `Message:`,
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [ADMIN_EMAIL],
      reply_to: payload.email,
      subject: `[Contact] ${payload.subject} — ${payload.firstName} ${payload.lastName}`,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Resend failed to send email");
  }
  return data;
}

async function sendWithFormSubmit(payload) {
  const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      phone: payload.phone || "Not provided",
      _subject: `[Contact] ${payload.subject} — ${payload.firstName} ${payload.lastName}`,
      _replyto: payload.email,
      _template: "table",
      _captcha: "false",
      "I am a": payload.audience,
      message: payload.message,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === "false" || data.success === false) {
    throw new Error(data.message || "Unable to deliver inquiry email");
  }
  return data;
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

    // Honeypot — bots fill this; humans leave it empty
    if (body.website) {
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

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      audience,
    };

    if (process.env.RESEND_API_KEY) {
      await sendWithResend(payload);
    } else {
      await sendWithFormSubmit(payload);
    }

    return res.status(200).json({
      ok: true,
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
