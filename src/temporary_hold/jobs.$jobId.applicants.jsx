import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/layouts/SiteLayout";
import { RoleGuard } from "@/components/RoleGuard";
import { ApplicantCard } from "@/components/ApplicantCard";
import { ProfileCard } from "@/components/ProfileCard";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { getJob } from "@/services/jobs";
import {
  listJobApplications,
  updateApplicationStatus,
} from "@/services/applications";

export const Route = createFileRoute("/_authenticated/jobs/$jobId/applicants")({
  head: () => ({ meta: [{ title: "Applicants · Peerly" }] }),
  component: () => (
    <SiteLayout>
      <RoleGuard role="client">
        <Applicants />
      </RoleGuard>
    </SiteLayout>
  ),
});

function Applicants() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState(null);

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["job-applications", jobId],
    queryFn: () => listJobApplications(jobId),
    enabled: !!job && job.client_id === user?.id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateApplicationStatus(id, status),
    onSuccess: (_data, variables) => {
      toast.success(`Application ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
    },
    onError: () => toast.error("Couldn't update application"),
  });

  if (jobLoading) return <PageLoader />;

  if (!job || job.client_id !== user?.id) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Briefcase}
          title="Job not available"
          description="This job doesn't exist or you don't have permission to view its applicants."
          action={
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const apps = applications ?? [];

  return (
    <div className="container-page py-10">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Applicants for</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {job.title}
          </h1>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {apps.length} {apps.length === 1 ? "applicant" : "applicants"}
      </p>

      {appsLoading ? (
        <PageLoader label="Loading applicants…" />
      ) : apps.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No applicants yet"
            description="Share your job or wait for providers to apply. They'll show up here."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {apps.map((app) => (
            <ApplicantCard
              key={app.id}
              application={app}
              busy={statusMutation.isPending}
              onAccept={(id) =>
                statusMutation.mutate({ id, status: "Accepted" })
              }
              onDecline={(id) =>
                statusMutation.mutate({ id, status: "Declined" })
              }
              onViewProfile={setSelectedProvider}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
        <DialogContent className="max-w-md p-0 overflow-y-auto max-h-[90vh] border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Provider Profile</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4 pb-6">
              <ProfileCard profile={selectedProvider} />

              {selectedProvider.cv_url && (
                <div className="px-6">
                  <Button asChild className="w-full" variant="outline">
                    <a href={selectedProvider.cv_url} target="_blank" rel="noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      View Full CV (PDF)
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
