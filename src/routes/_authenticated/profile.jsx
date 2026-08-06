import { useRef, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Save, FileText, Upload, User, Briefcase, Building2, MapPin, GraduationCap, DollarSign, Clock, Stethoscope, ShieldAlert, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/layouts/SiteLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { PageLoader } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, uploadAvatar, listODIntakesByUser, listPracticeIntakesByUser, updateODIntake, updatePracticeIntake, deleteODIntake, deletePracticeIntake } from "@/services/profiles";
import { supabase } from "@/integrations/supabase/client";
import { cn, formatPhoneNumber } from "@/lib/utils";

const US_SCHOOLS = [
  "Arizona College of Optometry at Midwestern University",
  "Chicago College of Optometry at Midwestern University",
  "Illinois College of Optometry",
  "Indiana University School of Optometry",
  "Inter American University of Puerto Rico School of Optometry",
  "Kentucky College of Optometry",
  "MCPHS University School of Optometry",
  "Michigan College of Optometry at Ferris State University",
  "New England College of Optometry",
  "Northeastern State University Oklahoma College of Optometry",
  "Nova Southeastern University College of Optometry",
  "Ohio State University College of Optometry",
  "Pacific University College of Optometry",
  "Pennsylvania College of Optometry at Salus University",
  "Southern California College of Optometry at Marshall B. Ketchum University",
  "Southern College of Optometry",
  "State University of New York College of Optometry",
  "University of Alabama at Birmingham School of Optometry",
  "University of California, Berkeley School of Optometry",
  "University of Houston College of Optometry",
  "University of Incarnate Word, Rosenberg School of Optometry",
  "University of Missouri-St. Louis College of Optometry",
  "Western University of Health Sciences, College of Optometry",
  "Other"
].sort((a, b) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b));

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "Open to Anywhere"
];

import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search) => ({
    tab: search.tab || "account",
    subtab: search.subtab || null,
  }),
  head: () =>
    buildSeoHead({
      title: "Your Profile",
      description: "Manage your Optometry Concierge profile.",
      path: "/profile",
      noindex: true,
    }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, roles, role, loading, refreshProfile } = useAuth();
  const { tab, subtab } = Route.useSearch();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const resumeRef = useRef(null);

  const [fullName, setFullName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [activeTab, setActiveTab] = useState(tab);
  const [activeSubtab, setActiveSubtab] = useState(subtab || "od");

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    if (subtab) {
        setActiveSubtab(subtab);
    } else if (roles.length > 0) {
        // Default to od if they have it, otherwise practice
        setActiveSubtab(roles.includes("od") ? "od" : "practice");
    }
  }, [subtab, roles]);

  // Fetch Intake Data for all roles the user possesses
  const { data: odIntakes, isLoading: odLoading } = useQuery({
    queryKey: ["my-od-intakes", user?.id],
    queryFn: () => listODIntakesByUser(user.id),
    enabled: !!user && roles.includes("od"),
  });

  const { data: practiceIntakes, isLoading: practiceLoading } = useQuery({
    queryKey: ["my-practice-intakes", user?.id],
    queryFn: () => listPracticeIntakesByUser(user.id),
    enabled: !!user && roles.includes("employer"),
  });

  const [selectedOdIndex, setSelectedOdIndex] = useState(0);
  const [selectedPracticeIndex, setSelectedPracticeIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const odIntake = odIntakes?.[selectedOdIndex];
  const practiceIntake = practiceIntakes?.[selectedPracticeIndex];

  // Fix: Reset index if it becomes out of bounds after deletion
  useEffect(() => {
    if (odIntakes && selectedOdIndex >= odIntakes.length && odIntakes.length > 0) {
        setSelectedOdIndex(odIntakes.length - 1);
    }
  }, [odIntakes, selectedOdIndex]);

  useEffect(() => {
    if (practiceIntakes && selectedPracticeIndex >= practiceIntakes.length && practiceIntakes.length > 0) {
        setSelectedPracticeIndex(practiceIntakes.length - 1);
    }
  }, [practiceIntakes, selectedPracticeIndex]);

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: (updates) => updateProfile(user.id, updates),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["outreach-owner-photos"] });
      toast.success("Account updated");
    },
  });

  const odIntakeMutation = useMutation({
    mutationFn: (updates) => updateODIntake(odIntake?.id, updates, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-od-intakes"] });
      toast.success("Career profile updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const practiceIntakeMutation = useMutation({
    mutationFn: (updates) => updatePracticeIntake(practiceIntake?.id, updates, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-practice-intakes"] });
      toast.success("Practice details updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteIntakeMutation = useMutation({
    mutationFn: async ({ id, type }) => {
        if (type === 'od') return deleteODIntake(id);
        return deletePracticeIntake(id);
    },
    onSuccess: async (_, { type }) => {
        queryClient.invalidateQueries({ queryKey: [type === 'od' ? "my-od-intakes" : "my-practice-intakes"] });
        await refreshProfile(); // Refresh roles in AuthContext
        toast.success(`${type === 'od' ? 'Career profile' : 'Practice profile'} deleted`);
        setConfirmDelete(null);
    },
    onError: (err) => toast.error("Failed to delete profile. Please try again."),
  });

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await profileMutation.mutateAsync({ avatar_url: url });
    } catch (err) {
      toast.error("We couldn't upload your photo. Please try again with a smaller image.");
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingResume(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/resume-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);
        await odIntakeMutation.mutateAsync({ resume_url: publicUrl });
        toast.success("Resume updated");
    } catch (err) {
        toast.error("We couldn't upload your resume. Please ensure it's a PDF or Word document and try again.");
    } finally {
        setUploadingResume(false);
    }
  };

  if (loading || odLoading || practiceLoading) return <SiteLayout><PageLoader /></SiteLayout>;

  return (
    <SiteLayout>
      <div className="container-page py-6 md:py-16 overflow-x-hidden">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground px-1">Account Settings</h1>
            <p className="mt-1 md:mt-2 text-sm text-muted-foreground px-1">Manage your identity and professional information.</p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 md:mt-10">
                <TabsList className={cn(
                    "grid w-full mb-6 md:mb-8 h-11 md:h-12 p-1 bg-muted rounded-full",
                    (roles.includes("od") || roles.includes("employer")) ? "grid-cols-2 lg:w-[400px]" : "grid-cols-1 lg:w-[200px]"
                )}>
                    <TabsTrigger value="account" className="rounded-full text-xs md:text-sm">General Account</TabsTrigger>
                    {(roles.includes("od") || roles.includes("employer")) && (
                        <TabsTrigger value="details" className="rounded-full text-xs md:text-sm">
                            {roles.includes("od") && roles.includes("employer") ? "Professional Details" :
                             roles.includes("od") ? "Career Profile" : "Practice Details"}
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="account" className="space-y-6">
                    <div className="rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-8 shadow-soft">
                        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 text-center sm:text-left">
                            <UserAvatar name={fullName} url={profile?.avatar_url} className="h-24 w-24 text-xl border-4 border-background shadow-soft" />
                            <div className="space-y-3">
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                                <Button variant="outline" size="sm" className="rounded-full w-full sm:w-auto" onClick={() => fileRef.current?.click()} disabled={uploading}>
                                    <Camera className="h-4 w-4 mr-2" /> {uploading ? "Uploading..." : "Change Photo"}
                                </Button>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">JPG or PNG. Max 5MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Doctor Jane Smith" />
                            </div>
                            <div className="space-y-2 opacity-60">
                                <Label>Email Address (Managed by Auth)</Label>
                                <Input value={user?.email} disabled />
                            </div>
                            <div className="pt-4 border-t border-border">
                                <Button
                                    onClick={() => profileMutation.mutate({ full_name: fullName })}
                                    disabled={profileMutation.isPending || fullName === profile?.full_name}
                                    className="rounded-full px-8 w-full sm:w-auto"
                                >
                                    <Save className="h-4 w-4 mr-2" /> Save Account Info
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                    {(roles.includes("od") || roles.includes("employer")) ? (
                      roles.includes("od") && roles.includes("employer") ? (
                        <Tabs value={activeSubtab} onValueChange={setActiveSubtab} className="w-full">
                          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 h-10 p-1 bg-muted rounded-full">
                            <TabsTrigger value="od" className="rounded-full text-xs">Career Profile</TabsTrigger>
                            <TabsTrigger value="practice" className="rounded-full text-xs">Practice Details</TabsTrigger>
                          </TabsList>
                          <TabsContent value="od" className="mt-0">
                             {odIntakes?.length > 1 && (
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-6 px-1">
                                    {odIntakes.map((_, idx) => (
                                        <Button
                                            key={idx}
                                            variant={selectedOdIndex === idx ? "default" : "outline"}
                                            size="sm"
                                            className="rounded-full whitespace-nowrap"
                                            onClick={() => setSelectedOdIndex(idx)}
                                        >
                                            Profile {idx + 1}
                                        </Button>
                                    ))}
                                </div>
                             )}
                             <ODProfileEditor
                                user={user}
                                intake={odIntake}
                                onSave={(updates) => odIntakeMutation.mutate(updates)}
                                isSaving={odIntakeMutation.isPending}
                                onDelete={() => setConfirmDelete({ id: odIntake?.id, type: 'od', name: 'this career profile' })}
                                resumeRef={resumeRef}
                                handleResumeUpload={handleResumeUpload}
                                isUploadingResume={uploadingResume}
                              />
                          </TabsContent>
                          <TabsContent value="practice" className="mt-0">
                             <div className="flex items-center justify-between gap-4 mb-6 px-1">
                                {practiceIntakes?.length > 1 ? (
                                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                        {practiceIntakes.map((intake, idx) => (
                                            <Button
                                                key={intake.id}
                                                variant={selectedPracticeIndex === idx ? "default" : "outline"}
                                                size="sm"
                                                className="rounded-full whitespace-nowrap"
                                                onClick={() => setSelectedPracticeIndex(idx)}
                                            >
                                                {intake.practice_name || `Practice ${idx + 1}`}
                                            </Button>
                                        ))}
                                    </div>
                                ) : <div />}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                    onClick={() => {
                                        setSelectedPracticeIndex(-1);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Another
                                </Button>
                             </div>
                             <PracticeProfileEditor
                                user={user}
                                intake={selectedPracticeIndex === -1 ? null : practiceIntake}
                                onSave={(updates) => practiceIntakeMutation.mutate(updates)}
                                isSaving={practiceIntakeMutation.isPending}
                                onDelete={() => setConfirmDelete({ id: practiceIntake.id, type: 'practice', name: practiceIntake.practice_name || 'this practice' })}
                              />
                          </TabsContent>
                        </Tabs>
                      ) : roles.includes("od") ? (
                        <div className="space-y-6">
                            {odIntakes?.length > 1 && (
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1">
                                    {odIntakes.map((_, idx) => (
                                        <Button
                                            key={idx}
                                            variant={selectedOdIndex === idx ? "default" : "outline"}
                                            size="sm"
                                            className="rounded-full whitespace-nowrap"
                                            onClick={() => setSelectedOdIndex(idx)}
                                        >
                                            Career Profile {idx + 1}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            <ODProfileEditor
                            user={user}
                            intake={odIntake}
                            onSave={(updates) => odIntakeMutation.mutate(updates)}
                            isSaving={odIntakeMutation.isPending}
                            onDelete={() => setConfirmDelete({ id: odIntake?.id, type: 'od', name: 'this career profile' })}
                            resumeRef={resumeRef}
                            handleResumeUpload={handleResumeUpload}
                            isUploadingResume={uploadingResume}
                            />
                        </div>
                      ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4 px-1">
                                {practiceIntakes?.length > 1 ? (
                                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                                        {practiceIntakes.map((intake, idx) => (
                                            <Button
                                                key={intake.id}
                                                variant={selectedPracticeIndex === idx ? "default" : "outline"}
                                                size="sm"
                                                className="rounded-full whitespace-nowrap"
                                                onClick={() => setSelectedPracticeIndex(idx)}
                                            >
                                                {intake.practice_name || `Practice ${idx + 1}`}
                                            </Button>
                                        ))}
                                    </div>
                                ) : <div />}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                    onClick={() => {
                                        setSelectedPracticeIndex(-1);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Another
                                </Button>
                             </div>
                            <PracticeProfileEditor
                            user={user}
                            intake={selectedPracticeIndex === -1 ? null : practiceIntake}
                            onSave={(updates) => practiceIntakeMutation.mutate(updates)}
                            isSaving={practiceIntakeMutation.isPending}
                            onDelete={() => setConfirmDelete({ id: practiceIntake.id, type: 'practice', name: practiceIntake.practice_name || 'this practice' })}
                            />
                        </div>
                      )
                    ) : (
                        <div className="rounded-2xl border border-border bg-card p-8 text-center">
                            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-bold">No Professional Profile</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                You are signed in with an administrative account.
                                Personal professional profiles are only available for Doctors and Practices.
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Delete Professional Profile?"
        description={`Are you sure you want to delete ${confirmDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete Profile"
        destructive
        onConfirm={() => confirmDelete && deleteIntakeMutation.mutate({ id: confirmDelete.id, type: confirmDelete.type })}
      />
    </SiteLayout>
  );
}

function ODProfileEditor({ user, intake, onSave, isSaving, onDelete, resumeRef, handleResumeUpload, isUploadingResume }) {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: user?.email || "",
        phone: "",
        school: "",
        other_school: "",
        grad_year: "",
        years_in_practice: "",
        license_status: "",
        license_states: "",
        completed_residency: "No",
        residency_type: "",
        preferred_states: [],
        preferred_cities: "",
        open_to_relocation: "Maybe",
        practice_setting: [],
        practice_type_preference: "Open to either",
        clinical_interests: [],
        salary_expectation: "",
        position_type: "Full-Time",
        target_start_date: "",
        interest_in_ownership: "Open to it",
        job_priorities: [],
        anything_else: "",
    });

    useEffect(() => {
        if (intake) {
            setFormData({
                ...intake,
                email: intake.email || user?.email || "",
                phone: formatPhoneNumber(intake.phone || ""),
            });
        } else {
            // Reset to default if creating new
            setFormData({
                first_name: user?.full_name?.split(" ")[0] || "",
                last_name: user?.full_name?.split(" ").slice(1).join(" ") || "",
                email: user?.email || "",
                phone: "",
                school: "",
                other_school: "",
                grad_year: "",
                years_in_practice: "",
                license_status: "",
                completed_residency: "No",
                residency_type: "",
                preferred_states: [],
                preferred_cities: "",
                open_to_relocation: "Maybe",
                practice_setting: [],
                practice_type_preference: "Open to either",
                clinical_interests: [],
                salary_expectation: "",
                position_type: "Full-Time",
                target_start_date: "",
                interest_in_ownership: "Open to it",
                job_priorities: [],
                anything_else: "",
            });
        }
    }, [intake, user]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-8 shadow-soft space-y-10 animate-in fade-in duration-300">
            {/* Contact Information */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <User className="h-5 w-5 text-primary" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={formData.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="First Name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={formData.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Last Name" />
                    </div>
                    <div className="space-y-2 opacity-60">
                        <Label>Email Address (Managed by Account)</Label>
                        <Input value={formData.email} disabled placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", formatPhoneNumber(e.target.value))}
                          placeholder="(555) 123-4567"
                        />
                    </div>
                </div>
            </div>

            {/* Professional Background */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <GraduationCap className="h-5 w-5 text-primary" /> Professional Background
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Optometry School</Label>
                        <Select onValueChange={(v) => updateField("school", v)} value={formData.school}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select your school" />
                            </SelectTrigger>
                            <SelectContent>
                                {US_SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.school === "Other" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Specify School</Label>
                            <Input value={formData.other_school} onChange={(e) => updateField("other_school", e.target.value)} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Graduation Year</Label>
                        <Input value={formData.grad_year} onChange={(e) => updateField("grad_year", e.target.value)} placeholder="e.g. 2024" />
                    </div>
                    <div className="space-y-2">
                        <Label>Years in Practice</Label>
                        <Select onValueChange={(v) => updateField("years_in_practice", v)} value={formData.years_in_practice}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="New Grad (0-1 yr)">New Grad (0-1 yr)</SelectItem>
                                <SelectItem value="1-3 years">1-3 years</SelectItem>
                                <SelectItem value="3-5 years">3-5 years</SelectItem>
                                <SelectItem value="5-10 years">5-10 years</SelectItem>
                                <SelectItem value="10-20 years">10-20 years</SelectItem>
                                <SelectItem value="20+ years">20+ years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>License Status</Label>
                        <Select onValueChange={(v) => updateField("license_status", v)} value={formData.license_status}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Not yet licensed">Not yet licensed</SelectItem>
                                <SelectItem value="Licensed (1 state)">Licensed (1 state)</SelectItem>
                                <SelectItem value="Licensed (Multiple states)">Licensed (Multiple states)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {formData.license_status === "Licensed (Multiple states)" && (
                    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <Label>Please specify states</Label>
                            <Input value={formData.license_states} onChange={(e) => updateField("license_states", e.target.value)} placeholder="e.g. CA, NY, TX" />
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label>Did you complete a residency?</Label>
                        <RadioGroup value={formData.completed_residency} onValueChange={(v) => updateField("completed_residency", v)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Yes" id="res-yes" />
                                <Label htmlFor="res-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="No" id="res-no" />
                                <Label htmlFor="res-no">No</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {formData.completed_residency === "Yes" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Residency Type</Label>
                            <Input value={formData.residency_type} onChange={(e) => updateField("residency_type", e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Location & Preferences */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <MapPin className="h-5 w-5 text-primary" /> Location & Setting Preferences
                </h3>
                <div className="space-y-3">
                    <Label>Preferred States (Select all that apply)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 border border-border rounded-2xl p-4 bg-muted/20 max-h-[200px] overflow-y-auto">
                        {STATES.map(state => (
                            <div key={state} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`state-${state}`}
                                    checked={formData.preferred_states?.includes(state)}
                                    onCheckedChange={(checked) => {
                                        const current = formData.preferred_states || [];
                                        if (checked) updateField("preferred_states", [...current, state]);
                                        else updateField("preferred_states", current.filter(s => s !== state));
                                    }}
                                />
                                <label htmlFor={`state-${state}`} className="text-[10px] font-bold uppercase tracking-tight cursor-pointer">{state}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Preferred Cities (Optional)</Label>
                        <Input value={formData.preferred_cities} onChange={(e) => updateField("preferred_cities", e.target.value)} placeholder="e.g. San Francisco, Boston" />
                    </div>
                    <div className="space-y-4">
                        <Label>Open to Relocation?</Label>
                        <RadioGroup value={formData.open_to_relocation} onValueChange={(v) => updateField("open_to_relocation", v)} className="flex gap-4">
                            {["Yes", "No", "Maybe"].map(v => (
                                <div key={v} className="flex items-center space-x-2">
                                    <RadioGroupItem value={v} id={`reloc-${v}`} />
                                    <Label htmlFor={`reloc-${v}`}>{v}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
                <div className="space-y-3">
                    <Label>Practice Type Preference</Label>
                    <RadioGroup value={formData.practice_type_preference} onValueChange={(v) => updateField("practice_type_preference", v)} className="flex gap-4">
                        {["Private Practice", "Corporate", "Open to either"].map(v => (
                            <div key={v} className="flex items-center space-x-2">
                                <RadioGroupItem value={v} id={`type-pref-${v}`} />
                                <Label htmlFor={`type-pref-${v}`}>{v}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <div className="space-y-3">
                    <Label>Practice Setting Preferences</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            "Private Practice", "Corporate/Retail", "MD-OD Group",
                            "VA/Federal", "Academic", "Other"
                        ].map(setting => (
                            <div key={setting} className="flex items-center space-x-3 border border-border rounded-xl p-3 hover:bg-muted transition-colors">
                                <Checkbox
                                    id={`setting-${setting}`}
                                    checked={formData.practice_setting?.includes(setting)}
                                    onCheckedChange={(checked) => {
                                        const current = formData.practice_setting || [];
                                        if (checked) updateField("practice_setting", [...current, setting]);
                                        else updateField("practice_setting", current.filter(s => s !== setting));
                                    }}
                                />
                                <label htmlFor={`setting-${setting}`} className="text-sm font-medium cursor-pointer">{setting}</label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Clinical Interests */}
            <div className="space-y-4">
                <Label className="text-base md:text-lg font-bold">Clinical Interests</Label>
                <div className="flex flex-wrap gap-2">
                    {[
                        "Comprehensive", "Ocular Disease", "Pediatrics",
                        "Contact Lenses", "Vision Therapy", "Low Vision", "LASIK/Refractive"
                    ].map(interest => (
                        <button
                            key={interest}
                            type="button"
                            onClick={() => {
                                const current = formData.clinical_interests || [];
                                if (current.includes(interest)) updateField("clinical_interests", current.filter(i => i !== interest));
                                else updateField("clinical_interests", [...current, interest]);
                            }}
                            className={cn(
                                "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold border transition-all",
                                formData.clinical_interests?.includes(interest)
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            {interest}
                        </button>
                    ))}
                </div>
            </div>

            {/* Job Details */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <Briefcase className="h-5 w-5 text-primary" /> Job Specifics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Annual Salary Expectation</Label>
                        <Select onValueChange={(v) => updateField("salary_expectation", v)} value={formData.salary_expectation}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="$100k - $120k">$100k - $120k</SelectItem>
                                <SelectItem value="$120k - $140k">$120k - $140k</SelectItem>
                                <SelectItem value="$140k - $160k">$140k - $160k</SelectItem>
                                <SelectItem value="$160k - $180k">$160k - $180k</SelectItem>
                                <SelectItem value="$180k+">$180k+</SelectItem>
                                <SelectItem value="Best competitive offer">Best competitive offer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Position Type</Label>
                        <Select onValueChange={(v) => updateField("position_type", v)} value={formData.position_type}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full-Time">Full-Time</SelectItem>
                                <SelectItem value="Part-Time">Part-Time</SelectItem>
                                <SelectItem value="Either">Either</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Target Start Date</Label>
                        <Input value={formData.target_start_date} onChange={(e) => updateField("target_start_date", e.target.value)} placeholder="e.g. July 2024" />
                    </div>
                    <div className="space-y-4">
                        <Label>Interest in future ownership/buy-in?</Label>
                        <RadioGroup value={formData.interest_in_ownership} onValueChange={(v) => updateField("interest_in_ownership", v)} className="flex gap-4">
                            {["Yes", "No", "Open to it"].map(v => (
                                <div key={v} className="flex items-center space-x-2">
                                    <RadioGroupItem value={v} id={`own-${v}`} />
                                    <Label htmlFor={`own-${v}`}>{v}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
                <div className="space-y-3">
                    <Label>Job Priorities (Select 3)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            "Salary", "Work-Life Balance", "Mentorship",
                            "Ownership Potential", "Clinical Variety", "Location",
                            "Schedule Flexibility", "Sign-On Bonus"
                        ].map(priority => (
                            <div key={priority} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`prio-${priority}`}
                                    checked={formData.job_priorities?.includes(priority)}
                                    onCheckedChange={(checked) => {
                                        const current = formData.job_priorities || [];
                                        if (checked) updateField("job_priorities", [...current, priority]);
                                        else updateField("job_priorities", current.filter(p => p !== priority));
                                    }}
                                />
                                <label htmlFor={`prio-${priority}`} className="text-sm font-medium cursor-pointer">{priority}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea value={formData.anything_else} onChange={(e) => updateField("anything_else", e.target.value)} rows={4} placeholder="Specific goals, specialized equipment needs, etc." />
                </div>
            </div>

            {/* Resume Section */}
            <div className="pt-6 border-t border-border space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> Professional Resume</Label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border gap-4">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium">My Current Resume</p>
                            {intake?.resume_url ? (
                                <a href={intake.resume_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline font-bold truncate block">View File</a>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No resume uploaded yet</p>
                            )}
                        </div>
                    </div>
                    <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleResumeUpload} />
                    <Button variant="outline" size="sm" className="rounded-full w-full sm:w-auto" onClick={() => resumeRef.current?.click()} disabled={isUploadingResume || !intake?.id}>
                        {isUploadingResume ? "Uploading..." : intake?.id ? "Replace Resume" : "Save Profile first"}
                    </Button>
                </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Button onClick={() => onSave(formData)} disabled={isSaving} className="rounded-full px-12 h-12 shadow-elevated w-full sm:w-auto order-last sm:order-first">
                    <Save className="h-4 w-4 mr-2" /> {intake?.id ? "Save Professional Changes" : "Create Career Profile"}
                </Button>

                {intake?.id && (
                    <Button variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-6 order-first sm:order-last">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete This Profile
                    </Button>
                )}
            </div>
        </div>
    );
}

function PracticeProfileEditor({ user, intake, onSave, isSaving, onDelete }) {
    const [formData, setFormData] = useState({
        practice_name: "",
        contact_name: "",
        email: user?.email || "",
        phone: "",
        location: "",
        practice_type: "Independent Private Practice",
        num_ods: "0-1",
        position_type: "Full-Time",
        salary_range: "",
        production_bonus: "No",
        sign_on_bonus: "",
        relocation_assistance: "No",
        benefits: [],
        schedule: "",
        patient_volume: "2/hour",
        primary_care_type: [],
        new_grad_friendly: "Open to Both",
        mentorship_available: "Yes",
        ownership_track: "Future possibility",
        urgency: "Within 3 months",
        equipment_tech: "",
        anything_else: "",
    });

    useEffect(() => {
        if (intake) {
            setFormData({
                ...intake,
                email: intake.email || user?.email || "",
                phone: formatPhoneNumber(intake.phone || ""),
            });
        } else {
            setFormData({
                practice_name: "",
                contact_name: user?.full_name || "",
                email: user?.email || "",
                phone: "",
                location: "",
                practice_type: "Independent Private Practice",
                num_ods: "0-1",
                position_type: "Full-Time",
                salary_range: "",
                production_bonus: "No",
                sign_on_bonus: "",
                relocation_assistance: "No",
                benefits: [],
                schedule: "",
                patient_volume: "2/hour",
                primary_care_type: [],
                new_grad_friendly: "Open to Both",
                mentorship_available: "Yes",
                ownership_track: "Future possibility",
                urgency: "Within 3 months",
                equipment_tech: "",
                anything_else: "",
            });
        }
    }, [intake, user]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="rounded-2xl md:rounded-3xl border border-border bg-card p-5 md:p-8 shadow-soft space-y-10 animate-in fade-in duration-300">
            {/* Contact & Location */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <User className="h-5 w-5 text-primary" /> Contact & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Practice / Company Name</Label>
                        <Input value={formData.practice_name} onChange={(e) => updateField("practice_name", e.target.value)} placeholder="Main Street Eye Care" />
                    </div>
                    <div className="space-y-2">
                        <Label>Contact Name</Label>
                        <Input value={formData.contact_name} onChange={(e) => updateField("contact_name", e.target.value)} placeholder="Doctor Jane Smith" />
                    </div>
                    <div className="space-y-2 opacity-60">
                        <Label>Email Address (Managed by Account)</Label>
                        <Input value={formData.email} disabled placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={(e) => updateField("phone", formatPhoneNumber(e.target.value))}
                          placeholder="(555) 123-4567"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Practice Location (City, State)</Label>
                        <Input value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="City, State" />
                    </div>
                </div>
            </div>

            {/* Practice Details */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <Building2 className="h-5 w-5 text-primary" /> Practice & Position
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Practice Type</Label>
                        <Select onValueChange={(v) => updateField("practice_type", v)} value={formData.practice_type}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Independent Private Practice">Independent Private Practice</SelectItem>
                                <SelectItem value="PE-Backed Group">PE-Backed Group</SelectItem>
                                <SelectItem value="Corporate/Retail">Corporate/Retail</SelectItem>
                                <SelectItem value="MD-OD Group">MD-OD Group</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Current ODs on Staff</Label>
                        <Select onValueChange={(v) => updateField("num_ods", v)} value={formData.num_ods}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0-1">0-1</SelectItem>
                                <SelectItem value="2-3">2-3</SelectItem>
                                <SelectItem value="4-5">4-5</SelectItem>
                                <SelectItem value="6+">6+</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Position Type Needed</Label>
                        <Select onValueChange={(v) => updateField("position_type", v)} value={formData.position_type}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Full-Time">Full-Time</SelectItem>
                                <SelectItem value="Part-Time">Part-Time</SelectItem>
                                <SelectItem value="Either">Either</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Base Salary Range Offered</Label>
                        <Select onValueChange={(v) => updateField("salary_range", v)} value={formData.salary_range}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="$100k - $120k">$100k - $120k</SelectItem>
                                <SelectItem value="$120k - $140k">$120k - $140k</SelectItem>
                                <SelectItem value="$140k - $160k">$140k - $160k</SelectItem>
                                <SelectItem value="$160k - $180k">$160k - $180k</SelectItem>
                                <SelectItem value="$180k+">$180k+</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label>Production Bonus Available?</Label>
                        <RadioGroup value={formData.production_bonus} onValueChange={(v) => updateField("production_bonus", v)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="pb-yes" /><Label htmlFor="pb-yes">Yes</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="pb-no" /><Label htmlFor="pb-no">No</Label></div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-4">
                        <Label>Relocation Assistance?</Label>
                        <RadioGroup value={formData.relocation_assistance} onValueChange={(v) => updateField("relocation_assistance", v)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="ra-yes" /><Label htmlFor="ra-yes">Yes</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="ra-no" /><Label htmlFor="ra-no">No</Label></div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Sign-On Bonus Available? (Optional amount)</Label>
                    <Input value={formData.sign_on_bonus} onChange={(e) => updateField("sign_on_bonus", e.target.value)} placeholder="e.g. $5,000 or No" />
                </div>
            </div>

            {/* Offer & Requirements */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <DollarSign className="h-5 w-5 text-primary" /> Requirements & Benefits
                </h3>
                <div className="space-y-3">
                    <Label>Benefits Offered</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            "Health Insurance", "PTO", "Retirement/401k",
                            "CE Allowance", "Student Loan Help", "License/Dues",
                            "Malpractice", "Other"
                        ].map(benefit => (
                            <div key={benefit} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`benefit-e-${benefit}`}
                                    checked={formData.benefits?.includes(benefit)}
                                    onCheckedChange={(checked) => {
                                        const current = formData.benefits || [];
                                        if (checked) updateField("benefits", [...current, benefit]);
                                        else updateField("benefits", current.filter(b => b !== benefit));
                                    }}
                                />
                                <label htmlFor={`benefit-e-${benefit}`} className="text-sm font-medium cursor-pointer">{benefit}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Schedule</Label>
                        <Input value={formData.schedule} onChange={(e) => updateField("schedule", e.target.value)} placeholder="e.g. Mon-Fri 9-5, alternating Saturdays" />
                    </div>
                    <div className="space-y-2">
                        <Label>Patient Volume (patients/hour)</Label>
                        <Select onValueChange={(v) => updateField("patient_volume", v)} value={formData.patient_volume}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1/hour">1/hour</SelectItem>
                                <SelectItem value="2/hour">2/hour</SelectItem>
                                <SelectItem value="3/hour">3/hour</SelectItem>
                                <SelectItem value="4/hour">4/hour</SelectItem>
                                <SelectItem value="5+/hour">5+/hour</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-3">
                    <Label>Primary Care Type (Select all that apply)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                            "Routine/Comprehensive", "Medical Optometry", "Contact Lenses",
                            "Pediatrics", "Specialty", "Low Vision"
                        ].map(type => (
                            <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`type-e-${type}`}
                                    checked={formData.primary_care_type?.includes(type)}
                                    onCheckedChange={(checked) => {
                                        const current = formData.primary_care_type || [];
                                        if (checked) updateField("primary_care_type", [...current, type]);
                                        else updateField("primary_care_type", current.filter(t => t !== type));
                                    }}
                                />
                                <label htmlFor={`type-e-${type}`} className="text-sm font-medium cursor-pointer">{type}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label>New-Grad Friendly?</Label>
                        <RadioGroup value={formData.new_grad_friendly} onValueChange={(v) => updateField("new_grad_friendly", v)} className="flex flex-col gap-2">
                            {["Yes", "Prefer Experience", "Open to Both"].map(v => (
                                <div key={v} className="flex items-center space-x-2"><RadioGroupItem value={v} id={`nge-${v}`} /><Label htmlFor={`nge-${v}`}>{v}</Label></div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="space-y-4">
                        <Label>Mentorship Available?</Label>
                        <RadioGroup value={formData.mentorship_available} onValueChange={(v) => updateField("mentorship_available", v)} className="flex flex-col gap-2">
                            {["Yes", "No", "Limited"].map(v => (
                                <div key={v} className="flex items-center space-x-2"><RadioGroupItem value={v} id={`mentore-${v}`} /><Label htmlFor={`mentore-${v}`}>{v}</Label></div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
            </div>

            {/* Final Details */}
            <div className="space-y-6">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-border pb-3 text-foreground">
                    <Clock className="h-5 w-5 text-primary" /> Final Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Label>Ownership / Buy-In Track?</Label>
                        <RadioGroup value={formData.ownership_track} onValueChange={(v) => updateField("ownership_track", v)} className="flex gap-4">
                            {["Yes", "No", "Future possibility"].map(v => (
                                <div key={v} className="flex items-center space-x-2"><RadioGroupItem value={v} id={`own-e-${v}`} /><Label htmlFor={`own-e-${v}`}>{v}</Label></div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>How urgent is this hire?</Label>
                        <Select onValueChange={(v) => updateField("urgency", v)} value={formData.urgency}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Immediately">Immediately</SelectItem>
                                <SelectItem value="Within 3 months">Within 3 months</SelectItem>
                                <SelectItem value="Within 6 months">Within 6 months</SelectItem>
                                <SelectItem value="Planning ahead">Planning ahead</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Equipment / Technology</Label>
                    <Textarea value={formData.equipment_tech} onChange={(e) => updateField("equipment_tech", e.target.value)} rows={3} placeholder="List major equipment (OCT, visual fields, etc.)" />
                </div>
                <div className="space-y-2">
                    <Label>Practice Culture / What makes you unique?</Label>
                    <Textarea value={formData.anything_else} onChange={(e) => updateField("anything_else", e.target.value)} rows={4} placeholder="Describe the vibe, technology, and why an OD should join you." />
                </div>
            </div>

            <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Button onClick={() => onSave(formData)} disabled={isSaving} className="rounded-full px-12 h-12 shadow-elevated w-full sm:w-auto order-last sm:order-first">
                    <Save className="h-4 w-4 mr-2" /> {intake?.id ? "Save Practice Changes" : "Create Practice Profile"}
                </Button>

                {intake?.id && (
                    <Button variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full px-6 order-first sm:order-last">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete This Profile
                    </Button>
                )}
            </div>
        </div>
    );
}
