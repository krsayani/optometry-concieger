import {
  readJsonBody,
  sendAdminEmail,
  buildAdminNotificationHtml,
  buildPlainTextFromSections,
  formatList,
} from "./_lib/email.js";

function buildOdEmail(data) {
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  const replyName = name || "Optometrist";
  const schoolLabel =
    data.school === "Other" && data.otherSchool
      ? data.otherSchool
      : data.school;

  const sections = [
    {
      title: "Contact",
      rows: [
        { label: "Name", value: name },
        { label: "Email", value: data.email },
        { label: "Phone", value: data.phone },
      ],
    },
    {
      title: "Education & license",
      rows: [
        { label: "School", value: schoolLabel },
        { label: "Graduation year", value: data.gradYear },
        { label: "License status", value: data.licenseStatus },
        { label: "License states", value: data.licenseStates },
        { label: "Years in practice", value: data.yearsInPractice },
        { label: "Completed residency", value: data.completedResidency },
        { label: "Residency type", value: data.residencyType },
      ],
    },
    {
      title: "Preferences",
      rows: [
        { label: "Preferred states", value: formatList(data.preferredStates) },
        { label: "Preferred cities", value: data.preferredCities },
        { label: "Open to relocation", value: data.openToRelocation },
        { label: "Practice setting", value: formatList(data.practiceSetting) },
        {
          label: "Practice type preference",
          value: data.practiceTypePreference,
        },
        {
          label: "Clinical interests",
          value: formatList(data.clinicalInterests),
        },
        { label: "Position type", value: data.positionType },
        { label: "Target start date", value: data.targetStartDate },
        { label: "Salary expectation", value: data.salaryExpectation },
        { label: "Job priorities", value: formatList(data.jobPriorities) },
        { label: "Interest in ownership", value: data.interestInOwnership },
        data.resumeUrl
          ? {
              label: "Resume",
              value: "View uploaded resume",
              href: data.resumeUrl,
            }
          : { label: "Resume", value: "Not uploaded" },
      ],
    },
  ];

  const subject = `New optometrist profile — ${name || data.email || "Candidate"}`;

  return {
    subject,
    replyTo: data.email,
    replyName,
    html: buildAdminNotificationHtml({
      badge: "Optometrist profile",
      title: replyName,
      subtitle:
        "A doctor just created a career profile. Reply to connect or request more details.",
      replyName,
      replyEmail: data.email,
      replyPhone: data.phone,
      replySubject: `Optometry Concierge — following up with ${replyName}`,
      highlight: data.anythingElse
        ? { label: "Anything else they shared", value: data.anythingElse }
        : null,
      sections,
      footerNote:
        "Reply to this email to write the optometrist directly. Their address is set as Reply-To.",
    }),
    text: buildPlainTextFromSections({
      intro: "A new optometrist profile was submitted on Optometry Concierge.",
      replyName,
      replyEmail: data.email,
      replyPhone: data.phone,
      sections: [
        ...sections,
        data.anythingElse
          ? {
              title: "Anything else",
              rows: [{ label: "Notes", value: data.anythingElse }],
            }
          : null,
      ].filter(Boolean),
    }),
  };
}

function buildPracticeEmail(data) {
  const replyName =
    data.contactName || data.practiceName || "Practice contact";
  const practiceLabel = data.practiceName || replyName;

  const sections = [
    {
      title: "Contact",
      rows: [
        { label: "Contact name", value: data.contactName },
        { label: "Practice name", value: data.practiceName },
        { label: "Email", value: data.email },
        { label: "Phone", value: data.phone },
        { label: "Location", value: data.location },
      ],
    },
    {
      title: "Practice details",
      rows: [
        { label: "Practice type", value: data.practiceType },
        { label: "Number of ODs", value: data.numODs },
        { label: "Patient volume", value: data.patientVolume },
        { label: "Primary care type", value: formatList(data.primaryCareType) },
        { label: "Equipment / tech", value: data.equipmentTech },
        { label: "New grad friendly", value: data.newGradFriendly },
        { label: "Mentorship", value: data.mentorshipAvailable },
        { label: "Ownership track", value: data.ownershipTrack },
      ],
    },
    {
      title: "Hiring need",
      rows: [
        { label: "Position type", value: data.positionType },
        { label: "Urgency", value: data.urgency },
        { label: "Salary range", value: data.salaryRange },
        { label: "Production bonus", value: data.productionBonus },
        { label: "Sign-on bonus", value: data.signOnBonus },
        { label: "Relocation assistance", value: data.relocationAssistance },
        { label: "Benefits", value: formatList(data.benefits) },
        { label: "Schedule", value: data.schedule },
      ],
    },
  ];

  const subject = `New practice hiring request — ${practiceLabel}`;

  return {
    subject,
    replyTo: data.email,
    replyName,
    html: buildAdminNotificationHtml({
      badge: "Practice hiring request",
      title: practiceLabel,
      subtitle:
        "A practice submitted a hiring profile. Reply to discuss candidates or next steps.",
      replyName,
      replyEmail: data.email,
      replyPhone: data.phone,
      replySubject: `Optometry Concierge — following up with ${practiceLabel}`,
      highlight: data.anythingElse
        ? { label: "Anything else they shared", value: data.anythingElse }
        : data.urgency
          ? { label: "Hiring urgency", value: data.urgency }
          : null,
      sections,
      footerNote:
        "Reply to this email to write the practice contact directly. Their address is set as Reply-To.",
    }),
    text: buildPlainTextFromSections({
      intro:
        "A new practice hiring profile was submitted on Optometry Concierge.",
      replyName,
      replyEmail: data.email,
      replyPhone: data.phone,
      sections: [
        ...sections,
        data.anythingElse
          ? {
              title: "Anything else",
              rows: [{ label: "Notes", value: data.anythingElse }],
            }
          : null,
      ].filter(Boolean),
    }),
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
    const type =
      body.type === "practice" ? "practice" : body.type === "od" ? "od" : null;

    if (!type) {
      return res.status(400).json({ error: "Invalid intake type." });
    }

    if (!body.email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const emailPayload =
      type === "od" ? buildOdEmail(body) : buildPracticeEmail(body);

    const sent = await sendAdminEmail(emailPayload);

    return res.status(200).json({ ok: true, id: sent?.id });
  } catch (error) {
    console.error("[intake-notify API]", error);
    return res.status(500).json({
      error: error?.message || "Failed to email admin about the new profile.",
    });
  }
}
