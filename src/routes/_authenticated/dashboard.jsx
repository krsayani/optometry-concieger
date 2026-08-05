import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Building2,
  Lock,
  Clock,
  CheckCircle2,
  FileText,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  GraduationCap,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/layouts/SiteLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/utils/format";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard · Optometry Concierge" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && roles.includes("super_admin")) {
      navigate({ to: "/admin", replace: true });
    }
  }, [loading, roles, navigate]);

  if (loading) {
    return (
      <SiteLayout>
        <PageLoader />
      </SiteLayout>
    );
  }

  if (!user || roles.includes("super_admin")) return null;

  const isOD = roles.includes("od");
  const isPractice = roles.includes("employer");

  if (!isOD && !isPractice) {
    return (
      <SiteLayout>
        <div className="container-page py-10 md:py-20">
          <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-border bg-card p-8 md:p-12 text-center shadow-soft">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 text-primary">
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="mb-4 text-2xl md:text-3xl font-bold text-foreground">
              Finish setting up your account
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              Your login works, but we still need a career or practice profile
              before your dashboard can load matching updates.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild className="h-14 w-full rounded-full px-10 text-base font-bold sm:w-auto">
                <Link to="/for-ods" hash="intake">
                  Create OD Profile <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 w-full rounded-full px-8 sm:w-auto"
              >
                <Link to="/for-practices" hash="intake">
                  Create Practice Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {isOD && isPractice ? (
        <div className="py-10">
          <div className="container-page mb-6">
            <Tabs defaultValue="od" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-12 p-1 bg-muted rounded-full">
                <TabsTrigger value="od" className="rounded-full font-bold">OD View</TabsTrigger>
                <TabsTrigger value="practice" className="rounded-full font-bold">Practice View</TabsTrigger>
              </TabsList>
              <TabsContent value="od" className="mt-8">
                <ODDashboard isNested />
              </TabsContent>
              <TabsContent value="practice" className="mt-8">
                <PracticeDashboard isNested />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : isPractice ? (
        <PracticeDashboard />
      ) : (
        <ODDashboard />
      )}
    </SiteLayout>
  );
}

/* ----------------------------- OD Dashboard ----------------------------- */

function ODDashboard({ isNested }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: intake, isLoading } = useQuery({
    queryKey: ["my-od-intake", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("od_intake_responses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Enable Realtime sync
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`my-od-intake-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "od_intake_responses",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-od-intake", user.id] });
          toast.info("Your career profile has been updated by the concierge team.", {
            description: "Check your dashboard for the latest status and updates.",
            icon: <Sparkles className="h-4 w-4 text-primary" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  if (isLoading) return <PageLoader />;

  if (!intake) {
    return (
      <div className="container-page py-10 md:py-20">
        <div className="max-w-2xl mx-auto rounded-[2.5rem] border-2 border-dashed border-destructive/20 bg-destructive/5 p-8 md:p-12 text-center shadow-soft">
          <div className="h-20 w-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Professional Profile Missing</h2>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            It appears your professional career profile is missing. This might be because you haven't filled out the intake form yet, or it was removed by our team.
            To continue receiving concierge matching services, please complete your professional profile.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="rounded-full px-10 h-14 text-base font-bold shadow-soft w-full sm:w-auto">
              <Link to="/profile">
                Complete Career Profile <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full px-8 h-14 w-full sm:w-auto">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(isNested ? "" : "container-page py-10 md:py-16")}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome, Doctor {profile?.full_name?.split(" ").pop() || "Doctor"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your career profile is currently being reviewed by our concierge team.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Profile Status: {intake?.status || 'Under Review'}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Status Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Concierge Roadmap
            </h2>

            <div className="space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-muted" />

                <TimelineStep
                    icon={CheckCircle2}
                    title="Profile Created"
                    desc="We've received your career preferences and professional background."
                    completed={!!intake}
                    date={intake ? formatDate(intake.created_at) : ""}
                />
                <TimelineStep
                    icon={Clock}
                    title="Concierge Review"
                    desc="Our team is building your verified profile and identifying matches."
                    active={intake?.status === 'Concierge Review' || intake?.status === 'Profile Created'}
                    completed={['Verified', 'Consent Requested', 'Introduced', 'Hired'].includes(intake?.status)}
                    date={['Verified', 'Consent Requested', 'Introduced', 'Hired', 'Concierge Review'].includes(intake?.status) ? formatDate(intake?.status_updated_at) : ""}
                />
                <TimelineStep
                    icon={Lock}
                    title="Consent-Based Introductions"
                    desc="We'll call you when we find a match that fits your goals perfectly."
                    active={['Consent Requested', 'Introduced'].includes(intake?.status)}
                    completed={intake?.status === 'Hired'}
                    date={['Consent Requested', 'Introduced', 'Hired'].includes(intake?.status) ? formatDate(intake?.status_updated_at) : ""}
                />
            </div>
          </div>

          {/* Concierge Notes */}
          {intake?.admin_notes && (
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                    <MessageSquare className="h-5 w-5" />
                    Concierge Updates
                </h3>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap italic">
                    "{intake.admin_notes}"
                </div>
                <p className="text-[10px] uppercase font-bold text-primary/60 mt-4 tracking-widest">
                    Last updated by your personal concierge on {formatDate(intake.updated_at)}
                </p>
            </div>
          )}

          {/* Data Summary */}
          {intake && (
            <div className="rounded-3xl border border-border bg-muted/30 p-8">
                <h3 className="font-bold text-lg mb-6">Profile Summary</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-primary shrink-0">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Education</p>
                            <p className="text-sm font-medium">{intake.school}</p>
                            <p className="text-xs text-muted-foreground">Class of {intake.grad_year}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-primary shrink-0">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Location Preferences</p>
                            <p className="text-sm font-medium">{intake.preferred_states?.join(", ")}</p>
                            <p className="text-xs text-muted-foreground">{intake.open_to_relocation === 'Yes' ? 'Open to relocation' : 'Staying local'}</p>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
           <div className="rounded-3xl bg-primary text-primary-foreground p-8 shadow-elevated">
              <h3 className="text-xl font-bold mb-4 italic">"Confidentiality is our primary value proposition."</h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed mb-6">
                Your profile is never visible to practices. We only make introductions after we've talked to you about a specific opportunity and you've said "Yes".
              </p>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                 <Lock className="h-4 w-4" /> 100% Private
              </div>
           </div>

           <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Need to update something?</h4>
              <p className="text-sm text-muted-foreground mb-6">If your career goals have changed, please contact your concierge directly.</p>
              <div className="flex flex-col gap-3">
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link to="/profile" search={{ tab: 'details', subtab: 'od' }}>View Career Profile</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link to="/contact">Message Support</Link>
                  </Button>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}

/* ----------------------------- Practice Dashboard ----------------------------- */

function PracticeDashboard({ isNested }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-practice-intake", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employer_intake_responses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const request = requests?.find(r => r.id === selectedId) || requests?.[0];

  useEffect(() => {
    if (requests?.length > 0 && !selectedId) {
        setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  // Enable Realtime sync
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`my-practice-intake-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employer_intake_responses",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-practice-intake", user.id] });
          toast.info("Your practice hiring request has been updated.", {
            description: "View your roadmap for the latest candidate matching status.",
            icon: <Sparkles className="h-4 w-4 text-success" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  if (isLoading) return <PageLoader />;

  if (!requests || requests.length === 0) {
    return (
      <div className="container-page py-10 md:py-20">
        <div className="max-w-2xl mx-auto rounded-[2.5rem] border-2 border-dashed border-destructive/20 bg-destructive/5 p-8 md:p-12 text-center shadow-soft">
          <div className="h-20 w-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Practice Profile Missing</h2>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Your practice's hiring profile is missing. This might be because you haven't filled out the form yet, or it was removed by our team.
            To resume your search for top optometrist talent, please complete your practice details.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="rounded-full px-10 h-14 text-base font-bold shadow-soft w-full sm:w-auto">
              <Link to="/for-practices" hash="intake">
                Complete Practice Profile <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full px-8 h-14 w-full sm:w-auto">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(isNested ? "" : "container-page py-10 md:py-16")}>
       {requests.length > 1 && (
         <div className="mb-8 flex flex-wrap gap-2">
            {requests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border",
                  selectedId === req.id
                    ? "bg-primary border-primary text-primary-foreground shadow-soft"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {req.practice_name} ({req.location?.split(',')[0] || 'Remote'})
              </button>
            ))}
         </div>
       )}

       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {request?.practice_name || "Practice Dashboard"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            We are actively scanning our Doctor network for your {request?.position_type || "OD"} role in {request?.location}.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-success/5 border border-success/10">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-bold text-success uppercase tracking-widest">Status: {request?.status || 'Active Search'}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Hiring Roadmap
            </h2>

            <div className="space-y-8 relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                <TimelineStep
                    icon={CheckCircle2}
                    title="Request Received"
                    desc="We've processed your practice requirements and offer details."
                    completed={!!request}
                    date={request ? formatDate(request.created_at) : ""}
                />
                <TimelineStep
                    icon={Clock}
                    title="Doctor Matching"
                    desc="Identifying pre-vetted ODs who match your culture and requirements."
                    active={request?.status === 'Doctor Matching' || request?.status === 'Request Received'}
                    completed={['Introductions', 'Hiring Process', 'Closed'].includes(request?.status)}
                    date={['Doctor Matching', 'Introductions', 'Hiring Process', 'Closed'].includes(request?.status) ? formatDate(request?.status_updated_at) : ""}
                />
                <TimelineStep
                    icon={Lock}
                    title="Interview-Ready Introductions"
                    desc="We'll present candidate summaries. You only see names after the OD consents."
                    active={request?.status === 'Introductions'}
                    completed={['Hiring Process', 'Closed'].includes(request?.status)}
                    date={['Introductions', 'Hiring Process', 'Closed'].includes(request?.status) ? formatDate(request?.status_updated_at) : ""}
                />
            </div>
          </div>

          {/* Concierge Notes */}
          {request?.admin_notes && (
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary">
                    <MessageSquare className="h-5 w-5" />
                    Concierge Matching Updates
                </h3>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap italic">
                    "{request.admin_notes}"
                </div>
                <p className="text-[10px] uppercase font-bold text-primary/60 mt-4 tracking-widest">
                    Last updated by your practice concierge on {formatDate(request.updated_at)}
                </p>
            </div>
          )}

          {/* Hiring Overview */}
          <div className="grid sm:grid-cols-2 gap-4">
             <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Target Salary</p>
                <p className="text-xl font-bold text-foreground">{request?.salary_range || "N/A"}</p>
             </div>
             <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Urgency</p>
                <p className="text-xl font-bold text-foreground">{request?.urgency || "N/A"}</p>
             </div>
          </div>
        </div>

        <aside className="space-y-6">
            <div className="rounded-3xl bg-muted p-8 border border-border">
                <h4 className="font-bold mb-4">Concierge Model</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    We don't use public job boards. Our team personally reaches out to ODs in our network who fit your criteria.
                    Expect a higher caliber of candidate, ready to interview.
                </p>
                <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">No Upfront Cost</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Fees apply only when you successfully hire.</p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button asChild className="w-full rounded-full py-6 shadow-soft">
                    <Link to="/for-practices" hash="intake">
                        Submit New Hiring Request <Sparkles className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-full py-6">
                    <Link to="/profile" search={{ tab: 'details', subtab: 'practice' }}>
                        View Practice Profile <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </aside>
      </div>
    </div>
  );
}

/* ----------------------------- Helpers ----------------------------- */

function TimelineStep({ icon: Icon, title, desc, completed, active, date }) {
    return (
        <div className="relative pl-12">
            <div className={`absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center border-2 z-10 transition-colors ${
                completed ? 'bg-primary border-primary text-primary-foreground' :
                active ? 'bg-background border-primary text-primary' :
                'bg-background border-muted text-muted-foreground'
            }`}>
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <div className="flex items-center justify-between gap-4">
                    <h4 className={`font-bold ${active ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {title}
                    </h4>
                    {date && <span className="text-[10px] font-bold text-muted-foreground uppercase">{date}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
                    {desc}
                </p>
            </div>
        </div>
    );
}
