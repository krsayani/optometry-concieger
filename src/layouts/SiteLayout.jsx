import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export function SiteLayout({ children }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  if (profile?.status === "Suspended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4 animate-pulse">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Account Suspended</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Your account has been suspended by a platform administrator due to a violation of our terms or policies.
          You no longer have access to this marketplace.
        </p>
        <div className="mt-8">
          <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
