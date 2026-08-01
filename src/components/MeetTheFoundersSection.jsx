export function MeetTheFoundersSection() {
  return (
    <section className="bg-background pt-16 pb-16 md:pt-24 md:pb-24">
      <div className="container-page max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            Our Story
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-primary">
            Meet the Founders
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Doctor Bilal Ismail and Doctor Karim Sayani — optometrists helping optometrists find the right opportunity.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-border/50 bg-primary shadow-elevated aspect-video">
          <video
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
          >
            <source src="/videos/meet-the-founders.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}
