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
} from "lucide-react";
import {
  listSchoolOutreachSchools,
  listSchoolOutreachClubs,
  updateSchoolOutreachSchool,
  updateSchoolOutreachClub,
  SCHOOL_OUTREACH_STATUSES,
  SCHOOL_OUTREACH_OWNERS,
} from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/school-outreach")({
  component: AdminSchoolOutreach,
});

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

Thank you for everything you pour into getting these students ready. Happy to answer anything, or hop on a call if that's easier.

Warmly,
Dr. Bilal Ismail & Dr. Karim Sayani
Optometry Concierge
https://www.optometryconcierge.com  ·  Admin@optometryconcierge.com`,
  },
  {
    id: "short",
    title: "Shorter version — AOSA advisors / faculty",
    subject: "Free, confidential career help for your OD students",
    body: `Hi [First name],

I'm Dr. Bilal Ismail. My colleague Dr. Karim Sayani and I graduated together from UIW Rosenberg, and we still practice. We built a free resource called Optometry Concierge for one reason: we want new grads to land somewhere that values their training, pays them fairly, and lets them do the work they're passionate about, so it doesn't feel like work. Getting there comes down to the things school doesn't teach: resumes, contracts, knowing your worth, comparing offers, and negotiating.

We help with all of it, free. It's confidential, students sign up themselves, and we don't need any information from your office. Would you share it with your third- and fourth-years? A short video from the two of us is below so they can hear why this matters to us.

Thank you,
Bilal & Karim  ·  Optometry Concierge  ·  https://www.optometryconcierge.com`,
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

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
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
    onError: () => toast.error("Could not update school. Please try again."),
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
      const matchesSearch =
        !q ||
        [item.school, item.club_name, item.notes, item.reach_notes]
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
          <StatCard label="Bilal" value={schoolStats.bilal} />
          <StatCard label="Karim" value={schoolStats.karim} />
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
                      : "Search clubs..."
                  }
                  className="pl-9 rounded-xl"
                />
              </div>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-full sm:w-40 rounded-xl">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All owners</SelectItem>
                  {SCHOOL_OUTREACH_OWNERS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
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
                description="Try clearing filters or search."
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
                            <p className="font-semibold">{item.primary_contact_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.primary_target_role}
                            </p>
                            {item.primary_email ? (
                              <a
                                href={`mailto:${item.primary_email}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline mt-1"
                              >
                                <Mail className="h-3 w-3" />
                                {item.primary_email}
                              </a>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Badge variant="outline" className="rounded-full">
                              {item.owner}
                            </Badge>
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setSelectedSchool(item)}
                            >
                              Open
                            </Button>
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
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 hidden md:table-cell">Notes</th>
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
                          <td className="px-4 py-3 align-top">
                            <Badge variant="outline" className="rounded-full">
                              {item.owner}
                            </Badge>
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
                          <td className="px-4 py-3 align-top text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                            {item.notes || "—"}
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => setSelectedClub(item)}
                            >
                              Open
                            </Button>
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
                  Link the founders video; don&apos;t attach a large file.
                </li>
                <li>
                  Frame it as a free student resource, not recruiting.
                </li>
                <li>
                  Follow up once after ~7–10 days, then log it in the tracker.
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

      {/* School detail dialog */}
      <Dialog
        open={!!selectedSchool}
        onOpenChange={(open) => !open && setSelectedSchool(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSchool ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">
                  {selectedSchool.short_name}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  {selectedSchool.school}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Primary contact
                    </p>
                    <p className="font-bold">{selectedSchool.primary_contact_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSchool.primary_target_role}
                    </p>
                    {selectedSchool.primary_email ? (
                      <a
                        href={`mailto:${selectedSchool.primary_email}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline mt-2"
                      >
                        <Mail className="h-3 w-3" />
                        {selectedSchool.primary_email}
                      </a>
                    ) : null}
                    {selectedSchool.phone ? (
                      <a
                        href={`tel:${selectedSchool.phone}`}
                        className="flex items-center gap-1 text-xs font-semibold text-foreground/80 mt-1"
                      >
                        <Phone className="h-3 w-3" />
                        {selectedSchool.phone}
                      </a>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      Secondary / Dean
                    </p>
                    <p className="text-sm font-medium leading-snug">
                      {selectedSchool.secondary_contact || "—"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedSchool.program_website ? (
                        <a
                          href={selectedSchool.program_website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                        >
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                      {selectedSchool.directory_page ? (
                        <a
                          href={selectedSchool.directory_page}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                        >
                          Directory <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>

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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_OWNERS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
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
                        setSelectedSchool((prev) => ({
                          ...prev,
                          date_emailed: e.target.value || null,
                        }))
                      }
                      onBlur={(e) =>
                        schoolMutation.mutate({
                          id: selectedSchool.id,
                          updates: { date_emailed: e.target.value || null },
                        })
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
                        setSelectedSchool((prev) => ({
                          ...prev,
                          follow_up_date: e.target.value || null,
                        }))
                      }
                      onBlur={(e) =>
                        schoolMutation.mutate({
                          id: selectedSchool.id,
                          updates: { follow_up_date: e.target.value || null },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reply?</Label>
                  <Input
                    className="rounded-xl"
                    value={selectedSchool.reply || ""}
                    onChange={(e) =>
                      setSelectedSchool((prev) => ({
                        ...prev,
                        reply: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      schoolMutation.mutate({
                        id: selectedSchool.id,
                        updates: { reply: e.target.value || null },
                      })
                    }
                    placeholder="Short reply note"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-xl min-h-[100px]"
                    value={selectedSchool.notes || ""}
                    onChange={(e) =>
                      setSelectedSchool((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      schoolMutation.mutate({
                        id: selectedSchool.id,
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

      {/* Club detail dialog */}
      <Dialog
        open={!!selectedClub}
        onOpenChange={(open) => !open && setSelectedClub(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedClub ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedClub.school}
                </DialogTitle>
                <DialogDescription>{selectedClub.club_name}</DialogDescription>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_OUTREACH_OWNERS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
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
    </>
  );
}
