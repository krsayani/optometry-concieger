import { cn } from "@/lib/utils";

const toneMap = {
  Open: "open",
  Closed: "closed",
  Pending: "pending",
  Accepted: "accepted",
  Declined: "declined",
};

const toneClasses = {
  open: "bg-success/12 text-success border-success/25",
  closed: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  accepted: "bg-success/12 text-success border-success/25",
  declined: "bg-destructive/12 text-destructive border-destructive/25",
  neutral: "bg-accent text-accent-foreground border-transparent",
};

export function StatusBadge({ status, className }) {
  const tone = toneMap[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
