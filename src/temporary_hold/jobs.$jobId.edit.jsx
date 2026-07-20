import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/layouts/SiteLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { JobForm } from "@/components/JobForm";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getJob, updateJob } from "@/services/jobs";

export const Route = createFileRoute("/_authenticated/jobs/$jobId/edit")({
  head: () => ({ meta: [{ title: "Edit job · Peerly" }] }),
  component: () => (
    <SiteLayout>
      <RoleGuard role="client">
        <EditJob />
      </RoleGuard>
    </SiteLayout>
  ),
});

function EditJob() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });

  const mutation = useMutation({
    mutationFn: (values) => updateJob(jobId, values),
    onSuccess: () => {
      toast.success("Job updated");
      navigate({ to: "/dashboard" });
    },
    onError: (err) =>
      toast.error("Couldn't update job", {
        description: err instanceof Error ? err.message : undefined,
      }),
  });

  if (isLoading) return <PageLoader />;

  if (!job || job.client_id !== user?.id) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Briefcase}
          title="Job not available"
          description="This job doesn't exist or you don't have permission to edit it."
          action={
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Edit job
      </h1>
      <p className="mt-1 text-muted-foreground">
        Update the details for "{job.title}".
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <JobForm
          initial={job}
          submitLabel="Save changes"
          onSubmit={mutation.mutate}
          busy={mutation.isPending}
        />
      </div>
    </div>
  );
}
