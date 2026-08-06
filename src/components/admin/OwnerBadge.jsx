import { cn } from "@/lib/utils";

const OWNER_PHOTOS = {
  Bilal: "/images/owners/bilal.jpg",
  Karim: "/images/owners/karim.jpg",
};

export function ownerPhotoUrl(owner) {
  return OWNER_PHOTOS[owner] || null;
}

/**
 * Shows Bilal / Karim with their photo in outreach trackers.
 */
export function OwnerBadge({ owner, className, size = "sm", showName = true }) {
  const src = ownerPhotoUrl(owner);
  const px = size === "md" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-6 w-6";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground",
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={owner || ""}
          className={cn(
            px,
            "shrink-0 rounded-full object-cover ring-1 ring-border",
          )}
        />
      ) : null}
      {showName ? <span className="pr-1.5">{owner}</span> : null}
    </span>
  );
}

export function OwnerSelectLabel({ owner }) {
  const src = ownerPhotoUrl(owner);
  return (
    <span className="inline-flex items-center gap-2">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
        />
      ) : null}
      <span>{owner}</span>
    </span>
  );
}
