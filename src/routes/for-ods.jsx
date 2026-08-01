import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  Lock,
  CheckCircle2,
  ShieldCheck,
  Star,
  FileText,
  DollarSign,
  Scale,
  MessagesSquare,
  UserPlus,
  ArrowRight,
  GraduationCap,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Plus,
  Minus,
  Search,
  Users,
  TrendingUp,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ODIntakeForm } from "@/components/ODIntakeForm";
import { cn } from "@/lib/utils";
import { ConfidentialitySection } from "@/components/ConfidentialitySection";
import { InteractiveRoadmap } from "@/components/Illustrations";

export const Route = createFileRoute("/for-ods")({
  component: ForODs,
});

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={cn(
      "group rounded-[2rem] border transition-all duration-300 overflow-hidden",
      isOpen
        ? "border-primary/30 bg-primary/5 shadow-soft"
        : "border-border bg-card hover:border-primary/20 hover:shadow-soft"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 md:p-8 text-left outline-none"
      >
        <span className={cn(
          "text-lg md:text-xl font-black tracking-tight transition-colors",
          isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
        )}>
          {question}
        </span>
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300",
          isOpen ? "bg-primary text-primary-foreground rotate-0" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
      </button>
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="p-6 md:p-8 pt-0 text-muted-foreground font-medium leading-relaxed border-t border-primary/10 mt-2">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

function ForODs() {
  const [audience, setAudience] = useState("new-grad"); // 'new-grad' or 'experienced'

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary pt-10 pb-20 md:pt-12 md:pb-24 border-b border-border/30 text-white">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1600"
          alt="Optometry Eye Exam"
          className="absolute inset-0 w-full h-full object-cover opacity-100 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-transparent" />

        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-primary/5 blur-[100px] -z-10" />

        <div className="container-page relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Doctor owned and led</span>
                </div>

                {/* Audience Toggle */}
                <div className="inline-flex p-1.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md shadow-inner">
                  <button
                    onClick={() => setAudience("new-grad")}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      audience === "new-grad"
                        ? "bg-accent text-primary shadow-elevated"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <GraduationCap className="h-4 w-4" />
                    New Grad
                  </button>
                  <button
                    onClick={() => setAudience("experienced")}
                    className={cn(
                      "flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      audience === "experienced"
                        ? "bg-accent text-primary shadow-elevated"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Briefcase className="h-4 w-4" />
                    Experienced OD
                  </button>
                </div>
              </div>

              {audience === "new-grad" ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight md:leading-[1.1] text-white mb-6">
                    Graduating OD? <br />
                    <span className="text-accent underline decoration-4 underline-offset-8">Don't sign your first contract blind</span>
                  </h1>
                  <p className="mt-6 text-base md:text-lg text-white/80 leading-relaxed max-w-xl font-medium">
                    We've walked in your shoes. Get clinical-first mentorship, salary transparency, and direct introductions to the best private practices.
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight md:leading-[1.1] text-white mb-6">
                    Ready for a change? <br />
                    <span className="text-accent underline decoration-4 underline-offset-8">We'll handle the search, you keep your career private</span>
                  </h1>
                  <p className="mt-6 text-base md:text-lg text-white/80 leading-relaxed max-w-xl font-medium">
                    100% identity-stealth job matching. Find a practice that values your clinical expertise without the friction of public job boards.
                  </p>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-4 items-center">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg font-black bg-accent text-primary border-none shadow-elevated transition-all hover:scale-105 active:scale-95 hover:bg-accent/90" asChild>
                  <a href="#intake">
                    {audience === "new-grad" ? "Start Free Profile" : "Sign Up Stealthily"}
                  </a>
                </Button>
                <div className="flex flex-col">
                   <span className="text-xs font-black uppercase tracking-widest text-accent mb-1">Colleague Support</span>
                   <span className="text-sm font-bold text-white/70">Free & Confidential</span>
                </div>
              </div>
            </div>

            {/* Visual Side */}
            <div className="relative lg:pl-10 mt-12 lg:mt-0">
               <div className="absolute -inset-10 md:-inset-20 bg-accent/10 rounded-full blur-[80px] md:blur-[120px] opacity-50 -z-10" />

               <div className="relative group max-w-[500px] mx-auto lg:max-w-none">
                  <div className="absolute -inset-2 rounded-[3.5rem] md:rounded-[4.5rem] bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                  <div className="relative rounded-[2.5rem] md:rounded-[4rem] border-2 border-border/50 bg-card p-3 md:p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-700 hover:scale-[1.02]">
                    <div className="aspect-[4/5] md:aspect-square rounded-[2rem] md:rounded-[3.5rem] bg-muted/20 overflow-hidden relative border border-border/50">
                       <img
                         src="https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&q=80&w=1200"
                         alt="Optometrist performing eye exam"
                         className="absolute inset-0 w-full h-full object-cover opacity-60"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                       {/* Medical Card Mockup */}
                       <div className="absolute inset-0 p-4 md:p-8 flex flex-col gap-3 md:gap-6">
                          <div className="flex items-center justify-between">
                             <div className="h-4 md:h-6 w-24 md:w-32 bg-primary/20 rounded-full" />
                          </div>

                          <div className="space-y-2 md:space-y-4">
                             <div className="h-8 md:h-12 w-full bg-white rounded-xl md:rounded-2xl shadow-sm border border-border/50 p-2 md:p-4 flex items-center gap-2 md:gap-4">
                                <div className="h-3 w-3 md:h-5 md:w-5 rounded-full bg-accent/20 animate-pulse" />
                                <div className="h-2 w-28 md:h-3 md:w-36 bg-muted/40 rounded-full" />
                             </div>
                             <div className="h-8 md:h-12 w-3/4 bg-white/60 rounded-xl md:rounded-2xl border border-border/30 p-2 md:p-4 flex items-center gap-2 md:gap-4">
                                <div className="h-3 w-3 md:h-5 md:w-5 rounded-full bg-primary/20" />
                                <div className="h-2 w-20 md:h-3 md:w-28 bg-muted/40 rounded-full" />
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:gap-5 mt-1 md:mt-2">
                             <div className="h-20 md:h-28 rounded-[1rem] md:rounded-[1.5rem] bg-primary p-3 md:p-5 text-white shadow-elevated flex flex-col justify-between">
                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-70">Salary Audit</span>
                                <div className="text-lg md:text-2xl font-black">$165k+</div>
                                <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                   <div className="h-full w-3/4 bg-accent" />
                                </div>
                             </div>
                             <div className="h-20 md:h-28 rounded-[1rem] md:rounded-[1.5rem] bg-white border border-border shadow-soft p-3 md:p-5 flex flex-col justify-between">
                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground">Match Rating</span>
                                <div className="text-lg md:text-2xl font-black text-primary">98%</div>
                                <div className="flex gap-1">
                                   {[1,2,3,4,5].map(i => <div key={i} className="h-1 w-2 md:h-1.5 md:w-3 bg-accent rounded-full" />)}
                                </div>
                             </div>
                          </div>

                          <div className="mt-auto h-10 md:h-14 w-full rounded-lg md:rounded-2xl bg-accent text-primary flex items-center justify-center font-black text-[8px] md:text-[11px] tracking-widest uppercase shadow-elevated text-center">
                             Confidential Match Secured
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Floating Doctor Badge */}
                  <div className="absolute -bottom-6 -left-4 md:-bottom-12 md:-left-10 lg:-left-24 p-4 md:p-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-border shadow-2xl max-w-[160px] md:max-w-[220px] animate-float z-20">
                     <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                           <ShieldCheck className="h-4 w-4 md:h-6 md:w-6" />
                        </div>
                        <div>
                           <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest block">Colleague Vetted</span>
                           <span className="text-[7px] md:text-[8px] font-bold text-muted-foreground">Verified Member</span>
                        </div>
                     </div>
                     <p className="text-[9px] md:text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                       "Every practice is clinical-first vetted by our OD team."
                     </p>
                  </div>

                  {/* Floating Notification */}
                  <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 p-3 md:p-4 bg-primary text-white rounded-xl md:rounded-2xl shadow-2xl max-w-[120px] md:max-w-[150px] rotate-3 border-4 border-white z-20">
                     <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">New Match</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Roadmap Section - Updated to 6 Steps */}
      <section className="bg-muted/40 pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="container-page">
          <div className="mx-auto max-w-4xl text-center mb-16">
             <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">The Journey</span>
             <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight md:leading-[1.1] mb-8">
               Your Roadmap in <br /><span className="text-gradient">6 Simple Steps</span>
             </h2>
             <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
               We've broken down the career transition into a transparent, low-friction framework.
             </p>
          </div>

          <div className="max-w-6xl mx-auto">
             <InteractiveRoadmap
               className="w-full h-auto drop-shadow-xl"
               steps={[
                 { title: "Profile Creation" },
                 { title: "Career Profile" },
                 { title: "Match Search" },
                 { title: "The Call" },
                 { title: "Prep & Guide" },
                 { title: "Sign " },
               ]}
             />
          </div>

          <div className="max-w-5xl mx-auto space-y-6 mt-24">
             {[
               { step: "01", title: "Create Your Free Profile", desc: "Create your free, confidential profile in minutes." },
               { step: "02", title: "We Build Your Career Profile", desc: "We build your clinical career profile for you." },
               { step: "03", title: "We Find a Match", desc: "We find matches that fit your specific criteria." },
               { step: "04", title: "You Get the Call", desc: "Receive interview requests from interested practices." },
               { step: "05", title: "Interview Prep & Offer Guidance", desc: "One-on-one prep and guidance from our team." },
               { step: "06", title: "Sign With Confidence", desc: "Sign your contract with absolute confidence." },
             ].map((item) => (
               <FAQItem key={item.step} question={`${item.step}. ${item.title}`} answer={item.desc} />
             ))}
          </div>
        </div>
      </section>

      {/* What All ODs Receive (Free) */}
      <section className="relative bg-background py-20 md:py-32 overflow-hidden">

        <div className="container-page relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Exclusive Benefits</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight md:leading-[1.1] text-primary mb-8">
              What All ODs <br /><span className="text-gradient">Receive (Free)</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: FileText, title: "Resume/CV review and feedback" },
              { icon: DollarSign, title: "Salary guidance by region and practice setting" },
              { icon: ArrowUpRight, title: "Offer comparison support" },
              { icon: Scale, title: "Contract red-flag education", desc: "(not legal advice — we identify common issues to ask about)" },
              { icon: MessagesSquare, title: "Negotiation guidance" },
              { icon: CheckCircle2, title: "Job matching with verified practices" },
              { icon: UserPlus, title: "Direct introductions to practices aligned with their goals" },
              { icon: Users, title: "Interview prep resources and tips" },
              { icon: Briefcase, title: "Help understanding private practice vs. corporate offers" },
              { icon: TrendingUp, title: "Fast-track interviews in high-demand markets" },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-[3rem] bg-muted/20 border border-border group hover:border-primary/30 transition-all flex flex-col shadow-soft">
                <div className="h-14 w-14 rounded-2xl bg-white text-primary flex items-center justify-center mb-6 shadow-sm group-hover:bg-accent group-hover:text-white transition-colors">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black text-primary mb-2 leading-tight">{item.title}</h3>
                {item.desc && <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intake Form Section */}
      <section id="intake" className="container-page py-20 md:py-32 bg-muted/40 rounded-[3rem] mb-16 scroll-mt-24">
         <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Get Started</span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight md:leading-[1.1] mb-8">Create Your <br /><span className="text-gradient">Free Profile</span></h2>
              <p className="mt-4 text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Take the first step toward your next chapter. Our onboarding process is 100% confidential and takes less than 5 minutes.
              </p>
            </div>

            <div className="bg-card border border-border rounded-[3rem] p-8 md:p-20 shadow-elevated">
               <ODIntakeForm />
               <div className="text-sm text-left border-t border-border mt-16 pt-10">
                  <p className="font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    100% Confidentiality Guarantee
                  </p>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Your information is never shared with any practice without your explicit consent.
                    Practices cannot browse candidate profiles or see who has signed up.
                    We make the introduction — you decide if and when your name goes forward.
                  </p>
               </div>
            </div>
         </div>
      </section>
    </SiteLayout>
  );
}
