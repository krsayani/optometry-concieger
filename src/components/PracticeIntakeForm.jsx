import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Users,
  DollarSign,
  Clock,
  Briefcase,
  Stethoscope,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Info,
  Building,
  MapPin,
  Calendar,
  Rocket
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

const schema = z.object({
  // Step 1: Contact
  contactName: z.string().min(2, "Required"),
  practiceName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .refine((v) => phoneDigits(v).length === 10, "Enter a valid 10-digit phone number"),
  location: z.string().min(5, "City, State required"),

  // Step 2: Practice Details
  practiceType: z.string().min(1, "Required"),
  numODs: z.string().min(1, "Required"),
  positionType: z.string().min(1, "Required"),
  salaryRange: z.string().min(1, "Required"),
  productionBonus: z.string().min(1, "Required"),
  signOnBonus: z.string().optional(),
  relocationAssistance: z.string().min(1, "Required"),

  // Step 3: Offer
  benefits: z.array(z.string()).min(1, "Select at least one"),
  schedule: z.string().min(1, "Required"),
  patientVolume: z.string().min(1, "Required"),
  primaryCareType: z.array(z.string()).min(1, "Select at least one"),
  newGradFriendly: z.string().min(1, "Required"),
  mentorshipAvailable: z.string().min(1, "Required"),

  // Step 4: Final
  equipmentTech: z.string().min(5, "Please describe your equipment"),
  ownershipTrack: z.string().min(1, "Required"),
  urgency: z.string().min(1, "Required"),
  anythingElse: z.string().min(20, "Please describe your practice culture"),
  agreeToFee: z.boolean().refine(v => v === true, "You must agree to the fee terms to proceed"),
  agreeToTerms: z.boolean().refine(v => v === true, "You must agree to proceed"),
});

export function PracticeIntakeForm() {
  const { user, roles } = useAuth();
  const isSuperAdmin = roles.includes("super_admin");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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
      contactName: "",
      practiceName: "",
      email: "",
      phone: "",
      location: "",
      benefits: [],
      schedule: "",
      patientVolume: "2/hour",
      primaryCareType: [],
      agreeToTerms: false,
      practiceType: "Independent Private Practice",
      numODs: "0-1",
      positionType: "Full-Time",
      salaryRange: "",
      productionBonus: "No",
      relocationAssistance: "No",
      signOnBonus: "",
      newGradFriendly: "Open to Both",
      mentorshipAvailable: "Yes",
      ownershipTrack: "Future possibility",
      urgency: "Within 3 months",
      equipmentTech: "",
      anythingElse: "",
      agreeToFee: false,
      agreeToTerms: false,
    }
  });

  // Pre-fill email if logged in
  useEffect(() => {
    if (user?.email) {
      setValue("email", user.email);
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
      case 1: return ["contactName", "practiceName", "email", "phone", "location"];
      case 2: return ["practiceType", "numODs", "positionType", "salaryRange", "productionBonus", "relocationAssistance"];
      case 3: return ["benefits", "schedule", "patientVolume", "primaryCareType", "newGradFriendly", "mentorshipAvailable"];
      case 4: return ["ownershipTrack", "urgency", "equipmentTech", "anythingElse", "agreeToFee", "agreeToTerms"];
      default: return [];
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // 0. Preliminary Check: See if this email is already registered in Auth
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
        const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: tempPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/reset-password`,
            data: {
              full_name: data.contactName,
              role: "employer"
            }
          }
        });

        if (authError) throw authError;
        userId = authData.user?.id;

        if (!userId) {
            throw new Error("Account creation failed. Please try again.");
        }
      } else {
        await supabase.rpc("ensure_user_role", {
          target_user_id: userId,
          target_role: "employer"
        });
      }

      // 2. Save intake response
      const { error } = await supabase
        .from("employer_intake_responses")
        .insert({
          user_id: userId,
          contact_name: data.contactName,
          practice_name: data.practiceName,
          email: data.email,
          phone: data.phone,
          location: data.location,
          practice_type: data.practiceType,
          num_ods: data.numODs,
          position_type: data.positionType,
          salary_range: data.salaryRange,
          production_bonus: data.productionBonus,
          sign_on_bonus: data.signOnBonus,
          relocation_assistance: data.relocationAssistance,
          benefits: data.benefits,
          schedule: data.schedule,
          patient_volume: data.patientVolume,
          primary_care_type: data.primaryCareType,
          new_grad_friendly: data.newGradFriendly,
          mentorship_available: data.mentorshipAvailable,
          equipment_tech: data.equipmentTech,
          ownership_track: data.ownershipTrack,
          urgency: data.urgency,
          anything_else: data.anythingElse,
          consent: data.agreeToTerms && data.agreeToFee
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Hiring Request Submitted!");

      if (!user) {
        toast.info("Check your email to verify your account and set your password.");
      }
    } catch (error) {
      console.error("Error submitting employer intake:", error);
      let message = "We couldn't submit your request. Please check your information and try again.";

      const errorMsg = error.message?.toLowerCase() || "";

      if (errorMsg.includes("already registered") || errorMsg.includes("email already in use") || errorMsg.includes("unique constraint")) {
        message = "An account with this email already exists. Please sign in instead.";
      } else if (errorMsg.includes("email rate limit exceeded")) {
        message = "Too many attempts. Please wait a few minutes before trying again.";
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (errors) => {
    console.error("Form validation errors:", errors);
    toast.error("Some information is missing or incorrect.", {
      description: "Please review the form and ensure all required fields are filled out.",
    });
  };

  if (submitted) {
    return (
      <div className="text-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success mb-6">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Request Received</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Thank you for trusting Optometry Concierge with your search. A team member will review your practice requirements and reach out within 48 business hours.
        </p>

        <div className="p-6 rounded-2xl bg-muted border border-border inline-block text-left mb-8">
           <h4 className="font-bold text-sm uppercase tracking-widest mb-3">Next Steps</h4>
           <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><span>1.</span> <span>We audit your requirements against our OD network.</span></li>
              <li className="flex gap-2"><span>2.</span> <span>We clinically vet potential matches for your culture.</span></li>
              <li className="flex gap-2"><span>3.</span> <span>You'll get a call to discuss the top candidates.</span></li>
           </ul>
        </div>

        {!user && (
           <div className="block max-w-sm mx-auto p-5 rounded-2xl bg-primary/5 border border-primary/20 text-left">
              <p className="text-xs text-muted-foreground leading-relaxed">
                 We've created a temporary account for you. <strong>Check your email</strong> to verify your account and set a password to track your hiring roadmap.
              </p>
           </div>
        )}
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
              Administrative accounts cannot create practice hiring profiles.
              Please sign out and use a practice account.
            </p>
          </div>
        </div>
      ) : user && !roles.includes("employer") && (
        <div className="mb-10 p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
             <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Add Practice Role</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are signed in. Submitting this request will add practice management features to your account.
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-primary uppercase tracking-widest">Step {step} of 4</span>
          <span className="text-sm text-muted-foreground font-medium">
            {step === 1 && "Practice & Contact Info"}
            {step === 2 && "Position Details"}
            {step === 3 && "Requirements & Culture"}
            {step === 4 && "Review & Confidentiality"}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="practiceName">Practice Name</Label>
                   <Input id="practiceName" {...register("practiceName")} placeholder="Main Street Eye Care" />
                   {errors.practiceName && <p className="text-xs text-destructive">{errors.practiceName.message}</p>}
                </div>
                <div className="space-y-2">
                   <Label htmlFor="contactName">Contact Name</Label>
                   <Input id="contactName" {...register("contactName")} placeholder="Doctor Jane Smith" />
                   {errors.contactName && <p className="text-xs text-destructive">{errors.contactName.message}</p>}
                </div>
             </div>

             <div className="grid sm:grid-cols-2 gap-4">
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
                        placeholder="doctor.smith@example.com"
                        className={cn(!emailAvailable && "border-destructive focus-visible:ring-destructive")}
                        disabled={!!user}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                   </div>
                   {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                   {!emailAvailable && !errors.email && <p className="text-xs text-destructive">Already registered. Please login.</p>}
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

             <div className="space-y-2">
                <Label htmlFor="location">Practice Location</Label>
                <Input id="location" {...register("location")} placeholder="City, State" />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-2">
                <Label>Practice Type</Label>
                <Select onValueChange={(v) => setValue("practiceType", v)} defaultValue={formValues.practiceType}>
                  <SelectTrigger>
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

             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Current ODs on Staff</Label>
                   <Select onValueChange={(v) => setValue("numODs", v)} defaultValue={formValues.numODs}>
                    <SelectTrigger>
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

             <div className="space-y-2">
                <Label>Base Salary Range Offered</Label>
                <Select onValueChange={(v) => setValue("salaryRange", v)} defaultValue={formValues.salaryRange}>
                  <SelectTrigger>
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
                {errors.salaryRange && <p className="text-xs text-destructive">{errors.salaryRange.message}</p>}
             </div>

             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <Label>Production Bonus?</Label>
                    <RadioGroup defaultValue={formValues.productionBonus} onValueChange={(v) => setValue("productionBonus", v)} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="py" /><Label htmlFor="py">Yes</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="pn" /><Label htmlFor="pn">No</Label></div>
                    </RadioGroup>
                </div>
                <div className="space-y-4">
                    <Label>Relocation Help?</Label>
                    <RadioGroup defaultValue={formValues.relocationAssistance} onValueChange={(v) => setValue("relocationAssistance", v)} className="flex gap-4">
                       <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="ry" /><Label htmlFor="ry">Yes</Label></div>
                       <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="rn" /><Label htmlFor="rn">No</Label></div>
                    </RadioGroup>
                </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-3">
                <Label>Benefits Offered</Label>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     "Health Insurance", "PTO", "Retirement/401k",
                     "CE Allowance", "Student Loan Help", "License/Dues",
                     "Malpractice"
                   ].map(benefit => (
                     <div key={benefit} className="flex items-center space-x-2 border border-border rounded-xl p-3 bg-card hover:bg-accent transition-colors">
                        <Checkbox
                          id={`benefit-${benefit}`}
                          checked={formValues.benefits.includes(benefit)}
                          onCheckedChange={(checked) => {
                            const current = formValues.benefits;
                            if (checked) setValue("benefits", [...current, benefit]);
                            else setValue("benefits", current.filter(b => b !== benefit));
                          }}
                        />
                        <label htmlFor={`benefit-${benefit}`} className="text-sm font-medium leading-none cursor-pointer">
                          {benefit}
                        </label>
                     </div>
                   ))}
                </div>
             </div>

             <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="schedule">Typical Schedule</Label>
                   <Input id="schedule" {...register("schedule")} placeholder="e.g. Mon-Fri 9-5" />
                </div>
                <div className="space-y-2">
                   <Label>Patient Volume</Label>
                   <Select onValueChange={(v) => setValue("patientVolume", v)} defaultValue={formValues.patientVolume}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1/hour">1/hour</SelectItem>
                      <SelectItem value="2/hour">2/hour</SelectItem>
                      <SelectItem value="3/hour">3/hour</SelectItem>
                      <SelectItem value="4+/hour">4+/hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="space-y-3">
                <Label>Primary Care Types</Label>
                <div className="flex flex-wrap gap-2">
                   {[
                     "Comprehensive", "Medical", "Contact Lenses",
                     "Pediatrics", "Vision Therapy", "Low Vision"
                   ].map(type => (
                     <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const current = formValues.primaryCareType;
                          if (current.includes(type)) setValue("primaryCareType", current.filter(t => t !== type));
                          else setValue("primaryCareType", [...current, type]);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          formValues.primaryCareType.includes(type)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        )}
                     >
                        {type}
                     </button>
                   ))}
                </div>
             </div>

             <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                   <Label>New-Grad Friendly?</Label>
                   <RadioGroup defaultValue={formValues.newGradFriendly} onValueChange={(v) => setValue("newGradFriendly", v)} className="flex flex-col gap-2">
                      {["Yes", "Prefer Experience", "Open to Both"].map(v => (
                        <div key={v} className="flex items-center space-x-2"><RadioGroupItem value={v} id={`ng-${v}`} /><Label htmlFor={`ng-${v}`}>{v}</Label></div>
                      ))}
                   </RadioGroup>
                </div>
                <div className="space-y-3">
                   <Label>Mentorship Available?</Label>
                   <RadioGroup defaultValue={formValues.mentorshipAvailable} onValueChange={(v) => setValue("mentorshipAvailable", v)} className="flex flex-col gap-2">
                      {["Yes", "No", "Limited"].map(v => (
                        <div key={v} className="flex items-center space-x-2"><RadioGroupItem value={v} id={`m-${v}`} /><Label htmlFor={`m-${v}`}>{v}</Label></div>
                      ))}
                   </RadioGroup>
                </div>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="space-y-2">
                <Label htmlFor="equipmentTech">Major Equipment / Tech</Label>
                <Textarea id="equipmentTech" {...register("equipmentTech")} placeholder="OCT, Optos, Visual Field, EHR, etc." />
             </div>
             <div className="space-y-2">
                <Label htmlFor="anythingElse">Practice Culture / Vibe</Label>
                <Textarea id="anythingElse" {...register("anythingElse")} placeholder="Describe your team, patient base, and why an OD should join you." />
             </div>

             <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-primary">
                       <DollarSign className="h-5 w-5" />
                       Fee Agreement
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                        <p>Optometry Concierge operates on a <strong>Success-Only</strong> basis. There are no upfront costs, monthly retainers, or job posting fees.</p>
                        <p>Our placement fee is only earned if you hire a candidate introduced by our team. This covers our full-service clinical vetting and headhunting efforts.</p>
                    </div>
                    <div className="flex items-start space-x-3 pt-2">
                        <Checkbox
                          id="agreeToFee"
                          checked={formValues.agreeToFee}
                          onCheckedChange={(checked) => setValue("agreeToFee", !!checked)}
                          className="mt-1"
                        />
                        <Label htmlFor="agreeToFee" className="text-sm font-medium leading-tight cursor-pointer">
                          I agree to the fee structure and understand that payment is only due upon a successful hire.
                        </Label>
                    </div>
                    {errors.agreeToFee && <p className="text-xs text-destructive">{errors.agreeToFee.message}</p>}
                </div>

                <div className="rounded-2xl border border-border bg-muted/30 p-6 space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                       <Lock className="h-5 w-5 text-primary" />
                       Practice Confidentiality
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                       Your practice details remain private. We do not post your name on public job boards.
                       We only introduce pre-vetted candidates who fit your clinical and cultural requirements.
                    </p>
                    <div className="space-y-4 pt-4 border-t border-border">
                       <div className="flex items-start space-x-3">
                          <Checkbox
                            id="agreeToTerms"
                            checked={formValues.agreeToTerms}
                            onCheckedChange={(checked) => setValue("agreeToTerms", !!checked)}
                            className="mt-1"
                          />
                          <Label htmlFor="agreeToTerms" className="text-sm font-medium leading-tight cursor-pointer">
                            I agree to the general terms and conditions of Optometry Concierge.
                          </Label>
                       </div>
                       {errors.agreeToTerms && <p className="text-xs text-destructive">{errors.agreeToTerms.message}</p>}
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-4 pt-8 border-t border-border">
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

              {step < 4 ? (
                <Button
                   type="button"
                   onClick={(e) => { e.preventDefault(); nextStep(); }}
                   className="rounded-full px-8 shadow-soft w-full sm:w-auto"
                   disabled={isSuperAdmin}
                >
                   Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                   type="submit"
                   disabled={isSubmitting || isSuperAdmin}
                   className="rounded-full px-10 shadow-elevated w-full sm:w-auto"
                >
                   {isSubmitting ? "Submitting..." : "Submit Hiring Request"}
                </Button>
              )}
           </div>
        </div>
      </form>

      <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
         <Lock className="h-3 w-3" />
         Encrypted & Secure Submission
      </div>
    </div>
  );
}
