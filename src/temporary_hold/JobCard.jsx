import { Link } from "@tanstack/react-router";
import { MapPin, CalendarDays, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { formatCurrency, formatDate, timeAgo } from "@/utils/format";

export function JobCard({ job }) {
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
          {job.category}
        </span>
        <StatusBadge status={job.status} />
      </div>

      <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
        {job.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {job.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {job.location}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" /> {formatDate(job.date)}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={job.client?.full_name}
            url={job.client?.avatar_url}
            className="h-8 w-8"
          />

          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">
              {job.client?.full_name || "Client"}
            </p>
            <p className="text-xs text-muted-foreground">
              {timeAgo(job.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold text-foreground">
            {formatCurrency(job.rate)}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
