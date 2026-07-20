import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { ShieldCheck, Eye, EyeOff, Lock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
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

function PrivacyPage() {
  const lastUpdated = "July 02, 2026";

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] -z-10" />
        <div className="container-page">
          <div className="max-w-3xl">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 block">Confidentiality</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1] mb-8">
              Privacy <br /><span className="text-gradient">Policy</span>
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Last updated: {lastUpdated}. Your identity is your most valuable asset. We treat it with absolute respect.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-background">
        <div className="container-page">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-16">
              <Section title="1. Information We Collect">
                <p>
                  We collect information necessary to provide professional matchmaking services. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Personal details: Name, email, phone number.</li>
                  <li>Professional details: OD school, license status, years in practice, clinical interests.</li>
                  <li>Career goals: Salary expectations, preferred locations, practice setting preferences.</li>
                  <li>Resumes and CVs: Document uploads provided by candidates.</li>
                </ul>
              </Section>

              <Section title="2. How We Use Information">
                <p>
                  We use your information solely to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create and manage your confidential profile.</li>
                  <li>Match candidates with practices based on mutual criteria.</li>
                  <li>Communicate with you regarding potential opportunities.</li>
                  <li>Provide career guidance and salary audits.</li>
                </ul>
              </Section>

              <Section title="3. The Consent-First Model">
                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10">
                    <p className="font-bold text-primary mb-4 flex items-center gap-2">
                        <Lock className="h-5 w-5" /> Our Identity-Stealth Promise
                    </p>
                    <p className="text-sm">
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
                  You have the right to access, update, or delete your information at any time. You can manage your profile through your dashboard or by contacting us directly at Admin@optometryconcierge.com.
                </p>
              </Section>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-[3rem] bg-muted/30 border border-border sticky top-32">
                 <h3 className="text-xl font-black text-primary mb-8">At a Glance</h3>
                 <div className="space-y-8">
                    {[
                      { icon: EyeOff, label: "No Browsing", desc: "Your profile is hidden from the public." },
                      { icon: UserCheck, label: "Consent Only", desc: "Introductions require your approval." },
                      { icon: ShieldCheck, label: "Secure Storage", desc: "Encrypted data management." },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-5">
                         <div className="h-12 w-12 shrink-0 rounded-2xl bg-white flex items-center justify-center text-primary shadow-soft">
                            <item.icon className="h-6 w-6" />
                         </div>
                         <div>
                            <p className="text-sm font-black uppercase tracking-tight mb-1">{item.label}</p>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
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
