import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  Users,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  UserCheck,
  Building2,
  MapPin,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Filter,
  SearchX
} from "lucide-react";
import {
  listMatches,
  createMatch,
  updateMatchStatus,
  deleteMatch,
  listODIntakes,
  listPracticeIntakes
} from "@/services/admin";
import { PageLoader } from "@/components/LoadingSpinner";
import { StatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDate } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/admin/matches")({
  component: AdminMatches,
});

// Matching logic helper
const calculateMatchScore = (od, practice) => {
    if (!od || !practice) return 0;
    let score = 0;
    const reasons = [];

    // 1. Location Match (Highest priority)
    const empState = practice.location?.split(',')?.pop()?.trim();
    if (od.preferred_states?.includes(empState) || od.preferred_states?.includes("Open to Anywhere")) {
        score += 40;
        reasons.push("Location preference match");
    }

    // 2. Position Type Match
    if (od.position_type === practice.position_type || od.position_type === "Either") {
        score += 20;
        reasons.push("Position type match");
    }

    // 3. Practice Setting Match
    const settingMap = {
        "Independent Private Practice": "Private Practice",
        "PE-Backed Group": "Private Practice",
        "Corporate/Retail": "Corporate/Retail",
        "MD-OD Group": "MD-OD Group",
        "VA/Federal": "VA/Federal",
        "Academic": "Academic"
    };
    if (od.practice_setting?.includes(settingMap[practice.practice_type])) {
        score += 20;
        reasons.push("Practice setting match");
    }

    // 4. Clinical Interest Match
    const interestOverlap = od.clinical_interests?.filter(i =>
        practice.primary_care_type?.some(pt => pt.includes(i) || i.includes(pt))
    );
    if (interestOverlap?.length > 0) {
        score += 10 + (interestOverlap.length * 5);
        reasons.push(`${interestOverlap.length} clinical interest overlaps`);
    }

    return { score, reasons };
};

function AdminMatches() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedOD, setSelectedOD] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: listMatches,
  });

  const { data: odIntakes } = useQuery({
    queryKey: ["admin-od-intakes"],
    queryFn: listODIntakes,
  });

  const { data: practiceIntakes } = useQuery({
    queryKey: ["admin-practice-intakes"],
    queryFn: listPracticeIntakes,
  });

  // Enable Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel("admin-matches-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "concierge_matches" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["admin-matches"] });

          if (payload.eventType === 'INSERT') {
            toast.info("Match Identified", {
              description: "A new potential match has been recorded.",
              icon: <Users className="h-4 w-4 text-primary" />,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter(match => {
      const odName = `${match.od?.first_name} ${match.od?.last_name}`.toLowerCase();
      const practiceName = match.practice?.practice_name?.toLowerCase() || "";
      const matchesSearch =
        search === "" ||
        odName.includes(search.toLowerCase()) ||
        practiceName.includes(search.toLowerCase());

      const matchesStatus = statusFilter === "All" || match.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [matches, search, statusFilter]);

  // Automated suggestions logic
  const suggestedODs = useMemo(() => {
    if (!selectedPractice || !odIntakes) return odIntakes || [];
    const practice = practiceIntakes?.find(e => e.id === selectedPractice);
    return [...odIntakes].map(od => ({
        ...od,
        matchData: calculateMatchScore(od, practice)
    })).sort((a, b) => b.matchData.score - a.matchData.score);
  }, [selectedPractice, odIntakes, practiceIntakes]);

  const suggestedPractices = useMemo(() => {
    if (!selectedOD || !practiceIntakes) return practiceIntakes || [];
    const od = odIntakes?.find(o => o.id === selectedOD);
    return [...practiceIntakes].map(p => ({
        ...p,
        matchData: calculateMatchScore(od, p)
    })).sort((a, b) => b.matchData.score - a.matchData.score);
  }, [selectedOD, odIntakes, practiceIntakes]);

  const createMutation = useMutation({
    mutationFn: () => createMatch(selectedOD, selectedPractice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success("Match created");
      setIsCreating(false);
      setSelectedOD(null);
      setSelectedPractice(null);
    },
    onError: (err) => toast.error("We couldn't create the match. Please check the requirements and try again."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateMatchStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success("Match status updated");
    },
    onError: (err) => toast.error("We couldn't update the status. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      toast.success("Match removed");
    },
    onError: (err) => toast.error("We couldn't remove the match. Please try again."),
  });

  if (matchesLoading) return <SiteLayout><PageLoader /></SiteLayout>;

  return (
    <SiteLayout>
      <div className="container-page py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-foreground">Introduction Hub</h1>
                <p className="text-sm text-muted-foreground">Connecting vetted doctors with premier practices</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search OD or practice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-10 rounded-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Potential Match">Potential Match</SelectItem>
                <SelectItem value="Introduced">Introduced</SelectItem>
                <SelectItem value="Interviewing">Interviewing</SelectItem>
                <SelectItem value="Hired">Hired</SelectItem>
                <SelectItem value="Declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreating(true)} className="rounded-full px-6 shadow-soft">
                <Plus className="h-4 w-4 mr-2" /> New Match
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
            {filteredMatches?.map((match) => {
                const { score, reasons } = calculateMatchScore(match.od, match.practice);
                return (
                <div key={match.id} className="group relative rounded-3xl border border-border bg-card p-6 shadow-soft hover:border-primary/20 transition-all overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* OD Column */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em]">Optometrist Candidate</div>
                                {score > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                    <Sparkles className="h-3 w-3" /> {score}% Match
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[200px] text-[11px] p-3">
                                                <p className="font-bold mb-1">Match Strength Reasons:</p>
                                                <ul className="list-disc pl-3 space-y-1">
                                                    {reasons.map((r, i) => <li key={i}>{r}</li>)}
                                                </ul>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    name={`${match.od?.first_name} ${match.od?.last_name}`}
                                    url={match.od?.avatar_url}
                                    className="h-10 w-10 border border-border shrink-0"
                                />
                                <div className="min-w-0">
                                    <h4 className="font-bold text-foreground truncate">{match.od?.first_name} {match.od?.last_name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{match.od?.school} · {match.od?.grad_year}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {match.od?.preferred_states?.slice(0, 3).map(s => (
                                    <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary uppercase font-bold">{s}</Badge>
                                ))}
                            </div>
                        </div>

                        {/* Status/Arrow Column */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-4">
                                <div className="h-[1px] w-12 bg-border hidden lg:block" />
                                <div className="p-3 rounded-2xl bg-muted/50 border border-border group-hover:border-primary/30 transition-colors shadow-inner">
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <div className="h-[1px] w-12 bg-border hidden lg:block" />
                            </div>
                            <Select
                                defaultValue={match.status}
                                onValueChange={(v) => statusMutation.mutate({ id: match.id, status: v })}
                            >
                                <SelectTrigger className="h-8 rounded-full text-[10px] font-bold uppercase tracking-wider w-[160px] bg-background border-primary/20 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Potential Match">Potential Match</SelectItem>
                                    <SelectItem value="Introduced">Introduced</SelectItem>
                                    <SelectItem value="Interviewing">Interviewing</SelectItem>
                                    <SelectItem value="Hired">Hired</SelectItem>
                                    <SelectItem value="Declined">Declined</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Practice Column */}
                        <div className="flex-1 w-full space-y-4">
                             <div className="text-[10px] font-black text-success/50 uppercase tracking-[0.2em] md:text-right">Hiring Practice</div>
                             <div className="flex items-center gap-3 md:justify-end text-right">
                                <div className="min-w-0">
                                    <h4 className="font-bold text-foreground truncate">{match.practice?.practice_name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{match.practice?.location}</p>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0 border border-success/20">
                                    <Building2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 md:justify-end">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/20 text-success uppercase font-bold">{match.practice?.salary_range}</Badge>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-success/20 text-success uppercase font-bold">{match.practice?.position_type}</Badge>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:border-l border-border pl-6 flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                onClick={() => setConfirmDelete(match)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.3em]">
                        <span>ID: {match.id.split('-')[0]}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                        <span>Identified {formatDate(match.created_at)}</span>
                    </div>
                </div>
            )})}

            {filteredMatches?.length === 0 && (
                <div className="py-20 bg-card rounded-[2rem] border border-border">
                    <EmptyState
                        icon={search || statusFilter !== "All" ? SearchX : Users}
                        title={search || statusFilter !== "All" ? "No matches found" : "No matches identified yet"}
                        description={search || statusFilter !== "All" ? "Try adjusting your search or filters." : "Start the process by identifying your first candidate match."}
                        action={search || statusFilter !== "All" ? (
                            <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("All"); }} className="rounded-full">
                            Clear all filters
                            </Button>
                        ) : (
                            <Button onClick={() => setIsCreating(true)} className="rounded-full">Identify First Match</Button>
                        )}
                    />
                </div>
            )}
        </div>

        <ConfirmDialog
            open={!!confirmDelete}
            onOpenChange={(o) => !o && setConfirmDelete(null)}
            title="Remove Match?"
            description={`Are you sure you want to remove the introduction between ${confirmDelete?.od?.first_name} and ${confirmDelete?.practice?.practice_name}?`}
            confirmLabel="Remove Match"
            destructive
            onConfirm={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
        />

        {/* Creation Dialog */}
        <Dialog open={isCreating} onOpenChange={(open) => {
            setIsCreating(open);
            if (!open) {
                setSelectedOD(null);
                setSelectedPractice(null);
            }
        }}>
            <DialogContent className="max-w-5xl p-0 border-none bg-background shadow-elevated overflow-hidden flex flex-col max-h-[95vh] w-[95vw]">
                <DialogHeader className="p-6 md:p-8 border-b border-border bg-muted/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold">Initiate Concierge Match</DialogTitle>
                            <DialogDescription className="text-sm">Link a vetted candidate with a practice hiring request to start the workflow.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-8">
                    <div className="grid md:grid-cols-2 gap-8 h-full min-h-0">
                        {/* OD Selector */}
                        <div className="flex flex-col min-h-0 h-full">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <h4 className="font-bold flex items-center gap-2 text-primary uppercase text-[11px] tracking-[0.15em]">
                                    <UserCheck className="h-4 w-4" /> The Optometrist
                                </h4>
                                {selectedPractice && (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] animate-in fade-in slide-in-from-right-2 font-bold px-2 py-0.5">
                                        Auto-Ranked Match
                                    </Badge>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {suggestedODs?.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed border-border rounded-3xl">
                                        <UserCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground font-medium">No candidates available</p>
                                    </div>
                                ) : suggestedODs?.map(od => (
                                    <button
                                        key={od.id}
                                        onClick={() => setSelectedOD(od.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all relative group",
                                            selectedOD === od.id
                                                ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-soft"
                                                : "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <UserAvatar name={`${od.first_name} ${od.last_name}`} url={od.avatar_url} className="h-9 w-9 border border-border shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-foreground truncate">{od.first_name} {od.last_name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <p className="text-[10px] text-muted-foreground truncate font-medium">{od.preferred_states?.join(", ")}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedPractice && od.matchData?.score > 0 && (
                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className="flex items-center gap-1 text-[11px] font-black text-primary">
                                                        {od.matchData.score}%
                                                    </div>
                                                    <div className="h-1 w-12 bg-muted rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-700 ease-out"
                                                            style={{ width: `${od.matchData.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedOD === od.id && (
                                            <div className="absolute -right-1 -top-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Practice Selector */}
                        <div className="flex flex-col min-h-0 h-full">
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <h4 className="font-bold flex items-center gap-2 text-success uppercase text-[11px] tracking-[0.15em]">
                                    <Building2 className="h-4 w-4" /> The Practice
                                </h4>
                                {selectedOD && (
                                    <Badge variant="outline" className="bg-success/5 text-success border-success/20 text-[10px] animate-in fade-in slide-in-from-right-2 font-bold px-2 py-0.5">
                                        Best Fit Logic
                                    </Badge>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {suggestedPractices?.length === 0 ? (
                                    <div className="py-12 text-center border-2 border-dashed border-border rounded-3xl">
                                        <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground font-medium">No practices available</p>
                                    </div>
                                ) : suggestedPractices?.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPractice(p.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all relative group",
                                            selectedPractice === p.id
                                                ? "bg-success/5 border-success ring-1 ring-success/20 shadow-soft"
                                                : "bg-card border-border hover:border-success/30 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0 border border-success/20">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-foreground truncate">{p.practice_name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <p className="text-[10px] text-muted-foreground truncate font-medium">{p.location}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedOD && p.matchData?.score > 0 && (
                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className="flex items-center gap-1 text-[11px] font-black text-success">
                                                        {p.matchData.score}%
                                                    </div>
                                                    <div className="h-1 w-12 bg-muted rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="h-full bg-success transition-all duration-700 ease-out"
                                                            style={{ width: `${p.matchData.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedPractice === p.id && (
                                            <div className="absolute -right-1 -top-1 h-5 w-5 bg-success text-success-foreground rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 border-t border-border bg-muted/20 shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            {selectedOD && selectedPractice ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/20 animate-in fade-in zoom-in">
                                    <Sparkles className="h-3.5 w-3.5" /> Ready to Match
                                </div>
                            ) : (
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Pair a Doctor with a practice to start
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-full px-6 flex-1 sm:flex-none font-bold text-xs uppercase tracking-wider">
                                Cancel
                            </Button>
                            <Button
                                disabled={!selectedOD || !selectedPractice || createMutation.isPending}
                                onClick={() => createMutation.mutate()}
                                className="px-10 rounded-full shadow-elevated flex-1 sm:flex-none font-bold text-xs uppercase tracking-wider"
                            >
                                {createMutation.isPending ? "Connecting..." : "Confirm Match"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </SiteLayout>
  );
}
