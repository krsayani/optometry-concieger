import { Link } from "@tanstack/react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-white text-foreground border-t border-border">
      <div className="container-page py-12 md:py-20">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand/About */}
          <div className="space-y-4 col-span-2 lg:col-span-2">
             <Link to="/" className="inline-flex items-center gap-3 mb-1">
                <img
                  src="/logo.png"
                  alt="Optometry Concierge"
                  className="h-11 w-11 md:h-12 md:w-12 rounded-xl object-cover ring-1 ring-border/60"
                />
                <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-primary leading-[1.15] overflow-visible">
                  Optometry
                  <span className="block text-accent italic leading-[1.2] pb-0.5">Concierge</span>
                </span>
             </Link>
             <p className="text-sm md:text-base font-medium text-muted-foreground leading-relaxed max-w-sm">
                The premier Doctor owned and led agency for optometry professionals. Built by colleagues, for colleagues, with absolute confidentiality.
             </p>
             <div className="pt-1 flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-[0.16em]">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Doctor owned and led
             </div>
          </div>

          {/* Platform */}
          <div className="space-y-4 md:space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">
              Platform
            </h4>
            <nav className="flex flex-col gap-3 md:gap-4">
              <Link to="/" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">Home</Link>
              <Link to="/for-ods" hash="intake" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">For ODs</Link>
              <Link to="/for-practices" hash="intake" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">For Practices</Link>
              <Link to="/how-it-works" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">How It Works</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4 md:space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Resources</h4>
            <nav className="flex flex-col gap-3 md:gap-4">
              <Link to="/about" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">Contact Us</Link>
              <Link to="/privacy" className="text-sm font-bold text-foreground/80 hover:text-accent transition-colors">Privacy Model</Link>
            </nav>
          </div>

          {/* Contact  */}
          <div className="space-y-4 md:space-y-6 col-span-2 md:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Connect</h4>
            <div className="space-y-4">
              <a href="mailto:Admin@optometryconcierge.com" className="text-sm text-foreground/80 hover:text-accent transition-colors block font-bold break-all">
                Admin@optometryconcierge.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-border flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>© {currentYear} OptometryConcierge.com</span>
            <span className="h-4 w-px bg-border hidden sm:block" />
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
