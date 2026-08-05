import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfidentialIllustration } from "@/components/Illustrations";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <section id="story" className="container-page py-12 md:py-20 scroll-mt-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-2 max-w-3xl">
            <span className="section-eyebrow text-accent">About Us</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 md:mb-8 text-primary">
              Optometry Concierge
            </h1>
            <div className="space-y-5 md:space-y-6 text-[0.95rem] md:text-lg text-muted-foreground leading-relaxed">
              <p>
                Optometry Concierge was created by Doctor Bilal Ismail and Doctor Karim Sayani, two optometrists who graduated together from the University of the Incarnate Word Rosenberg School of Optometry.
              </p>
              <p>
                When we were graduating, we quickly realized there was no clear roadmap for finding the right first job. We had questions about resumes, interviews, salary expectations, contracts, negotiation, benefits, non-competes, production bonuses, and how to know whether an offer was actually fair.
              </p>
              <p>
                Like many new grads, we had to figure it out ourselves. We asked professors, watched negotiation videos, compared notes with classmates, and learned through experience. Thankfully, we were able to land strong first jobs and negotiate competitive offers.
              </p>
              <p>
                But after speaking with classmates, colleagues, and friends, we realized many optometrists were dealing with the same problem. Some did not know what to ask. Some did not know what they were worth. Some accepted offers that were lower than they deserved. One colleague was making about $20,000 less than what she could have been earning in her market.
              </p>
              <p>
                That is why we built Optometry Concierge.
              </p>
              <p>
                Our mission is simple: help optometrists make smarter career decisions.
              </p>
              <p>
                Whether you are a student, a new graduate, or a practicing OD quietly exploring your next move, we help with resume review, interview preparation, salary guidance, offer comparison, contract red-flag education, negotiation support, and job matching.
              </p>
              <p>
                Everything is confidential. Your information is never shared with an employer unless you approve it first. If you are currently working and simply want to explore better options, your employer will not know.
              </p>
              <p>
                For optometrists, our service is completely free.
              </p>
              <p>
                We are not just another job board. We are optometrists helping optometrists move from uncertainty to the right opportunity.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="bg-primary/5 py-20 md:py-32 scroll-mt-20 overflow-hidden relative">
         <div className="container-page relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               <div className="max-w-xl">
                  <span className="section-eyebrow">Confidentiality First</span>
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-6">The Core Privacy Model</h2>
                  <div className="grid sm:grid-cols-2 gap-8 text-left">
                     <div className="bg-card p-8 rounded-3xl border border-border shadow-soft">
                        <h3 className="font-bold text-lg mb-4">Visible To Us</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                           <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> OD name, resume, goals</li>
                           <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Practice location details</li>
                        </ul>
                     </div>
                     <div className="bg-card p-8 rounded-3xl border border-border shadow-soft">
                        <h3 className="font-bold text-lg mb-4 text-destructive">HIDDEN From Public</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                           <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-destructive" /> Current employers</li>
                           <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-destructive" /> Browsing practices</li>
                        </ul>
                     </div>
                  </div>
                  <p className="mt-12 text-lg text-muted-foreground italic font-medium">
                    "Confidentiality is not fine print — it is our primary value proposition."
                  </p>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] -z-10" />
                  <ConfidentialIllustration className="w-full h-auto text-primary" />
               </div>
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-14 md:py-20 text-center">
        <div className="max-w-3xl mx-auto rounded-2xl md:rounded-3xl border border-border bg-card p-8 md:p-14 shadow-elevated relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-5 tracking-tight relative z-10">Ready to find your next move?</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-8 md:mb-10 max-w-xl mx-auto font-medium leading-relaxed relative z-10">
            Join hundreds of ODs who have found their ideal practice through our confidential concierge service.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 relative z-10">
            <Button asChild size="lg" className="rounded-full px-8 h-12 md:h-14 text-base font-bold shadow-soft">
              <Link to="/for-ods" hash="intake">Create Your Free Profile <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-12 md:h-14 text-base font-bold">
              <Link to="/contact">Talk to a Recruiter</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
