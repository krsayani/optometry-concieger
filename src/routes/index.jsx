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
import { MeetTheFoundersSection } from "@/components/MeetTheFoundersSection";
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
      {/* 1. Hero — full-bleed brand composition */}
      <section className="relative min-h-[min(100svh,720px)] overflow-hidden bg-primary pt-12 pb-16 text-white sm:min-h-[78vh] md:min-h-[92vh] md:pt-28 md:pb-28 flex items-center">
        <img
          src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=2000"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-40 md:animate-kenburns pointer-events-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(42,157,157,0.22),transparent_55%)] pointer-events-none" />
        <div className="absolute -left-24 top-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-[140px] animate-pulse-slow pointer-events-none" />
        <div className="absolute -right-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-white/10 blur-[120px] pointer-events-none" />

        <div className="container-page relative z-10 w-full">
          <div className="mx-auto max-w-4xl text-center px-1">
            <p className="mb-4 md:mb-7 font-serif text-[1.45rem] sm:text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-white animate-fade-up">
              Optometry{" "}
              <span className="text-accent italic">Concierge</span>
            </p>
            <h1 className="mb-4 md:mb-6 text-[1.55rem] sm:text-4xl font-black leading-[1.15] tracking-tight text-white md:text-5xl lg:text-[3.35rem] animate-fade-up delay-100 text-balance">
              From graduation to great offer
              <span className="block mt-1.5 md:mt-2 font-serif text-[1.2rem] sm:text-3xl md:text-4xl lg:text-[2.65rem] font-medium tracking-tight text-white/90">
                with someone in your corner
              </span>
            </h1>
            <p className="mx-auto mb-7 md:mb-9 max-w-xl text-sm sm:text-[0.95rem] font-medium leading-relaxed text-white/80 md:text-lg animate-fade-up delay-200">
              Free resume review, salary guidance, offer comparison, and job matching for ODs at every career stage.
            </p>
            <div className="flex w-full flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 animate-fade-up delay-300">
              <Button
                asChild
                size="lg"
                className="h-12 md:h-14 w-full sm:w-auto rounded-full border-none bg-accent px-6 md:px-10 text-[0.95rem] md:text-lg font-bold text-accent-foreground shadow-elevated transition-all duration-300 hover:bg-accent/90 hover:scale-[1.02]"
              >
                <Link to="/for-ods" hash="intake">
                  Get Free Career Help
                  <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-12 md:h-14 w-full sm:w-auto rounded-full border border-white/50 bg-white/15 px-6 md:px-10 text-[0.95rem] md:text-lg font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/25 hover:border-white/70"
              >
                <Link to="/for-practices" hash="intake">Hire an OD</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-16 md:h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* 2. Trust strip */}
      <div className="relative z-20 border-b border-border/50 bg-card/80 backdrop-blur-md -mt-px">
        <div className="container-page py-4 md:py-6">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-3 gap-y-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-primary/70 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-2 sm:text-[11px] md:tracking-[0.13em]">
            {[
              "Doctor owned and led",
              "Free for all ODs",
              "Only pay when you hire",
              "Private practice specialists",
            ].map((label) => (
              <span key={label} className="inline-flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <span className="leading-snug">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Meet the Founders */}
      <MeetTheFoundersSection />

      {/* 4. Value Proposition Section - For ODs */}
      <section className="relative bg-background pt-16 pb-16 md:pt-28 md:pb-28 overflow-hidden">
        <div className="container-page text-center mb-10 md:mb-14 max-w-6xl relative z-10">
           <span className="section-eyebrow">Your Career Partner</span>
           <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-primary">
             We are not a job board
             <br />
             <span className="font-serif italic font-semibold text-accent">
               We are your career concierge
             </span>
           </h2>
        </div>

        <div className="container-page grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
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
             <div
               key={i}
               className="feature-tile feature-tile-hover p-6 md:p-8 text-left flex flex-col group"
             >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent transition-all duration-500" />
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/[0.06] text-primary flex items-center justify-center mb-5 md:mb-6 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                   <item.icon className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-primary mb-2 md:mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm md:text-[0.95rem] text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 4. 6-Step Roadmap Section */}
      <section className="bg-primary pt-16 pb-16 md:pt-24 md:pb-32 text-white overflow-hidden border-y border-white/5">
        <div className="container-page">
          <div className="text-center mb-12 md:mb-20">
            <span className="section-eyebrow">The Journey</span>
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
                                   { title: "We Contact You" },
                                   { title: "Prep & Guide" },
                                   { title: "Sign" },
                ]}
              />
            </div>

            {/* Mobile Roadmap (Stacked) */}
            <div className="lg:hidden max-w-lg mx-auto space-y-5 mt-8 relative px-1">
               <div className="absolute left-[22px] top-3 bottom-3 w-0.5 bg-white/10 z-0" />

               {[
                { step: "01", title: "Create Your Free Profile", desc: "Create your free, confidential profile in minutes." },
                { step: "02", title: "We Build Your Career Profile", desc: "We build your clinical career profile for you." },
                { step: "03", title: "We Find a Match", desc: "We find matches that fit your specific criteria." },
                { step: "04", title: "We Contact You", desc: "We'll email or call you with interview opportunities from interested practices.", match: true },
                { step: "05", title: "Interview Prep & Offer Guidance", desc: "One-on-one prep and guidance from our team.", match: true },
                { step: "06", title: "Sign With Confidence", desc: "Sign your contract with absolute confidence.", match: true }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 relative z-10">
                  <div className={cn(
                    "h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-black text-sm shadow-elevated",
                    item.match ? "bg-white text-primary" : "bg-accent text-primary"
                  )}>
                    {item.step}
                  </div>
                  <div className="pt-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-black mb-1 leading-snug">{item.title}</h4>
                    <p className="text-sm opacity-70 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 md:mt-20 text-center px-1">
            <Button asChild size="lg" className="rounded-full w-full sm:w-auto px-8 md:px-12 h-12 md:h-14 text-base md:text-xl font-black bg-white text-primary shadow-elevated transition-all hover:scale-105 hover:bg-white/90">
              <Link to="/for-ods" hash="intake">Get Started Today</Link>
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
           <span className="section-eyebrow">For Practices & Employers</span>
           <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-primary mb-8">
             Recruiters send resumes
             <br />
             <span className="font-serif italic font-semibold text-accent">
               We send ready-to-hire ODs
             </span>
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
             <div
               key={i}
               className="feature-tile feature-tile-hover p-8 md:p-10 text-left flex flex-col group"
             >
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-primary/[0.06] text-primary flex items-center justify-center mb-7 md:mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                   <item.icon className="h-7 w-7 md:h-8 md:w-8" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-primary mb-3 md:mb-4 tracking-tight leading-tight">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 6. Doctor Owned Section */}
      <DoctorOwnedSection />

      {/* 7. Testimonials */}
      <section className="bg-primary pt-14 pb-16 md:pt-24 md:pb-28 text-white border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] -z-10" />
        <div className="container-page">
          <div className="mx-auto max-w-4xl text-center mb-10 md:mb-14">
            <span className="section-eyebrow">Colleague Feedback</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              What our <span className="text-accent">clients</span> say
            </h2>
          </div>

          <div className="grid gap-5 md:gap-6 md:grid-cols-2 xl:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                quote: "Optometry Concierge helped me compare multiple offers and explained details in my contract that I would have completely overlooked. I felt much more confident accepting my first position.",
                author: "Future New Graduate",
                role: "Class of 2027",
              },
              {
                quote: "Instead of sorting through dozens of resumes, we were introduced to a candidate who was genuinely interested in our practice and community. The process was organized, efficient, and saved us valuable time.",
                author: "Private Practice Owner",
                role: "",
              },
              {
                quote: "I wanted to explore new opportunities without my employer knowing. The confidential process gave me peace of mind, and I found a position that was a much better fit for my career goals.",
                author: "Experienced Optometrist",
                role: "10+ Years in Practice",
              },
              {
                quote: "Negotiating my first contract felt intimidating. Having another optometrist walk me through the offer helped me avoid mistakes and understand what questions to ask.",
                author: "Future OD",
                role: "Class of 2026",
              },
              {
                quote: "The candidates we met were prepared, professional, and aligned with what we were looking for. It felt more like a personalized introduction than traditional recruiting.",
                author: "Hiring Practice",
                role: "",
              },
              {
                quote: "I was relocating to a new state and did not know where to start. Optometry Concierge helped me understand the local market, refine my resume, and connect with practices that actually fit my goals.",
                author: "Relocating Optometrist",
                role: "5 Years in Practice",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.07] p-6 md:p-7 transition-all duration-300 hover:bg-white/[0.11] hover:border-accent/30 hover:-translate-y-0.5 group"
              >
                <Quote className="absolute right-5 top-5 h-7 w-7 text-accent/25 group-hover:text-accent/40 transition-colors" />
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-serif text-[1.02rem] md:text-[1.08rem] font-medium text-white/90 leading-relaxed mb-6 flex-1 tracking-tight">
                  “{item.quote}”
                </p>
                <div className="pt-4 border-t border-white/10">
                  <p className="font-display font-bold text-sm md:text-[0.95rem] text-white tracking-tight">
                    {item.author}
                  </p>
                  {item.role ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent mt-1">
                      {item.role}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA — full-bleed */}
      <section className="relative overflow-hidden bg-primary text-white pt-16 pb-16 md:pt-24 md:pb-28">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-accent/30 blur-[140px] animate-pulse-slow" />
          <div className="absolute -right-20 bottom-0 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[120px] animate-pulse-slow delay-200" />
        </div>
        <div className="container-page relative z-10 max-w-3xl mx-auto text-center">
          <p className="font-serif text-accent text-xl md:text-2xl mb-4 italic">
            Optometry Concierge
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-4 md:mb-6">
            Start your next chapter today
          </h2>
          <p className="mx-auto text-sm md:text-base text-white/80 font-medium leading-relaxed mb-8 md:mb-10 max-w-xl">
            Whether you are looking for your first job or your next major career move,
            we are in your corner. 100% free, 100% confidential.
          </p>
          <div className="flex w-full flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="h-12 md:h-14 w-full sm:w-auto rounded-full px-8 md:px-10 text-base font-bold bg-accent hover:bg-accent/90 text-accent-foreground border-none shadow-elevated transition-transform hover:scale-[1.02]">
              <Link to="/for-ods" hash="intake">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12 md:h-14 w-full sm:w-auto rounded-full px-8 md:px-10 text-base font-bold bg-white/10 backdrop-blur-md border border-white/25 text-white hover:bg-white/20">
              <Link to="/contact">Talk to a Recruiter</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
