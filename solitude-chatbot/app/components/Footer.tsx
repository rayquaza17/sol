"use client";


import { Sparkles, Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="py-20 px-6 border-t border-white/5 bg-sol-deep relative overflow-hidden">
            {/* Subtle radial glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sol-teal/5 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start gap-16">
                <div className="flex flex-col gap-6 max-w-sm">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 bg-sol-teal/15 rounded-xl flex items-center justify-center text-sol-teal group-hover:scale-105 transition-transform border border-sol-teal/20">
                            <Sparkles size={20} />
                        </div>
                        <span className="text-2xl font-heading font-bold text-white">Solitude</span>
                    </Link>
                    <p className="text-slate-400 text-lg leading-relaxed font-light">
                        A mindful sanctuary for your internal world. Designed to bring clarity to the noise.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
                    <div className="space-y-4">
                        <h5 className="text-white font-semibold uppercase tracking-widest text-xs">Sanctuary</h5>
                        <nav className="flex flex-col gap-3 text-slate-400">
                            <Link href="/about" className="hover:text-sol-teal transition-colors">Our Philosophy</Link>
                            <Link href="/chat" className="hover:text-sol-teal transition-colors">The Interface</Link>
                            <Link href="/resources" className="hover:text-sol-teal transition-colors">Library</Link>
                        </nav>
                    </div>
                    <div className="space-y-4">
                        <h5 className="text-white font-semibold uppercase tracking-widest text-xs">Legal</h5>
                        <nav className="flex flex-col gap-3 text-slate-400">
                            <Link href="/privacy" className="hover:text-sol-teal transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-sol-teal transition-colors">Terms</Link>
                        </nav>
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <h5 className="text-white font-semibold uppercase tracking-widest text-xs">Crisis Support</h5>
                        <div className="flex items-center gap-3 bg-red-500/10 text-red-300 px-5 py-3 rounded-2xl text-xs font-bold border border-red-500/20">
                            <Heart size={16} fill="currentColor" className="animate-pulse" />
                            <span>9152987821 (India)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-20 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 mt-20 opacity-40">
                <div className="text-[10px] tracking-[0.4em] uppercase text-slate-500 font-bold">
                    © {new Date().getFullYear()} Solitude Sanctuary
                </div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-medium italic">
                    Made for the mind, in the quiet.
                </div>
            </div>
        </footer>
    );
}
