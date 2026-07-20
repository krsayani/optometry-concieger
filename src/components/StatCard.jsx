import { cn } from "@/lib/utils";

export function StatCard({ icon: Icon, label, value, hint, accent = false }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            accent
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
