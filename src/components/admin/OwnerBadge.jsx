import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOutreachOwnerPhotos,
  OUTREACH_OWNER_PHOTO_FALLBACKS,
} from "@/services/admin";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const OWNER_PHOTO_QUERY_KEY = ["outreach-owner-photos"];

let ownerPhotoChannel = null;
let ownerPhotoRefCount = 0;

function retainOwnerPhotoChannel(queryClient) {
  ownerPhotoRefCount += 1;
  if (!ownerPhotoChannel) {
    ownerPhotoChannel = supabase
      .channel("outreach-owner-photos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: OWNER_PHOTO_QUERY_KEY });
        },
      )
      .subscribe();
  }

  return () => {
    ownerPhotoRefCount = Math.max(0, ownerPhotoRefCount - 1);
    if (ownerPhotoRefCount === 0 && ownerPhotoChannel) {
      supabase.removeChannel(ownerPhotoChannel);
      ownerPhotoChannel = null;
    }
  };
}

export function useOutreachOwnerPhotoMap() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: OWNER_PHOTO_QUERY_KEY,
    queryFn: listOutreachOwnerPhotos,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => retainOwnerPhotoChannel(queryClient), [queryClient]);

  return data || OUTREACH_OWNER_PHOTO_FALLBACKS;
}

export function useOwnerPhotoUrl(owner) {
  const map = useOutreachOwnerPhotoMap();
  return map?.[owner] || OUTREACH_OWNER_PHOTO_FALLBACKS[owner] || null;
}

/** @deprecated Prefer useOwnerPhotoUrl — sync helper uses fallbacks only. */
export function ownerPhotoUrl(owner) {
  return OUTREACH_OWNER_PHOTO_FALLBACKS[owner] || null;
}

/**
 * Shows Bilal / Karim with their profile photo (live) in outreach trackers.
 */
export function OwnerBadge({ owner, className, size = "sm", showName = true }) {
  const src = useOwnerPhotoUrl(owner);
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
  const src = useOwnerPhotoUrl(owner);
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
