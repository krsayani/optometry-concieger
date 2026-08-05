import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function BrandLogo({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center shrink-0">
      <img
        src="/logo.png"
        alt="Optometry Concierge"
        className="h-10 w-10 md:h-11 md:w-11 rounded-lg object-cover shadow-sm ring-1 ring-border/60"
      />
      <span className="ml-2.5 font-display text-sm md:text-base font-extrabold tracking-tighter uppercase text-primary leading-tight">
        Optometry
        <span className="block text-accent -mt-0.5">Concierge</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { user, profile, roles, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  const isSuperAdmin = roles.includes("super_admin");
  const isDoctor = roles.includes("od");
  const isPractice = roles.includes("employer");

  const navLinks = [
    { to: "/for-ods", label: "The Optometrist", show: !isDoctor && !isSuperAdmin },
    { to: "/for-practices", label: "The Practice", show: !isPractice && !isSuperAdmin },
  ];

  const NavItems = ({ onClick }) => (
    <>
      {navLinks
        .filter((l) => l.show)
        .map((l) => (
          <Button
            key={l.to}
            asChild
            variant="outline"
            className={cn(
              "h-9 rounded-xl px-5 text-sm font-bold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-all",
              pathname.startsWith(l.to) && "bg-primary/5 border-primary/40",
            )}
          >
            <Link to={l.to} onClick={onClick}>
              {l.label}
            </Link>
          </Button>
        ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      {/* Utility Top Bar */}
      <div className="hidden border-b border-border/40 bg-muted/40 py-1.5 md:block">
        <div className="container-page flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <div className="flex items-center gap-6">
            <a href="mailto:Admin@optometryconcierge.com" className="hover:text-primary transition-colors flex items-center gap-1.5">
              Email: Admin@optometryconcierge.com
            </a>
          </div>
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5 text-primary/80">
               Doctor owned and led
             </span>
             <span className="h-3.5 w-px bg-border" />
             <span className="flex items-center gap-1.5 text-primary/80">
               <ShieldCheck className="h-3 w-3 text-accent" /> 100% Confidential Service
             </span>
          </div>
        </div>
      </div>

      <nav className="container-page flex h-14 md:h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <BrandLogo />
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-3">
            <NavItems />
          </div>

          <div className="flex items-center gap-3 ml-2">
            {loading ? (
              <div className="h-11 w-24 animate-pulse rounded-xl bg-muted" />
            ) : user ? (
            <>
              {isSuperAdmin ? (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/admin">Admin</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
              <Link to="/profile" className="flex items-center hover:opacity-80 transition-opacity ml-2">
                <UserAvatar
                  name={profile?.full_name}
                  url={profile?.avatar_url}
                  className="h-9 w-9 border border-border"
                />
              </Link>
              <Button size="sm" variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="h-10 rounded-xl px-6 text-sm font-black bg-primary text-white hover:bg-primary/90 border-none shadow-soft flex items-center gap-2">
                <Link to="/auth" search={{ mode: "login" }}>
                  <UserIcon className="h-4 w-4 text-accent" />
                  Log In
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

        {/* Mobile */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border">
                  <BrandLogo onClick={() => setOpen(false)} />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {user ? (
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft hover:bg-muted/50 transition-colors"
                    >
                      <UserAvatar
                        name={profile?.full_name}
                        url={profile?.avatar_url}
                        className="h-10 w-10 border border-border"
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-foreground">
                          {profile?.full_name || "User"}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          {role === 'super_admin' ? 'Administrator' : role}
                        </p>
                      </div>
                    </Link>
                  ) : null}

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Navigation</p>
                      {navLinks
                        .filter((l) => l.show)
                        .map((l) => (
                          <Link
                            key={l.to}
                            to={l.to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-1 text-base font-semibold transition-colors hover:text-primary",
                              pathname.startsWith(l.to) ? "text-primary" : "text-muted-foreground",
                            )}
                          >
                            {l.label}
                          </Link>
                        ))}
                      {user && (
                        <Link
                          to={isSuperAdmin ? "/admin" : "/dashboard"}
                          onClick={() => setOpen(false)}
                          className="flex items-center px-1 text-base font-semibold text-muted-foreground hover:text-primary transition-colors"
                        >
                          {isSuperAdmin ? "Admin Panel" : "Dashboard"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border bg-muted/20 mt-auto">
                  <div className="flex flex-col gap-2">
                    {user ? (
                      <Button variant="outline" onClick={handleSignOut} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </Button>
                    ) : (
                      <>
                        <Button asChild variant="outline" className="w-full">
                          <Link
                            to="/auth"
                            search={{ mode: "login" }}
                            onClick={() => setOpen(false)}
                          >
                            Login
                          </Link>
                        </Button>
                        <Button asChild className="w-full">
                          <Link
                            to="/get-started"
                            onClick={() => setOpen(false)}
                          >
                            Get started
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
