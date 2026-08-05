import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import {
  Mail,
  Clock,
  ShieldCheck,
  ArrowRight,
  Send,
  UserRound,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    buildSeoHead({
      title: "Contact Us",
      description:
        "Get in touch with Optometry Concierge. Whether you are an OD or a practice, we are here to help.",
      path: "/contact",
    }),
  component: Contact,
});

const CONTACT_EMAIL = "Admin@optometryconcierge.com";

const audienceOptions = [
  { id: "od", label: "I am an Optometrist", icon: UserRound },
  { id: "practice", label: "I am a Practice", icon: Building2 },
];

function Contact() {
  const [audience, setAudience] = useState("od");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      message: String(data.get("message") || "").trim(),
      audience,
      // Honeypot for bots (obscure name avoids password-manager autofill)
      company_fax_hp: String(data.get("company_fax_hp") || "").trim(),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to send your message.");
      }

      setSent(true);
      form.reset();
      setAudience("od");
      toast.success("Message sent", {
        description: `Your inquiry was emailed to ${CONTACT_EMAIL}.`,
      });
    } catch (error) {
      toast.error("Could not send message", {
        description:
          error?.message ||
          `Please email us directly at ${CONTACT_EMAIL}.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-white pt-10 pb-12 md:pt-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(42,157,157,0.35),transparent_55%)]" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
        <div className="container-page relative z-10 max-w-3xl">
          <p className="font-serif text-accent text-lg md:text-2xl italic mb-2 md:mb-3">
            Optometry Concierge
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-3 md:mb-6 text-white">
            Contact Us
          </h1>
          <p className="text-sm md:text-lg text-white/80 font-medium leading-relaxed max-w-2xl">
            Have questions about how we work? Whether you are a Doctor looking for
            guidance or a practice looking to hire, we are in your corner.
          </p>
        </div>
      </section>

      <section className="container-page py-8 sm:py-12 md:py-20">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-14">
          {/* Info column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-soft">
              <div className="h-11 w-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-lg text-primary mb-1">Email Us</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Form submissions are delivered directly to our admin inbox.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm font-bold text-accent hover:underline break-all"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-soft">
              <div className="h-11 w-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-lg text-primary mb-1">Response Time</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We typically reply within 1–2 business days, Monday–Friday.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-7 shadow-soft">
              <div className="h-11 w-11 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-lg text-primary mb-1">Confidential</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Your inquiry stays private. We never share your information without
                your approval.
              </p>
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-accent transition-colors"
              >
                Read our privacy model <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Form column */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl md:rounded-3xl border border-border bg-card p-6 md:p-10 shadow-card">
              {sent ? (
                <div className="text-center py-10 md:py-14">
                  <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                    <Send className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-primary mb-3">
                    Message sent
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground font-medium max-w-md mx-auto mb-8 leading-relaxed">
                    Thanks for reaching out. Your inquiry was emailed to{" "}
                    <span className="text-primary font-semibold">{CONTACT_EMAIL}</span>.
                    We will get back to you soon.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full px-6"
                    onClick={() => setSent(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl font-black tracking-tight text-primary mb-2">
                      Send a message
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">
                      Fill out the form below and we will email the team right away.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="relative space-y-5">
                    {/* Honeypot — off-screen, obscure name to avoid autofill */}
                    <div
                      aria-hidden="true"
                      className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                    >
                      <label htmlFor="company_fax_hp">Company fax</label>
                      <input
                        id="company_fax_hp"
                        type="text"
                        name="company_fax_hp"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>I am a…</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {audienceOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAudience(option.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                              audience === option.id
                                ? "border-accent/50 bg-accent/10 text-primary shadow-soft"
                                : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground",
                            )}
                          >
                            <option.icon className="h-5 w-5 shrink-0" />
                            <span className="text-sm font-bold">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          placeholder="Jane"
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          placeholder="Doe"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone{" "}
                          <span className="text-muted-foreground font-normal">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        required
                        placeholder={
                          audience === "practice"
                            ? "Hiring an OD"
                            : "Career guidance question"
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        placeholder="Tell us a bit about what you need help with…"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={busy}
                      className="w-full h-12 md:h-14 rounded-full font-bold shadow-elevated"
                    >
                      <Send className="h-4 w-4" />
                      {busy ? "Sending…" : "Send Message"}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      Prefer email? Reach us directly at{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="font-semibold text-primary hover:text-accent"
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
