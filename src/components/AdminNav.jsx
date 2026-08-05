import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UserCheck,
  Building2,
  Users,
  GitMerge,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/od-intakes", label: "Optometrists", icon: UserCheck },
  { to: "/admin/practice-intakes", label: "Practices", icon: Building2 },
  { to: "/admin/matches", label: "Matches", icon: GitMerge },
  { to: "/admin/users", label: "Users", icon: Users },
];

export function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="border-b border-border/80 bg-muted/30">
      <div className="container-page">
        <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {links.map(({ to, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname.startsWith(to);

            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-background hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
