/**
 * Optometry Concierge — Google Workspace → Website Inbox sync
 *
 * SETUP (one time, ~5 minutes)
 * 1. Open https://script.google.com while signed in as Admin@optometryconcierge.com
 * 2. New project → paste this entire file
 * 3. Set SCRIPT PROPERTIES (Project Settings → Script properties):
 *      INBOUND_API_URL = https://www.optometryconcierge.com/api/workspace-inbound
 *      INBOUND_API_SECRET = <same value as WORKSPACE_INBOUND_SECRET on Vercel>
 * 4. Run syncWorkspaceInbox once → approve Gmail + external request permissions
 * 5. Triggers → Add trigger:
 *      Function: syncWorkspaceInbox
 *      Event source: Time-driven
 *      Type: Minutes timer
 *      Interval: Every 5 minutes
 *
 * What it does:
 * - Reads recent Inbox messages from Admin@ Gmail / Google Workspace
 * - Posts them to the website Admin → Inbox (server dedupes by Gmail id)
 * - Skips mail that already came from Admin@ (contact/intake mirrors)
 */

var LOOKBACK_QUERY = "in:inbox newer_than:14d";
var MAX_THREADS = 40;

function syncWorkspaceInbox() {
  var props = PropertiesService.getScriptProperties();
  var apiUrl = String(props.getProperty("INBOUND_API_URL") || "").trim();
  var secret = String(props.getProperty("INBOUND_API_SECRET") || "").trim();

  if (!apiUrl || !secret) {
    throw new Error(
      "Set Script properties INBOUND_API_URL and INBOUND_API_SECRET first.",
    );
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

  // Keep payload small — newest first, cap batch size
  emails.sort(function (a, b) {
    return String(b.received_at).localeCompare(String(a.received_at));
  });
  emails = emails.slice(0, 60);

  var response = UrlFetchApp.fetch(apiUrl, {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + secret,
    },
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
  try {
    rawId = message.getId();
  } catch (e) {
    rawId = "";
  }

  var messageId = "";
  try {
    messageId = String(
      message.getHeader("Message-ID") || message.getHeader("Message-Id") || "",
    ).trim();
  } catch (e2) {
    messageId = "";
  }

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
  } catch (e3) {
    attachments = [];
  }

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

/** Manual test helper — run once from the Apps Script editor. */
function testSyncOnce() {
  syncWorkspaceInbox();
}
