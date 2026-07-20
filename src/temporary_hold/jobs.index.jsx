import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, SearchX } from "lucide-react";
import { SiteLayout } from "@/layouts/SiteLayout";
import { SearchBar } from "@/components/SearchBar";
import { JobCard } from "@/components/JobCard";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/LoadingSpinner";
import { listJobs } from "@/services/jobs";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Browse jobs · Peerly" },
      {
        name: "description",
        content:
          "Explore open jobs from clients across every category on Peerly.",
      },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => listJobs(),
  });

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const term = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesCategory = category === "All" || job.category === category;
      const matchesSearch =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [jobs, search, category]);

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card/40">
        <div className="container-page py-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Browse jobs
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find your next opportunity from clients across every category.
          </p>
        </div>
      </div>

      <div className="container-page py-8">
        <SearchBar
          search={search}
          category={category}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
        />

        {isLoading ? (
          <PageLoader label="Loading jobs…" />
        ) : filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={jobs && jobs.length > 0 ? SearchX : Briefcase}
              title={
                jobs && jobs.length > 0
                  ? "No jobs match your search"
                  : "No jobs yet"
              }
              description={
                jobs && jobs.length > 0
                  ? "Try a different keyword or category."
                  : "Check back soon — new jobs are posted all the time."
              }
            />
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "job" : "jobs"} found
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
