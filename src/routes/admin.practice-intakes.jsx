import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Stethoscope,
  DollarSign,
  Clock,
  CircleCheck,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Save,
  Search,
  SearchX,
  Filter
} from "lucide-react";
import { listPracticeIntakes, adminDeletePracticeIntake, adminUpdatePracticeIntake } from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/practice-intakes")({
  validateSearch: (search) => ({
    search: search.search || "",
  }),
  component: AdminPracticeIntakes,
});

function AdminPracticeIntakes() {
  const queryClient = useQueryClient();
  const { search: searchParam } = Route.useSearch();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [search, setSearch] = useState(searchParam || "");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (searchParam) setSearch(searchParam);
  }, [searchParam]);

  const { data: intakes, isLoading } = useQuery({
    queryKey: ["admin-practice-intakes"],
    queryFn: listPracticeIntakes,
  });

  // Enable Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("admin-practice-intakes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employer_intake_responses" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["admin-practice-intakes"] });

          if (payload.eventType === 'INSERT') {
            toast.info("New Hiring Request", {
              description: `A new request has been received from ${payload.new.practice_name}.`,
              icon: <Building2 className="h-4 w-4 text-primary" />,
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
        item.practice_name.toLowerCase().includes(search.toLowerCase()) ||
        item.contact_name.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "All" || (item.status || "Request Received") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [intakes, search, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeletePracticeIntake(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-practice-intakes"] });
      toast.success("Practice response deleted");
      setConfirmDelete(null);
    },
    onError: (err) => toast.error("We couldn't delete the response. Please try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => adminUpdatePracticeIntake(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-practice-intakes"] });
      toast.success("Request updated");
    },
    onError: (err) => toast.error("We couldn't save the changes. Please try again."),
  });

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Practice Intakes</h1>
              <p className="text-sm text-muted-foreground">Manage practice hiring requests and requirements</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search practice or email..."
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
                <SelectItem value="Request Received">Request Received</SelectItem>
                <SelectItem value="Doctor Matching">Doctor Matching</SelectItem>
                <SelectItem value="Introductions">Introductions</SelectItem>
                <SelectItem value="Hiring Process">Hiring Process</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Practice / Contact</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Location</th>
                  <th className="px-6 py-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Position</th>
                  <th className="px-6 py-4 font-semibold text-right text-[11px] uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIntakes?.map((intake) => (
                  <tr key={intake.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={intake.practice_name}
                          url={intake.avatar_url}
                          className="h-10 w-10 border border-border"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-foreground truncate">{intake.practice_name}</div>
                            {intake.email_verified ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 h-4 px-1 text-[8px] uppercase font-black shrink-0">Verified</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 h-4 px-1 text-[8px] uppercase font-black shrink-0">Pending</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            Contact: {intake.contact_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={intake.status || 'Request Received'} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{intake.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="text-foreground font-semibold text-xs">
                          {intake.position_type}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          {intake.urgency}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
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
                  icon={search || statusFilter !== "All" ? SearchX : Building2}
                  title={search || statusFilter !== "All" ? "No matching practices" : "No practice intake responses found"}
                  description={search || statusFilter !== "All" ? "Try adjusting your search or filters." : "When practices submit hiring requests, they will appear here."}
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
          title="Delete Request?"
          description={`Are you sure you want to delete the hiring request from ${confirmDelete?.practice_name}?`}
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
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">{selectedIntake.practice_name}</h2>
                        {selectedIntake.consent && (
                           <Badge className="bg-success text-white border-none text-[8px] h-4 px-1.5 uppercase font-black">Fee Agreed</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Practice Hiring Request</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Internal Status</Label>
                    <Select
                        defaultValue={selectedIntake.status || 'Request Received'}
                        onValueChange={(v) => updateMutation.mutate({ id: selectedIntake.id, updates: { status: v } })}
                    >
                        <SelectTrigger className="w-[200px] rounded-full h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Request Received">Request Received</SelectItem>
                            <SelectItem value="Doctor Matching">Doctor Matching</SelectItem>
                            <SelectItem value="Introductions">Introductions</SelectItem>
                            <SelectItem value="Hiring Process">Hiring Process</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto">
                   {/* Internal Admin Area */}
                   <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Concierge Matching Notes
                    </h3>
                    <Textarea
                        placeholder="Add private notes about this practice... (e.g., culture fit, specific candidate feedback)"
                        defaultValue={selectedIntake.admin_notes}
                        onBlur={(e) => {
                            if (e.target.value !== selectedIntake.admin_notes) {
                                updateMutation.mutate({ id: selectedIntake.id, updates: { admin_notes: e.target.value } });
                            }
                        }}
                        className="bg-background min-h-[100px]"
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        <span>Private notes visible to admin team only</span>
                        <div className="flex items-center gap-1">
                            <div className={`h-1.5 w-1.5 rounded-full ${updateMutation.isPending ? 'bg-primary animate-pulse' : 'bg-success'}`} />
                            {updateMutation.isPending ? 'Saving...' : 'Changes Auto-Saved'}
                        </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-4 gap-6">
                    <DetailCol label="Contact Name" value={selectedIntake.contact_name} icon={CircleCheck} />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                      <div className="flex flex-wrap items-center gap-2 text-sm min-w-0 font-medium">
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
                    <DetailCol label="Phone" value={selectedIntake.phone} icon={Phone} />
                    <DetailCol label="Location" value={selectedIntake.location} icon={MapPin} />
                  </div>

                  {/* Practice Details */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border pb-2 text-primary">
                      <Building2 className="h-5 w-5" />
                      Practice & Position
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <DetailRow label="Practice Type" value={selectedIntake.practice_type} />
                      <DetailRow label="ODs on Staff" value={selectedIntake.num_ods} />
                      <DetailRow label="Need Type" value={selectedIntake.position_type} />
                      <DetailRow label="Urgency" value={selectedIntake.urgency} />
                      <DetailRow label="Patient Volume" value={selectedIntake.patient_volume} />
                      <DetailRow label="Schedule" value={selectedIntake.schedule} />
                    </div>
                  </div>

                  {/* Financial & Benefits */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 border-b border-border pb-2 text-primary">
                      <DollarSign className="h-5 w-5" />
                      Offer & Requirements
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
                      <DetailRow label="Base Salary" value={selectedIntake.salary_range} />
                      <DetailRow label="Production Bonus" value={selectedIntake.production_bonus} />
                      <DetailRow label="Sign-On Bonus" value={selectedIntake.sign_on_bonus} />
                      <DetailRow label="Relocation" value={selectedIntake.relocation_assistance} />
                      <DetailRow label="New Grad Friendly" value={selectedIntake.new_grad_friendly} />
                      <DetailRow label="Mentorship" value={selectedIntake.mentorship_available} />
                      <DetailRow label="Ownership Track" value={selectedIntake.ownership_track} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-8">
                     <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Benefits Offered</span>
                        <div className="flex flex-wrap gap-2">
                           {selectedIntake.benefits?.map(b => (
                             <span key={b} className="px-2 py-1 rounded-md bg-success/5 text-success text-[11px] font-semibold border border-success/10">
                                {b}
                             </span>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Care Type</span>
                        <div className="flex flex-wrap gap-2">
                           {selectedIntake.primary_care_type?.map(t => (
                             <span key={t} className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[11px] font-semibold border border-primary/10">
                                {t}
                             </span>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-2 md:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Compliance & Agreement</span>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/5 border border-success/20">
                            <ShieldCheck className="h-4 w-4 text-success" />
                            <span className="text-xs font-bold text-success uppercase tracking-wider">Verified Fee Agreement</span>
                        </div>
                     </div>
                  </div>

                  {/* Technology */}
                  {selectedIntake.equipment_tech && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equipment / Technology</span>
                      <div className="p-4 rounded-xl border border-border bg-card text-sm leading-relaxed">
                        {selectedIntake.equipment_tech}
                      </div>
                    </div>
                  )}

                  {selectedIntake.anything_else && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Practice Culture</span>
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
                   }}>Delete Request</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function DetailCol({ label, value, icon: Icon, isLink, href }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        {isLink ? <a href={href} className="hover:underline truncate">{value}</a> : <span className="truncate">{value}</span>}
      </div>
    </div>
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
