import { Heart, Sun, Leaf } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col pt-32 relative">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-grow">
                <section className="max-w-4xl mx-auto px-6 py-20">
                    <div className="text-center space-y-4 mb-20">
                        <h1 className="text-5xl md:text-6xl text-white serif italic">Our Mission</h1>
                        <p className="text-xl text-slate-300">A journey toward inner peace and emotional resilience.</p>
                    </div>

                    <div className="bg-sol-glass backdrop-blur-xl border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl space-y-10">
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-sol-teal/10 rounded-2xl flex items-center justify-center text-sol-teal mb-8">
                                <Heart size={32} />
                            </div>
                            <p className="text-2xl md:text-3xl text-white leading-relaxed serif underline decoration-sol-teal/30 decoration-8 underline-offset-[-2px] decoration-skip-ink-none">
                                Solitude was created with a simple belief: that everyone deserves a safe,
                                private sanctuary to process their emotions without judgment.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sol-teal font-bold uppercase tracking-widest text-xs">
                                    <Sun size={14} /> The Vision
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                    In a world that never stops talking, we provide the space to listen—to yourself.
                                    We believe that healing starts with silence and a non-judgmental witness.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sol-teal font-bold uppercase tracking-widest text-xs">
                                    <Leaf size={14} /> The Approach
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                    Inspired by the quiet rhythms of nature, our AI companion is designed to
                                    offer empathetic, localized support focused on your holistic well-being.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
