import { createClient } from "@supabase/supabase-js";
import {
  readJsonBody,
  sendUserEmail,
  getSiteUrl,
  buildAccountReadyHtml,
} from "./_lib/email.js";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAdminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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

  const admin = getAdminClient();
  if (!admin) {
    return res.status(503).json({
      error: "Account registration is not configured.",
      code: "MISSING_SERVICE_ROLE",
      useClientSignup: true,
    });
  }

  try {
    const body = await readJsonBody(req);
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || "Member";
    const type = body.type === "practice" ? "practice" : "od";
    const origin = String(body.origin || "")
      .trim()
      .replace(/\/$/, "");

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    const role = type === "practice" ? "employer" : "od";

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role,
        },
      });

    if (createError) {
      const message = createError.message || "Failed to create account.";
      const alreadyExists =
        /already|registered|exists/i.test(message) ||
        createError.status === 422;

      return res.status(alreadyExists ? 409 : 400).json({
        error: alreadyExists
          ? "An account already exists for this email."
          : message,
        code: alreadyExists ? "USER_EXISTS" : "CREATE_FAILED",
      });
    }

    const userId = created?.user?.id;
    if (!userId) {
      return res.status(500).json({ error: "User was not created." });
    }

    const siteUrl =
      origin && /^https?:\/\//i.test(origin) ? origin : getSiteUrl();
    const dashboardUrl = `${siteUrl}/dashboard`;

    try {
      await sendUserEmail({
        to: email,
        subject: "Your Optometry Concierge account is ready",
        text: [
          `Hi ${name},`,
          "",
          "Your Optometry Concierge account is confirmed.",
          `Open your dashboard: ${dashboardUrl}`,
          "",
          "Questions? Email Admin@optometryconcierge.com.",
        ].join("\n"),
        html: buildAccountReadyHtml({
          name,
          type,
          dashboardUrl,
        }),
      });
    } catch (emailError) {
      // Account exists even if welcome email fails.
      console.error("[register-account] welcome email failed:", emailError);
    }

    return res.status(200).json({
      ok: true,
      userId,
      email,
    });
  } catch (error) {
    console.error("[register-account API]", error);
    return res.status(500).json({
      error: error?.message || "Failed to create account.",
    });
  }
}
