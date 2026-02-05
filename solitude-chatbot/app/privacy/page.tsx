import { ShieldCheck, Lock, EyeOff } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col pt-32 relative">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-grow max-w-4xl mx-auto px-6 py-20 w-full relative z-10">
                <div className="text-center space-y-4 mb-20">
                    <h1 className="text-5xl md:text-6xl text-white serif italic">Privacy Policy</h1>
                    <p className="text-xl text-slate-300">Your trust is our foundation.</p>
                </div>

                <div className="bg-sol-glass backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[3rem] shadow-2xl space-y-12">
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        <div className="w-16 h-16 bg-sol-teal/10 rounded-2xl flex items-center justify-center text-sol-teal shrink-0">
                            <ShieldCheck size={32} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-heading font-bold text-white underline decoration-sol-teal/30 decoration-4 underline-offset-4 font-serif">100% Private Conversations</h2>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                We believe that mental health support should be absolute. At Solitude, we do not
                                store your personal chat history on our servers. All processing is transient or
                                stored only in your local browser session.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                        <div className="p-8 rounded-[2rem] bg-sol-teal/5 space-y-4 border border-sol-teal/10 hover:border-sol-teal/30 transition-colors">
                            <div className="flex items-center gap-2 text-sol-teal font-bold uppercase tracking-widest text-xs">
                                <Lock size={16} /> Data Sovereignty
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                We do not sell your data. We do not track you. We exist only to provide a safe space for your emotional well-being.
                            </p>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-sol-teal/5 space-y-4 border border-sol-teal/10 hover:border-sol-teal/30 transition-colors">
                            <div className="flex items-center gap-2 text-sol-teal font-bold uppercase tracking-widest text-xs">
                                <EyeOff size={16} /> Zero Logging
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Our AI processing happens in stateless environments, meaning once your session ends, the memory of the conversation fades away.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
