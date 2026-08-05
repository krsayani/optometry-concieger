import {
  ADMIN_EMAIL,
  readJsonBody,
  sendAdminEmail,
  formatFields,
} from "./_lib/email.js";

function formatList(value) {
  if (Array.isArray(value)) return value.join(", ") || "N/A";
  return value || "N/A";
}

function buildOdEmail(data) {
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  const fields = {
    "Profile Type": "Optometrist",
    Name: name,
    Email: data.email || "N/A",
    Phone: data.phone || "N/A",
    School: data.school || "N/A",
    "Other School": data.otherSchool || "",
    "Graduation Year": data.gradYear || "N/A",
    "License Status": data.licenseStatus || "N/A",
    "License States": data.licenseStates || "N/A",
    "Years in Practice": data.yearsInPractice || "N/A",
    "Completed Residency": data.completedResidency || "N/A",
    "Residency Type": data.residencyType || "",
    "Preferred States": formatList(data.preferredStates),
    "Preferred Cities": data.preferredCities || "N/A",
    "Open to Relocation": data.openToRelocation || "N/A",
    "Practice Setting": formatList(data.practiceSetting),
    "Practice Type Preference": data.practiceTypePreference || "N/A",
    "Clinical Interests": formatList(data.clinicalInterests),
    "Salary Expectation": data.salaryExpectation || "N/A",
    "Position Type": data.positionType || "N/A",
    "Target Start Date": data.targetStartDate || "N/A",
    "Job Priorities": formatList(data.jobPriorities),
    "Interest in Ownership": data.interestInOwnership || "N/A",
    "Resume URL": data.resumeUrl || "Not uploaded",
    "Anything Else": data.anythingElse || "N/A",
  };

  return {
    subject: `[New OD Profile] ${name || data.email || "Optometrist"}`,
    replyTo: data.email,
    name: name || "Optometrist Intake",
    fields: {
      "Profile Type": "Optometrist",
      Name: name,
      Email: data.email || "N/A",
      Phone: data.phone || "N/A",
      School: data.school || "N/A",
      "Graduation Year": data.gradYear || "N/A",
    },
    text: [
      "A new optometrist profile was submitted on Optometry Concierge.",
      "",
      formatFields(fields),
      "",
      `Delivered to: ${ADMIN_EMAIL}`,
    ].join("\n"),
  };
}

function buildPracticeEmail(data) {
  const fields = {
    "Profile Type": "Practice / Hiring Request",
    "Contact Name": data.contactName || "N/A",
    "Practice Name": data.practiceName || "N/A",
    Email: data.email || "N/A",
    Phone: data.phone || "N/A",
    Location: data.location || "N/A",
    "Practice Type": data.practiceType || "N/A",
    "Number of ODs": data.numODs || "N/A",
    "Position Type": data.positionType || "N/A",
    "Salary Range": data.salaryRange || "N/A",
    "Production Bonus": data.productionBonus || "N/A",
    "Sign-On Bonus": data.signOnBonus || "N/A",
    "Relocation Assistance": data.relocationAssistance || "N/A",
    Benefits: formatList(data.benefits),
    Schedule: data.schedule || "N/A",
    "Patient Volume": data.patientVolume || "N/A",
    "Primary Care Type": formatList(data.primaryCareType),
    "New Grad Friendly": data.newGradFriendly || "N/A",
    Mentorship: data.mentorshipAvailable || "N/A",
    "Equipment / Tech": data.equipmentTech || "N/A",
    "Ownership Track": data.ownershipTrack || "N/A",
    Urgency: data.urgency || "N/A",
    "Anything Else": data.anythingElse || "N/A",
  };

  return {
    subject: `[New Practice Profile] ${data.practiceName || data.contactName || "Hiring Request"}`,
    replyTo: data.email,
    name: data.contactName || data.practiceName || "Practice Intake",
    fields: {
      "Profile Type": "Practice / Hiring Request",
      "Contact Name": data.contactName || "N/A",
      "Practice Name": data.practiceName || "N/A",
      Email: data.email || "N/A",
      Phone: data.phone || "N/A",
      Location: data.location || "N/A",
    },
    text: [
      "A new practice hiring profile was submitted on Optometry Concierge.",
      "",
      formatFields(fields),
      "",
      `Delivered to: ${ADMIN_EMAIL}`,
    ].join("\n"),
  };
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
    const type = body.type === "practice" ? "practice" : body.type === "od" ? "od" : null;

    if (!type) {
      return res.status(400).json({ error: "Invalid intake type." });
    }

    if (!body.email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const emailPayload =
      type === "od" ? buildOdEmail(body) : buildPracticeEmail(body);

    await sendAdminEmail(emailPayload);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[intake-notify API]", error);
    return res.status(500).json({
      error: error?.message || "Failed to email admin about the new profile.",
    });
  }
}
