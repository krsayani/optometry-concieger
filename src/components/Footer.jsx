import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { MedicalBadge } from "./Illustrations";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary text-primary-foreground border-t border-white/5">
      <div className="container-page py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand/About */}
          <div className="space-y-6 lg:col-span-2">
             <Link to="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-black tracking-tighter uppercase text-white">
                  Optometry <span className="text-accent">Concierge</span>
                </span>
             </Link>
             <p className="text-base font-medium opacity-70 leading-relaxed max-w-sm">
                The premier doctor owned and led agency for optometry professionals. Built by colleagues, for colleagues, with absolute confidentiality.
             </p>
             <div className="pt-4 flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest">
                <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                doctor owned and led
             </div>
          </div>

          {/* Platform */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 text-accent">
              Platform
            </h4>
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-sm font-bold hover:text-accent transition-colors">Home</Link>
              <Link to="/for-ods" className="text-sm font-bold hover:text-accent transition-colors">For ODs</Link>
              <Link to="/for-practices" className="text-sm font-bold hover:text-accent transition-colors">For Practices</Link>
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
              <Link to="/resources" className="text-xs font-bold opacity-50 cursor-not-allowed">Job Board (Soon)</Link>
            </nav>
          </div>

          {/* Contact  */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 text-accent">Connect</h4>
            <div className="space-y-4">
              <a href="mailto:Admin@optometryconcierge.com" className="text-sm hover:text-accent transition-colors block font-bold">
                Admin@optometryconcierge.com
              </a>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="hover:text-accent transition-colors" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-accent transition-colors" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="hover:text-accent transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
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

          <div className="flex items-center gap-4">
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
