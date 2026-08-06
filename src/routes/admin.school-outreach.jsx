import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  Search,
  Mail,
  Phone,
  ExternalLink,
  Users,
  Building2,
  Copy,
  Check,
  Send,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  listSchoolOutreachSchools,
  listSchoolOutreachClubs,
  createSchoolOutreachSchool,
  updateSchoolOutreachSchool,
  deleteSchoolOutreachSchool,
  createSchoolOutreachContact,
  updateSchoolOutreachContact,
  deleteSchoolOutreachContact,
  createSchoolOutreachClubContact,
  updateSchoolOutreachClubContact,
  deleteSchoolOutreachClubContact,
  getSchoolPrimaryContact,
  getClubPrimaryContact,
  updateSchoolOutreachClub,
  sendOutreachEmail,
  SCHOOL_OUTREACH_STATUSES,
  SCHOOL_OUTREACH_OWNERS,
  SCHOOL_OUTREACH_REGIONS,
} from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
import {
  OwnerBadge,
  OwnerSelectLabel,
  useOwnerPhotoUrl,
} from "@/components/admin/OwnerBadge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/school-outreach")({
  component: AdminSchoolOutreach,
});

function firstNameFromContact(name) {
  if (!name) return "";
  const cleaned = String(name)
    .replace(/^dr\.?\s+/i, "")
    .replace(/^professor\s+/i, "")
    .trim();
  return cleaned.split(/\s+/)[0] || "";
}

function greetingFromContacts(contacts, school) {
  const list = (Array.isArray(contacts) ? contacts : contacts ? [contacts] : [])
    .map((c) => firstNameFromContact(c?.name))
    .filter(Boolean);
  if (!list.length) {
    return (
      firstNameFromContact(school?.primary_contact_name) || "there"
    );
  }
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

/**
 * Templates are written in Bilal's voice (Bilal first, Karim as colleague).
 * For schools/clubs owned by Karim, swap their positioning in the copy.
 */
function applyOwnerVoice(text, owner) {
  let out = String(text || "");
  if (owner !== "Karim") return out;

  // Temp tokens avoid double-swapping during replace
  out = out
    .replace(/Dr\. Bilal Ismail/g, "__TMP_SPEAKER_DR__")
    .replace(/Dr\. Karim Sayani/g, "__TMP_COLLEAGUE_DR__")
    .replace(/Bilal Ismail/g, "__TMP_SPEAKER__")
    .replace(/Karim Sayani/g, "__TMP_COLLEAGUE__")
    .replace(/\bBilal & Karim\b/g, "__TMP_SIG_SHORT__")
    .replace(/\bKarim and me\b/g, "__TMP_VIDEO_REF__");

  return out
    .replace(/__TMP_SPEAKER_DR__/g, "Dr. Karim Sayani")
    .replace(/__TMP_COLLEAGUE_DR__/g, "Dr. Bilal Ismail")
    .replace(/__TMP_SPEAKER__/g, "Karim Sayani")
    .replace(/__TMP_COLLEAGUE__/g, "Bilal Ismail")
    .replace(/__TMP_SIG_SHORT__/g, "Karim & Bilal")
    .replace(/__TMP_VIDEO_REF__/g, "Bilal and me");
}

function personalizeTemplate(template, school, contacts) {
  const first = greetingFromContacts(contacts, school);
  const withName = {
    subject: template.subject,
    body: template.body.replace(/\[First name\]/g, first),
  };
  return {
    subject: applyOwnerVoice(withName.subject, school?.owner),
    body: applyOwnerVoice(withName.body, school?.owner),
  };
}

function emailsFromContacts(contacts) {
  return [
    ...new Set(
      (contacts || [])
        .map((c) => String(c?.email || "").trim())
        .filter(Boolean),
    ),
  ];
}

function resolveComposeContacts(school, contactIds) {
  const all = school?.contacts || [];
  if (!contactIds?.length) return [];
  const byId = new Map(all.map((c) => [c.id, c]));
  return contactIds.map((id) => byId.get(id)).filter(Boolean);
}

const EMPTY_CONTACT_FORM = {
  name: "",
  role: "",
  email: "",
  phone: "",
  notes: "",
  is_primary: false,
};

function todayISODate() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

const EMPTY_SCHOOL_FORM = {
  region: "South Central",
  school: "",
  short_name: "",
  city: "",
  state: "",
  program_website: "",
  directory_page: "",
  primary_target_role: "",
  primary_contact_name: "",
  primary_email: "",
  phone: "",
  secondary_contact: "",
  owner: "Bilal",
  status: "Not started",
  notes: "",
};

function slugShortName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

const EMAIL_TEMPLATES = [
  {
    id: "full",
    title: "Outreach email — Student Affairs",
    subject:
      "A free resource for your 3rd- and 4th-year students, from two ODs who wish they'd had one",
    body: `Hi [First name],

I'm Dr. Bilal Ismail. My colleague Dr. Karim Sayani and I graduated together from UIW's Rosenberg School of Optometry, and we both still practice.

We worked incredibly hard to become optometrists, and like your students, we came out wanting the same simple thing: to land somewhere that values our training, compensates us fairly for it, and lets us focus on the parts of this profession we're genuinely passionate about, the kind of place where the work doesn't feel like work. What we learned is that getting there has less to do with clinical skill and more to do with the things nobody teaches you: reading a contract, knowing your worth, comparing offers, negotiating without burning a bridge.

We figured it out the hard way, from professors, classmates, and a lot of late nights. We were fortunate. But plenty of our classmates weren't, good doctors who signed the first offer in front of them because no one walked them through it, and left real money and a better fit on the table. That stuck with us.

So we built Optometry Concierge. It's a free way to help students and new grads through exactly that part: resume and CV review, interview prep, honest salary guidance, offer comparison, contract red-flag education, and negotiation coaching. Everything is confidential, students opt in themselves, and we don't ask your office for any student information.

We'd be grateful if you'd share it with your third- and fourth-years. I've included a short video of Karim and me explaining who we are and why this means so much to us, so your students can hear it directly.

Watch our short intro:
https://www.optometryconcierge.com/intro

Thank you for everything you pour into getting these students ready. Happy to answer anything, or hop on a call if that's easier.

Warmly,
Dr. Bilal Ismail & Dr. Karim Sayani
Optometry Concierge
https://www.optometryconcierge.com`,
  },
  {
    id: "short",
    title: "Shorter version — AOSA advisors / faculty",
    subject: "Free, confidential career help for your OD students",
    body: `Hi [First name],

I'm Dr. Bilal Ismail. My colleague Dr. Karim Sayani and I graduated together from UIW Rosenberg, and we still practice. We built a free resource called Optometry Concierge for one reason: we want new grads to land somewhere that values their training, pays them fairly, and lets them do the work they're passionate about, so it doesn't feel like work. Getting there comes down to the things school doesn't teach: resumes, contracts, knowing your worth, comparing offers, and negotiating.

We help with all of it, free. It's confidential, students sign up themselves, and we don't need any information from your office. Would you share it with your third- and fourth-years? A short video from the two of us is below so they can hear why this matters to us.

Watch our short intro:
https://www.optometryconcierge.com/intro

Thank you,
Bilal & Karim  ·  Optometry Concierge
https://www.optometryconcierge.com`,
  },
];

function statusTone(status) {
  switch (status) {
    case "Sharing with students":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    case "Replied":
      return "bg-sky-500/10 text-sky-700 border-sky-500/20";
    case "Emailed":
    case "Follow-up sent":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    case "Declined":
    case "No response":
      return "bg-rose-500/10 text-rose-700 border-rose-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function StatCard({ label, value, accent, photo }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
          />
        ) : null}
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-black tracking-tight",
          accent || "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function OwnerStatCard({ owner, value }) {
  const photo = useOwnerPhotoUrl(owner);
  return <StatCard label={owner} value={value} photo={photo} />;
}

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Could not copy");
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
      {label}
    </Button>
  );
}

function AdminSchoolOutreach() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("schools");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_SCHOOL_FORM);
  const [confirmDeleteSchool, setConfirmDeleteSchool] = useState(null);
  const [contactForm, setContactForm] = useState(null);
  // contactForm: { kind: 'school'|'club', parentId, id?, ...fields }
  const [confirmDeleteContact, setConfirmDeleteContact] = useState(null);
  // confirmDeleteContact: { kind, id, name, parentId }
  const [compose, setCompose] = useState(null);
  // compose: { kind: 'school'|'club', target, contactIds, templateId, to, cc, subject, body, bccAdmin, markFollowUp }

  const patchSchoolField = (field, value) => {
    setSelectedSchool((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveSchoolField = (field, value) => {
    if (!selectedSchool?.id) return;
    const next = value === "" ? null : value;
    schoolMutation.mutate({
      id: selectedSchool.id,
      updates: { [field]: next },
    });
  };

  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ["admin-school-outreach-schools"],
    queryFn: listSchoolOutreachSchools,
  });

  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ["admin-school-outreach-clubs"],
    queryFn: listSchoolOutreachClubs,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-school-outreach-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "school_outreach_schools" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["admin-school-outreach-schools"],
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "school_outreach_clubs" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["admin-school-outreach-clubs"],
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "school_outreach_contacts" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["admin-school-outreach-schools"],
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "school_outreach_club_contacts",
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["admin-school-outreach-clubs"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const schoolMutation = useMutation({
    mutationFn: ({ id, updates }) => updateSchoolOutreachSchool(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-school-outreach-schools"],
      });
      if (data) setSelectedSchool(data);
      toast.success("School updated");
    },
    onError: (err) =>
      toast.error(err?.message || "Could not update school. Please try again."),
  });

  const createSchoolMutation = useMutation({
    mutationFn: (payload) => createSchoolOutreachSchool(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-school-outreach-schools"],
      });
      setCreatingSchool(false);
      setCreateForm(EMPTY_SCHOOL_FORM);
      setSelectedSchool(data);
      toast.success("School added");
    },
    onError: (err) =>
      toast.error(
        err?.message?.includes("unique") || err?.code === "23505"
          ? "That short name is already used. Pick a different abbreviation."
          : err?.message || "Could not add school.",
      ),
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: (id) => deleteSchoolOutreachSchool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-school-outreach-schools"],
      });
      setConfirmDeleteSchool(null);
      setSelectedSchool(null);
      toast.success("School deleted");
    },
    onError: (err) =>
      toast.error(err?.message || "Could not delete school."),
  });

  const contactMutation = useMutation({
    mutationFn: async (form) => {
      if (!form?.name?.trim()) throw new Error("Contact name is required.");
      const fields = {
        name: form.name.trim(),
        role: form.role?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        notes: form.notes?.trim() || null,
        is_primary: Boolean(form.is_primary),
      };
      const kind = form.kind || "school";
      if (form.id) {
        return kind === "club"
          ? updateSchoolOutreachClubContact(form.id, fields)
          : updateSchoolOutreachContact(form.id, fields);
      }
      return kind === "club"
        ? createSchoolOutreachClubContact({
            club_id: form.parentId,
            ...fields,
          })
        : createSchoolOutreachContact({
            school_id: form.parentId || form.schoolId,
            ...fields,
          });
    },
    onSuccess: async () => {
      const kind = contactForm?.kind || "school";
      const parentId = contactForm?.parentId || contactForm?.schoolId;
      if (kind === "club") {
        await queryClient.invalidateQueries({
          queryKey: ["admin-school-outreach-clubs"],
        });
        if (parentId) {
          const refreshed = await listSchoolOutreachClubs();
          const next = refreshed.find((c) => c.id === parentId);
          if (next) setSelectedClub(next);
        }
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["admin-school-outreach-schools"],
        });
        if (parentId) {
          const refreshed = await listSchoolOutreachSchools();
          const next = refreshed.find((s) => s.id === parentId);
          if (next) setSelectedSchool(next);
        }
      }
      setContactForm(null);
      toast.success(contactForm?.id ? "Contact updated" : "Contact added");
    },
    onError: (err) =>
      toast.error(err?.message || "Could not save contact."),
  });

  const deleteContactMutation = useMutation({
    mutationFn: ({ id, kind }) =>
      kind === "club"
        ? deleteSchoolOutreachClubContact(id)
        : deleteSchoolOutreachContact(id),
    onSuccess: async () => {
      const kind = confirmDeleteContact?.kind || "school";
      const parentId =
        confirmDeleteContact?.parentId || confirmDeleteContact?.school_id;
      setConfirmDeleteContact(null);
      if (kind === "club") {
        await queryClient.invalidateQueries({
          queryKey: ["admin-school-outreach-clubs"],
        });
        if (parentId) {
          const refreshed = await listSchoolOutreachClubs();
          const next = refreshed.find((c) => c.id === parentId);
          if (next) setSelectedClub(next);
        }
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["admin-school-outreach-schools"],
        });
        if (parentId) {
          const refreshed = await listSchoolOutreachSchools();
          const next = refreshed.find((s) => s.id === parentId);
          if (next) setSelectedSchool(next);
        }
      }
      toast.success("Contact deleted");
    },
    onError: (err) =>
      toast.error(err?.message || "Could not delete contact."),
  });

  const clubMutation = useMutation({
    mutationFn: ({ id, updates }) => updateSchoolOutreachClub(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-school-outreach-clubs"],
      });
      if (data) setSelectedClub(data);
      toast.success("Club updated");
    },
    onError: () => toast.error("Could not update club. Please try again."),
  });

  const submitCreateSchool = () => {
    const school = createForm.school.trim();
    const shortName = slugShortName(
      createForm.short_name || school.split("–")[0] || school,
    );
    if (!school) {
      toast.error("School name is required.");
      return;
    }
    if (!shortName) {
      toast.error("Short name / abbreviation is required.");
      return;
    }
    createSchoolMutation.mutate({
      region: createForm.region || "South Central",
      school,
      short_name: shortName,
      city: createForm.city.trim() || null,
      state: createForm.state.trim() || null,
      program_website: createForm.program_website.trim() || null,
      directory_page: createForm.directory_page.trim() || null,
      primary_target_role: createForm.primary_target_role.trim() || null,
      primary_contact_name: createForm.primary_contact_name.trim() || null,
      primary_email: createForm.primary_email.trim() || null,
      phone: createForm.phone.trim() || null,
      secondary_contact: createForm.secondary_contact.trim() || null,
      owner: createForm.owner || "Bilal",
      status: createForm.status || "Not started",
      notes: createForm.notes.trim() || null,
    });
  };

  const openCompose = (
    target,
    templateId = "full",
    contact = null,
    kind = "school",
  ) => {
    const primary =
      kind === "club"
        ? getClubPrimaryContact(target)
        : getSchoolPrimaryContact(target);
    const withEmail = (target.contacts || []).filter((c) => c.email);
    const initialContacts = contact?.email
      ? [contact]
      : primary?.email
        ? [primary]
        : withEmail.slice(0, 1);
    const contactIds = initialContacts.map((c) => c.id).filter(Boolean);
    const template =
      EMAIL_TEMPLATES.find((t) => t.id === templateId) || EMAIL_TEMPLATES[0];
    const personalized = personalizeTemplate(
      template,
      target,
      initialContacts,
    );
    const alreadyContacted =
      target.status && target.status !== "Not started";
    const toEmails = emailsFromContacts(initialContacts);
    setCompose({
      kind,
      target,
      contactIds,
      templateId: template.id,
      to:
        toEmails.join(", ") ||
        (kind === "school" ? target.primary_email : "") ||
        "",
      cc: "",
      subject: personalized.subject,
      body: personalized.body,
      bccAdmin: true,
      markFollowUp: alreadyContacted,
    });
  };

  const applyComposeTemplate = (templateId) => {
    setCompose((prev) => {
      if (!prev) return prev;
      const template =
        EMAIL_TEMPLATES.find((t) => t.id === templateId) || EMAIL_TEMPLATES[0];
      const contacts = resolveComposeContacts(prev.target, prev.contactIds);
      const personalized = personalizeTemplate(
        template,
        prev.target,
        contacts,
      );
      return {
        ...prev,
        templateId: template.id,
        subject: personalized.subject,
        body: personalized.body,
      };
    });
  };

  const toggleComposeContact = (contactId) => {
    setCompose((prev) => {
      if (!prev) return prev;
      const exists = prev.contactIds.includes(contactId);
      const contactIds = exists
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId];
      const contacts = resolveComposeContacts(prev.target, contactIds);
      const template =
        EMAIL_TEMPLATES.find((t) => t.id === prev.templateId) ||
        EMAIL_TEMPLATES[0];
      const personalized = personalizeTemplate(
        template,
        prev.target,
        contacts,
      );
      return {
        ...prev,
        contactIds,
        to: emailsFromContacts(contacts).join(", "),
        subject: personalized.subject,
        body: personalized.body,
      };
    });
  };

  const selectAllComposeContacts = () => {
    setCompose((prev) => {
      if (!prev) return prev;
      const contacts = (prev.target.contacts || []).filter((c) => c.email);
      const contactIds = contacts.map((c) => c.id);
      const template =
        EMAIL_TEMPLATES.find((t) => t.id === prev.templateId) ||
        EMAIL_TEMPLATES[0];
      const personalized = personalizeTemplate(
        template,
        prev.target,
        contacts,
      );
      return {
        ...prev,
        contactIds,
        to: emailsFromContacts(contacts).join(", "),
        subject: personalized.subject,
        body: personalized.body,
      };
    });
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!compose) throw new Error("Nothing to send.");
      const recipients = compose.to
        .split(/[,;]/)
        .map((v) => v.trim())
        .filter(Boolean);
      if (!recipients.length) {
        throw new Error("At least one recipient email is required.");
      }

      const label =
        compose.kind === "club"
          ? `${compose.target.school} — ${compose.target.club_name}`
          : compose.target.school;

      const result = await sendOutreachEmail({
        to: recipients,
        cc: compose.cc.trim() || undefined,
        subject: compose.subject.trim(),
        body: compose.body.trim(),
        kind: compose.kind === "club" ? "club" : "school",
        contactId: compose.target.id,
        contactLabel: label,
        schoolId: compose.target.id,
        schoolName: label,
        bccAdmin: compose.bccAdmin,
      });

      const today = todayISODate();
      let updates;
      if (compose.kind === "club") {
        updates = {
          status: compose.markFollowUp
            ? "Follow-up sent"
            : compose.target.status === "Not started" || !compose.target.status
              ? "Emailed"
              : compose.target.status,
        };
        await updateSchoolOutreachClub(compose.target.id, updates);
      } else {
        updates = compose.markFollowUp
          ? {
              status: "Follow-up sent",
              follow_up_date: today,
            }
          : {
              status:
                compose.target.status === "Not started" ||
                !compose.target.status
                  ? "Emailed"
                  : compose.target.status,
              date_emailed: compose.target.date_emailed || today,
            };
        await updateSchoolOutreachSchool(compose.target.id, updates);
      }
      return { result, updates, recipients };
    },
    onSuccess: ({ updates, recipients }) => {
      if (compose?.kind === "club") {
        queryClient.invalidateQueries({
          queryKey: ["admin-school-outreach-clubs"],
        });
        setSelectedClub((prev) =>
          prev && compose?.target?.id === prev.id
            ? { ...prev, ...updates }
            : prev,
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: ["admin-school-outreach-schools"],
        });
        setSelectedSchool((prev) =>
          prev && compose?.target?.id === prev.id
            ? { ...prev, ...updates }
            : prev,
        );
      }
      const count = recipients?.length || 0;
      toast.success(
        count > 1
          ? `Email sent to ${count} contacts`
          : `Email sent to ${recipients?.[0] || "recipient"}`,
      );
      setCompose(null);
    },
    onError: (err) => {
      toast.error(err?.message || "Could not send email. Please try again.");
    },
  });

  const schoolStats = useMemo(() => {
    const list = schools || [];
    const byStatus = Object.fromEntries(
      SCHOOL_OUTREACH_STATUSES.map((s) => [s, 0]),
    );
    let bilal = 0;
    let karim = 0;
    for (const item of list) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      if (item.owner === "Bilal") bilal += 1;
      if (item.owner === "Karim") karim += 1;
    }
    return { total: list.length, byStatus, bilal, karim };
  }, [schools]);

  const filteredSchools = useMemo(() => {
    if (!schools) return [];
    const q = search.trim().toLowerCase();
    return schools.filter((item) => {
      const contactBlob = (item.contacts || [])
        .flatMap((c) => [c.name, c.email, c.role, c.phone, c.notes])
        .filter(Boolean)
        .join(" ");
      const matchesSearch =
        !q ||
        [
          item.school,
          item.short_name,
          item.city,
          item.state,
          item.primary_contact_name,
          item.primary_email,
          item.region,
          contactBlob,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesOwner = ownerFilter === "All" || item.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [schools, search, statusFilter, ownerFilter]);

  const filteredClubs = useMemo(() => {
    if (!clubs) return [];
    const q = search.trim().toLowerCase();
    return clubs.filter((item) => {
      const contactBlob = (item.contacts || [])
        .flatMap((c) => [c.name, c.email, c.role, c.phone, c.notes])
        .filter(Boolean)
        .join(" ");
      const matchesSearch =
        !q ||
        [item.school, item.club_name, item.notes, item.reach_notes, contactBlob]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesOwner = ownerFilter === "All" || item.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [clubs, search, statusFilter, ownerFilter]);

  if (schoolsLoading || clubsLoading) return <PageLoader />;

  return (
    <>
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary">
                School Outreach Tracker
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Shared list for Bilal & Karim · 3rd- & 4th-year OD students at
                every U.S. optometry school
              </p>
            </div>
          </div>
          <Button
            className="rounded-full shrink-0"
            onClick={() => {
              setCreateForm(EMPTY_SCHOOL_FORM);
              setCreatingSchool(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add school
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total schools" value={schoolStats.total} />
          <StatCard
            label="Not started"
            value={schoolStats.byStatus["Not started"] || 0}
          />
          <StatCard
            label="Emailed+"
            value={
              (schoolStats.byStatus["Emailed"] || 0) +
              (schoolStats.byStatus["Follow-up sent"] || 0)
            }
            accent="text-amber-600"
          />
          <StatCard
            label="Sharing"
            value={schoolStats.byStatus["Sharing with students"] || 0}
            accent="text-emerald-600"
          />
          <OwnerStatCard owner="Bilal" value={schoolStats.bilal} />
          <OwnerStatCard owner="Karim" value={schoolStats.karim} />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 h-auto flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-2xl border border-border w-full sm:w-auto">
            <TabsTrigger value="schools" className="rounded-xl px-4 py-2.5">
              School Tracker
            </TabsTrigger>
            <TabsTrigger value="clubs" className="rounded-xl px-4 py-2.5">
              Private Practice Clubs
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl px-4 py-2.5">
              Email Templates
            </TabsTrigger>
          </TabsList>

          {(tab === "schools" || tab === "clubs") && (
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    tab === "schools"
                      ? "Search schools, contacts, email..."
                      : "Search clubs, contacts, email..."
                  }
                  className="pl-9 rounded-xl"
                />
              </div>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-full sm:w-44 rounded-xl">
                  {ownerFilter !== "All" ? (
                    <OwnerSelectLabel owner={ownerFilter} />
                  ) : (
                    <SelectValue placeholder="Owner" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All owners</SelectItem>
                  {SCHOOL_OUTREACH_OWNERS.map((o) => (
                    <SelectItem key={o} value={o}>
                      <OwnerSelectLabel owner={o} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All statuses</SelectItem>
                  {SCHOOL_OUTREACH_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <TabsContent value="schools" className="mt-0">
            {!filteredSchools.length ? (
              <EmptyState
                icon={GraduationCap}
                title="No schools match"
                description="Try clearing filters, or add a new optometry school."
                action={
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setCreateForm(EMPTY_SCHOOL_FORM);
                      setCreatingSchool(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add school
                  </Button>
                }
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">School</th>
                        <th className="px-4 py-3 hidden md:table-cell">Contact</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 hidden lg:table-cell">Emailed</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 align-top">
                            <p className="font-bold text-primary leading-snug">
                              {item.short_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px] leading-snug">
                              {item.school}
                            </p>
                            <p className="text-[11px] text-muted-foreground/80 mt-1">
                              {item.city}, {item.state} · {item.region}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top hidden md:table-cell">
                            {(() => {
                              const primary = getSchoolPrimaryContact(item);
                              const extra = Math.max(
                                0,
                                (item.contacts || []).length - 1,
                              );
                              return (
                                <>
                                  <p className="font-semibold">
                                    {primary?.name ||
                                      item.primary_contact_name ||
                                      "—"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {primary?.role || item.primary_target_role}
                                  </p>
                                  {primary?.email || item.primary_email ? (
                                    <a
                                      href={`mailto:${primary?.email || item.primary_email}`}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline mt-1"
                                    >
                                      <Mail className="h-3 w-3" />
                                      {primary?.email || item.primary_email}
                                    </a>
                                  ) : null}
                                  {extra > 0 ? (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      +{extra} more contact{extra === 1 ? "" : "s"}
                                    </p>
                                  ) : null}
                                </>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <OwnerBadge owner={item.owner} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                                statusTone(item.status),
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-muted-foreground hidden lg:table-cell">
                            {item.date_emailed || "—"}
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                className="rounded-full"
                                disabled={
                                  !getSchoolPrimaryContact(item)?.email &&
                                  !item.primary_email
                                }
                                onClick={() => openCompose(item)}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Email
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setSelectedSchool(item)}
                              >
                                Open
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clubs" className="mt-0">
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 md:p-5 mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-accent mb-2">
                Start here — national network
              </p>
              <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                SOLN (Student Optometric Leadership Network) connects private
                practice club presidents across all schools. One partnership here
                reaches every club. Contact:{" "}
                <a
                  href="https://solnoptometry.com/contact-us.html"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-accent hover:underline"
                >
                  solnoptometry.com
                </a>{" "}
                · VSP: schoolsofoptometry@vsp.com
              </p>
            </div>

            {!filteredClubs.length ? (
              <EmptyState
                icon={Users}
                title="No clubs match"
                description="Try clearing filters or search."
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">School / Club</th>
                        <th className="px-4 py-3 hidden md:table-cell">Contact</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 hidden lg:table-cell">Notes</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClubs.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 align-top">
                            <p className="font-bold text-primary">{item.school}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.club_name}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top hidden md:table-cell">
                            {(() => {
                              const primary = getClubPrimaryContact(item);
                              const extra = Math.max(
                                0,
                                (item.contacts || []).length - 1,
                              );
                              if (!primary) {
                                return (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                );
                              }
                              return (
                                <>
                                  <p className="font-semibold">{primary.name}</p>
                                  {primary.email ? (
                                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                      {primary.email}
                                    </p>
                                  ) : null}
                                  {extra > 0 ? (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      +{extra} more contact
                                      {extra === 1 ? "" : "s"}
                                    </p>
                                  ) : null}
                                </>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <OwnerBadge owner={item.owner} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold",
                                statusTone(item.status),
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-muted-foreground hidden lg:table-cell max-w-xs">
                            {item.notes || "—"}
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                className="rounded-full"
                                disabled={!getClubPrimaryContact(item)?.email}
                                onClick={() =>
                                  openCompose(item, "full", null, "club")
                                }
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Email
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setSelectedClub(item)}
                              >
                                Open
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-0 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                Sending tips
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground font-medium leading-relaxed">
                <li>
                  Send individually (or BCC) — a visible mass To: list reads as
                  spam.
                </li>
                <li>
                  Link the intro video at /intro — emails include a poster + Watch button automatically.
                </li>
                <li>
                  Frame it as a free student resource, not recruiting.
                </li>
                <li>
                  Follow up once after ~7–10 days, then log it in the tracker.
                </li>
                <li>
                  Templates are written in Bilal’s voice. For schools owned by
                  Karim, compose auto-swaps so Karim speaks first and Bilal is
                  the colleague.
                </li>
              </ul>
            </div>

            {EMAIL_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-primary">{tpl.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-bold text-foreground/80">Subject:</span>{" "}
                      {tpl.subject}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CopyButton text={tpl.subject} label="Copy subject" />
                    <CopyButton text={tpl.body} label="Copy body" />
                  </div>
                </div>
                <pre className="whitespace-pre-wrap rounded-xl bg-muted/40 border border-border p-4 text-sm font-medium leading-relaxed text-foreground/90">
                  {tpl.body}
                </pre>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* School detail / edit dialog */}
      <Dialog
        open={!!selectedSchool}
        onOpenChange={(open) => !open && setSelectedSchool(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSchool ? (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pr-6">
                  <div>
                    <DialogTitle className="text-xl font-black">
                      Edit school
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                      Update school details, contacts, and outreach status.
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      className="rounded-full"
                      disabled={
                        !getSchoolPrimaryContact(selectedSchool)?.email &&
                        !selectedSchool.primary_email
                      }
                      onClick={() => openCompose(selectedSchool)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send email
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => setConfirmDeleteSchool(selectedSchool)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>School name</Label>
                    <Input
                      className="rounded-xl"
                      value={selectedSchool.school || ""}
                      onChange={(e) => patchSchoolField("school", e.target.value)}
                      onBlur={(e) => saveSchoolField("school", e.target.value.trim())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Short name</Label>
                    <Input
                      className="rounded-xl"
                      value={selectedSchool.short_name || ""}
                      onChange={(e) =>
                        patchSchoolField("short_name", e.target.value)
                      }
                      onBlur={(e) =>
                        saveSchoolField(
                          "short_name",
                          slugShortName(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select
                      value={selectedSchool.region || "South Central"}
                      onValueChange={(v) =>
                        schoolMutation.mutate({
                          id: selectedSchool.id,
                          updates: { region: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      className="rounded-xl"
                      value={selectedSchool.city || ""}
                      onChange={(e) => patchSchoolField("city", e.target.value)}
                      onBlur={(e) => saveSchoolField("city", e.target.value.trim())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      className="rounded-xl"
                      value={selectedSchool.state || ""}
                      onChange={(e) => patchSchoolField("state", e.target.value)}
                      onBlur={(e) =>
                        saveSchoolField("state", e.target.value.trim())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Program website</Label>
                    <Input
                      className="rounded-xl"
                      value={selectedSchool.program_website || ""}
                      onChange={(e) =>
                        patchSchoolField("program_website", e.target.value)
                      }
                      onBlur={(e) =>
                        saveSchoolField("program_website", e.target.value.trim())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Directory page</Label>
                    <Input
                      className="rounded-xl"
                      value={selectedSchool.directory_page || ""}
                      onChange={(e) =>
                        patchSchoolField("directory_page", e.target.value)
                      }
                      onBlur={(e) =>
                        saveSchoolField("directory_page", e.target.value.trim())
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Contacts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add multiple people at this school. Mark one as primary
                        for default emailing.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full shrink-0"
                      onClick={() =>
                        setContactForm({
                          kind: "school",
                          parentId: selectedSchool.id,
                          ...EMPTY_CONTACT_FORM,
                          is_primary: !(selectedSchool.contacts || []).length,
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add contact
                    </Button>
                  </div>

                  {!(selectedSchool.contacts || []).length ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                      No contacts yet. Add Student Affairs, Dean, or club
                      advisors here.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(selectedSchool.contacts || []).map((contact) => (
                        <div
                          key={contact.id}
                          className="rounded-xl border border-border bg-muted/20 p-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-foreground">
                                  {contact.name}
                                </p>
                                {contact.is_primary ? (
                                  <Badge className="rounded-full" variant="secondary">
                                    Primary
                                  </Badge>
                                ) : null}
                              </div>
                              {contact.role ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {contact.role}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                                {contact.email ? (
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="inline-flex items-center gap-1 text-accent hover:underline"
                                  >
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </a>
                                ) : null}
                                {contact.phone ? (
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="inline-flex items-center gap-1 text-foreground/80"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </a>
                                ) : null}
                              </div>
                              {contact.notes ? (
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                  {contact.notes}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full"
                                disabled={!contact.email}
                                onClick={() =>
                                  openCompose(selectedSchool, "full", contact)
                                }
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Email
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() =>
                                  setContactForm({
                                    kind: "school",
                                    parentId: selectedSchool.id,
                                    id: contact.id,
                                    name: contact.name || "",
                                    role: contact.role || "",
                                    email: contact.email || "",
                                    phone: contact.phone || "",
                                    notes: contact.notes || "",
                                    is_primary: Boolean(contact.is_primary),
                                  })
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full text-destructive hover:text-destructive"
                                onClick={() =>
                                  setConfirmDeleteContact({
                                    kind: "school",
                                    id: contact.id,
                                    name: contact.name,
                                    parentId: selectedSchool.id,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {(selectedSchool.program_website ||
                  selectedSchool.directory_page) && (
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    {selectedSchool.program_website ? (
                      <a
                        href={selectedSchool.program_website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        Open website <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {selectedSchool.directory_page ? (
                      <a
                        href={selectedSchool.directory_page}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        Open directory <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select
                      value={selectedSchool.owner}
                      onValueChange={(v) =>
                        schoolMutation.mutate({
                          id: selectedSchool.id,
                          updates: { owner: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        {selectedSchool.owner ? (
                          <OwnerSelectLabel owner={selectedSchool.owner} />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_OWNERS.map((o) => (
                          <SelectItem key={o} value={o}>
                            <OwnerSelectLabel owner={o} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedSchool.status}
                      onValueChange={(v) =>
                        schoolMutation.mutate({
                          id: selectedSchool.id,
                          updates: { status: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date emailed</Label>
                    <Input
                      type="date"
                      className="rounded-xl"
                      value={selectedSchool.date_emailed || ""}
                      onChange={(e) =>
                        patchSchoolField("date_emailed", e.target.value || null)
                      }
                      onBlur={(e) =>
                        saveSchoolField("date_emailed", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up date</Label>
                    <Input
                      type="date"
                      className="rounded-xl"
                      value={selectedSchool.follow_up_date || ""}
                      onChange={(e) =>
                        patchSchoolField(
                          "follow_up_date",
                          e.target.value || null,
                        )
                      }
                      onBlur={(e) =>
                        saveSchoolField(
                          "follow_up_date",
                          e.target.value || null,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reply?</Label>
                  <Input
                    className="rounded-xl"
                    value={selectedSchool.reply || ""}
                    onChange={(e) => patchSchoolField("reply", e.target.value)}
                    onBlur={(e) => saveSchoolField("reply", e.target.value)}
                    placeholder="Short reply note"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-xl min-h-[100px]"
                    value={selectedSchool.notes || ""}
                    onChange={(e) => patchSchoolField("notes", e.target.value)}
                    onBlur={(e) => saveSchoolField("notes", e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add school dialog */}
      <Dialog
        open={creatingSchool}
        onOpenChange={(open) => {
          if (!open && !createSchoolMutation.isPending) {
            setCreatingSchool(false);
            setCreateForm(EMPTY_SCHOOL_FORM);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Add optometry school
            </DialogTitle>
            <DialogDescription>
              Add a school to the shared outreach tracker.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>School name *</Label>
              <Input
                className="rounded-xl"
                value={createForm.school}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, school: e.target.value }))
                }
                placeholder="University of … – College of Optometry"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Short name *</Label>
                <Input
                  className="rounded-xl"
                  value={createForm.short_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      short_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. UIW / RSO"
                />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select
                  value={createForm.region}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, region: v }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OUTREACH_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  className="rounded-xl"
                  value={createForm.city}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  className="rounded-xl"
                  value={createForm.state}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="TX"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary contact</Label>
                <Input
                  className="rounded-xl"
                  value={createForm.primary_contact_name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      primary_contact_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Target role</Label>
                <Input
                  className="rounded-xl"
                  value={createForm.primary_target_role}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      primary_target_role: e.target.value,
                    }))
                  }
                  placeholder="Dean of Student Affairs"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  className="rounded-xl"
                  value={createForm.primary_email}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      primary_email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  className="rounded-xl"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Program website</Label>
              <Input
                className="rounded-xl"
                value={createForm.program_website}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    program_website: e.target.value,
                  }))
                }
                placeholder="https://"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={createForm.owner}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, owner: v }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    {createForm.owner ? (
                      <OwnerSelectLabel owner={createForm.owner} />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OUTREACH_OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>
                        <OwnerSelectLabel owner={o} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, status: v }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OUTREACH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                className="rounded-xl min-h-[80px]"
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={createSchoolMutation.isPending}
                onClick={() => {
                  setCreatingSchool(false);
                  setCreateForm(EMPTY_SCHOOL_FORM);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-full"
                disabled={createSchoolMutation.isPending}
                onClick={submitCreateSchool}
              >
                {createSchoolMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add school
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDeleteSchool)}
        onOpenChange={(open) => !open && setConfirmDeleteSchool(null)}
        title="Delete this school?"
        description={`Remove ${confirmDeleteSchool?.short_name || "this school"} from the outreach tracker. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          confirmDeleteSchool &&
          deleteSchoolMutation.mutate(confirmDeleteSchool.id)
        }
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteContact)}
        onOpenChange={(open) => !open && setConfirmDeleteContact(null)}
        title="Delete this contact?"
        description={`Remove ${confirmDeleteContact?.name || "this contact"} from the ${confirmDeleteContact?.kind === "club" ? "club" : "school"}.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          confirmDeleteContact &&
          deleteContactMutation.mutate({
            id: confirmDeleteContact.id,
            kind: confirmDeleteContact.kind || "school",
          })
        }
      />

      {/* Add / edit school or club contact */}
      <Dialog
        open={Boolean(contactForm)}
        onOpenChange={(open) => {
          if (!open && !contactMutation.isPending) setContactForm(null);
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {contactForm ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  {contactForm.id ? "Edit contact" : "Add contact"}
                </DialogTitle>
                <DialogDescription>
                  {contactForm.kind === "club"
                    ? "People you can email for this private practice club."
                    : "People you can email for this school’s outreach."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    className="rounded-xl"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role / title</Label>
                  <Input
                    className="rounded-xl"
                    value={contactForm.role}
                    placeholder="Dean of Student Affairs"
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      className="rounded-xl"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      className="rounded-xl"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-xl min-h-[72px]"
                    value={contactForm.notes}
                    onChange={(e) =>
                      setContactForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={Boolean(contactForm.is_primary)}
                    onCheckedChange={(checked) =>
                      setContactForm((prev) => ({
                        ...prev,
                        is_primary: Boolean(checked),
                      }))
                    }
                  />
                  Primary contact for this school
                </label>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={contactMutation.isPending}
                    onClick={() => setContactForm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={contactMutation.isPending}
                    onClick={() => contactMutation.mutate(contactForm)}
                  >
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : contactForm.id ? (
                      "Save contact"
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add contact
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Club detail dialog */}
      <Dialog
        open={!!selectedClub}
        onOpenChange={(open) => !open && setSelectedClub(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClub ? (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl font-black flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {selectedClub.school}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedClub.club_name}
                    </DialogDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full shrink-0"
                    disabled={
                      !(selectedClub.contacts || []).some((c) => c.email)
                    }
                    onClick={() =>
                      openCompose(selectedClub, "full", null, "club")
                    }
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Email contacts
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed">
                  {selectedClub.reach_notes || "No reach notes."}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select
                      value={selectedClub.owner}
                      onValueChange={(v) =>
                        clubMutation.mutate({
                          id: selectedClub.id,
                          updates: { owner: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        {selectedClub.owner ? (
                          <OwnerSelectLabel owner={selectedClub.owner} />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_OWNERS.map((o) => (
                          <SelectItem key={o} value={o}>
                            <OwnerSelectLabel owner={o} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedClub.status}
                      onValueChange={(v) =>
                        clubMutation.mutate({
                          id: selectedClub.id,
                          updates: { status: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">
                        Contacts
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add club presidents, advisors, or other people to email.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full shrink-0"
                      onClick={() =>
                        setContactForm({
                          kind: "club",
                          parentId: selectedClub.id,
                          ...EMPTY_CONTACT_FORM,
                          is_primary: !(selectedClub.contacts || []).length,
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add contact
                    </Button>
                  </div>

                  {!(selectedClub.contacts || []).length ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                      No contacts yet. Add the club president or faculty advisor
                      here.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(selectedClub.contacts || []).map((contact) => (
                        <div
                          key={contact.id}
                          className="rounded-xl border border-border bg-muted/20 p-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-foreground">
                                  {contact.name}
                                </p>
                                {contact.is_primary ? (
                                  <Badge
                                    className="rounded-full"
                                    variant="secondary"
                                  >
                                    Primary
                                  </Badge>
                                ) : null}
                              </div>
                              {contact.role ? (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {contact.role}
                                </p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                                {contact.email ? (
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="inline-flex items-center gap-1 text-accent hover:underline"
                                  >
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </a>
                                ) : null}
                                {contact.phone ? (
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="inline-flex items-center gap-1 text-foreground/80"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </a>
                                ) : null}
                              </div>
                              {contact.notes ? (
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                  {contact.notes}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full"
                                disabled={!contact.email}
                                onClick={() =>
                                  openCompose(
                                    selectedClub,
                                    "full",
                                    contact,
                                    "club",
                                  )
                                }
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Email
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() =>
                                  setContactForm({
                                    kind: "club",
                                    parentId: selectedClub.id,
                                    id: contact.id,
                                    name: contact.name || "",
                                    role: contact.role || "",
                                    email: contact.email || "",
                                    phone: contact.phone || "",
                                    notes: contact.notes || "",
                                    is_primary: Boolean(contact.is_primary),
                                  })
                                }
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full text-destructive hover:text-destructive"
                                onClick={() =>
                                  setConfirmDeleteContact({
                                    kind: "club",
                                    id: contact.id,
                                    name: contact.name,
                                    parentId: selectedClub.id,
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-xl min-h-[100px]"
                    value={selectedClub.notes || ""}
                    onChange={(e) =>
                      setSelectedClub((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      clubMutation.mutate({
                        id: selectedClub.id,
                        updates: { notes: e.target.value || null },
                      })
                    }
                  />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Compose / send email */}
      <Dialog
        open={!!compose}
        onOpenChange={(open) => {
          if (!open && !sendMutation.isPending) setCompose(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {compose ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Send outreach email
                </DialogTitle>
                <DialogDescription>
                  {compose.kind === "club"
                    ? `${compose.target.school} · ${compose.target.club_name}`
                    : compose.target.short_name}{" "}
                  · from Admin@optometryconcierge.com
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-1">
                {(compose.target.contacts || []).filter((c) => c.email).length >
                0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>
                        Recipients
                        {compose.contactIds.length > 0
                          ? ` (${compose.contactIds.length})`
                          : ""}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-full text-xs"
                        disabled={sendMutation.isPending}
                        onClick={selectAllComposeContacts}
                      >
                        Select all with email
                      </Button>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border/70 max-h-48 overflow-y-auto">
                      {(compose.target.contacts || [])
                        .filter((c) => c.email)
                        .map((c) => {
                          const checked = compose.contactIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
                            >
                              <Checkbox
                                checked={checked}
                                disabled={sendMutation.isPending}
                                onCheckedChange={() =>
                                  toggleComposeContact(c.id)
                                }
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold leading-snug">
                                  {c.name || "Unnamed"}
                                  {c.is_primary ? (
                                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                      Primary
                                    </span>
                                  ) : null}
                                </span>
                                <span className="block text-xs text-muted-foreground truncate">
                                  {c.role ? `${c.role} · ` : ""}
                                  {c.email}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={compose.templateId}
                    onValueChange={applyComposeTemplate}
                    disabled={sendMutation.isPending}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input
                      type="text"
                      className="rounded-xl"
                      placeholder="comma-separated emails"
                      value={compose.to}
                      disabled={sendMutation.isPending}
                      onChange={(e) =>
                        setCompose((prev) => ({ ...prev, to: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CC (optional)</Label>
                    <Input
                      type="text"
                      className="rounded-xl"
                      placeholder="comma-separated"
                      value={compose.cc}
                      disabled={sendMutation.isPending}
                      onChange={(e) =>
                        setCompose((prev) => ({ ...prev, cc: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    className="rounded-xl"
                    value={compose.subject}
                    disabled={sendMutation.isPending}
                    onChange={(e) =>
                      setCompose((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    className="rounded-xl min-h-[280px] font-medium leading-relaxed"
                    value={compose.body}
                    disabled={sendMutation.isPending}
                    onChange={(e) =>
                      setCompose((prev) => ({ ...prev, body: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={compose.bccAdmin}
                      disabled={sendMutation.isPending}
                      onCheckedChange={(v) =>
                        setCompose((prev) => ({
                          ...prev,
                          bccAdmin: Boolean(v),
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium leading-snug">
                      BCC Admin@optometryconcierge.com so we keep a copy
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={compose.markFollowUp}
                      disabled={sendMutation.isPending}
                      onCheckedChange={(v) =>
                        setCompose((prev) => ({
                          ...prev,
                          markFollowUp: Boolean(v),
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium leading-snug">
                      Mark as follow-up sent (otherwise sets status to Emailed)
                    </span>
                  </label>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    disabled={sendMutation.isPending}
                    onClick={() => setCompose(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={
                      sendMutation.isPending ||
                      !compose.to.trim() ||
                      !compose.subject.trim() ||
                      !compose.body.trim()
                    }
                    onClick={() => sendMutation.mutate()}
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {compose.to.split(/[,;]/).filter((v) => v.trim())
                          .length > 1
                          ? `Send to ${compose.to.split(/[,;]/).filter((v) => v.trim()).length} contacts`
                          : "Send email"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
