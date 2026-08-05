import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  MailOpen,
  Reply,
  Search,
  Trash2,
  Paperclip,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteInboundEmail,
  listInboundEmails,
  markInboundEmailRead,
  replyToInboundEmail,
} from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inbox")({
  component: AdminInbox,
});

function previewText(email) {
  const text = email?.text_body || "";
  if (text.trim()) return text.replace(/\s+/g, " ").trim();
  if (email?.html_body) {
    return String(email.html_body)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "No message body";
}

function AdminInbox() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [replyBody, setReplyBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: emails, isLoading, isError, error } = useQuery({
    queryKey: ["admin-inbound-emails"],
    queryFn: listInboundEmails,
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-inbound-emails")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inbound_emails" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-inbound-emails"] });
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const filtered = useMemo(() => {
    const list = emails || [];
    return list.filter((email) => {
      if (filter === "unread" && email.is_read) return false;
      if (filter === "replied" && !email.replied_at) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        email.subject?.toLowerCase().includes(q) ||
        email.from_email?.toLowerCase().includes(q) ||
        email.from_name?.toLowerCase().includes(q) ||
        email.text_body?.toLowerCase().includes(q)
      );
    });
  }, [emails, filter, search]);

  const selected = useMemo(
    () => (emails || []).find((e) => e.id === selectedId) || filtered[0] || null,
    [emails, selectedId, filtered],
  );

  useEffect(() => {
    if (!selected) return;
    if (selectedId !== selected.id) setSelectedId(selected.id);
    if (!selected.is_read) {
      markInboundEmailRead(selected.id, true)
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["admin-inbound-emails"] }),
        )
        .catch(() => {});
    }
  }, [selected?.id]);

  useEffect(() => {
    setReplyBody("");
  }, [selected?.id]);

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToInboundEmail({ inboundId: selected.id, body: replyBody }),
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["admin-inbound-emails"] });
    },
    onError: (err) => toast.error(err.message || "Failed to send reply"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteInboundEmail(id),
    onSuccess: () => {
      toast.success("Message deleted");
      setConfirmDelete(null);
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-inbound-emails"] });
    },
    onError: (err) => toast.error(err.message || "Failed to delete"),
  });

  const unreadCount = (emails || []).filter((e) => !e.is_read).length;

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={Inbox}
          title="Inbox unavailable"
          description={
            error?.message ||
            "Could not load inbound emails. Make sure the inbox table migration has been applied."
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <Inbox className="h-4 w-4" />
            Admin Inbox
            {unreadCount > 0 ? (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            ) : null}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Email Inbox
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Contact forms, intake alerts, and inbound replies appear here and in
            Google Workspace (Admin@). Reply from the dashboard or from Gmail.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, sender, or body…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "replied", label: "Replied" },
          ].map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState
          icon={MailOpen}
          title="No messages yet"
          description="New contact forms and intake alerts will show up here automatically (and in Admin@ Gmail)."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-background">
            {filtered.map((email) => {
              const active = selected?.id === email.id;
              return (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => setSelectedId(email.id)}
                  className={cn(
                    "w-full border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0",
                    active ? "bg-primary/5" : "hover:bg-muted/40",
                    !email.is_read && "bg-muted/20",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!email.is_read ? (
                      <Circle className="mt-1 h-2.5 w-2.5 fill-primary text-primary" />
                    ) : (
                      <span className="mt-1 h-2.5 w-2.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-foreground">
                          {email.from_name || email.from_email}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {email.received_at
                            ? formatDistanceToNow(new Date(email.received_at), {
                                addSuffix: true,
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="truncate text-sm font-semibold text-foreground/90">
                        {email.subject || "(no subject)"}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {previewText(email)}
                      </p>
                      {email.replied_at ? (
                        <Badge className="mt-2" variant="outline">
                          Replied
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="rounded-2xl border border-border bg-background">
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold text-foreground">
                      {selected.subject || "(no subject)"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      From{" "}
                      <span className="font-semibold text-foreground">
                        {selected.from_name
                          ? `${selected.from_name} <${selected.from_email}>`
                          : selected.from_email}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      To {(selected.to_emails || []).join(", ") || "—"}
                      {selected.received_at
                        ? ` · ${new Date(selected.received_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(selected)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>
                {Array.isArray(selected.attachments) &&
                selected.attachments.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.attachments.map((file, idx) => (
                      <Badge key={file.id || idx} variant="secondary">
                        <Paperclip className="mr-1 h-3 w-3" />
                        {file.filename || "Attachment"}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="max-h-[36vh] overflow-y-auto px-5 py-4">
                {selected.html_body ? (
                  <div
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: selected.html_body }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {selected.text_body || "No message body"}
                  </pre>
                )}
              </div>

              <div className="border-t border-border px-5 py-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Reply className="h-4 w-4" />
                  Reply to {selected.from_email}
                </div>
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={6}
                  placeholder="Write your reply…"
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    disabled={
                      !replyBody.trim() || replyMutation.isPending
                    }
                    onClick={() => replyMutation.mutate()}
                  >
                    {replyMutation.isPending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this message?"
        description="This permanently removes the inbound email from the admin inbox."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
      />
    </div>
  );
}
