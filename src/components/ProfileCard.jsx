import { CalendarDays } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { formatDate } from "@/utils/format";

export function ProfileCard({ profile, role, email }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-col items-center text-center">
        <UserAvatar
          name={profile?.full_name}
          url={profile?.avatar_url}
          className="h-24 w-24 text-xl"
        />

        <h2 className="mt-4 text-xl font-bold text-foreground">
          {profile?.full_name || "Unnamed user"}
        </h2>

        {profile?.field && (
          <p className="mt-1 font-medium text-primary">
            {profile.field}
          </p>
        )}

        {email ? (
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        ) : null}
        {role ? (
          <span className="mt-3 inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold capitalize text-primary-foreground">
            {role}
          </span>
        ) : null}
      </div>

      <div className="mt-6 space-y-4 border-t border-border pt-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bio
          </p>
          <p className="mt-1 text-sm text-foreground">
            {profile?.bio || "No bio added yet."}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Joined {formatDate(profile?.created_at)}
        </div>
      </div>
    </div>
  );
}
