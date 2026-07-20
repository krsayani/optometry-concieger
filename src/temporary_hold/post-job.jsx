import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/layouts/SiteLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { JobForm } from "@/components/JobForm";
import { useAuth } from "@/context/AuthContext";
import { createJob } from "@/services/jobs";

export const Route = createFileRoute("/_authenticated/post-job")({
  head: () => ({ meta: [{ title: "Post a job · Peerly" }] }),
  component: () => (
    <SiteLayout>
      <RoleGuard role="client">
        <PostJob />
      </RoleGuard>
    </SiteLayout>
  ),
});

function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (values) => createJob(user.id, values),
    onSuccess: (job) => {
      toast.success("Job posted!", { description: "Providers can now apply." });
      navigate({ to: "/jobs/$jobId", params: { jobId: job.id } });
    },
    onError: (err) =>
      toast.error("Couldn't post job", {
        description: err instanceof Error ? err.message : undefined,
      }),
  });

  return (
    <div className="container-page max-w-2xl py-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Post a new job
      </h1>
      <p className="mt-1 text-muted-foreground">
        Fill in the details below to start receiving applications.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <JobForm
          submitLabel="Post job"
          onSubmit={mutation.mutate}
          busy={mutation.isPending}
        />
      </div>
    </div>
  );
}
