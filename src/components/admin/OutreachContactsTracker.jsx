import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Mail,
  Phone,
  Send,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import {
  sendOutreachEmail,
  CONTACT_OUTREACH_STATUSES,
  CONTACT_OUTREACH_OWNERS,
} from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
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

function firstNameFromContact(name) {
  if (!name) return "";
  const cleaned = String(name)
    .replace(/^dr\.?\s+/i, "")
    .trim();
  return cleaned.split(/\s+/)[0] || "";
}

function personalizeTemplate(template, firstName) {
  const first = firstName || "there";
  return {
    subject: template.subject,
    body: template.body.replace(/\[First name\]/g, first),
  };
}

function todayISODate() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function statusTone(status) {
  switch (status) {
    case "Signed up":
    case "Interested":
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
      {copied ? (
        <Check className="h-3.5 w-3.5 mr-1.5" />
      ) : (
        <Copy className="h-3.5 w-3.5 mr-1.5" />
      )}
      {label}
    </Button>
  );
}

/**
 * Shared outreach tracker for OD / Practice contacts.
 *
 * @param {{
 *   kind: 'od' | 'practice',
 *   title: string,
 *   description: string,
 *   icon: any,
 *   queryKey: string,
 *   tableName: string,
 *   listFn: () => Promise<any[]>,
 *   createFn: (payload: any) => Promise<any>,
 *   updateFn: (id: string, updates: any) => Promise<any>,
 *   deleteFn: (id: string) => Promise<void>,
 *   templates: Array<{ id: string, title: string, subject: string, body: string }>,
 *   emptyCreate: Record<string, any>,
 *   getTitle: (row: any) => string,
 *   getSubtitle: (row: any) => string,
 *   getEmail: (row: any) => string,
 *   getFirstName: (row: any) => string,
 *   renderCreateFields: (form: any, setForm: Function) => React.ReactNode,
 *   renderDetailExtra?: (row: any, setRow: Function, save: Function) => React.ReactNode,
 * }} props
 */
export function OutreachContactsTracker({
  kind,
  title,
  description,
  icon: Icon,
  queryKey,
  tableName,
  listFn,
  createFn,
  updateFn,
  deleteFn,
  templates,
  emptyCreate,
  getTitle,
  getSubtitle,
  getEmail,
  getFirstName,
  renderCreateFields,
  renderDetailExtra,
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("tracker");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [compose, setCompose] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: contacts, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: listFn,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`${queryKey}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey, tableName]);

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateFn(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (data) setSelected(data);
      toast.success("Contact updated");
    },
    onError: () => toast.error("Could not update contact."),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = { ...createForm };
      if (kind === "od" && !String(payload.first_name || "").trim()) {
        throw new Error("First name is required.");
      }
      if (kind === "practice" && !String(payload.practice_name || "").trim()) {
        throw new Error("Practice name is required.");
      }
      // Normalize empty optional strings to null
      for (const key of Object.keys(payload)) {
        if (payload[key] === "") payload[key] = null;
      }
      if (kind === "od") {
        payload.first_name = String(createForm.first_name || "").trim();
        payload.last_name = String(createForm.last_name || "").trim();
      }
      if (kind === "practice") {
        payload.practice_name = String(createForm.practice_name || "").trim();
      }
      payload.owner = createForm.owner || "Bilal";
      payload.status = createForm.status || "Not started";
      return createFn(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Contact added");
      setCreating(false);
      setCreateForm(emptyCreate);
      setSelected(data);
    },
    onError: (err) =>
      toast.error(err?.message || "Could not add contact."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Contact deleted");
      setConfirmDelete(null);
      setSelected(null);
    },
    onError: () => toast.error("Could not delete contact."),
  });

  const openCompose = (row, templateId = templates[0]?.id) => {
    const template =
      templates.find((t) => t.id === templateId) || templates[0];
    const personalized = personalizeTemplate(template, getFirstName(row));
    const alreadyContacted = row.status && row.status !== "Not started";
    setCompose({
      row,
      templateId: template.id,
      to: getEmail(row) || "",
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
        templates.find((t) => t.id === templateId) || templates[0];
      const personalized = personalizeTemplate(
        template,
        getFirstName(prev.row),
      );
      return {
        ...prev,
        templateId: template.id,
        subject: personalized.subject,
        body: personalized.body,
      };
    });
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!compose) throw new Error("Nothing to send.");
      if (!compose.to?.trim()) throw new Error("Recipient email is required.");

      const result = await sendOutreachEmail({
        to: compose.to.trim(),
        cc: compose.cc.trim() || undefined,
        subject: compose.subject.trim(),
        body: compose.body.trim(),
        kind,
        contactId: compose.row.id,
        contactLabel: getTitle(compose.row),
        bccAdmin: compose.bccAdmin,
      });

      const today = todayISODate();
      const updates = compose.markFollowUp
        ? { status: "Follow-up sent", follow_up_date: today }
        : {
            status:
              compose.row.status === "Not started" || !compose.row.status
                ? "Emailed"
                : compose.row.status,
            date_emailed: compose.row.date_emailed || today,
          };

      await updateFn(compose.row.id, updates);
      return { result, updates };
    },
    onSuccess: ({ updates }) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setSelected((prev) =>
        prev && compose?.row?.id === prev.id ? { ...prev, ...updates } : prev,
      );
      toast.success(`Email sent to ${compose.to}`);
      setCompose(null);
    },
    onError: (err) => {
      toast.error(err?.message || "Could not send email.");
    },
  });

  const stats = useMemo(() => {
    const list = contacts || [];
    const byStatus = Object.fromEntries(
      CONTACT_OUTREACH_STATUSES.map((s) => [s, 0]),
    );
    let bilal = 0;
    let karim = 0;
    for (const item of list) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      if (item.owner === "Bilal") bilal += 1;
      if (item.owner === "Karim") karim += 1;
    }
    return { total: list.length, byStatus, bilal, karim };
  }, [contacts]);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = search.trim().toLowerCase();
    return contacts.filter((item) => {
      const hay = [
        getTitle(item),
        getSubtitle(item),
        getEmail(item),
        item.phone,
        item.notes,
        item.school,
        item.location,
        item.city,
        item.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesOwner = ownerFilter === "All" || item.owner === ownerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [
    contacts,
    search,
    statusFilter,
    ownerFilter,
    getTitle,
    getSubtitle,
    getEmail,
  ]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {description}
              </p>
            </div>
          </div>
          <Button
            className="rounded-full"
            onClick={() => {
              setCreateForm(emptyCreate);
              setCreating(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add contact
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Total" value={stats.total} />
          <StatCard
            label="Not started"
            value={stats.byStatus["Not started"] || 0}
          />
          <StatCard
            label="Emailed+"
            value={
              (stats.byStatus["Emailed"] || 0) +
              (stats.byStatus["Follow-up sent"] || 0)
            }
            accent="text-amber-600"
          />
          <StatCard
            label="Signed up"
            value={stats.byStatus["Signed up"] || 0}
            accent="text-emerald-600"
          />
          <StatCard label="Bilal" value={stats.bilal} />
          <StatCard label="Karim" value={stats.karim} />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 h-auto flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-2xl border border-border w-full sm:w-auto">
            <TabsTrigger value="tracker" className="rounded-xl px-4 py-2.5">
              Tracker
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl px-4 py-2.5">
              Email Templates
            </TabsTrigger>
          </TabsList>

          {tab === "tracker" && (
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts..."
                  className="pl-9 rounded-xl"
                />
              </div>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-full sm:w-40 rounded-xl">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All owners</SelectItem>
                  {CONTACT_OUTREACH_OWNERS.map((o) => (
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
                  {CONTACT_OUTREACH_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <TabsContent value="tracker" className="mt-0">
            {!filtered.length ? (
              <EmptyState
                icon={Icon}
                title="No contacts yet"
                description="Add a contact to start tracking outreach."
                action={
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setCreateForm(emptyCreate);
                      setCreating(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add contact
                  </Button>
                }
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3 hidden md:table-cell">Email</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 hidden lg:table-cell">
                          Emailed
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 align-top">
                            <p className="font-bold text-primary leading-snug">
                              {getTitle(item)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getSubtitle(item)}
                            </p>
                          </td>
                          <td className="px-4 py-3 align-top hidden md:table-cell">
                            {getEmail(item) ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                                <Mail className="h-3 w-3" />
                                {getEmail(item)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                            {item.phone ? (
                              <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {item.phone}
                              </p>
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
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                className="rounded-full"
                                disabled={!getEmail(item)}
                                onClick={() => openCompose(item)}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Email
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setSelected(item)}
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
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-soft space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-primary">
                      {tpl.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-bold text-foreground/80">
                        Subject:
                      </span>{" "}
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

      {/* Detail dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pr-6">
                  <div>
                    <DialogTitle className="text-xl font-black">
                      {getTitle(selected)}
                    </DialogTitle>
                    <DialogDescription>
                      {getSubtitle(selected)}
                    </DialogDescription>
                  </div>
                  <Button
                    className="rounded-full shrink-0"
                    disabled={!getEmail(selected)}
                    onClick={() => openCompose(selected)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send email
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {renderDetailExtra?.(
                  selected,
                  setSelected,
                  (updates) =>
                    updateMutation.mutate({ id: selected.id, updates }),
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select
                      value={selected.owner}
                      onValueChange={(v) =>
                        updateMutation.mutate({
                          id: selected.id,
                          updates: { owner: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_OUTREACH_OWNERS.map((o) => (
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
                      value={selected.status}
                      onValueChange={(v) =>
                        updateMutation.mutate({
                          id: selected.id,
                          updates: { status: v },
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_OUTREACH_STATUSES.map((s) => (
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
                      value={selected.date_emailed || ""}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          date_emailed: e.target.value || null,
                        }))
                      }
                      onBlur={(e) =>
                        updateMutation.mutate({
                          id: selected.id,
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
                      value={selected.follow_up_date || ""}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          follow_up_date: e.target.value || null,
                        }))
                      }
                      onBlur={(e) =>
                        updateMutation.mutate({
                          id: selected.id,
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
                    value={selected.reply || ""}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        reply: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      updateMutation.mutate({
                        id: selected.id,
                        updates: { reply: e.target.value || null },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    className="rounded-xl min-h-[100px]"
                    value={selected.notes || ""}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    onBlur={(e) =>
                      updateMutation.mutate({
                        id: selected.id,
                        updates: { notes: e.target.value || null },
                      })
                    }
                  />
                </div>

                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setConfirmDelete(selected)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete contact
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              Add contact
            </DialogTitle>
            <DialogDescription>
              Add someone to the {kind === "od" ? "OD" : "practice"} outreach
              tracker.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {renderCreateFields(createForm, setCreateForm)}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_OUTREACH_OWNERS.map((o) => (
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
                  value={createForm.status}
                  onValueChange={(v) =>
                    setCreateForm((prev) => ({ ...prev, status: v }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_OUTREACH_STATUSES.map((s) => (
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
                className="rounded-xl"
                value={createForm.notes || ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Saving…" : "Save contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose dialog */}
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
                  {getTitle(compose.row)} · from Admin@optometryconcierge.com
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-1">
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
                      {templates.map((t) => (
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
                      type="email"
                      className="rounded-xl"
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
                    className="rounded-xl min-h-[260px] font-medium leading-relaxed"
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

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={sendMutation.isPending}
                    onClick={() => setCompose(null)}
                  >
                    Cancel
                  </Button>
                  <Button
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
                        Send email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this contact?"
        description="This removes them from the outreach tracker. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
      />
    </>
  );
}
