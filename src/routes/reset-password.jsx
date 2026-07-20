import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Briefcase, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set Password · Optometry Concierge" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event in reset-password:", event);
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || session) {
        setReady(true);
      }
    });

    checkSession();

    // Fallback: If after 3 seconds we still aren't ready, try one more session check
    // This handles slow hash processing on some devices
    const timer = setTimeout(checkSession, 3000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password set successfully!", {
        description: "Please sign in with your new password to continue."
      });

      // Sign out to ensure the user has to login with the new password
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { mode: "login" } });
    } catch (err) {
      toast.error("We couldn't set your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="w-full max-w-md">
        <Link
          to="/auth"
          search={{ mode: "login" }}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Briefcase className="h-5 w-5" />
            </span>
            <span className="text-xl font-black text-foreground uppercase tracking-tight">
              Optometry Concierge
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Complete your setup
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please set a password for your account to continue.
          </p>
          {ready ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Create your password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Minimum 6 characters</p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl shadow-soft font-bold"
                disabled={busy}
              >
                {busy ? "Saving password..." : "Complete Setup"}
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-6 animate-in fade-in duration-700">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm leading-relaxed">
                    <p className="font-bold mb-1">Session Expired or Already Used</p>
                    Verification links are one-time use. If you have already set your password, please proceed to login.
                </div>

                <div className="space-y-3">
                    <Button asChild className="w-full rounded-xl h-12 font-bold shadow-soft">
                        <Link to="/auth" search={{ mode: 'login' }}>Go to Login</Link>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                        Need a new link? <Link to="/auth" search={{ mode: 'recovery' }} className="text-primary hover:underline font-bold">Reset Password</Link>
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
