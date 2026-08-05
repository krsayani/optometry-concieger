export function MeetTheFoundersSection() {
  return (
    <section className="relative pt-16 pb-12 md:pt-24 md:pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(42,157,157,0.08),transparent_60%)] pointer-events-none" />
      <div className="container-page max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <span className="section-eyebrow !mb-3">Our Story</span>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight text-primary">
            Meet the{" "}
            <span className="font-serif italic font-semibold text-accent">
              Founders
            </span>
          </h2>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Doctor Bilal Ismail and Doctor Karim Sayani — optometrists helping
            optometrists find the right opportunity.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-border/50 bg-primary shadow-elevated aspect-video ring-1 ring-primary/10">
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster="/videos/meet-the-founders-poster.jpg"
          >
            <source src="/videos/meet-the-founders.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}
