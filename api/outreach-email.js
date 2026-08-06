import { createClient } from "@supabase/supabase-js";
import {
  readJsonBody,
  sendUserEmail,
  buildPlainOutreachHtml,
  ADMIN_EMAIL,
} from "./_lib/email.js";

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

function getUserClient(accessToken) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key || !accessToken) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

async function assertSuperAdmin(accessToken) {
  const client = getUserClient(accessToken);
  if (!client) {
    return { ok: false, status: 503, error: "Auth is not configured." };
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(accessToken);

  if (userError || !user) {
    return { ok: false, status: 401, error: "You must be signed in." };
  }

  const { data: roles, error: rolesError } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return { ok: false, status: 500, error: "Could not verify admin role." };
  }

  const isSuperAdmin = (roles || []).some((r) => r.role === "super_admin");
  if (!isSuperAdmin) {
    return { ok: false, status: 403, error: "Super admin access required." };
  }

  return { ok: true, user };
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
    const toRaw = Array.isArray(body.to)
      ? body.to
      : String(body.to || "")
          .split(/[,;]/)
          .map((v) => v.trim());
    const to = [
      ...new Set(
        toRaw
          .map((v) => String(v || "").trim().toLowerCase())
          .filter((v) => isValidEmail(v)),
      ),
    ];
    const ccRaw = String(body.cc || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.body || body.message || "").trim();
    const contactId = body.contactId || body.schoolId || null;
    const contactLabel = String(
      body.contactLabel || body.schoolName || "",
    ).trim();
    const kind = String(body.kind || "outreach").trim();
    const bccAdmin = body.bccAdmin !== false;
    const includeSchoolVideo =
      body.includeSchoolVideo === true ||
      kind === "school" ||
      kind === "club";

    if (!to.length) {
      return res
        .status(400)
        .json({ error: "At least one valid recipient email is required." });
    }
    if (!subject) {
      return res.status(400).json({ error: "Subject is required." });
    }
    if (!message) {
      return res.status(400).json({ error: "Email body is required." });
    }
    if (message.length > 20000) {
      return res.status(400).json({ error: "Email body is too long." });
    }

    const cc = ccRaw
      .split(/[,;]/)
      .map((v) => v.trim().toLowerCase())
      .filter((v) => isValidEmail(v));

    const sent = await sendUserEmail({
      to,
      cc,
      bcc: bccAdmin && ADMIN_EMAIL ? [ADMIN_EMAIL] : undefined,
      subject,
      text: message,
      html: buildPlainOutreachHtml({
        subject,
        body: message,
        includeSchoolVideo,
      }),
      replyTo: auth.user.email || ADMIN_EMAIL,
      replyName: "Optometry Concierge",
    });

    return res.status(200).json({
      ok: true,
      id: sent?.id,
      to,
      cc,
      kind,
      contactId,
      contactLabel,
      message: "Email sent.",
    });
  } catch (error) {
    console.error("[outreach-email API]", error);
    return res.status(500).json({
      error: error?.message || "Failed to send outreach email.",
    });
  }
}
