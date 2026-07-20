import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { FileText, ShieldCheck, Scale, Lock } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-primary tracking-tight">{title}</h2>
      <div className="text-muted-foreground font-medium leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  );
}

function TermsPage() {
  const lastUpdated = "July 02, 2026";

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container-page">
          <div className="max-w-3xl">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Legal</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1] mb-8">
              Terms of <br /><span className="text-gradient">Service</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Last updated: {lastUpdated}. Please read these terms carefully before using our concierge services.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-background">
        <div className="container-page">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-16">
              <Section title="1. Agreement to Terms">
                <p>
                  By accessing or using Optometry Concierge, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
                </p>
              </Section>

              <Section title="2. The Concierge Model">
                <p>
                  Optometry Concierge is a private, dr. owned and led. We act as a connection layer between clinical professionals (ODs) and practices.
                </p>
                <p>
                  For Doctors: Our services are 100% free of charge. We provide career guidance, contract review feedback, and direct introductions.
                </p>
                <p>
                  For Practices: Fees apply only upon a successful hire of a candidate introduced through our platform. Fee structures are detailed in the specific hiring agreement signed before candidate details are released.
                </p>
              </Section>

              <Section title="3. User Accounts">
                <p>
                  When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                </p>
                <p>
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>
              </Section>

              <Section title="4. Confidentiality & Privacy">
                <p>
                  Your privacy is our primary value proposition. We operate on a strict consent-based model. We will never share your personal information, resume, or practice details with another party without your explicit permission.
                </p>
              </Section>

              <Section title="5. Content & Intellectual Property">
                <p>
                  The Service and its original content, features, and functionality are and will remain the exclusive property of Optometry Concierge LLC and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
                </p>
              </Section>

              <Section title="6. Limitation of Liability">
                <p>
                  In no event shall Optometry Concierge LLC, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </Section>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-[3rem] bg-muted/30 border border-border sticky top-32">
                 <h3 className="text-xl font-black text-primary mb-6">Quick Summary</h3>
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Lock className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight mb-1">Total Privacy</p>
                          <p className="text-xs text-muted-foreground font-medium">We never sell your data.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Scale className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight mb-1">Fair Fees</p>
                          <p className="text-xs text-muted-foreground font-medium">Only pay if you hire.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <ShieldCheck className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase tracking-tight mb-1">Verified Only</p>
                          <p className="text-xs text-muted-foreground font-medium">Peer-vetted matching.</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
