import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Info,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  UserPlus,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, formatPhoneNumber, phoneDigits } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { checkEmailAvailability } from "@/services/profiles";
import { notifyAdminOfIntake } from "@/lib/notify-intake";
import { CaptchaChallenge } from "@/components/CaptchaChallenge";

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

const schema = z.object({
  // Step 1: Contact & Account
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .refine((v) => phoneDigits(v).length === 10, "Enter a valid 10-digit phone number"),

  // Step 2: Professional
  school: z.string().min(1, "Please select a school"),
  otherSchool: z.string().optional(),
  gradYear: z.string().min(4, "Graduation year is required"),
  licenseStatus: z.string().min(1, "Required"),
  licenseStates: z.string().optional(),
  yearsInPractice: z.string().min(1, "Required"),
  completedResidency: z.string().default("No"),
  residencyType: z.string().optional(),

  // Step 3: Preferences
  preferredStates: z.array(z.string()).min(1, "Select at least one state"),
  preferredCities: z.string().optional(),
  openToRelocation: z.string().min(1, "Required"),
  practiceSetting: z.array(z.string()).min(1, "Select at least one setting"),
  practiceTypePreference: z.string().min(1, "Required"),
  clinicalInterests: z.array(z.string()).min(1, "Select at least one interest"),

  // Step 4: Details
  salaryExpectation: z.string().min(1, "Required"),
  targetStartDate: z.string().min(1, "Required"),
  jobPriorities: z.array(z.string()).min(1, "Select at least one priority"),
  interestInOwnership: z.string().min(1, "Required"),
  anythingElse: z.string().optional(),
  positionType: z.string().min(1, "Required"),
  resumeUrl: z.string().optional(),
  resumeSelected: z.boolean().refine(v => v === true, "Resume is required"),

  // Consent
  consent: z.boolean().refine(v => v === true, "You must agree to proceed"),
}).superRefine((data, ctx) => {
  if (data.licenseStatus === "Licensed (Multiple states)" && (!data.licenseStates || data.licenseStates.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify the states",
      path: ["licenseStates"],
    });
  }
}).refine((data) => {
  // Only require password if not logged in
  return true; // Simplified for now, will handle in component
}, {
  message: "Password is required for new accounts",
  path: ["password"],
});

export function ODIntakeForm() {
  const { user, roles } = useAuth();
  const isSuperAdmin = roles.includes("super_admin");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      school: "",
      otherSchool: "",
      gradYear: "",
      licenseStatus: "",
      licenseStates: "",
      yearsInPractice: "",
      completedResidency: "No",
      residencyType: "",
      preferredStates: [],
      preferredCities: "",
      openToRelocation: "Maybe",
      practiceSetting: [],
      practiceTypePreference: "Open to either",
      clinicalInterests: [],
      salaryExpectation: "",
      targetStartDate: "",
      jobPriorities: [],
      interestInOwnership: "Open to it",
      positionType: "Full-Time",
      resumeSelected: false,
      anythingElse: "",
      consent: false,
    }
  });

  // Pre-fill email and check for existing profile if logged in
  useEffect(() => {
    if (user?.email) {
      setValue("email", user.email);

      // Check for existing profile
      const checkProfile = async () => {
        const { data } = await supabase
          .from("od_intake_responses")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) setHasExistingProfile(true);
      };
      checkProfile();
    }
  }, [user, setValue]);

  const formValues = watch();

  const handleEmailBlur = async (e) => {
    const email = e.target.value;
    if (!email || errors.email) return;

    setIsCheckingEmail(true);
    try {
      const isAvailable = await checkEmailAvailability(email);
      setEmailAvailable(isAvailable);
      if (!isAvailable) {
        toast.error("Email already exists", {
          description: "An account with this email already exists. Please sign in instead.",
        });
      }
    } catch (err) {
      console.error("Error checking email:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const nextStep = async () => {
    const fields = getStepFields(step);

    const isValid = await trigger(fields);
    if (isValid) {
      if (step === 1 && !emailAvailable) {
        toast.error("Please use a different email address.");
        return;
      }
      setStep(s => s + 1);
    } else {
      toast.error("Please fill in all required fields correctly before continuing.");
    }
  };

  const prevStep = () => setStep(s => s - 1);

  const getStepFields = (step) => {
    switch (step) {
      case 1: return ["firstName", "lastName", "email", "phone"];
      case 2: return ["school", "gradYear", "licenseStatus", "licenseStates", "yearsInPractice", "completedResidency"];
      case 3: return ["preferredStates", "openToRelocation", "practiceSetting", "practiceTypePreference", "clinicalInterests"];
      case 4: return ["salaryExpectation", "targetStartDate", "jobPriorities", "interestInOwnership", "positionType"];
      case 5: return ["consent", "resumeSelected"];
      default: return [];
    }
  };

  const onSubmit = async (data) => {
    if (!captchaVerified) {
      toast.error("Complete the security check", {
        description: "Solve the captcha before submitting your profile.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 0. Preliminary Check: See if this user already has a profile if logged in
      if (user) {
        const { data: existingProfile } = await supabase
          .from("od_intake_responses")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingProfile) {
          toast.error("Profile already exists", {
            description: "You have already created a career profile. Please visit your dashboard to view or edit it.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 0.1 Preliminary Check: See if this email is already registered in Auth
      // Skip check if user is already logged in and using their own email
      if (!user || data.email !== user.email) {
        const isAvailable = await checkEmailAvailability(data.email);

        if (!isAvailable) {
          toast.error("Email already exists", {
            description: "An account with this email already exists. Please sign in instead.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      let userId = user?.id;

      // 1. Create account if not logged in
      if (!user) {
        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: tempPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/reset-password`,
            data: {
              full_name: `${data.firstName} ${data.lastName}`,
              role: "od"
            }
          }
        });

        // If Supabase email sending is throttled, still notify admin with the full profile
        if (authError?.message?.toLowerCase().includes("rate limit")) {
          await notifyAdminOfIntake("od", {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            school: data.school,
            otherSchool: data.otherSchool,
            gradYear: data.gradYear,
            licenseStatus: data.licenseStatus,
            licenseStates: data.licenseStates,
            yearsInPractice: data.yearsInPractice,
            completedResidency: data.completedResidency,
            residencyType: data.residencyType,
            preferredStates: data.preferredStates,
            preferredCities: data.preferredCities,
            openToRelocation: data.openToRelocation,
            practiceSetting: data.practiceSetting,
            practiceTypePreference: data.practiceTypePreference,
            clinicalInterests: data.clinicalInterests,
            salaryExpectation: data.salaryExpectation,
            targetStartDate: data.targetStartDate,
            jobPriorities: data.jobPriorities,
            interestInOwnership: data.interestInOwnership,
            positionType: data.positionType,
            anythingElse: data.anythingElse,
            resumeUrl: null,
          });
          setSubmitted(true);
          setCaptchaResetKey((k) => k + 1);
          setCaptchaVerified(false);
          toast.success("Profile submitted successfully!");
          toast.info("We received your profile. Account setup email will follow shortly.");
          return;
        }

        if (authError) throw authError;
        userId = authData.user?.id;

        if (!userId) {
            console.error("Auth success but no user ID returned. Check Supabase settings.");
            throw new Error("Account creation failed. Please try again or contact support.");
        }
      } else {
        // If already logged in, ensure they have the 'od' role
        await supabase.rpc("ensure_user_role", {
          target_user_id: userId,
          target_role: "od"
        });
      }

      // 2. Upload resume FIRST so we can include the URL in the intake response
      let finalResumeUrl = null;
      if (resumeFile) {
        setIsUploading(true);
        const fileExt = resumeFile.name.split('.').pop();
        // Use user ID for folder organization
        const folder = userId;
        const fileName = `${folder}/resume-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
            console.error("Resume upload failed:", uploadError);
            toast.warning("Resume upload failed. You can upload it later from your profile.");
        } else {
            const { data: { publicUrl } } = supabase.storage
              .from('resumes')
              .getPublicUrl(fileName);
            finalResumeUrl = publicUrl;
        }
      }

      // 3. Save intake response
      const { error: dbError } = await supabase
        .from("od_intake_responses")
        .insert({
          user_id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          school: data.school,
          other_school: data.otherSchool,
          grad_year: data.gradYear,
          license_status: data.licenseStatus,
          license_states: data.licenseStates,
          years_in_practice: data.yearsInPractice,
          completed_residency: data.completedResidency,
          residency_type: data.residencyType,
          preferred_states: data.preferredStates,
          preferred_cities: data.preferredCities,
          open_to_relocation: data.openToRelocation,
          practice_setting: data.practiceSetting,
          practice_type_preference: data.practiceTypePreference,
          clinical_interests: data.clinicalInterests,
          salary_expectation: data.salaryExpectation,
          target_start_date: data.targetStartDate,
          job_priorities: data.jobPriorities,
          interest_in_ownership: data.interestInOwnership,
          anything_else: data.anythingElse,
          position_type: data.positionType,
          consent: data.consent,
          resume_url: finalResumeUrl
        });

      if (dbError) throw dbError;

      const emailed = await notifyAdminOfIntake("od", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        school: data.school,
        otherSchool: data.otherSchool,
        gradYear: data.gradYear,
        licenseStatus: data.licenseStatus,
        licenseStates: data.licenseStates,
        yearsInPractice: data.yearsInPractice,
        completedResidency: data.completedResidency,
        residencyType: data.residencyType,
        preferredStates: data.preferredStates,
        preferredCities: data.preferredCities,
        openToRelocation: data.openToRelocation,
        practiceSetting: data.practiceSetting,
        practiceTypePreference: data.practiceTypePreference,
        clinicalInterests: data.clinicalInterests,
        salaryExpectation: data.salaryExpectation,
        targetStartDate: data.targetStartDate,
        jobPriorities: data.jobPriorities,
        interestInOwnership: data.interestInOwnership,
        positionType: data.positionType,
        anythingElse: data.anythingElse,
        resumeUrl: finalResumeUrl,
      });

      setSubmitted(true);
      setCaptchaResetKey((k) => k + 1);
      setCaptchaVerified(false);
      toast.success("Profile Created Successfully!");
      if (!emailed) {
        toast.warning("Profile saved, but admin email notification failed.", {
          description: "Please email Admin@optometryconcierge.com so we know you submitted.",
        });
      }

      if (!user) {
          toast.info("Check your email to verify your account and set your password.");
      }

    } catch (error) {
      console.error("Error submitting intake:", error);
      let message = "We couldn't create your profile. Please check your information and try again.";

      const errorMsg = error.message?.toLowerCase() || "";

      if (errorMsg.includes("already registered") || errorMsg.includes("email already in use") || errorMsg.includes("unique constraint")) {
        message = "An account with this email already exists. Please sign in instead.";
      }

      setCaptchaResetKey((k) => k + 1);
      setCaptchaVerified(false);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const onInvalid = (errors) => {
    console.error("Form validation errors:", errors);
    toast.error("Some information is missing or incorrect.", {
      description: "Please review the form and ensure all required fields are filled out.",
    });
  };

  if (submitted || hasExistingProfile) {
    return (
      <div className="text-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className={cn(
          "inline-flex h-20 w-20 items-center justify-center rounded-full mb-6",
          hasExistingProfile ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
        )}>
          {hasExistingProfile ? <Info className="h-10 w-10" /> : <Check className="h-10 w-10" />}
        </div>
        <h2 className="text-3xl font-bold mb-4">
          {hasExistingProfile ? "Profile Already Exists" : "You're in good hands."}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          {hasExistingProfile
            ? "You have already created a career profile. Please visit your dashboard to view or edit it."
            : "Thank you for trusting Optometry Concierge with your career. A team member will review your profile and reach out within 48 business hours."}
        </p>
        <div className="p-6 rounded-2xl bg-muted border border-border inline-block text-left">
           <h4 className="font-bold text-sm uppercase tracking-widest mb-3">Next Steps</h4>
           <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><span>1.</span> <span>We build your verified career profile.</span></li>
              <li className="flex gap-2"><span>2.</span> <span>We begin matching you with top practices.</span></li>
              <li className="flex gap-2"><span>3.</span> <span>You'll get a call when we have a match.</span></li>
           </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {isSuperAdmin ? (
        <div className="mb-10 p-6 rounded-3xl bg-destructive/5 border border-destructive/20 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
             <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Administrative Restriction</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are signed in as a **Super Admin**. Administrative accounts cannot create professional OD profiles.
              Please sign out and use a candidate account to fill this form.
            </p>
          </div>
        </div>
      ) : user && !roles.includes("od") && (
        <div className="mb-10 p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
             <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Add Optometrist (OD) Role</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are signed in. Completing this form will add the **OD role** to your existing account,
              giving you a dual-mode dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Step {step} of 5</span>
          <span className="text-sm text-muted-foreground font-medium">
            {step === 1 && "Account Information"}
            {step === 2 && "Professional Background"}
            {step === 3 && "Location & Setting Preferences"}
            {step === 4 && "Job Specifics"}
            {step === 5 && "Review & Consent"}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="firstName">First Name</Label>
                   <Input id="firstName" {...register("firstName")} placeholder="First Name" />
                   {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                   <Label htmlFor="lastName">Last Name</Label>
                   <Input id="lastName" {...register("lastName")} placeholder="Last Name" />
                   {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    onBlur={(e) => {
                      register("email").onBlur(e);
                      handleEmailBlur(e);
                    }}
                    placeholder="email@example.com"
                    className={cn(!emailAvailable && "border-destructive focus-visible:ring-destructive")}
                    disabled={!!user}
                  />
                  {isCheckingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  )}
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                {!emailAvailable && !errors.email && <p className="text-xs text-destructive">This email is already registered. Please login instead.</p>}
                {!user && <p className="text-[10px] text-muted-foreground italic">We'll use this as your primary contact and login.</p>}
             </div>

             <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(555) 123-4567"
                  {...register("phone", {
                    onChange: (e) => {
                      e.target.value = formatPhoneNumber(e.target.value);
                    },
                  })}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Optometry School</Label>
                  <Select onValueChange={(v) => setValue("school", v)} defaultValue={formValues.school}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your school" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.school && <p className="text-xs text-destructive">{errors.school.message}</p>}
                </div>

                {formValues.school === "Other" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="otherSchool">Please Specify School</Label>
                    <Input id="otherSchool" {...register("otherSchool")} placeholder="Enter school name" />
                  </div>
                )}
             </div>

             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="gradYear">Graduation Year</Label>
                   <Input id="gradYear" {...register("gradYear")} placeholder="e.g. 2024" />
                   {errors.gradYear && <p className="text-xs text-destructive">{errors.gradYear.message}</p>}
                   <p className="text-[10px] text-muted-foreground italic">Approximate is fine if many years ago.</p>
                </div>
                <div className="space-y-2">
                   <Label htmlFor="yearsInPractice">Years in Practice</Label>
                   <Select onValueChange={(v) => setValue("yearsInPractice", v)} defaultValue={formValues.yearsInPractice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
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
                   {errors.yearsInPractice && <p className="text-xs text-destructive">{errors.yearsInPractice.message}</p>}
                </div>
             </div>
             <div className="space-y-2">
                <Label>License Status</Label>
                <Select onValueChange={(v) => setValue("licenseStatus", v)} defaultValue={formValues.licenseStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not yet licensed">Not yet licensed</SelectItem>
                    <SelectItem value="Licensed (1 state)">Licensed (1 state)</SelectItem>
                    <SelectItem value="Licensed (Multiple states)">Licensed (Multiple states)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.licenseStatus && <p className="text-xs text-destructive">{errors.licenseStatus.message}</p>}
             </div>
             {formValues.licenseStatus === "Licensed (Multiple states)" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <Label htmlFor="licenseStates">Please specify states</Label>
                   <Input id="licenseStates" {...register("licenseStates")} placeholder="e.g. CA, NY, TX" />
                   {errors.licenseStates && <p className="text-xs text-destructive">{errors.licenseStates.message}</p>}
                </div>
             )}
             <div className="space-y-4">
                <Label>Did you complete a residency?</Label>
                <RadioGroup
                  defaultValue={formValues.completedResidency}
                  onValueChange={(v) => setValue("completedResidency", v)}
                  className="flex flex-wrap gap-4"
                >
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
             {formValues.completedResidency === "Yes" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   <Label htmlFor="residencyType">Residency Type</Label>
                   <Input id="residencyType" {...register("residencyType")} placeholder="e.g. Ocular Disease" />
                </div>
             )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-3">
                <Label>Preferred States / Regions (Select all that apply)</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 h-48 overflow-y-auto border border-border rounded-xl p-4 bg-muted/20">
                   {STATES.map(state => (
                     <div key={state} className="flex items-center space-x-2">
                        <Checkbox
                          id={`state-${state}`}
                          checked={formValues.preferredStates.includes(state)}
                          onCheckedChange={(checked) => {
                            const current = formValues.preferredStates;
                            if (checked) setValue("preferredStates", [...current, state]);
                            else setValue("preferredStates", current.filter(s => s !== state));
                          }}
                        />
                        <label htmlFor={`state-${state}`} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {state}
                        </label>
                     </div>
                   ))}
                </div>
                {errors.preferredStates && <p className="text-xs text-destructive">{errors.preferredStates.message}</p>}
             </div>

             <div className="space-y-2">
                <Label>Open to Relocation?</Label>
                <RadioGroup
                  defaultValue={formValues.openToRelocation}
                  onValueChange={(v) => setValue("openToRelocation", v)}
                  className="flex flex-wrap gap-4"
                >
                   {["Yes", "No", "Maybe"].map(v => (
                     <div key={v} className="flex items-center space-x-2">
                        <RadioGroupItem value={v} id={`reloc-${v}`} />
                        <Label htmlFor={`reloc-${v}`}>{v}</Label>
                     </div>
                   ))}
                </RadioGroup>
             </div>

             <div className="space-y-3">
                <Label>Practice Setting Preference</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                   {[
                     "Private Practice", "Corporate/Retail", "MD-OD Group",
                     "VA/Federal", "Academic", "Other"
                   ].map(setting => (
                     <div key={setting} className="flex items-center space-x-2 border border-border rounded-xl p-3 bg-card hover:bg-accent transition-colors">
                        <Checkbox
                          id={`setting-${setting}`}
                          checked={formValues.practiceSetting.includes(setting)}
                          onCheckedChange={(checked) => {
                            const current = formValues.practiceSetting;
                            if (checked) setValue("practiceSetting", [...current, setting]);
                            else setValue("practiceSetting", current.filter(s => s !== setting));
                          }}
                        />
                        <label htmlFor={`setting-${setting}`} className="text-sm font-medium leading-none">
                          {setting}
                        </label>
                     </div>
                   ))}
                </div>
                {errors.practiceSetting && <p className="text-xs text-destructive">{errors.practiceSetting.message}</p>}
             </div>

             <div className="space-y-3">
                <Label>Clinical Interests</Label>
                <div className="flex flex-wrap gap-2">
                   {[
                     "Comprehensive", "Ocular Disease", "Pediatrics",
                     "Contact Lenses", "Vision Therapy", "Low Vision", "LASIK/Refractive"
                   ].map(interest => (
                     <button
                        key={interest}
                        type="button"
                        onClick={() => {
                          const current = formValues.clinicalInterests;
                          if (current.includes(interest)) setValue("clinicalInterests", current.filter(i => i !== interest));
                          else setValue("clinicalInterests", [...current, interest]);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          formValues.clinicalInterests.includes(interest)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        )}
                     >
                        {interest}
                     </button>
                   ))}
                </div>
                {errors.clinicalInterests && <p className="text-xs text-destructive">{errors.clinicalInterests.message}</p>}
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-2">
                <Label>Annual Salary Expectation</Label>
                <Select onValueChange={(v) => setValue("salaryExpectation", v)} defaultValue={formValues.salaryExpectation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
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
                {errors.salaryExpectation && <p className="text-xs text-destructive">{errors.salaryExpectation.message}</p>}
             </div>

             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="targetStartDate">Target Start Date</Label>
                   <Input id="targetStartDate" {...register("targetStartDate")} placeholder="e.g. July 2024" />
                   {errors.targetStartDate && <p className="text-xs text-destructive">{errors.targetStartDate.message}</p>}
                </div>
                <div className="space-y-2">
                   <Label>Position Type</Label>
                   <Select onValueChange={(v) => setValue("positionType", v)} defaultValue={formValues.positionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-Time">Full-Time</SelectItem>
                      <SelectItem value="Part-Time">Part-Time</SelectItem>
                      <SelectItem value="Either">Either</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="space-y-3">
                <Label>What are your top job priorities? (Select 3)</Label>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     "Salary", "Work-Life Balance", "Mentorship",
                     "Ownership Potential", "Clinical Variety", "Location",
                     "Schedule Flexibility", "Sign-On Bonus"
                   ].map(priority => (
                     <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`prio-${priority}`}
                          checked={formValues.jobPriorities.includes(priority)}
                          onCheckedChange={(checked) => {
                            const current = formValues.jobPriorities;
                            if (checked) setValue("jobPriorities", [...current, priority]);
                            else setValue("jobPriorities", current.filter(p => p !== priority));
                          }}
                        />
                        <label htmlFor={`prio-${priority}`} className="text-sm font-medium leading-none">
                          {priority}
                        </label>
                     </div>
                   ))}
                </div>
                {errors.jobPriorities && <p className="text-xs text-destructive">{errors.jobPriorities.message}</p>}
             </div>

             <div className="space-y-3">
                <Label>Interest in future ownership/buy-in?</Label>
                <RadioGroup
                  defaultValue={formValues.interestInOwnership}
                  onValueChange={(v) => setValue("interestInOwnership", v)}
                  className="flex flex-wrap gap-4"
                >
                   {["Yes", "No", "Open to it"].map(v => (
                     <div key={v} className="flex items-center space-x-2">
                        <RadioGroupItem value={v} id={`own-${v}`} />
                        <Label htmlFor={`own-${v}`}>{v}</Label>
                     </div>
                   ))}
                </RadioGroup>
             </div>

             <div className="space-y-2">
                <Label htmlFor="anythingElse">Anything else we should know? (Optional)</Label>
                <Textarea id="anythingElse" {...register("anythingElse")} placeholder="Specific goals, specialized equipment needs, etc." />
             </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                   <Lock className="h-5 w-5 text-primary" />
                   Review & Privacy
                </h3>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    <strong className="text-foreground">The Core Privacy Model:</strong> Optometry Concierge operates as a private,
                    confidential matchmaking service — not a public job board. Candidate profiles are never visible to practices.
                    Practice listings are never visible to candidates.
                  </p>
                  <p>
                    We are the connection layer between the two sides. Neither party sees the other until we make
                    a deliberate, <span className="text-primary font-bold italic">consent-based introduction</span>.
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-border">
                   <div className="flex items-start space-x-3">
                      <Checkbox
                        id="consent"
                        checked={formValues.consent}
                        onCheckedChange={(checked) => setValue("consent", !!checked)}
                        className="mt-1"
                      />
                      <Label htmlFor="consent" className="text-sm font-medium leading-tight cursor-pointer">
                        I understand that my information is kept confidential and will only be shared
                        with practices after I give explicit consent.
                      </Label>
                   </div>
                   {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
                </div>
             </div>

             <div className="p-6 rounded-2xl border border-dashed border-border bg-card">
                <div className="flex flex-col items-center text-center">
                   <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                   </div>
                   <h4 className="font-bold">Upload Your Resume</h4>
                   <p className="text-xs text-muted-foreground mt-1">PDF or Word doc (Max 5MB)</p>

                   <div className="mt-4 w-full max-w-xs">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size > 5 * 1024 * 1024) {
                            toast.error("File is too large. Max 5MB allowed.");
                            e.target.value = null;
                            return;
                          }
                          setResumeFile(file);
                          setValue("resumeSelected", !!file, { shouldValidate: true });
                        }}
                        className="hidden"
                        id="resume-upload"
                      />
                      <Label
                        htmlFor="resume-upload"
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-full px-6 py-2 text-sm font-semibold border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-pointer",
                          resumeFile && "bg-success/5 border-success/20 text-success",
                          errors.resumeSelected && "border-destructive bg-destructive/5 text-destructive"
                        )}
                      >
                        {resumeFile ? (
                          <>
                            <Check className="h-4 w-4" /> {resumeFile.name}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" /> Select File
                          </>
                        )}
                      </Label>
                      {errors.resumeSelected && <p className="mt-2 text-xs text-destructive">{errors.resumeSelected.message}</p>}
                      {resumeFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            setValue("resumeSelected", false, { shouldValidate: true });
                          }}
                          className="mt-2 text-xs text-destructive hover:underline"
                        >
                          Remove file
                        </button>
                      )}
                   </div>
                </div>
             </div>

             <CaptchaChallenge
               resetKey={captchaResetKey}
               onVerifiedChange={setCaptchaVerified}
             />
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-4 pt-8 border-t border-border">
           {step === 5 && (
             <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-2 animate-in fade-in slide-in-from-bottom-2">
                <Lock className="h-3 w-3 text-primary" />
                Your information is 100% confidential
             </div>
           )}
           <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
              <Button
                 type="button"
                 variant="ghost"
                 onClick={prevStep}
                 disabled={step === 1 || isSubmitting}
                 className={cn("rounded-full px-6 w-full sm:w-auto", step === 1 && "invisible")}
              >
                 <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {step < 5 ? (
                <Button
                   key="next-step-button"
                   type="button"
                   onClick={(e) => {
                     e.preventDefault();
                     nextStep();
                   }}
                   className="rounded-full px-8 shadow-soft w-full sm:w-auto"
                   disabled={isSuperAdmin}
                >
                   Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                   key="submit-form-button"
                   type="submit"
                   disabled={isSubmitting || isSuperAdmin || !captchaVerified}
                   className="rounded-full px-10 shadow-elevated w-full sm:w-auto"
                >
                   {isSubmitting ? "Submitting..." : "Submit My Profile"}
                </Button>
              )}
           </div>
        </div>
      </form>

      {step < 5 && (
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
           <Lock className="h-3 w-3" />
           Encrypted & Secure Submission
        </div>
      )}
    </div>
  );
}
