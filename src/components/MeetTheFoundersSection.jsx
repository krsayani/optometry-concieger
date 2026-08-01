export function MeetTheFoundersSection() {
  return (
    <section className="bg-background pt-14 pb-10 md:pt-20 md:pb-16">
      <div className="container-page max-w-5xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <span className="section-eyebrow text-accent !mb-3">
            Our Story
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black tracking-tight text-primary">
            Meet the Founders
          </h2>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Doctor Bilal Ismail and Doctor Karim Sayani — optometrists helping optometrists find the right opportunity.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/60 bg-primary shadow-elevated aspect-video ring-1 ring-black/5">
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
