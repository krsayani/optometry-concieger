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
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteInboundEmail,
  fetchWorkspaceSyncSetup,
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

  const workspaceSynced = useMemo(
    () =>
      (emails || []).some((email) =>
        String(email.resend_email_id || "").startsWith("gmail:"),
      ),
    [emails],
  );

  const copySyncScriptMutation = useMutation({
    mutationFn: fetchWorkspaceSyncSetup,
    onSuccess: async (payload) => {
      if (!payload?.script) {
        throw new Error("Setup script was empty.");
      }
      await navigator.clipboard.writeText(payload.script);
      toast.success("Apps Script copied — paste it at script.google.com");
    },
    onError: (err) =>
      toast.error(err?.message || "Could not copy Workspace sync script."),
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
      // Optimistic local mark-as-read so the list doesn't jump on refetch
      queryClient.setQueryData(["admin-inbound-emails"], (prev) =>
        Array.isArray(prev)
          ? prev.map((email) =>
              email.id === selected.id ? { ...email, is_read: true } : email,
            )
          : prev,
      );
      markInboundEmailRead(selected.id, true).catch(() => {
        queryClient.invalidateQueries({ queryKey: ["admin-inbound-emails"] });
      });
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
            <Badge
              variant="secondary"
              className={cn(
                "min-w-[5.5rem] justify-center",
                unreadCount === 0 && "opacity-40",
              )}
            >
              {unreadCount} unread
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Email Inbox
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Contact forms, intake alerts, and Google Workspace (Admin@) inbox
            mail appear here. Reply from the dashboard or from Gmail.
          </p>
        </div>
      </div>

      {!workspaceSynced ? (
        <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 md:p-5">
          <p className="text-sm font-black text-foreground">
            Google Workspace inbox is not connected yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Contact/intake emails already appear here. Mail that lands in
            Admin@ Gmail needs a one-time Apps Script so it also syncs to this
            page (every 5 minutes).
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-foreground/90">
            <li>
              Click <span className="font-semibold">Copy Apps Script</span> below
            </li>
            <li>
              Open{" "}
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent hover:underline"
              >
                script.google.com
              </a>{" "}
              as <span className="font-semibold">Admin@optometryconcierge.com</span>
            </li>
            <li>New project → paste → Save → run <span className="font-semibold">syncWorkspaceInbox</span> once (approve permissions)</li>
            <li>
              Triggers → Add trigger → every <span className="font-semibold">5 minutes</span>
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-full"
              disabled={copySyncScriptMutation.isPending}
              onClick={() => copySyncScriptMutation.mutate()}
            >
              {copySyncScriptMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy Apps Script
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              asChild
            >
              <a
                href="https://script.google.com/home/projects/create"
                target="_blank"
                rel="noreferrer"
              >
                Open Apps Script
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        </div>
      ) : null}

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
          description="New contact forms show up automatically. Connect Google Workspace with the Apps Script above to also pull Admin@ Gmail here."
        />
      ) : (
        <div className="grid h-[min(72vh,780px)] grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-background">
            {filtered.map((email) => {
              const active = selected?.id === email.id;
              return (
                <button
                  key={email.id}
                  type="button"
                  onClick={() => setSelectedId(email.id)}
                  className={cn(
                    "h-[108px] w-full border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0",
                    active ? "bg-primary/5" : "hover:bg-muted/40",
                    !email.is_read && "bg-muted/20",
                  )}
                >
                  <div className="flex h-full items-start gap-2">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                      {!email.is_read ? (
                        <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-foreground">
                          {email.from_name || email.from_email}
                        </p>
                        <span className="w-[78px] shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
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
                      <p className="mt-0.5 line-clamp-2 h-[2.5rem] text-xs text-muted-foreground">
                        {previewText(email)}
                      </p>
                      <div className="mt-1 h-5">
                        {email.replied_at ? (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                            Replied
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background">
            {selected ? (
              <>
                <div className="shrink-0 border-b border-border px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-extrabold text-foreground">
                        {selected.subject || "(no subject)"}
                      </h2>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        From{" "}
                        <span className="font-semibold text-foreground">
                          {selected.from_name
                            ? `${selected.from_name} <${selected.from_email}>`
                            : selected.from_email}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
                      className="shrink-0"
                      onClick={() => setConfirmDelete(selected)}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <div className="mt-3 flex h-7 items-center gap-2 overflow-x-auto">
                    {Array.isArray(selected.attachments) &&
                    selected.attachments.length > 0 ? (
                      selected.attachments.map((file, idx) => (
                        <Badge
                          key={file.id || idx}
                          variant="secondary"
                          className="shrink-0"
                        >
                          <Paperclip className="mr-1 h-3 w-3" />
                          {file.filename || "Attachment"}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No attachments
                      </span>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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

                <div className="shrink-0 border-t border-border px-5 py-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Reply className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      Reply to {selected.from_email}
                    </span>
                  </div>
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={5}
                    className="min-h-[120px] resize-none"
                    placeholder="Write your reply…"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      disabled={!replyBody.trim() || replyMutation.isPending}
                      onClick={() => replyMutation.mutate()}
                    >
                      {replyMutation.isPending ? "Sending…" : "Send reply"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                Select a message to read
              </div>
            )}
          </div>
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
