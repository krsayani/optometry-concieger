import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  UserCheck,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  User as UserIcon,
  Clock
} from "lucide-react";
import { listODIntakes, adminDeleteODIntake, adminUpdateODIntake } from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/utils/format";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/od-intakes")({
  validateSearch: (search) => ({
    search: search.search || "",
  }),
  component: AdminODIntakes,
});

function AdminODIntakes() {
  const queryClient = useQueryClient();
  const { search: searchParam } = Route.useSearch();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState(searchParam || "");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (searchParam) setSearch(searchParam);
  }, [searchParam]);

  const { data: intakes, isLoading } = useQuery({
    queryKey: ["admin-od-intakes"],
    queryFn: listODIntakes,
  });

  // Enable Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("admin-od-intakes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "od_intake_responses" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["admin-od-intakes"] });

          // Only show toast for NEW intakes, silent sync for updates/deletes
          // to avoid "double-toasting" when admin edits a profile
          if (payload.eventType === 'INSERT') {
            toast.info("New OD Profile Received", {
              description: `${payload.new.first_name} ${payload.new.last_name} has just submitted their intake form.`,
              icon: <UserCheck className="h-4 w-4 text-primary" />,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredIntakes = useMemo(() => {
    if (!intakes) return [];
    return intakes.filter(item => {
      const matchesSearch =
        search === "" ||
        `${item.first_name} ${item.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "All" || (item.status || "Profile Created") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [intakes, search, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteODIntake(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-od-intakes"] });
      toast.success("Intake response deleted");
      setConfirmDelete(null);
    },
    onError: (err) => toast.error("We couldn't delete the intake response. Please try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => adminUpdateODIntake(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-od-intakes"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error("We couldn't update the profile. Please try again."),
  });

  const prevStep = () => {}; // Not needed here but for completeness

  const handleDownloadResume = async (path) => {
    if (!path) return;
    setDownloading(true);
    try {
        // 1. If it's a full URL, just open it
        if (path.startsWith('http')) {
            window.open(path, '_blank');
            return;
        }

        // 2. Clean the path if it contains double bucket names
        let cleanPath = path;
        if (path.startsWith('resumes/')) {
            cleanPath = path.replace('resumes/', '');
        }

        // 3. Try to get a signed URL (safer)
        const { data, error } = await supabase.storage
            .from('resumes')
            .createSignedUrl(cleanPath, 7200);

        if (error) throw error;
        window.open(data.signedUrl, '_blank');
    } catch (err) {
        console.error("Error downloading resume:", err);
        toast.error("Could not open resume");
    } finally {
        setDownloading(false);
    }
  };

  if (isLoading) return <SiteLayout><PageLoader /></SiteLayout>;

  return (
    <SiteLayout>
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">OD Intake Responses</h1>
              <p className="text-sm text-muted-foreground">Manage optometrist career profiles and applications</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-10 rounded-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Profile Created">Profile Created</SelectItem>
                <SelectItem value="Concierge Review">Concierge Review</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Consent Requested">Consent Requested</SelectItem>
                <SelectItem value="Introduced">Introduced</SelectItem>
                <SelectItem value="Hired">Hired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Doctor</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Preferences</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Experience</th>
                  <th className="px-6 py-4 font-semibold text-right text-[11px] uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIntakes?.map((intake) => (
                  <tr key={intake.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={`${intake.first_name} ${intake.last_name}`}
                          url={intake.avatar_url}
                          className="h-10 w-10 border border-border"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-foreground truncate">{intake.first_name} {intake.last_name}</div>
                            {intake.email_verified ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 h-4 px-1 text-[8px] uppercase font-black shrink-0">Verified</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 h-4 px-1 text-[8px] uppercase font-black shrink-0">Pending</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {intake.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={intake.status || 'Profile Created'} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-[150px]">{intake.preferred_states?.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5" /> {intake.position_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-2">
                        <div className="text-foreground font-semibold flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          {intake.grad_year}
                        </div>
                        <Badge variant="outline" className="w-fit text-[9px] font-black px-2 py-0.5 border-primary/20 text-primary uppercase whitespace-nowrap">
                          {intake.years_in_practice}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        {intake.resume_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success hover:bg-success/10 rounded-full"
                            title="Download Resume"
                            disabled={downloading}
                            onClick={() => handleDownloadResume(intake.resume_url)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full"
                          title="View Details"
                          onClick={() => setSelectedIntake(intake)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                          title="Delete"
                          onClick={() => setConfirmDelete(intake)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIntakes?.length === 0 && (
              <div className="py-20 bg-card">
                <EmptyState
                  icon={search || statusFilter !== "All" ? Search : UserCheck}
                  title={search || statusFilter !== "All" ? "No matching doctors" : "No OD intake responses found"}
                  description={search || statusFilter !== "All" ? "Try adjusting your search or filters." : "When doctors complete their career profile, they will appear here."}
                  action={search || statusFilter !== "All" ? (
                    <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("All"); }} className="rounded-full">
                      Clear all filters
                    </Button>
                  ) : null}
                />
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={(o) => !o && setConfirmDelete(null)}
          title="Delete Intake?"
          description={`Are you sure you want to delete the profile for ${confirmDelete?.first_name}? This action cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        />

        <Dialog open={!!selectedIntake} onOpenChange={(o) => !o && setSelectedIntake(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none bg-background shadow-elevated">
            {selectedIntake && (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <UserCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedIntake.first_name} {selectedIntake.last_name}</h2>
                      <p className="text-sm text-muted-foreground">Optometrist Career Profile</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Internal Status</Label>
                    <Select
                        defaultValue={selectedIntake.status || 'Profile Created'}
                        onValueChange={(v) => updateMutation.mutate({ id: selectedIntake.id, updates: { status: v } })}
                    >
                        <SelectTrigger className="w-[200px] rounded-full h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Profile Created">Profile Created</SelectItem>
                            <SelectItem value="Concierge Review">Concierge Review</SelectItem>
                            <SelectItem value="Verified">Verified</SelectItem>
                            <SelectItem value="Consent Requested">Consent Requested</SelectItem>
                            <SelectItem value="Introduced">Introduced</SelectItem>
                            <SelectItem value="Hired">Hired</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto">
                  {/* Internal Admin Area */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Concierge Admin Notes
                    </h3>
                    <Textarea
                        placeholder="Add private notes about this candidate... (e.g., call logs, internal vetting notes)"
                        defaultValue={selectedIntake.admin_notes}
                        onBlur={(e) => {
                            if (e.target.value !== selectedIntake.admin_notes) {
                                updateMutation.mutate({ id: selectedIntake.id, updates: { admin_notes: e.target.value } });
                            }
                        }}
                        className="bg-background min-h-[100px]"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        <span>Peform internal vetting before identifying matches</span>
                        <div className="flex items-center gap-1">
                            <div className={`h-1.5 w-1.5 rounded-full ${updateMutation.isPending ? 'bg-primary animate-pulse' : 'bg-success'}`} />
                            {updateMutation.isPending ? 'Saving...' : 'Changes Auto-Saved'}
                        </div>
                    </div>
                  </div>

                  {/* Contact Grid */}
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                      <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                          <a href={`mailto:${selectedIntake.email}`} className="hover:underline truncate block">{selectedIntake.email}</a>
                        </div>
                        {selectedIntake.email_verified ? (
                          <Badge variant="outline" className="bg-success/5 text-success border-success/20 h-5 text-[10px] shrink-0">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 h-5 text-[10px] shrink-0">Not Verified</Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</span>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{selectedIntake.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Submitted</span>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formatDate(selectedIntake.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Professional */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border pb-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Professional Background
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                      <DetailRow label="School" value={selectedIntake.school === 'Other' ? selectedIntake.other_school : selectedIntake.school} />
                      <DetailRow label="Graduation Year" value={selectedIntake.grad_year} />
                      <DetailRow label="License Status" value={selectedIntake.license_status === 'Licensed (Multiple states)' ? `Licensed (${selectedIntake.license_states})` : selectedIntake.license_status} />
                      <DetailRow label="Years in Practice" value={selectedIntake.years_in_practice} />
                      <DetailRow label="Residency" value={selectedIntake.completed_residency === 'Yes' ? `Yes (${selectedIntake.residency_type})` : 'No'} />
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border pb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Job Preferences
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                      <DetailRow label="Position Type" value={selectedIntake.position_type} />
                      <DetailRow label="Preferred States" value={selectedIntake.preferred_states?.join(", ")} />
                      <DetailRow label="Relocation" value={selectedIntake.open_to_relocation} />
                      <DetailRow label="Practice Settings" value={selectedIntake.practice_setting?.join(", ")} />
                      <DetailRow label="Target Salary" value={selectedIntake.salary_expectation} />
                      <DetailRow label="Start Date" value={selectedIntake.target_start_date} />
                    </div>

                    <div className="space-y-2 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clinical Interests</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedIntake.clinical_interests?.map(interest => (
                          <span key={interest} className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[11px] font-semibold border border-primary/10">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resume Action */}
                  {selectedIntake.resume_url && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center">
                       <FileText className="h-10 w-10 text-primary mb-3" />
                       <h4 className="font-bold">Resume Attached</h4>
                       <p className="text-xs text-muted-foreground mt-1 mb-6">Download to review full professional experience.</p>
                       <Button
                        className="rounded-full px-8"
                        disabled={downloading}
                        onClick={() => handleDownloadResume(selectedIntake.resume_url)}
                       >
                         {downloading ? "Generating link..." : "Download Resume (PDF)"}
                       </Button>
                    </div>
                  )}

                  {selectedIntake.anything_else && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Additional Notes</span>
                      <div className="p-4 rounded-xl bg-muted/30 text-sm italic leading-relaxed">
                        "{selectedIntake.anything_else}"
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
                   <Button variant="outline" onClick={() => setSelectedIntake(null)}>Close</Button>
                   <Button variant="destructive" onClick={() => {
                      setConfirmDelete(selectedIntake);
                      setSelectedIntake(null);
                   }}>Delete Profile</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="text-sm font-medium text-foreground">{value || "N/A"}</div>
    </div>
  );
}
