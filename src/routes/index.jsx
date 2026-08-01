import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Star,
  CheckCircle2,
  FileText,
  DollarSign,
  Scale,
  MessagesSquare,
  UserPlus,
  UserCheck,
  Rocket,
  ArrowUpRight,
  Quote,
  Building2,
  Search,
} from "lucide-react";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ConfidentialitySection } from "@/components/ConfidentialitySection";
import { DoctorOwnedSection } from "@/components/DoctorOwnedSection";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConciergeIllustration, RoadmapIllustration, OptometryIllustration, InteractiveRoadmap } from "@/components/Illustrations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Optometry Concierge — From graduation to great offer" },
      {
        name: "description",
        content:
          "Free career concierge and job placement service for optometry students, new grads, and established ODs.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle accidental redirects to home during authentication (e.g. from email links)
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check if we arrived here with an access token in the hash (Supabase default behavior)
      const hash = window.location.hash;
      if (hash && (hash.includes("access_token=") || hash.includes("type=recovery") || hash.includes("type=signup"))) {
        // If it's a new signup or recovery, send them to set their password
        navigate({ to: "/reset-password", replace: true });
      }
    };
    handleAuthRedirect();
  }, [navigate]);

  return (
    <SiteLayout>
      {/* 1. Hero Section - Dark Background */}
      <section className="relative overflow-hidden bg-primary pt-16 pb-12 text-white md:pt-20 md:pb-16">
        <img
          src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=1600"
          alt="Optometry phoropter equipment"
          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/40 to-primary/80" />
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-accent/20 blur-[150px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white/10 blur-[150px] -z-10" />

        <div className="container-page relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 shadow-2xl backdrop-blur-md">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-accent">Doctor owned and led</span>
            </div>
            <h1 className="mb-8 text-3xl font-black leading-tight md:leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
              From graduation to <br className="hidden md:block" />
              great offer <span className="text-accent underline decoration-4 underline-offset-8">with someone</span> <br className="hidden md:block" />
              in your corner
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base font-medium leading-relaxed text-white/90 md:text-lg">
              Free resume review, salary guidance, offer comparison, and job matching for ODs at every career stage new grad or 20 years in.
            </p>
            <div className="mb-6 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="h-14 rounded-full border-none bg-accent px-10 text-lg font-black text-primary shadow-elevated transition-all hover:scale-105 hover:bg-accent/90 active:scale-95">
                <Link to="/for-ods">Get Free Career Help</Link>
              </Button>
              <Button asChild size="lg" className="h-14 rounded-full border border-white/20 bg-white/10 px-10 text-lg font-black text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-white/20 active:scale-95">
                <Link to="/for-practices">Hire an OD</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Bar - Social Proof */}
      <div className="bg-white border-y border-border/50 py-10 relative z-20 -mt-8 mx-4 rounded-3xl shadow-soft max-w-6xl md:mx-auto">
        <div className="container-page">
          <div className="grid grid-cols-1 md:flex md:flex-row md:justify-between items-center gap-6 md:gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">
            <div className="flex items-center justify-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="text-center md:text-left">Doctor owned and led</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="text-center md:text-left">Free for All ODs — New Grad or Experienced</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="text-center md:text-left">Only Pay When You Hire</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="text-center md:text-left">Private Practice Specialists</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Value Proposition Section - For ODs */}
      <section className="relative bg-background pt-16 pb-16 md:pt-24 md:pb-32 overflow-hidden">

        <div className="container-page text-center mb-16 max-w-6xl relative z-10">
           <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Your Career Partner</span>
           <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-primary mb-8">
             We are not a job board <br/><span className="text-gradient">We are your career concierge</span>
           </h2>
        </div>

        <div className="container-page grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {[
             {
               icon: FileText,
               title: "Resume & CV Review",
               desc: "Professional auditing to ensure your clinical experience stands out to top practices."
             },
             {
               icon: DollarSign,
               title: "Salary Guidance by Region",
               desc: "Real-time market data by region to ensure you're being compensated fairly."
             },
             {
               icon: ArrowUpRight,
               title: "Offer Comparison",
               desc: "We help you weigh multiple offers to find the best fit for your lifestyle and goals."
             },
             {
               icon: Scale,
               title: "Contract Red-Flag Education",
               desc: "Learn to identify red flags in contracts before you sign on the dotted line."
             },
             {
               icon: MessagesSquare,
               title: "Interview Prep",
               desc: "One-on-one coaching to help you articulate your clinical value with confidence."
             },
             {
               icon: UserCheck,
               title: "Job Matching & Direct Intros",
               desc: "Skip the applications and get your profile in front of decision makers."
             }
           ].map((item, i) => (
             <div key={i} className="p-10 rounded-[3rem] bg-muted/20 border border-border group hover:border-primary/30 transition-all text-left flex flex-col shadow-soft">
                <div className="h-16 w-16 rounded-2xl bg-white text-primary flex items-center justify-center mb-8 shadow-sm group-hover:bg-accent group-hover:text-white transition-colors">
                   <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 4. 6-Step Roadmap Section */}
      <section className="bg-primary pt-16 pb-16 md:pt-24 md:pb-32 text-white overflow-hidden border-y border-white/5">
        <div className="container-page">
          <div className="text-center mb-12 md:mb-20">
            <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mb-6 md:mb-8 block">The Journey</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white mb-8 md:mb-10">
              The 6-Step <br/><span className="text-accent">OD Career Roadmap</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden lg:block absolute top-[10.5rem] left-[10%] w-[80%] h-0.5 bg-white/10" />

            <div className="hidden lg:grid grid-cols-6 gap-12 mb-16 relative z-10">
               <div className="col-span-3 text-center">
                  <div className="inline-block px-10 py-4 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block mb-2">Phase 01</span>
                    <span className="text-sm font-black uppercase tracking-[0.15em] text-accent">After You Sign Up</span>
                  </div>
               </div>
               <div className="col-span-3 text-center">
                  <div className="inline-block px-10 py-4 rounded-[2rem] bg-accent/10 border border-accent/20 backdrop-blur-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent block mb-2">Phase 02</span>
                    <span className="text-sm font-black uppercase tracking-[0.15em] text-white">When We Have a Match for You</span>
                  </div>
               </div>
            </div>

            <div className="max-w-6xl mx-auto mb-20 hidden lg:block">
              <InteractiveRoadmap
                className="w-full h-auto drop-shadow-2xl"
                steps={[
                   { title: "Profile Creation" },
                                   { title: "Career Profile" },
                                   { title: "Match Search" },
                                   { title: "The Call" },
                                   { title: "Prep & Guide" },
                                   { title: "Sign" },
                ]}
              />
            </div>

            {/* Mobile Roadmap (Stacked) */}
            <div className="lg:hidden max-w-lg mx-auto space-y-8 mt-12 relative">
               {/* Vertical Line */}
               <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-white/10 z-0" />

               {[
                { step: "01", title: "Create Your Free Profile", desc: "Create your free, confidential profile in minutes." },
                { step: "02", title: "We Build Your Career Profile", desc: "We build your clinical career profile for you." },
                { step: "03", title: "We Find a Match", desc: "We find matches that fit your specific criteria." },
                { step: "04", title: "You Get the Call", desc: "Receive interview requests from interested practices.", match: true },
                { step: "05", title: "Interview Prep & Offer Guidance", desc: "One-on-one prep and guidance from our team.", match: true },
                { step: "06", title: "Sign With Confidence", desc: "Sign your contract with absolute confidence.", match: true }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 relative z-10 px-4">
                  <div className={cn(
                    "h-20 w-20 shrink-0 rounded-full flex items-center justify-center font-black text-xl shadow-elevated",
                    item.match ? "bg-white text-primary" : "bg-accent text-primary"
                  )}>
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h4 className="text-xl font-black mb-2">{item.title}</h4>
                    <p className="text-sm opacity-70 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Version (Already updated above to hidden on lg) */}
            <div className="hidden lg:grid grid-cols-6 gap-12 mt-24 relative z-10">
               {/* This was the old loop, we'll keep it for desktop if needed or just use the mobile one above with grid lg:grid-cols-6 */}
            </div>
          </div>

          <div className="mt-20 text-center">
                 <Button asChild size="lg" className="rounded-full px-12 h-18 text-xl font-black bg-white text-primary shadow-elevated transition-all hover:scale-105 hover:bg-white/90">
               <Link to="/for-ods">Get Started Today</Link>
             </Button>
          </div>
        </div>
      </section>

      {/* 5. Value Proposition Section - For Employers */}
      <section className="relative bg-muted/10 pt-16 pb-16 md:pt-24 md:pb-32 border-y border-border/50 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1600"
          alt="Modern Eye Clinic"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.03] pointer-events-none"
        />
        <div className="container-page text-center mb-16 max-w-6xl relative z-10">
           <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">For Practices & Employers</span>
           <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-primary mb-8">
             Recruiters send resumes <br/><span className="text-gradient">We send ready-to-hire ODs</span>
           </h2>
        </div>

        <div className="container-page grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {[
             {
               icon: UserPlus,
               title: "Pre-Vetted, Interview Ready Candidates",
               desc: "Every candidate is clinically vetted by an OD before they reach your inbox."
             },
             {
               icon: Building2,
               title: "No Upfront Cost — Pay Only on Hire",
               desc: "Risk-free recruitment. You only pay a flat fee once you've successfully hired your next OD."
             },
             {
               icon: Rocket,
               title: "Faster Than a Job Board, Cheaper Than a Recruiter",
               desc: "Skip the noise of job boards and the high commissions of traditional agencies."
             }
           ].map((item, i) => (
             <div key={i} className="p-10 rounded-[3rem] bg-white border border-border group hover:border-primary/30 transition-all text-left flex flex-col shadow-soft">
                <div className="h-16 w-16 rounded-2xl bg-muted text-primary flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                   <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-primary mb-4 tracking-tight leading-tight">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 6. Doctor Owned Section */}
      <DoctorOwnedSection />

      {/* 7. Testimonials - Dark Background */}
      <section className="bg-primary pt-12 pb-16 md:pt-20 md:pb-32 text-white border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] -z-10" />
        <div className="container-page">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Colleague Feedback</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight mb-8">
              What our <br/><span className="text-accent">clients</span> say
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                quote: "Your career success story will go here. We are currently matching our first cohort of new grads with top-tier private practices.",
                author: "Future OD Success",
                role: "Class of 2025",
              },
              {
                quote: "Reserved for our next experienced OD placement. We're helping established doctors navigate their next major career transition.",
                author: "Experienced OD",
                role: "10+ Years Experience",
              },
              {
                quote: "Practice owners are already joining the network. This space is reserved for our first successful practice-OD match testimonial.",
                author: "Practice Partner",
                role: "Private Practice Owner",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative rounded-[3.5rem] border border-white/10 bg-white/5 p-12 shadow-soft transition-all hover:bg-white/10 group backdrop-blur-md"
              >
                <Quote className="absolute right-12 top-12 h-12 w-12 text-accent opacity-20 group-hover:opacity-40 transition-colors" />
                <div className="relative z-10">
                  <div className="flex gap-1.5 mb-8">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-5 w-5 fill-accent text-accent" />)}
                  </div>
                  <p className="text-2xl font-bold text-white leading-snug mb-12 italic">
                    "{item.quote}"
                  </p>
                  <div className="flex items-center gap-5 pt-8 border-t border-white/10">
                    <div className="h-14 w-14 rounded-2xl bg-accent text-white flex items-center justify-center font-black text-xl shadow-elevated">
                      {item.author[0]}
                    </div>
                    <div>
                      <p className="font-black text-lg text-white">{item.author}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-accent mt-1 opacity-80">
                        {item.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA - Dark Background */}
      <section className="container-page pb-16 pt-16">
        <div
          className="relative overflow-hidden rounded-[3rem] border border-white/10 p-10 text-center shadow-elevated md:p-24 bg-primary text-white"
        >
          <div className="absolute inset-0 z-0 opacity-30">
            <div className="absolute -left-20 -top-20 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[150px] animate-pulse-slow" />
            <div className="absolute -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-accent/20 blur-[150px] animate-pulse-slow delay-700" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl leading-tight mb-8">
              Start your next <br /><span className="text-accent">chapter today</span>
            </h2>
            <p className="mx-auto mt-6 text-base opacity-90 font-medium leading-relaxed mb-10 max-w-2xl">
              Whether you are looking for your first job or your next major career move,
              we are in your corner. 100% free, 100% confidential.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-6">
              <Button asChild size="lg" className="rounded-full px-10 h-16 text-lg font-black bg-accent hover:bg-accent/90 text-primary border-none shadow-elevated transition-all hover:scale-105">
                <Link to="/for-ods">Get Started Now</Link>
              </Button>
              <Button asChild size="lg" className="rounded-full px-10 h-16 text-lg font-black bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105">
                <Link to="/contact">Talk to a Recruiter</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
