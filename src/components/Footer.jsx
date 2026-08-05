import { Link } from "@tanstack/react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary text-primary-foreground border-t border-white/5">
      <div className="container-page py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand/About */}
          <div className="space-y-5 lg:col-span-2">
             <Link to="/" className="inline-flex items-center gap-3 mb-2">
                <img
                  src="/logo.png"
                  alt="Optometry Concierge"
                  className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/15"
                />
                <span className="text-xl md:text-2xl font-black tracking-tighter uppercase text-white leading-tight">
                  Optometry
                  <span className="block text-accent">Concierge</span>
                </span>
             </Link>
             <p className="text-sm md:text-base font-medium text-white/70 leading-relaxed max-w-sm">
                The premier Doctor owned and led agency for optometry professionals. Built by colleagues, for colleagues, with absolute confidentiality.
             </p>
             <div className="pt-2 flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-[0.16em]">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Doctor owned and led
             </div>
          </div>

          {/* Platform */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 text-accent">
              Platform
            </h4>
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-sm font-bold hover:text-accent transition-colors">Home</Link>
              <Link to="/for-ods" hash="intake" className="text-sm font-bold hover:text-accent transition-colors">For ODs</Link>
              <Link to="/for-practices" hash="intake" className="text-sm font-bold hover:text-accent transition-colors">For Practices</Link>
              <Link to="/how-it-works" className="text-sm font-bold hover:text-accent transition-colors">How It Works</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 text-accent">Resources</h4>
            <nav className="flex flex-col gap-4">
              <Link to="/about" className="text-sm font-bold hover:text-accent transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm font-bold hover:text-accent transition-colors">Contact Us</Link>
              <Link to="/privacy" className="text-sm font-bold hover:text-accent transition-colors">Privacy Model</Link>
            </nav>
          </div>

          {/* Contact  */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 text-accent">Connect</h4>
            <div className="space-y-4">
              <a href="mailto:Admin@optometryconcierge.com" className="text-sm hover:text-accent transition-colors block font-bold">
                Admin@optometryconcierge.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/20 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            <span>© {currentYear} OptometryConcierge.com</span>
            <span className="h-4 w-px bg-white/10 hidden md:block" />
            <Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
