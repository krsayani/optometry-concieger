import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  CheckCircle2,
  Zap,
  ShieldCheck,
  DollarSign,
  Users,
  Lock,
  ArrowRight,
  TrendingUp,
  Search,
  MessageSquare,
  Briefcase,
  Scale,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeIntakeForm } from "@/components/PracticeIntakeForm";
import { ConfidentialitySection } from "@/components/ConfidentialitySection";
import { cn } from "@/lib/utils";
import { InteractiveRoadmap, OptometryIllustration } from "@/components/Illustrations";

export const Route = createFileRoute("/for-practices")({
  component: ForPractices,
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
        className="flex w-full items-center justify-between gap-3 p-4 sm:p-6 md:p-8 text-left outline-none"
      >
        <span className={cn(
          "text-base sm:text-lg md:text-xl font-black tracking-tight transition-colors pr-2",
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

function ForPractices() {
  useEffect(() => {
    if (window.location.hash === "#intake") {
      requestAnimationFrame(() => {
        document.getElementById("intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  return (
    <SiteLayout>
      {/* Hero Section - Elevated & Professional */}
      <section className="relative overflow-hidden bg-primary pt-8 pb-14 md:pt-12 md:pb-24 border-b border-border/30 text-white">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1600"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-45 md:animate-kenburns"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute top-0 left-0 w-1/3 h-full bg-accent/15 blur-[120px] pointer-events-none" />

        <div className="container-page relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <div>
              <p className="font-serif text-accent text-lg md:text-2xl italic mb-4 md:mb-6">
                Optometry Concierge
              </p>

              <h1 className="text-[1.65rem] sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight md:leading-[1.1] text-white mb-4 md:mb-6 text-balance">
                Recruiters send resumes
                <br />
                <span className="font-serif italic font-semibold text-accent">
                  We send ready-to-hire ODs
                </span>
              </h1>

              <p className="mt-4 md:mt-6 text-sm md:text-lg text-white/80 font-medium leading-relaxed max-w-xl">
                The recruitment alternative with Doctor owned and led. Skip the corporate headhunters and access a pre-vetted pipeline of high-retention clinical talent.
              </p>

              <div className="mt-7 md:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
                <Button size="lg" className="rounded-full w-full sm:w-auto px-6 md:px-10 h-12 md:h-14 text-base md:text-lg font-black bg-accent text-primary border-none shadow-elevated transition-all hover:scale-105 active:scale-95 hover:bg-accent/90" asChild>
                  <a href="#intake">Find Your Next OD</a>
                </Button>
                <div className="flex flex-col text-center sm:text-left">
                   <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-accent mb-0.5">Clinical-First Vetting</span>
                   <span className="text-xs md:text-sm font-bold text-white/70">Performance Based Fee</span>
                </div>
              </div>

              <div className="mt-8 md:mt-16 pt-6 md:pt-10 border-t border-white/10 grid grid-cols-1 xs:grid-cols-3 sm:flex sm:flex-wrap gap-x-8 gap-y-3 md:gap-y-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.14em] md:tracking-[0.2em] text-white/50">
                <span className="inline-flex items-center gap-2.5 md:gap-3">
                  <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-accent shrink-0" /> No Upfront Costs
                </span>
                <span className="inline-flex items-center gap-2.5 md:gap-3">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-accent shrink-0" /> Private Sourcing
                </span>
                <span className="inline-flex items-center gap-2.5 md:gap-3">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-accent shrink-0" /> OD-to-OD Matching
                </span>
              </div>
            </div>

            {/* Enhanced Visual Side - Practice Portal Mockup */}
            <div className="relative lg:pl-10 mt-4 lg:mt-0 hidden sm:block">
               <div className="absolute -inset-10 md:-inset-20 bg-primary/5 rounded-full blur-[80px] md:blur-[120px] opacity-50 -z-10" />

               <div className="relative group max-w-[500px] mx-auto lg:max-w-none">
                  <div className="absolute -inset-2 rounded-[3.5rem] md:rounded-[4.5rem] bg-gradient-to-br from-accent/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                  <div className="relative rounded-[2.5rem] md:rounded-[3rem] border-2 border-border/50 bg-card p-3 md:p-4 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-700 hover:scale-[1.01]">
                    <div className="aspect-[4/5] md:aspect-square rounded-[2rem] md:rounded-[2.5rem] bg-muted/20 overflow-hidden relative border border-border/50">
                       <img
                            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                         alt="Slit Lamp Exam Room"
                         className="absolute inset-0 w-full h-full object-cover opacity-60"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                       {/* Recruitment Portal Mockup */}
                       <div className="absolute inset-0 p-4 md:p-8 flex flex-col gap-3 md:gap-5">
                          <div className="flex items-center justify-between">
                             <div className="h-4 md:h-6 w-24 md:w-32 bg-primary/20 rounded-full" />
                             <div className="flex -space-x-2 md:-space-x-3">
                                {[1,2,3].map(i => (
                                  <div key={i} className="h-7 w-7 md:h-9 md:w-9 rounded-full border-2 border-white bg-accent/20 overflow-hidden">
                                     <img src={`https://images.unsplash.com/photo-${i === 1 ? '1612349317150-e413f6a5b16d' : i === 2 ? '1594824476967-48c8b964273f' : '1622253692010-333f2da6031d'}?auto=format&fit=crop&q=80&w=100`} alt="OD" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className="bg-white/80 backdrop-blur-md rounded-[1.2rem] md:rounded-[2rem] p-3 md:p-5 border border-white/50 shadow-soft">
                             <div className="flex items-center justify-between mb-2 md:mb-3">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">Candidate Pipeline</span>
                                <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-accent animate-pulse" />
                             </div>
                             <div className="space-y-2 md:space-y-3">
                                <div className="h-8 md:h-10 w-full bg-muted/30 rounded-lg md:rounded-xl flex items-center px-2 md:px-3 gap-2">
                                   <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-accent" />
                                   <div className="h-2 md:h-2.5 w-20 md:w-28 bg-foreground/10 rounded-full" />
                                   <div className="ml-auto text-[7px] md:text-[9px] font-black uppercase text-primary">Pre-Vetted</div>
                                </div>
                                <div className="h-8 md:h-10 w-full bg-muted/10 rounded-lg md:rounded-xl flex items-center px-2 md:px-3 gap-2">
                                   <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-accent/30" />
                                   <div className="h-2 md:h-2.5 w-16 md:w-20 bg-foreground/10 rounded-full" />
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 md:gap-5">
                             <div className="bg-primary rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-5 text-white shadow-elevated">
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-60">Avg Saving</span>
                                <div className="text-lg md:text-2xl font-black mt-0.5">$20k+</div>
                             </div>
                             <div className="bg-white border border-border rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-5 shadow-soft">
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground">Match Accuracy</span>
                                <div className="text-lg md:text-2xl font-black text-primary mt-0.5">92%</div>
                             </div>
                          </div>

                          <div className="mt-auto bg-accent rounded-lg md:rounded-xl h-8 md:h-12 flex items-center justify-center text-primary font-black text-[9px] md:text-[11px] uppercase tracking-[0.15em] shadow-elevated">
                             New Interview Ready OD
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Floating Stats Badge */}
                  <div className="absolute -bottom-6 -right-4 md:-bottom-12 md:-right-10 lg:-right-16 p-4 md:p-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-border shadow-2xl max-w-[160px] md:max-w-[220px] animate-float z-20">
                     <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <TrendingUp className="h-4 w-4 md:h-6 md:w-6" />
                        </div>
                        <div>
                           <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest block">Network Growth</span>
                           <span className="text-[7px] md:text-[8px] font-bold text-muted-foreground">Nationwide Coverage</span>
                        </div>
                     </div>
                     <p className="text-[9px] md:text-[11px] font-medium text-muted-foreground leading-relaxed">
                       Access a nationwide pool of ODs through our private, Doctor-vetted network.
                     </p>
                  </div>

                  {/* Trust Shield */}
                  <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 p-3 md:p-4 bg-primary text-white rounded-xl md:rounded-2xl shadow-2xl max-w-[130px] md:max-w-[160px] -rotate-3 border-4 border-white z-20">
                     <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                        <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-accent" />
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Confidential</span>
                     </div>
                     <p className="text-[8px] md:text-[10px] font-bold">Stealth Sourcing Enabled</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Profile Form — top of page */}
      <section id="intake" className="container-page py-10 sm:py-14 md:py-20 bg-muted/40 rounded-2xl md:rounded-[3rem] my-6 md:my-14 scroll-mt-20 md:scroll-mt-24">
         <div className="max-w-5xl mx-auto">
            <div className="text-center mb-7 md:mb-14">
              <span className="section-eyebrow">Get Started</span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight mb-3 md:mb-4">
                Create a <span className="text-gradient">Profile</span>
              </h2>
              <p className="mt-2 text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed px-1">
                Take the first step toward finding your next great associate. Our team will follow up within 24 hours.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl sm:rounded-2xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-12 shadow-elevated">
               <PracticeIntakeForm />
               <div className="text-sm text-left border-t border-border mt-8 md:mt-12 pt-6 md:pt-8">
                  <p className="font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-3">
                    <Lock className="h-5 w-5 text-primary" />
                    100% Confidential Search
                  </p>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    We never post your position on public job boards. Your practice details are
                    only shared with candidates after they have been vetted and you have
                    approved the introduction.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Practice Benefits Section */}
      <section className="relative bg-background py-20 md:py-32 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516062423079-7ca13cdc7f52?auto=format&fit=crop&q=80&w=1600"
          alt="Optometry Exam"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.08] pointer-events-none"
        />
        <div className="container-page relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="section-eyebrow">The Concierge Advantage</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-primary mb-8">
              Hire Smarter <br /><span className="text-gradient">Grow Sustainably</span>
            </h2>
            <p className="mt-6 text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              We provide a clinical-first recruitment layer that traditional headhunters and job boards simply can't match.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: UserPlus,
                title: "Pre-Vetted, Interview-Ready Candidates",
                desc: "Skip the resume review. Every candidate is interviewed and clinically vetted by an OD on our team before they reach your inbox."
              },
              {
                icon: DollarSign,
                title: "No Upfront Cost — Pay Only on Hire",
                desc: "Our model is performance-based. You only pay a flat fee once you've successfully hired your next associate."
              },
              {
                icon: Zap,
                title: "Faster Than a Job Board, Cheaper Than a Recruiter",
                desc: "We leverage our private, nationwide network of ODs to find matches in weeks, not months, at a fraction of the standard 20% commission."
              }
            ].map((item, i) => (
              <div key={i} className="p-8 md:p-10 rounded-[2.5rem] bg-muted/20 border border-border group hover:border-primary/30 transition-all text-left flex flex-col shadow-soft hover:shadow-card">
                <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center mb-8 shadow-elevated group-hover:bg-accent transition-colors">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-primary mb-4 tracking-tight leading-tight">{item.title}</h3>
                <p className="text-base text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Pricing Section */}
      <section className="bg-muted/30 py-20 md:py-32">
        <div className="container-page">
          <div className="max-w-4xl mx-auto text-center mb-24">
            <span className="section-eyebrow">Transparent Pricing</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-10 leading-tight">
              Pricing <span className="text-gradient">Transparency</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
              We believe in clear, upfront pricing. Our competitors hide their fees — we show them clearly because our value speaks for itself.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[3rem] border border-border bg-card shadow-elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="p-8 text-xs font-black uppercase tracking-[0.2em]">Practice Type</th>
                    <th className="p-8 text-xs font-black uppercase tracking-[0.2em]">Fee Structure</th>
                    <th className="p-8 text-xs font-black uppercase tracking-[0.2em]">Guarantee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { type: "Independent Private Practice", fee: "$5,000 at hire + $5,000 at 30 days", guarantee: "Free replacement if OD leaves within 30 days" },
                    { type: "Corporate / High-Demand Markets", fee: "$15,000–$20,000 per successful hire", guarantee: "Contact us for details" },
                    { type: "No hire = no fee", fee: "You only pay when you hire", guarantee: "Zero upfront cost" },
                  ].map((row) => (
                    <tr key={row.type} className="group hover:bg-muted/30 transition-colors">
                      <td className="p-8 text-lg font-black text-foreground">{row.type}</td>
                      <td className="p-8 text-lg font-bold text-primary">{row.fee}</td>
                      <td className="p-8 text-base text-muted-foreground font-medium">{row.guarantee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-primary/5 p-10 text-center">
               <p className="text-xl font-bold text-primary italic">"Our goal is to be the most affordable and effective clinical partner for your practice."</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - DarkLight */}
      <section className="bg-muted/30 py-16 md:py-32 border-t border-border/50">
         <div className="container-page">

            <div className="max-w-5xl mx-auto">
               <div className="text-center mb-24">
                 <span className="section-eyebrow">Common Questions</span>
                 <h2 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight mb-10">
                   Practice <br />
                   <span className="text-gradient">Questions</span>
                 </h2>
               </div>

               <div className="space-y-6">
                 <FAQItem
                   question="How does your flat-fee model work?"
                   answer="Unlike traditional recruiters who charge 20-30% of an OD's salary (often $30k+), we charge a single flat fee of $10,000. You pay nothing upfront, and the fee is only due after a successful hire."
                 />
                 <FAQItem
                   question="Where do you find your candidates?"
                   answer="We leverage a private, nationwide network of optometrists. This includes new grads from top schools as well as established ODs who are looking for a confidential change in practice setting."
                 />
                 <FAQItem
                   question="Do you vet candidates' clinical skills?"
                   answer="Yes. Every candidate we present has undergone a clinical vetting session with an experienced OD from our concierge team to ensure they meet the clinical standards of your practice."
                 />
                 <FAQItem
                   question="What if a hire doesn't work out?"
                   answer="We include a 30-day replacement guarantee. If a candidate leaves within the first 30 days, we will source a replacement match for your practice at no additional cost."
                 />
                 <FAQItem
                   question="Is our hiring need kept confidential?"
                   answer="Absolutely. We never post your practice name or location on public job boards. We only share details with pre-vetted candidates who have expressed direct interest in your specific role type."
                 />
               </div>
            </div>
         </div>
      </section>

    </SiteLayout>
  );
}
