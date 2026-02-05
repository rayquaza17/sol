import { Sparkles, Phone, Heart, Users } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function ResourcesPage() {
    const helplines = [
        {
            name: "AASRA",
            phone: "91-9820466726",
            label: "24/7 Crisis Support",
            desc: "For those struggling with thoughts of self-harm or deep emotional distress."
        },
        {
            name: "Vandrevala Foundation",
            phone: "1860-2662-345",
            label: "Mental Health Support",
            desc: "Free 24x7 psychological counselling for anyone across India."
        },
        {
            name: "iCall (TISS)",
            phone: "9152987821",
            label: "Support Helpline",
            desc: "Counselling services by trained professionals for all emotional needs."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col pt-32 relative">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-grow max-w-5xl mx-auto px-6 py-20 w-full relative z-10">
                <div className="text-center space-y-6 mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-bold text-xs uppercase tracking-widest border border-red-500/20">
                        <Heart size={14} fill="currentColor" /> You are not alone
                    </div>
                    <h1 className="text-5xl md:text-6xl text-white serif italic">Wellness Resources</h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Reaching out is the bravest first step toward healing. These organizations are here to help.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {helplines.map((h, i) => (
                        <div key={i} className="bg-sol-glass backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-xl flex flex-col h-full group transition-all duration-500 hover:border-sol-teal/50">
                            <div className="mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sol-teal bg-sol-teal/10 px-3 py-1 rounded-full">{h.label}</span>
                                <h3 className="text-2xl mt-4 text-white font-bold">{h.name}</h3>
                            </div>
                            <p className="text-slate-300 mb-8 flex-grow leading-relaxed italic">{h.desc}</p>
                            <div className="space-y-4">
                                <div className="text-2xl font-serif font-bold text-white tracking-tight">{h.phone}</div>
                                <a
                                    href={`tel:${h.phone.replace(/-/g, '')}`}
                                    className="btn-sol-primary w-full gap-2 !py-4 shadow-none hover:shadow-lg hover:shadow-sol-teal/20"
                                >
                                    <Phone size={18} /> Call Now
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Global Support Note */}
                <div className="mt-20 p-10 rounded-[3rem] bg-sol-glass backdrop-blur-xl border border-white/10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                        <Users size={120} />
                    </div>
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <h2 className="text-3xl font-heading font-bold italic text-white font-serif">Outside India?</h2>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            If you are currently outside of India, please visit <a href="https://www.befrienders.org" className="underline underline-offset-4 text-sol-teal hover:text-sol-accent transition-colors">Befrienders Worldwide</a> or <a href="https://www.iasp.info/resources/Crisis_Centres/" className="underline underline-offset-4 text-sol-teal hover:text-sol-accent transition-colors">IASP</a> to find support services in your country.
                        </p>
                        <div className="flex items-center gap-2 pt-4 text-sm font-medium text-sol-teal">
                            <Sparkles size={16} /> Every life is precious.
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
