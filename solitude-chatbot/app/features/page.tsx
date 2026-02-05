import { Sparkles, Wind, MessageCircle, TreePine, Zap, Shield } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function FeaturesPage() {
    const tools = [
        {
            title: "AI Wisdom",
            icon: <MessageCircle className="text-sol-teal" size={32} />,
            desc: "Thoughtful, context-aware conversations powered by empathetic intelligence.",
            accent: "bg-sol-teal/10"
        },
        {
            title: "Breath Flow",
            icon: <Wind className="text-sol-teal" size={32} />,
            desc: "Scientifically-backed breathing patterns designed to calm the nervous system instantly.",
            accent: "bg-sol-teal/10"
        },
        {
            title: "Soundscapes",
            icon: <TreePine className="text-sol-teal" size={32} />,
            desc: "High-fidelity nature recordings captured from real forest sanctuaries across the world.",
            accent: "bg-sol-teal/10"
        },
        {
            title: "Instant Access",
            icon: <Zap className="text-sol-teal" size={32} />,
            desc: "No sign-up required. Your sanctuary is always just one click away, 24/7.",
            accent: "bg-sol-teal/10"
        },
        {
            title: "Deep Privacy",
            icon: <Shield className="text-sol-teal" size={32} />,
            desc: "End-to-end encryption ensures your thoughts and feelings stay yours alone.",
            accent: "bg-sol-teal/10"
        },
        {
            title: "Gentle UI",
            icon: <Sparkles className="text-sol-teal" size={32} />,
            desc: "Minimalist design with calm color palettes to reduce sensory overwhelm.",
            accent: "bg-sol-teal/10"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col pt-32 relative">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto px-6 py-20 w-full">
                <div className="text-center space-y-4 mb-20">
                    <h1 className="text-5xl md:text-6xl text-white serif italic">The Sanctuary Tools</h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Every feature is carefully crafted as a step toward your peace of mind.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tools.map((t, i) => (
                        <div key={i} className="bg-sol-glass backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] hover:border-sol-teal/50 hover:shadow-2xl hover:shadow-sol-teal/5 transition-all duration-500 group">
                            <div className={`w-16 h-16 ${t.accent} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 text-sol-teal`}>
                                {t.icon}
                            </div>
                            <h3 className="text-2xl mb-4 text-white font-heading font-bold">{t.title}</h3>
                            <p className="text-slate-300 leading-relaxed">
                                {t.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
