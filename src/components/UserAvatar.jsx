import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, url, className }) {
  return (
    <Avatar className={cn("border border-border", className)}>
      {url ? <AvatarImage src={url} alt={name ?? "User"} /> : null}
      <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
