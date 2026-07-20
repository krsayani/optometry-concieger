import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  CalendarDays,
  DollarSign,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Send,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { getJob } from "@/services/jobs";
import { applyToJob, getMyApplicationForJob } from "@/services/applications";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate, timeAgo } from "@/utils/format";

export const Route = createFileRoute("/jobs/$jobId")({
  component: JobDetails,
});

function JobDetails() {
  const { jobId } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });

  const { data: myApplication } = useQuery({
    queryKey: ["my-application", jobId, user?.id],
    queryFn: () => getMyApplicationForJob(jobId, user.id),
    enabled: !!user && role === "provider",
  });

  const applyMutation = useMutation({
    mutationFn: () => applyToJob(jobId, user.id),
    onSuccess: () => {
      toast.success("Application sent!", {
        description: "The client will review your application.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-application", jobId] });
    },
    onError: (err) => {
      toast.error("Couldn't apply", {
        description:
          err instanceof Error && err.message.includes("duplicate")
            ? "You've already applied to this job."
            : err instanceof Error
              ? err.message
              : "Please try again.",
      });
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <PageLoader label="Loading job…" />
      </SiteLayout>
    );
  }

  if (!job) {
    return (
      <SiteLayout>
        <div className="container-page py-16">
          <EmptyState
            icon={Briefcase}
            title="Job not found"
            description="This job may have been removed or closed."
            action={
              <Button asChild>
                <Link to="/jobs">Browse jobs</Link>
              </Button>
            }
          />
        </div>
      </SiteLayout>
    );
  }

  const isOwner = user?.id === job.client_id;
  const isClosed = job.status === "Closed";
  const alreadyApplied = !!myApplication;

  const renderApplyArea = () => {
    if (!user) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in as a provider to apply.
          </p>
          <Button asChild className="w-full" size="lg">
            <Link to="/auth" search={{ mode: "login" }}>
              Sign in to apply
            </Link>
          </Button>
        </div>
      );
    }
    if (isOwner) {
      return (
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link to="/jobs/$jobId/applicants" params={{ jobId }}>
              View applicants
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/jobs/$jobId/edit" params={{ jobId }}>
              <Pencil className="h-4 w-4" /> Edit job
            </Link>
          </Button>
        </div>
      );
    }
    if (role !== "provider") {
      return (
        <p className="text-sm text-muted-foreground">
          You're signed in as a client. Only providers can apply to jobs.
        </p>
      );
    }
    if (alreadyApplied) {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-accent p-4 text-sm font-medium text-accent-foreground">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          You've applied — status: {myApplication?.status}
        </div>
      );
    }
    if (isClosed) {
      return (
        <p className="text-sm text-muted-foreground">
          This job is closed for applications.
        </p>
      );
    }
    return (
      <Button
        className="w-full"
        size="lg"
        disabled={applyMutation.isPending}
        onClick={() => applyMutation.mutate()}
      >
        <Send className="h-4 w-4" />
        {applyMutation.isPending ? "Applying…" : "Apply in one click"}
      </Button>
    );
  };

  return (
    <SiteLayout>
      <div className="container-page py-8">
        <button
          onClick={() => navigate({ to: "/jobs" })}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                {job.category}
              </span>
              <StatusBadge status={job.status} />
              <span className="text-xs text-muted-foreground">
                Posted {timeAgo(job.created_at)}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {job.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {job.location || "Flexible location"}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDate(job.date)}
              </span>
              <span className="inline-flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {formatCurrency(job.rate)}
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-foreground">
                Job description
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {job.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rate
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {formatCurrency(job.rate)}
              </p>
              <div className="mt-5">{renderApplyArea()}</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                About the client
              </p>
              <div className="mt-3 flex items-center gap-3">
                <UserAvatar
                  name={job.client?.full_name}
                  url={job.client?.avatar_url}
                  className="h-12 w-12"
                />

                <div>
                  <p className="font-semibold text-foreground">
                    {job.client?.full_name || "Client"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(job.client?.created_at)}
                  </p>
                </div>
              </div>
              {job.client?.bio ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {job.client.bio}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
