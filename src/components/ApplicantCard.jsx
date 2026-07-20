import { Mail, FileText } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";

export function ApplicantCard({ application, onAccept, onDecline, onViewProfile, busy }) {
  const od = application.provider;
  const isPending = application.status === "Pending";

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/20">
      <div className="flex items-start gap-4">
        <button
          onClick={() => onViewProfile(od)}
          className="shrink-0 transition-transform hover:scale-105 active:scale-95"
        >
          <UserAvatar
            name={od?.full_name}
            url={od?.avatar_url}
            className="h-12 w-12"
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => onViewProfile(od)}
              className="text-left hover:text-primary transition-colors"
            >
              <h4 className="text-base font-semibold text-foreground">
                {od?.full_name || "Optometrist"}
              </h4>
            </button>
            <StatusBadge status={application.status} />
          </div>

          {od?.field && (
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
              Field: {od.field}
            </p>
          )}

          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
            {od?.bio || "This optometrist hasn't added a bio yet."}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Applied {formatDate(application.applied_at)}
            </p>

            <button
              onClick={() => onViewProfile(od)}
              className="text-xs font-medium text-muted-foreground hover:text-primary underline"
            >
              View Full Profile
            </button>

            {od?.resume_url && (
              <a
                href={od.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                View Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="mt-4 flex gap-2.5 border-t border-border pt-4">
          <Button
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => onAccept(application.id)}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => onDecline(application.id)}
          >
            Decline
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          {application.status === "Accepted"
            ? "You accepted this application."
            : "You declined this application."}
        </div>
      )}
    </div>
  );
}
