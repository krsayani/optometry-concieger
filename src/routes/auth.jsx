import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { z } from "zod";
import { Mail, ArrowLeft, Lock, Eye, EyeOff, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).catch("login"),
  expired: z.boolean().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isSuperAdmin = roles?.some(r => r.role === "super_admin");

      if (isSuperAdmin) {
        throw redirect({ to: "/admin" });
      } else {
        throw redirect({ to: "/dashboard" });
      }
    }
  },
  head: () => ({
    meta: [{ title: "Sign in · Optometry Concierge" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { expired } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(!!expired);
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState("practice"); // 'practice' or 'doctor'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        toast.success("Welcome back!");

        if (roles?.some(r => r.role === "super_admin")) {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/dashboard" });
        }
    } catch (err) {
      let message = "Invalid email or password. Please try again.";
      if (err.message?.includes("Email not confirmed")) {
        message = "Please verify your email address before signing in.";
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Check your email", {
        description: "We sent you a link to reset your password.",
      });
      setForgot(false);
    } catch (err) {
      toast.error(
        "We couldn't send the reset email. Please check the address and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[520px]">
        {/* Brand Logo */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Optometry Concierge"
              className="h-12 w-12 rounded-xl object-cover shadow-soft ring-1 ring-border/60"
            />
            <span className="text-xl font-black uppercase tracking-tighter text-primary leading-tight text-left">
              Optometry
              <span className="block text-accent">Concierge</span>
            </span>
          </Link>
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border p-8 md:p-12 shadow-elevated">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-primary tracking-tight">
              {forgot ? "Reset Password" : "Welcome Back!"}
            </h1>
            <p className="mt-3 text-base font-medium text-muted-foreground">
              {forgot
                ? "Enter your email and we'll send you a reset link."
                : "Sign in to your account."}
            </p>
          </div>

          {forgot ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {expired && (
                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-medium">
                  Your verification or reset link has expired.
                </div>
              )}
              <form onSubmit={handleForgot} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="h-14 rounded-2xl border-border bg-white pl-12 focus:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-elevated"
                  disabled={busy}
                >
                  {busy ? "Sending..." : "Send reset link"}
                </Button>
                <button
                  type="button"
                  onClick={() => setForgot(false)}
                  className="w-full text-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to sign in
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Role Toggle */}
              <div className="flex p-1.5 bg-muted/20 rounded-2xl border border-border/50">
                <button
                  onClick={() => setActiveRole("practice")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 h-14 rounded-xl text-sm font-bold transition-all",
                    activeRole === "practice"
                      ? "bg-accent/20 text-primary shadow-sm border border-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-5 w-5" />
                  Practice
                </button>
                <button
                  onClick={() => setActiveRole("doctor")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 h-14 rounded-xl text-sm font-bold transition-all",
                    activeRole === "doctor"
                      ? "bg-accent/20 text-primary shadow-sm border border-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <User className="h-5 w-5" />
                  Doctor
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="h-14 rounded-2xl border-border bg-white pl-12 text-foreground focus:ring-primary/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-bold text-foreground">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      className="h-14 rounded-2xl border-border bg-white pl-12 pr-12 text-foreground focus:ring-primary/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="h-14 w-full rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-elevated transition-transform hover:scale-[1.01] active:scale-[0.98]"
                  disabled={busy}
                >
                  {busy ? "Authenticating..." : "Login"}
                </Button>
              </form>

              <div className="pt-6 border-t border-border/50">
                <p className="text-sm font-bold text-center text-muted-foreground mb-6">
                  Don't have an account?
                </p>
                <div className="grid grid-cols-2 gap-4">
                   <Button asChild variant="outline" className="h-14 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5">
                      <Link to="/for-ods" hash="intake">
                        Join as OD
                      </Link>
                   </Button>
                   <Button asChild variant="outline" className="h-14 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5">
                      <Link to="/for-practices" hash="intake">
                        Join Practice
                      </Link>
                   </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
