import { assertSuperAdmin } from "./_lib/supabase-admin.js";

function getBearerToken(req) {
  const header =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    req.headers?.get?.("authorization");
  if (!header) return null;
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function buildAppsScript({ apiUrl, secret }) {
  const safeUrl = JSON.stringify(String(apiUrl || ""));
  const safeSecret = JSON.stringify(String(secret || ""));

  return `/**
 * Optometry Concierge — Google Workspace → Website Inbox sync
 *
 * SETUP
 * 1. Open https://script.google.com as Admin@optometryconcierge.com
 * 2. New project → paste this entire file → Save
 * 3. Run syncWorkspaceInbox once → Approve Gmail + external URL access
 * 4. Triggers → Add trigger:
 *      Function: syncWorkspaceInbox
 *      Event source: Time-driven
 *      Minutes timer → Every 5 minutes
 */

var CONFIG_API_URL = ${safeUrl};
var CONFIG_API_SECRET = ${safeSecret};
var LOOKBACK_QUERY = "in:inbox newer_than:14d";
var MAX_THREADS = 40;

function syncWorkspaceInbox() {
  var props = PropertiesService.getScriptProperties();
  var apiUrl = String(props.getProperty("INBOUND_API_URL") || CONFIG_API_URL || "").trim();
  var secret = String(props.getProperty("INBOUND_API_SECRET") || CONFIG_API_SECRET || "").trim();

  if (!apiUrl || !secret) {
    throw new Error("Missing API URL or secret. Re-copy the script from Admin → Inbox.");
  }

  var threads = GmailApp.search(LOOKBACK_QUERY, 0, MAX_THREADS);
  if (!threads.length) {
    Logger.log("No inbox threads found.");
    return;
  }

  var emails = [];
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      emails.push(messageToPayload_(message));
    });
  });

  if (!emails.length) {
    Logger.log("No messages extracted.");
    return;
  }

  emails.sort(function (a, b) {
    return String(b.received_at).localeCompare(String(a.received_at));
  });
  emails = emails.slice(0, 60);

  var response = UrlFetchApp.fetch(apiUrl, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + secret },
    payload: JSON.stringify({ emails: emails }),
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  Logger.log("API " + code + " (" + emails.length + " msgs): " + body);

  if (code < 200 || code >= 300) {
    throw new Error("Inbox sync failed (" + code + "): " + body);
  }
}

function messageToPayload_(message) {
  var from = message.getFrom() || "";
  var to = message.getTo() || "";
  var cc = message.getCc() || "";
  var rawId = "";
  try { rawId = message.getId(); } catch (e) { rawId = ""; }

  var messageId = "";
  try {
    messageId = String(
      message.getHeader("Message-ID") || message.getHeader("Message-Id") || "",
    ).trim();
  } catch (e2) { messageId = ""; }

  var attachments = [];
  try {
    attachments = (
      message.getAttachments({
        includeInlineImages: false,
        includeAttachments: true,
      }) || []
    ).map(function (file) {
      return {
        filename: file.getName(),
        content_type: file.getContentType(),
        size: file.getSize(),
      };
    });
  } catch (e3) { attachments = []; }

  return {
    gmail_id: rawId,
    message_id: messageId || null,
    from: from,
    to: to,
    cc: cc,
    subject: message.getSubject() || "(no subject)",
    text_body: message.getPlainBody() || "",
    html_body: message.getBody() || "",
    received_at: message.getDate()
      ? message.getDate().toISOString()
      : new Date().toISOString(),
    attachments: attachments,
  };
}

function testSyncOnce() {
  syncWorkspaceInbox();
}
`;
}

/**
 * Returns a ready-to-paste Apps Script (with secret baked in) for super admins.
 * This is the bridge that copies Google Workspace / Gmail inbox → website Inbox.
 */
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

    const secret = String(process.env.WORKSPACE_INBOUND_SECRET || "").trim();
    const apiUrl =
      process.env.WORKSPACE_INBOUND_URL ||
      "https://www.optometryconcierge.com/api/workspace-inbound";

    if (!secret) {
      return res.status(503).json({
        error:
          "WORKSPACE_INBOUND_SECRET is not configured on the server yet.",
        configured: false,
      });
    }

    const script = buildAppsScript({ apiUrl, secret });

    return res.status(200).json({
      ok: true,
      configured: true,
      apiUrl,
      script,
      steps: [
        "Open https://script.google.com signed in as Admin@optometryconcierge.com",
        "Click New project, delete the stub code, paste the script, Save",
        "Run syncWorkspaceInbox once and approve Gmail + external request permissions",
        "Triggers → Add trigger → syncWorkspaceInbox → Time-driven → Every 5 minutes",
      ],
    });
  } catch (error) {
    console.error("[workspace-sync-setup]", error);
    return res.status(500).json({
      error: error?.message || "Failed to build sync setup",
    });
  }
}
