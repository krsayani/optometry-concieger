import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { ShieldCheck, EyeOff, Lock, UserCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Optometry Concierge" },
      {
        name: "description",
        content:
          "Learn how Optometry Concierge protects your identity with our consent-first privacy model.",
      },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl md:text-2xl font-extrabold text-primary tracking-tight">
        {title}
      </h2>
      <div className="font-sans text-[0.95rem] md:text-base text-muted-foreground font-normal leading-[1.75] space-y-4">
        {children}
      </div>
    </div>
  );
}

function PrivacyPage() {
  const lastUpdated = "July 02, 2026";

  return (
    <SiteLayout>
      <section className="bg-muted/40 py-14 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 blur-[120px] -z-10" />
        <div className="container-page">
          <div className="max-w-3xl">
            <span className="section-eyebrow">Confidentiality</span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-primary leading-[1.12] mb-5 md:mb-6">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="font-sans text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl">
              Last updated: {lastUpdated}. Your identity is your most valuable asset.
              We treat it with absolute respect.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-24 bg-background">
        <div className="container-page">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            <div className="lg:col-span-2 space-y-12 md:space-y-14">
              <Section title="1. Information We Collect">
                <p>
                  We collect information necessary to provide professional matchmaking services. This includes:
                </p>
                <ul className="list-disc pl-5 space-y-2.5 marker:text-accent">
                  <li>Personal details: Name, email, phone number.</li>
                  <li>Professional details: OD school, license status, years in practice, clinical interests.</li>
                  <li>Career goals: Salary expectations, preferred locations, practice setting preferences.</li>
                  <li>Resumes and CVs: Document uploads provided by candidates.</li>
                </ul>
              </Section>

              <Section title="2. How We Use Information">
                <p>We use your information solely to:</p>
                <ul className="list-disc pl-5 space-y-2.5 marker:text-accent">
                  <li>Create and manage your confidential profile.</li>
                  <li>Match candidates with practices based on mutual criteria.</li>
                  <li>Communicate with you regarding potential opportunities.</li>
                  <li>Provide career guidance and salary audits.</li>
                </ul>
              </Section>

              <Section title="3. The Consent-First Model">
                <div className="p-6 md:p-8 rounded-2xl bg-primary/[0.04] border border-primary/10">
                  <p className="font-display font-bold text-primary mb-3 flex items-center gap-2 text-[0.95rem] md:text-base">
                    <Lock className="h-4 w-4 text-accent shrink-0" />
                    Our Identity-Stealth Promise
                  </p>
                  <p className="font-sans text-sm md:text-[0.95rem] text-muted-foreground leading-[1.75]">
                    Unlike traditional job boards, your profile is NOT browseable. No employer can "find" you. We are the filter. Your name and contact details are only shared with a practice after we have discussed a specific match with you and received your explicit permission to move forward.
                  </p>
                </div>
              </Section>

              <Section title="4. Data Security">
                <p>
                  We implement industry-standard security measures to protect your data. This includes encrypted transmission (SSL), secure cloud storage via Supabase, and strict internal access controls.
                </p>
              </Section>

              <Section title="5. Your Data Rights">
                <p>
                  You have the right to access, update, or delete your information at any time. You can manage your profile through your dashboard or by contacting us directly at{" "}
                  <a
                    href="mailto:Admin@optometryconcierge.com"
                    className="font-semibold text-primary hover:text-accent underline-offset-2 hover:underline"
                  >
                    Admin@optometryconcierge.com
                  </a>
                  .
                </p>
              </Section>
            </div>

            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-soft sticky top-28">
                <h3 className="font-display text-lg font-extrabold text-primary tracking-tight mb-6">
                  At a Glance
                </h3>
                <div className="space-y-6">
                  {[
                    { icon: EyeOff, label: "No Browsing", desc: "Your profile is hidden from the public." },
                    { icon: UserCheck, label: "Consent Only", desc: "Introductions require your approval." },
                    { icon: ShieldCheck, label: "Secure Storage", desc: "Encrypted data management." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-11 w-11 shrink-0 rounded-xl bg-secondary flex items-center justify-center text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold text-primary tracking-tight mb-1">
                          {item.label}
                        </p>
                        <p className="font-sans text-sm text-muted-foreground font-normal leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
