import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/intro")({
  head: () =>
    buildSeoHead({
      title: "Meet the Founders — Short Intro",
      description:
        "Watch Drs. Bilal Ismail and Karim Sayani introduce Optometry Concierge — free career help for optometry students and new grads.",
      path: "/intro",
      image: "https://www.optometryconcierge.com/videos/school-outreach-poster.jpg",
    }),
  component: IntroVideoPage,
});

function IntroVideoPage() {
  return (
    <SiteLayout>
      <section className="container-page py-10 md:py-16 max-w-4xl mx-auto">
        <p className="font-serif text-accent text-lg md:text-xl italic mb-3">
          Optometry Concierge
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary mb-3">
          A short intro from Bilal & Karim
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium mb-8 max-w-2xl leading-relaxed">
          Why we built a free, confidential career resource for 3rd- and 4th-year
          OD students — and how Student Affairs offices can share it.
        </p>

        <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-border/50 bg-primary shadow-elevated aspect-video ring-1 ring-primary/10">
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster="/videos/school-outreach-poster.jpg"
          >
            <source src="/videos/school-outreach.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="rounded-full h-12 px-8 font-bold">
            <Link to="/for-ods" hash="intake">
              Get free career help
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full h-12 px-8 font-bold">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
