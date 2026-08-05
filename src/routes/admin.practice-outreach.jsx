import { createFileRoute } from "@tanstack/react-router";
import { Building } from "lucide-react";
import { OutreachContactsTracker } from "@/components/admin/OutreachContactsTracker";
import {
  listPracticeOutreachContacts,
  createPracticeOutreachContact,
  updatePracticeOutreachContact,
  deletePracticeOutreachContact,
} from "@/services/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/practice-outreach")({
  component: AdminPracticeOutreach,
});

const PRACTICE_TEMPLATES = [
  {
    id: "full",
    title: "Practice outreach — full",
    subject:
      "Ready-to-hire ODs, Doctor owned and led — Optometry Concierge",
    body: `Hi [First name],

I'm Dr. Bilal Ismail. My colleague Dr. Karim Sayani and I are practicing optometrists who built Optometry Concierge as a Doctor owned and led alternative to traditional recruiting.

We send practices pre-vetted, high-fit ODs — not resume blasts. Matching is confidential, clinical-first, and performance-based (no upfront posting fees).

If you're hiring an associate or planning ahead, we'd love to learn what you're looking for:

https://www.optometryconcierge.com/for-practices#intake

Happy to hop on a short call anytime.

Warmly,
Dr. Bilal Ismail & Dr. Karim Sayani
Optometry Concierge
https://www.optometryconcierge.com  ·  Admin@optometryconcierge.com`,
  },
  {
    id: "short",
    title: "Practice outreach — short",
    subject: "Doctor owned OD matching for your practice",
    body: `Hi [First name],

We're Drs. Bilal Ismail and Karim Sayani — practicing ODs who built Optometry Concierge to help practices hire ready-to-fit associates without the usual recruiter friction.

If you're hiring (or will be), start here:
https://www.optometryconcierge.com/for-practices#intake

Thanks,
Bilal & Karim  ·  Optometry Concierge`,
  },
];

function AdminPracticeOutreach() {
  return (
    <OutreachContactsTracker
      kind="practice"
      title="Practice Outreach Tracker"
      description="Track direct outreach to practices — shared by Bilal & Karim"
      icon={Building}
      queryKey="admin-practice-outreach"
      tableName="practice_outreach_contacts"
      listFn={listPracticeOutreachContacts}
      createFn={createPracticeOutreachContact}
      updateFn={updatePracticeOutreachContact}
      deleteFn={deletePracticeOutreachContact}
      templates={PRACTICE_TEMPLATES}
      emptyCreate={{
        practice_name: "",
        contact_name: "",
        email: "",
        phone: "",
        location: "",
        practice_type: "",
        owner: "Bilal",
        status: "Not started",
        notes: "",
      }}
      getTitle={(row) => row.practice_name || "Untitled practice"}
      getSubtitle={(row) =>
        [row.contact_name, row.location, row.practice_type]
          .filter(Boolean)
          .join(" · ") || "Practice contact"
      }
      getEmail={(row) => row.email || ""}
      getFirstName={(row) => {
        if (!row.contact_name) return "";
        return String(row.contact_name)
          .replace(/^dr\.?\s+/i, "")
          .trim()
          .split(/\s+/)[0];
      }}
      renderCreateFields={(form, setForm) => (
        <>
          <div className="space-y-2">
            <Label>Practice name *</Label>
            <Input
              className="rounded-xl"
              value={form.practice_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, practice_name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Contact name</Label>
            <Input
              className="rounded-xl"
              value={form.contact_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, contact_name: e.target.value }))
              }
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                className="rounded-xl"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                className="rounded-xl"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                className="rounded-xl"
                placeholder="City, State"
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Practice type</Label>
              <Input
                className="rounded-xl"
                placeholder="Private, group, etc."
                value={form.practice_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, practice_type: e.target.value }))
                }
              />
            </div>
          </div>
        </>
      )}
      renderDetailExtra={(row, setRow, save) => (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Practice name</Label>
            <Input
              className="rounded-xl"
              value={row.practice_name || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, practice_name: e.target.value }))
              }
              onBlur={(e) => save({ practice_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Contact name</Label>
            <Input
              className="rounded-xl"
              value={row.contact_name || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, contact_name: e.target.value }))
              }
              onBlur={(e) => save({ contact_name: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              className="rounded-xl"
              value={row.email || ""}
              onChange={(e) => setRow((p) => ({ ...p, email: e.target.value }))}
              onBlur={(e) => save({ email: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              className="rounded-xl"
              value={row.phone || ""}
              onChange={(e) => setRow((p) => ({ ...p, phone: e.target.value }))}
              onBlur={(e) => save({ phone: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              className="rounded-xl"
              value={row.location || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, location: e.target.value }))
              }
              onBlur={(e) => save({ location: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Practice type</Label>
            <Input
              className="rounded-xl"
              value={row.practice_type || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, practice_type: e.target.value }))
              }
              onBlur={(e) => save({ practice_type: e.target.value || null })}
            />
          </div>
        </div>
      )}
    />
  );
}
