import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  Lock,
  Search,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Scale,
  GraduationCap,
  Sparkles,
  MessageSquare,
  UserPlus,
  ShieldCheck,
  Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RoadmapIllustration } from "@/components/Illustrations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorks,
});

function StepCard({ step, title, desc, icon: Icon, isDark = false, phaseLabel }) {
  return (
    <div className={cn(
      "group relative p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 shadow-soft hover:shadow-card flex flex-col",
      isDark
        ? "bg-primary text-white border-white/5 hover:border-accent/40"
        : "bg-card border-border hover:border-primary/20"
    )}>
      {phaseLabel && (
        <div className={cn(
          "absolute -top-4 left-8 px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border z-30",
          isDark
            ? "bg-accent text-primary border-accent shadow-elevated"
            : "bg-white text-primary border-primary/20 shadow-soft"
        )}>
          {phaseLabel}
        </div>
      )}

      <div className={cn(
        "absolute top-6 right-6 text-5xl font-black transition-colors duration-500",
        isDark ? "text-white/[0.03] group-hover:text-accent/[0.08]" : "text-foreground/[0.03] group-hover:text-primary/[0.05]"
      )}>
        {step}
      </div>

      <div className={cn(
        "h-14 w-14 rounded-2xl flex items-center justify-center mb-6 shadow-elevated transition-transform duration-500 group-hover:rotate-6",
        isDark ? "bg-accent text-primary" : "bg-primary text-white"
      )}>
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-black mb-3 tracking-tight leading-tight">{title}</h3>
      <p className={cn(
        "text-sm font-medium leading-relaxed flex-1",
        isDark ? "opacity-80" : "text-muted-foreground"
      )}>
        {desc}
      </p>
    </div>
  );
}

function HowItWorks() {
  return (
    <SiteLayout>
      {/* Hero Section - Dark (Primary) */}
      <section className="bg-primary pt-10 pb-10 md:pt-24 md:pb-24 text-white overflow-hidden relative border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2a9d9d_0%,transparent_50%)] opacity-[0.12]" />
        <div className="container-page relative z-10 text-center max-w-4xl mx-auto">
          <span className="section-eyebrow">The Master Plan</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 md:mb-8 leading-[1.15] md:leading-[1.05] text-white">The Methodology</h1>
          <p className="text-sm sm:text-lg md:text-xl opacity-90 font-medium leading-relaxed max-w-2xl mx-auto mb-6 md:mb-12 px-1">
            We've refined clinical recruitment into a transparent, low-friction framework
            built for the modern Doctor and practice owner.
          </p>
        </div>
      </section>

      {/* Tabs Section - Large Selector */}
      <section className="bg-background -mt-6 md:-mt-8 relative z-20 pt-8 pb-16 md:pt-20 md:pb-32">
        <div className="container-page">
          <Tabs defaultValue="ods" className="w-full">
            <div className="flex justify-center mb-10 md:mb-16">
              <TabsList className="grid w-full grid-cols-2 gap-1 max-w-lg h-auto sm:h-14 items-stretch rounded-2xl sm:rounded-full bg-muted/50 p-1 sm:p-1.5 border border-border shadow-elevated backdrop-blur-xl">
                <TabsTrigger
                  value="ods"
                  className="rounded-xl sm:rounded-full h-full w-full min-h-[3rem] sm:min-h-0 flex items-center justify-center gap-1.5 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] px-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-elevated transition-all"
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span className="leading-tight text-center">For Optometrists</span>
                </TabsTrigger>
                <TabsTrigger
                  value="practices"
                  className="rounded-xl sm:rounded-full h-full w-full min-h-[3rem] sm:min-h-0 flex items-center justify-center gap-1.5 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] px-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-elevated transition-all"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="leading-tight text-center">For Practices</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* OD Journey */}
            <TabsContent value="ods" className="mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
                  <div className="max-w-xl text-left">
                    <span className="section-eyebrow">OD Roadmap</span>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-primary leading-[1.1] md:leading-none mb-10">
                      Two Phases <br /><span className="text-gradient">Total Privacy</span>
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                      Phase 1 happens for every OD who signs up. Phase 2 is only activated when we have identified a real potential match.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-[4rem] blur-[100px] -z-10" />
                    <div className="p-8 rounded-[3rem] border border-primary/10 bg-primary/5">
                        <p className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> 100% Confidential
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                            "Steps 4–6 are only initiated when we have identified a specific practice that is a strong match for your profile AND is ready to interview. We do not activate every candidate — only those we can realistically move forward with based on current practice demand."
                        </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 pt-8">
                  <StepCard
                    step="01"
                    icon={FileText}
                    phaseLabel="Phase 1: After You Sign Up"
                    title="Create Your Profile"
                    desc="Tell us who you are, where you want to practice, and what matters most to you (5-minute form)."
                  />
                  <StepCard
                    step="02"
                    icon={UserCheck}
                    title="Verified Intake"
                    desc="We review your profile and add you to our verified candidate pool — you'll receive a confirmation and we may follow up by email or phone."
                  />
                  <StepCard
                    step="03"
                    icon={Search}
                    title="Stealth Sourcing"
                    desc="We begin looking for practices that match your goals, location, salary range, and setting — you do not need to do anything at this stage."
                  />
                  <StepCard
                    step="04"
                    icon={PhoneCall}
                    phaseLabel="Phase 2: When We Have a Match"
                    isDark={true}
                    title="The Match Alert"
                    desc="We contact you by email or phone with details about the opportunity — location, setting, salary, and practice type — before sharing your name with anyone."
                  />
                  <StepCard
                    step="05"
                    icon={MessageSquare}
                    isDark={true}
                    title="Interview Ready"
                    desc="If you say yes, we prep you for the interview, walk you through salary benchmarks, and help you understand the offer when it comes."
                  />
                  <StepCard
                    step="06"
                    icon={Scale}
                    isDark={true}
                    title="Sign With Confidence"
                    desc="Sign your contract knowing the compensation is fair, red flags have been identified, and you had a concierge in your corner."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Practice Journey */}
            <TabsContent value="practices" className="mt-0 outline-none animate-in fade-in zoom-in-95 duration-500">
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-32 text-left">
                  <div className="order-2 lg:order-1">
                    <div className="absolute inset-0 bg-accent/5 rounded-[4rem] blur-[100px] -z-10" />

                    {/* Pricing Transparency Table - Matching Practice Page Style */}
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-elevated">
                        <div className="bg-primary px-6 py-5">
                            <h4 className="text-lg font-black text-white flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-accent" />
                                Pricing Transparency
                            </h4>
                        </div>
                        <div className="divide-y divide-border">
                            <div className="p-6 grid grid-cols-2 items-center">
                                <span className="text-xs font-black text-foreground uppercase tracking-wider">Independent Practice</span>
                                <span className="text-base font-black text-primary text-right">$5,000 @ Hire + $5,000 @ 30 Days</span>
                            </div>
                            <div className="p-6 grid grid-cols-2 items-center bg-muted/20">
                                <span className="text-xs font-black text-foreground uppercase tracking-wider">Guarantee</span>
                                <span className="text-base font-black text-primary text-right">30-Day Free Replace</span>
                            </div>
                            <div className="p-6 grid grid-cols-2 items-center">
                                <span className="text-xs font-black text-foreground uppercase tracking-wider">Performance Based</span>
                                <div className="flex items-center justify-end gap-2 text-accent">
                                    <Check className="h-4 w-4" strokeWidth={3} />
                                    <span className="text-base font-black uppercase">Pay on Hire</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 text-center">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Zero Upfront Cost · Risk Free Recruitment</p>
                        </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2 max-w-xl">
                    <span className="section-eyebrow">Practice Roadmap</span>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-primary leading-tight md:leading-none mb-10">
                      Precision <br /><span className="text-gradient">Clinical Hiring</span>
                    </h2>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                      We manage every detail of the recruitment process, so you can focus on patient care while we source your next colleague.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <StepCard step="01" icon={Search} title="Hiring Request" desc="Submit your hiring request through our 10-minute form to define your ideal OD profile." />
                  <StepCard step="02" icon={TrendingUp} title="Position Review" desc="Our team reviews your position to confirm it's a good fit for our verified clinical candidate pool." />
                  <StepCard step="03" icon={Users} title="Network Sourcing" desc="We source pre-vetted, interested OD candidates matched to your location, salary, and setting." />
                  <StepCard step="04" icon={UserPlus} title="Qualified Intro" desc="We introduce you to qualified candidates — no cold resumes, and no wasted interview time." isDark={true} />
                  <StepCard step="05" icon={MessageSquare} title="Selection Process" desc="You interview the curated shortlist and select your hire with absolute confidence." isDark={true} />
                  <StepCard step="06" icon={DollarSign} title="Performance Pay" desc="You pay only after a successful hire — $5,000 at start and $5,000 at 30 days." isDark={true} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Alternating Dark Section - Trust Markers */}
      <section className="bg-primary pt-12 pb-20 md:pt-20 md:pb-32 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-full bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-[0.03] -z-0" />
        <div className="container-page relative z-10 text-center max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-12 leading-[1.1] md:leading-[0.9]">
            The Matchmaking <br /><span className="text-accent">Difference</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-10 mt-16">
            <div className="space-y-4">
              <div className="text-5xl font-black text-accent">30k+</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Active OD Network</p>
            </div>
            <div className="space-y-4 border-x border-white/10 px-8">
              <div className="text-5xl font-black text-accent">14d</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Avg. to First Interview</p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-black text-accent">$20k</div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Avg. Savings vs Agency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Light */}
      <section className="bg-background pt-12 pb-20 md:pt-20 md:pb-32 text-center">
        <div className="container-page">
          <div className="max-w-4xl mx-auto rounded-[3.5rem] bg-muted/40 border border-border p-10 md:p-20 shadow-elevated relative overflow-hidden">
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
             <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.1] md:leading-[0.9]">Ready to <br /><span className="text-gradient">start?</span></h2>
             <p className="text-lg md:text-xl text-muted-foreground font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
               Whether you are an OD looking for your next career move or a practice
               owner ready to hire, we are here to guide you.
             </p>
             <div className="flex flex-wrap justify-center gap-6">
               <Button asChild size="lg" className="rounded-full px-10 h-16 text-lg font-black bg-primary text-white shadow-elevated transition-transform hover:scale-105">
                 <Link to="/auth" search={{ mode: 'register' }}>Select Your Path</Link>
               </Button>
               <Button asChild size="lg" variant="outline" className="rounded-full px-10 h-16 text-lg font-black border-primary text-primary hover:bg-primary/5 transition-transform hover:scale-105">
                 <Link to="/contact">Talk to a Recruiter</Link>
               </Button>
             </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
