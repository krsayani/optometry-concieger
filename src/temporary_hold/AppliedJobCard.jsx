import { Link } from "@tanstack/react-router";
import { MapPin, CalendarDays } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, timeAgo } from "@/utils/format";

export function AppliedJobCard({ application }) {
  const job = application.job;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            {job?.category ?? "Job"}
          </span>
          {job ? (
            <Link
              to="/jobs/$jobId"
              params={{ jobId: job.id }}
              className="mt-2 block text-lg font-semibold text-foreground hover:text-primary"
            >
              {job.title}
            </Link>
          ) : (
            <p className="mt-2 text-lg font-semibold text-muted-foreground">
              This job is no longer available
            </p>
          )}
        </div>
        <StatusBadge status={application.status} />
      </div>

      {job ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {job.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {job.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {formatDate(job.date)}
          </span>
          <span className="font-semibold text-foreground">
            {formatCurrency(job.rate)}
          </span>
        </div>
      ) : null}

      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        Applied {timeAgo(application.applied_at)}
      </p>
    </div>
  );
}
