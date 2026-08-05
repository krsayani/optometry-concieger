import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { OutreachContactsTracker } from "@/components/admin/OutreachContactsTracker";
import {
  listOdOutreachContacts,
  createOdOutreachContact,
  updateOdOutreachContact,
  deleteOdOutreachContact,
} from "@/services/admin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/od-outreach")({
  component: AdminOdOutreach,
});

const OD_TEMPLATES = [
  {
    id: "full",
    title: "OD outreach — full",
    subject:
      "Free career help from two practicing ODs — Optometry Concierge",
    body: `Hi [First name],

I'm Dr. Bilal Ismail. My colleague Dr. Karim Sayani and I graduated together from UIW Rosenberg, and we both still practice.

We built Optometry Concierge as a free, confidential resource for optometrists — resume and CV review, interview prep, salary guidance, offer comparison, contract red-flag education, and negotiation coaching. Students and ODs opt in themselves; nothing gets shared with a practice without their consent.

If you're thinking about your next role (or your first one), we'd be glad to help. You can start here anytime:

https://www.optometryconcierge.com/for-ods#intake

Happy to answer questions or hop on a quick call.

Warmly,
Dr. Bilal Ismail & Dr. Karim Sayani
Optometry Concierge
https://www.optometryconcierge.com  ·  Admin@optometryconcierge.com`,
  },
  {
    id: "short",
    title: "OD outreach — short",
    subject: "Free, confidential career help for ODs",
    body: `Hi [First name],

I'm Dr. Bilal Ismail — my colleague Dr. Karim Sayani and I are practicing ODs who built Optometry Concierge so new grads and colleagues don't have to figure out contracts, offers, and negotiations alone.

Everything is free and confidential. If useful, start here:
https://www.optometryconcierge.com/for-ods#intake

Thanks,
Bilal & Karim  ·  Optometry Concierge`,
  },
];

function AdminOdOutreach() {
  return (
    <OutreachContactsTracker
      kind="od"
      title="OD Outreach Tracker"
      description="Track direct outreach to optometrists and students — shared by Bilal & Karim"
      icon={Stethoscope}
      queryKey="admin-od-outreach"
      tableName="od_outreach_contacts"
      listFn={listOdOutreachContacts}
      createFn={createOdOutreachContact}
      updateFn={updateOdOutreachContact}
      deleteFn={deleteOdOutreachContact}
      templates={OD_TEMPLATES}
      emptyCreate={{
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        school: "",
        city: "",
        state: "",
        class_year: "",
        owner: "Bilal",
        status: "Not started",
        notes: "",
      }}
      getTitle={(row) =>
        `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Untitled"
      }
      getSubtitle={(row) =>
        [row.school, row.class_year, [row.city, row.state].filter(Boolean).join(", ")]
          .filter(Boolean)
          .join(" · ") || "OD contact"
      }
      getEmail={(row) => row.email || ""}
      getFirstName={(row) => row.first_name || firstNameFallback(row)}
      renderCreateFields={(form, setForm) => (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name *</Label>
              <Input
                className="rounded-xl"
                value={form.first_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, first_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                className="rounded-xl"
                value={form.last_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, last_name: e.target.value }))
                }
              />
            </div>
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
          <div className="space-y-2">
            <Label>School</Label>
            <Input
              className="rounded-xl"
              value={form.school}
              onChange={(e) =>
                setForm((p) => ({ ...p, school: e.target.value }))
              }
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                className="rounded-xl"
                value={form.city}
                onChange={(e) =>
                  setForm((p) => ({ ...p, city: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                className="rounded-xl"
                value={form.state}
                onChange={(e) =>
                  setForm((p) => ({ ...p, state: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Class year</Label>
              <Input
                className="rounded-xl"
                placeholder="e.g. 2027"
                value={form.class_year}
                onChange={(e) =>
                  setForm((p) => ({ ...p, class_year: e.target.value }))
                }
              />
            </div>
          </div>
        </>
      )}
      renderDetailExtra={(row, setRow, save) => (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input
              className="rounded-xl"
              value={row.first_name || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, first_name: e.target.value }))
              }
              onBlur={(e) => save({ first_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input
              className="rounded-xl"
              value={row.last_name || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, last_name: e.target.value }))
              }
              onBlur={(e) => save({ last_name: e.target.value })}
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
          <div className="space-y-2 sm:col-span-2">
            <Label>School</Label>
            <Input
              className="rounded-xl"
              value={row.school || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, school: e.target.value }))
              }
              onBlur={(e) => save({ school: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              className="rounded-xl"
              value={row.city || ""}
              onChange={(e) => setRow((p) => ({ ...p, city: e.target.value }))}
              onBlur={(e) => save({ city: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              className="rounded-xl"
              value={row.state || ""}
              onChange={(e) => setRow((p) => ({ ...p, state: e.target.value }))}
              onBlur={(e) => save({ state: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label>Class year</Label>
            <Input
              className="rounded-xl"
              value={row.class_year || ""}
              onChange={(e) =>
                setRow((p) => ({ ...p, class_year: e.target.value }))
              }
              onBlur={(e) => save({ class_year: e.target.value || null })}
            />
          </div>
        </div>
      )}
    />
  );
}

function firstNameFallback() {
  return "";
}
