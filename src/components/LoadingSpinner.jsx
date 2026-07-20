import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, size = 24, label }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <Loader2
        className="animate-spin text-primary"
        style={{ width: size, height: size }}
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size={32} label={label} />
    </div>
  );
}
