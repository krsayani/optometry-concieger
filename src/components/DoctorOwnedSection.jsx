import React from 'react';
import { Stethoscope, Award, ClipboardCheck, HeartPulse } from 'lucide-react';

export const DoctorOwnedSection = () => {
  return (
    <section className="bg-white py-20 md:py-32 border-y border-border/50 overflow-hidden relative">
      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container-page relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6 md:mb-8">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">A Colleague-Driven Network</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-primary mb-8 text-balance">
              doctor <br />
              <span className="text-accent">owned and led</span>
            </h2>
            <p className="text-base text-muted-foreground font-medium mb-8 md:mb-10 leading-relaxed">
              We aren't just another agency. We are optometrists who understand the clinical nuances, the late-night charting, and the value of a perfectly balanced practice.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  icon: Stethoscope,
                  title: "Clinical First",
                  desc: "Every candidate and practice is vetted by an OD, not an algorithm."
                },
                {
                  icon: Award,
                  title: "Peer Vetted",
                  desc: "We speak the language of medical ethics and clinical excellence."
                },
                {
                  icon: ClipboardCheck,
                  title: "Strategic Matches",
                  desc: "We look beyond the resume to find the right cultural and clinical fit."
                },
                {
                  icon: HeartPulse,
                  title: "Advocacy Focus",
                  desc: "We advocate for fair contracts and sustainable practice growth."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-primary text-base md:text-lg mb-1">{item.title}</h4>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative mt-10 lg:mt-0">
             <div className="relative z-10 bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl overflow-hidden">
                {/* Background Image of Doctors */}
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200"
                  alt="Doctor Colleagues"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
                />
                <div className="relative z-10">
                   <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                      <div>
                         <h3 className="text-2xl font-black tracking-tight uppercase">doctor owned and led</h3>
                         <p className="text-accent font-bold uppercase tracking-widest text-[10px] mt-1">Founders' Commitment</p>
                      </div>
                   </div>

                   <blockquote className="text-base md:text-lg font-medium italic mb-8 md:mb-10 leading-relaxed">
                     "Our mission is to elevate the profession by ensuring every OD finds their ideal practice, and every practice finds their ideal partner."
                   </blockquote>

                   <div className="pt-6 md:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex -space-x-3 md:-space-x-4">
                         {[
                           "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100",
                           "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=100",
                           "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100"
                         ].map((url, i) => (
                           <div key={i} className="h-10 w-10 md:h-12 md:w-12 rounded-full border-2 md:border-4 border-primary bg-muted overflow-hidden">
                             <img src={url} alt="OD" className="w-full h-full object-cover" />
                           </div>
                         ))}
                      </div>
                      <p className="text-[10px] md:text-sm font-bold opacity-70 italic text-center sm:text-left">Join our growing network of OD colleagues</p>
                   </div>
                </div>
             </div>

             {/* Decorative Background Elements */}
             <div className="absolute -top-10 -right-10 w-48 md:w-64 h-48 md:h-64 bg-accent/20 rounded-full blur-[80px] md:blur-[100px] -z-10" />
             <div className="absolute -bottom-10 -left-10 w-48 md:w-64 h-48 md:h-64 bg-primary/10 rounded-full blur-[80px] md:blur-[100px] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
