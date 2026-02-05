import { Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function ContactPage() {
    return (
        <div className="min-h-screen flex flex-col pt-32 relative">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-grow max-w-4xl mx-auto px-6 py-20 w-full relative z-10">
                <div className="text-center space-y-4 mb-20">
                    <h1 className="text-5xl md:text-6xl text-white serif italic">Contact Support</h1>
                    <p className="text-xl text-slate-300">We&apos;re here to help you find your peace.</p>
                </div>

                <div className="bg-sol-glass backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[3rem] shadow-2xl text-center space-y-8">
                    <div className="w-20 h-20 bg-sol-teal/10 rounded-full flex items-center justify-center text-sol-teal mx-auto shadow-inner">
                        <Mail size={32} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-heading font-bold text-white">Get in Touch</h2>
                        <p className="text-2xl text-sol-teal font-medium tracking-tight">support@solitude.ai</p>
                    </div>

                    <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                        For technical issues, feedback, or partnership inquiries, please reach out via email.
                        We aim to respond within 24-48 hours.
                    </p>

                    <div className="pt-8 border-t border-white/5">
                        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[2rem] space-y-4">
                            <div className="flex items-center justify-center gap-2 text-red-400 font-black uppercase tracking-[0.2em] text-xs">
                                <ShieldAlert size={18} /> Emergency Notice
                            </div>
                            <p className="text-slate-200 leading-relaxed font-medium">
                                If you are in immediate danger or experiencing a crisis, please do not wait for an email response.
                            </p>
                            <Link href="/resources" className="inline-flex items-center gap-2 text-sol-teal font-bold hover:underline underline-offset-4 decoration-sol-teal/30">
                                View Local Helplines <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
