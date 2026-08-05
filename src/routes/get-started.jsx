import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { GraduationCap, Building2, ArrowRight, UserCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/get-started")({
  component: GetStarted,
});

function GetStarted() {
  return (
    <SiteLayout>
      <section className="min-h-[80vh] flex flex-col items-center justify-center py-24 md:py-32 bg-background">
        <div className="container-page">
          <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
            <span className="section-eyebrow">Welcome to Optometry Concierge</span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[0.95] mb-8">
              How would you like <br /><span className="text-gradient">to get started?</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Choose the path that fits your current goals. Our concierge service is tailored to your unique clinical or business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* OD Card */}
            <Link
              to="/for-ods"
              hash="intake"
              className="group relative p-12 rounded-[4rem] bg-card border border-border shadow-soft hover:shadow-card hover:-translate-y-2 transition-all overflow-hidden flex flex-col h-full"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />

              <div className="h-20 w-20 rounded-3xl bg-primary text-white flex items-center justify-center mb-10 shadow-elevated">
                 <GraduationCap className="h-10 w-10" />
              </div>

              <h2 className="text-4xl font-black text-primary mb-6 tracking-tight">I am an <br />Optometrist</h2>
              <p className="text-lg text-muted-foreground font-bold mb-10 flex-1 leading-relaxed">
                Looking for a career move, salary audit, or a new clinical opportunity with 100% confidentiality.
              </p>

              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                Start My Profile <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            {/* Practice Card */}
            <Link
              to="/for-practices"
              hash="intake"
              className="group relative p-12 rounded-[4rem] bg-primary text-white shadow-soft hover:shadow-card hover:-translate-y-2 transition-all overflow-hidden flex flex-col h-full border border-white/5"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500" />

              <div className="h-20 w-20 rounded-3xl bg-accent text-white flex items-center justify-center mb-10 shadow-elevated">
                 <Building2 className="h-10 w-10" />
              </div>

              <h2 className="text-4xl font-black text-white mb-6 tracking-tight">I am hiring <br />an OD</h2>
              <p className="text-lg opacity-90 font-bold mb-10 flex-1 leading-relaxed">
                Looking to find pre-vetted, high-quality clinical talent for your private practice or group.
              </p>

              <div className="flex items-center gap-2 text-accent font-black uppercase tracking-widest text-sm">
                Submit Hiring Request <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          </div>

          <div className="mt-20 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              All interactions are 100% confidential and secure
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
