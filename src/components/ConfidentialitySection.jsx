import { Lock, ShieldCheck, Eye, EyeOff, Users, Building2, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfidentialitySection({ className }) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="mx-auto max-w-4xl text-center mb-16 md:mb-24">
        <span className="section-eyebrow">
          Enterprise-Grade Security
        </span>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[0.95] mb-8">
          Privacy by design, <br />
          <span className="text-gradient">not by accident.</span>
        </h2>
        <p className="mt-8 text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
          Confidentiality isn't fine print—it's our primary promise.
          We are a private matchmaking service, not a public job board.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto relative">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px] -z-10" />

        {/* The "Safe" Side */}
        <div className="group rounded-[3rem] border border-border bg-card p-10 shadow-soft transition-all hover:shadow-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">The Safe Vault</h3>
          </div>
          <p className="text-muted-foreground font-medium leading-relaxed mb-8">
            Your data lives in a private environment. We only bridge the gap when the match is perfect and your consent is explicit.
          </p>
          <ul className="space-y-4">
            {[
              "Identity hidden from all searches",
              "Direct 1:1 concierge vetting",
              "Consent-based introductions only",
              "Encrypted resume storage"
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* The "Shield" Side */}
        <div className="group rounded-[3rem] border border-primary/20 bg-primary/5 p-10 shadow-soft transition-all hover:shadow-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-elevated">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Zero Exposure</h3>
          </div>
          <p className="text-muted-foreground font-medium leading-relaxed mb-8">
            We've engineered our platform to ensure you never show up on a public radar or alert your current network.
          </p>
          <ul className="space-y-4">
            {[
              "No public-facing candidate list",
              "No practice browsing access",
              "No Google indexing of profiles",
              "Blocked from current network"
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-bold text-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-muted/50 border border-border text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          <EyeOff className="h-3 w-3 text-primary" />
          You remain invisible until you decide to be seen.
        </p>
      </div>
    </section>
  );
}
