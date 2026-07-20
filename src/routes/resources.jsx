import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/resources")({
  component: Resources,
});

function Resources() {
  return (
    <SiteLayout>
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Decorative Background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />

        <section className="container-page relative z-10 py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in zoom-in duration-700">
            <Sparkles className="h-4 w-4" />
            Something Big is Coming
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl leading-[1.1]">
            Our Resource Library is <br />
            <span className="text-gradient">Currently Underway</span>
          </h1>

          <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            We're building the ultimate toolkit for ODs: resume templates, salary negotiation guides,
            and contract red-flag checklists. We'll be ready very soon.
          </p>

          <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest mb-16">
             <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Strategy</div>
             <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Templates</div>
             <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Guides</div>
          </div>

          <Button asChild variant="ghost" className="rounded-full px-8 text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </section>
      </div>
    </SiteLayout>
  );
}

