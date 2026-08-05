import { useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router";
import { z } from "zod";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearPendingIntake,
  readPendingIntake,
} from "@/lib/account-invite";
import { isExistingAccountError } from "@/lib/auth-errors";

const searchSchema = z.object({
  email: z.string().email().optional().catch(undefined),
  name: z.string().optional().catch(undefined),
  type: z.enum(["od", "practice"]).optional().catch("od"),
});

export const Route = createFileRoute("/create-account")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [{ title: "Create account · Optometry Concierge" }],
  }),
  component: CreateAccountPage,
});

function CreateAccountPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const displayName = useMemo(
    () => search.name || "there",
    [search.name],
  );
  const accountType = search.type === "practice" ? "practice" : "od";

  const finishPendingIntake = async (userId) => {
    const pending = readPendingIntake();
    if (!pending?.data || !userId) return;

    const type = pending.type || accountType;
    const data = pending.data;

    if (type === "practice") {
      await supabase.rpc("ensure_user_role", {
        target_user_id: userId,
        target_role: "employer",
      });

      const { data: existing } = await supabase
        .from("employer_intake_responses")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("employer_intake_responses").insert({
          user_id: userId,
          contact_name: data.contactName,
          practice_name: data.practiceName,
          email: data.email,
          phone: data.phone,
          location: data.location,
          practice_type: data.practiceType,
          num_ods: data.numODs,
          position_type: data.positionType,
          salary_range: data.salaryRange,
          production_bonus: data.productionBonus,
          sign_on_bonus: data.signOnBonus,
          relocation_assistance: data.relocationAssistance,
          benefits: data.benefits,
          schedule: data.schedule,
          patient_volume: data.patientVolume,
          primary_care_type: data.primaryCareType,
          new_grad_friendly: data.newGradFriendly,
          mentorship_available: data.mentorshipAvailable,
          equipment_tech: data.equipmentTech,
          ownership_track: data.ownershipTrack,
          urgency: data.urgency,
          anything_else: data.anythingElse,
          consent: data.consent ?? true,
        });
      }
    } else {
      await supabase.rpc("ensure_user_role", {
        target_user_id: userId,
        target_role: "od",
      });

      const { data: existing } = await supabase
        .from("od_intake_responses")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("od_intake_responses").insert({
          user_id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          school: data.school,
          other_school: data.otherSchool,
          grad_year: data.gradYear,
          license_status: data.licenseStatus,
          license_states: data.licenseStates,
          years_in_practice: data.yearsInPractice,
          completed_residency: data.completedResidency,
          residency_type: data.residencyType,
          preferred_states: data.preferredStates,
          preferred_cities: data.preferredCities,
          open_to_relocation: data.openToRelocation,
          practice_setting: data.practiceSetting,
          practice_type_preference: data.practiceTypePreference,
          clinical_interests: data.clinicalInterests,
          salary_expectation: data.salaryExpectation,
          target_start_date: data.targetStartDate,
          job_priorities: data.jobPriorities,
          interest_in_ownership: data.interestInOwnership,
          anything_else: data.anythingElse,
          position_type: data.positionType,
          consent: data.consent ?? true,
          resume_url: data.resumeUrl || null,
        });
      }
    }

    clearPendingIntake();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const fullName =
        search.name ||
        readPendingIntake()?.data?.firstName ||
        readPendingIntake()?.data?.contactName ||
        "Member";
      const trimmedEmail = email.trim().toLowerCase();

      // Prefer server registration so Supabase does not send its default
      // "Confirm your email" from noreply@mail.app.supabase.io.
      let userId = null;
      let hasSession = false;

      const registerRes = await fetch("/api/register-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          name: fullName,
          type: accountType,
          origin: window.location.origin,
        }),
      }).catch(() => null);

      const registerPayload = registerRes
        ? await registerRes.json().catch(() => ({}))
        : { useClientSignup: true };

      if (registerRes?.ok && registerPayload?.userId) {
        userId = registerPayload.userId;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
        hasSession = true;
      } else if (
        registerPayload?.code === "USER_EXISTS" ||
        registerRes?.status === 409
      ) {
        toast.error("An account already exists for this email.", {
          description: "Sign in, or use Forgot password on the sign-in page.",
        });
        navigate({
          to: "/auth",
          search: { mode: "login" },
        });
        return;
      } else if (registerPayload?.useClientSignup || !registerRes) {
        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/dashboard`,
              data: {
                full_name: fullName,
                role: accountType === "practice" ? "employer" : "od",
              },
            },
          });

        if (authError) {
          if (isExistingAccountError(authError)) {
            toast.error("An account already exists for this email.", {
              description:
                "Sign in, or use Forgot password on the sign-in page.",
            });
            navigate({
              to: "/auth",
              search: { mode: "login" },
            });
            return;
          }
          throw authError;
        }

        userId = authData.user?.id || null;
        hasSession = Boolean(authData.session);
      } else {
        throw new Error(
          registerPayload?.error || "We couldn't create your account.",
        );
      }

      if (userId) {
        try {
          await finishPendingIntake(userId);
        } catch (intakeError) {
          console.error("Pending intake save failed:", intakeError);
        }
      }

      toast.success("Account created!", {
        description: hasSession
          ? "You can now access your dashboard."
          : "Check your email to confirm, then sign in.",
      });

      navigate({
        to: hasSession ? "/dashboard" : "/auth",
        ...(hasSession ? {} : { search: { mode: "login" } }),
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error?.message || "We couldn't create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Optometry Concierge"
              className="h-12 w-12 rounded-xl object-cover shadow-soft ring-1 ring-border/60"
            />
            <span className="font-serif text-left text-lg font-semibold tracking-tight text-primary leading-[1.15] overflow-visible">
              Optometry
              <span className="block text-accent italic leading-[1.2] pb-0.5">Concierge</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
          <Link
            to="/auth"
            search={{ mode: "login" }}
            className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Hi {displayName} — set a password to access your{" "}
            {accountType === "practice" ? "practice" : "career"} dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-full h-11 font-bold"
            >
              <Lock className="mr-2 h-4 w-4" />
              {busy ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
