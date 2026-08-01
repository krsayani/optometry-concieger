import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/layouts/SiteLayout";
import { Mail, Phone, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Message Sent!", {
      description: "We've received your message and will get back to you soon.",
    });
    e.target.reset();
  };

  return (
    <SiteLayout>
      <section className="container-page py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-20">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-8">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-16 leading-relaxed">
              Have questions about how we work? Whether you are a Doctor looking for guidance
              or a practice looking to hire, we are here to help.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email Us</h3>
                  <p className="text-muted-foreground">Admin@optometryconcierge.com</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Live Chat</h3>
                  <p className="text-muted-foreground">Available Mon-Fri, 9am - 5pm EST</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" required placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" required placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required placeholder="Admin@optometryconcierge.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" required placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" required rows={5} placeholder="Tell us more..." />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full shadow-elevated">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
