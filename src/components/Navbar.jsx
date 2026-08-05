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
    <Link
      to="/"
      onClick={onClick}
      className="group flex items-center min-w-0 shrink transition-opacity hover:opacity-90"
    >
      <img
        src="/logo.png"
        alt="Optometry Concierge"
        className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-lg object-cover shadow-sm ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-[1.03] shrink-0"
      />
      <span className="ml-2 md:ml-2.5 font-serif text-[0.95rem] sm:text-[1.05rem] md:text-lg font-semibold tracking-tight text-primary leading-none truncate">
        Optometry
        <span className="block text-accent italic -mt-0.5">Concierge</span>
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
    { to: "/for-ods", hash: "intake", label: "The Optometrist", show: !isDoctor && !isSuperAdmin },
    { to: "/for-practices", hash: "intake", label: "The Practice", show: !isPractice && !isSuperAdmin },
    { to: "/contact", label: "Contact Us", show: true },
  ];

  const NavItems = ({ onClick }) => (
    <>
      {navLinks
        .filter((l) => l.show)
        .map((l) => (
          <Link
            key={l.to}
            to={l.to}
            {...(l.hash ? { hash: l.hash } : {})}
            onClick={onClick}
            className={cn(
              "group relative px-1 py-1 text-sm font-semibold text-primary/70 transition-colors hover:text-primary",
              pathname.startsWith(l.to) && "text-primary",
            )}
          >
            {l.label}
            <span
              className={cn(
                "absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-x-100",
                pathname.startsWith(l.to) && "scale-x-100",
              )}
            />
          </Link>
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

      <nav className="container-page flex h-14 md:h-16 items-center justify-between gap-3">
        <BrandLogo />

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-5">
            <NavItems />
          </div>

          <div className="flex items-center gap-3 ml-2">
            {loading ? (
              <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
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
                <Link
                  to="/profile"
                  className="flex items-center hover:opacity-80 transition-opacity ml-1"
                >
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
              <Button
                asChild
                className="h-10 rounded-full px-6 text-sm font-bold bg-primary text-white hover:bg-primary/90 border-none shadow-soft transition-transform hover:scale-[1.02]"
              >
                <Link to="/auth" search={{ mode: "login" }}>
                  Log In
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1.5 md:hidden">
          {!loading && !user ? (
            <Button
              asChild
              size="sm"
              className="h-9 rounded-full px-4 text-xs font-bold bg-primary text-white"
            >
              <Link to="/auth" search={{ mode: "login" }}>
                Log In
              </Link>
            </Button>
          ) : null}
          {!loading && user ? (
            <Link to="/profile" className="mr-0.5">
              <UserAvatar
                name={profile?.full_name}
                url={profile?.avatar_url}
                className="h-8 w-8 border border-border"
              />
            </Link>
          ) : null}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Open menu"
                className="h-10 w-10 shrink-0"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100vw-2rem,20rem)] flex flex-col p-0"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-border">
                  <BrandLogo onClick={() => setOpen(false)} />
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
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
                      <div className="leading-tight min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {profile?.full_name || "User"}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          {role === "super_admin" ? "Administrator" : role}
                        </p>
                      </div>
                    </Link>
                  ) : null}

                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
                      Navigation
                    </p>
                    {navLinks
                      .filter((l) => l.show)
                      .map((l) => (
                        <Link
                          key={l.to}
                          to={l.to}
                          {...(l.hash ? { hash: l.hash } : {})}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center rounded-xl px-3 py-3 text-base font-semibold transition-colors hover:bg-muted/60",
                            pathname.startsWith(l.to)
                              ? "text-primary bg-primary/5"
                              : "text-foreground/80",
                          )}
                        >
                          {l.label}
                        </Link>
                      ))}
                    {user && (
                      <Link
                        to={isSuperAdmin ? "/admin" : "/dashboard"}
                        onClick={() => setOpen(false)}
                        className="flex items-center rounded-xl px-3 py-3 text-base font-semibold text-foreground/80 hover:bg-muted/60 transition-colors"
                      >
                        {isSuperAdmin ? "Admin Panel" : "Dashboard"}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/20 mt-auto safe-pb">
                  <div className="flex flex-col gap-2">
                    {user ? (
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full h-11 rounded-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </Button>
                    ) : (
                      <>
                        <Button
                          asChild
                          className="w-full h-11 rounded-full font-bold"
                        >
                          <Link
                            to="/for-ods"
                            hash="intake"
                            onClick={() => setOpen(false)}
                          >
                            Get Free Career Help
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full h-11 rounded-full"
                        >
                          <Link
                            to="/auth"
                            search={{ mode: "login" }}
                            onClick={() => setOpen(false)}
                          >
                            Log In
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
