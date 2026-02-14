"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative pt-40 pb-24 px-6 overflow-hidden min-h-[90vh] flex items-center justify-center">
            {/* Dynamic Aura Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sol-teal/10 rounded-full blur-[120px] opacity-40 pointer-events-none" />

            <div className="max-w-7xl mx-auto text-center space-y-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-sol-glass backdrop-blur-2xl border border-sol-glass-border text-sol-teal text-sm font-medium tracking-wide shadow-2xl shadow-sol-teal/5"
                >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>A sanctuary for your inner peace</span>
                </motion.div>

                <div className="space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl md:text-8xl font-heading leading-tight md:leading-[0.9] max-w-[14ch] mx-auto tracking-tighter filter drop-shadow-sm font-bold"
                    >
                        Find calm in <span className="text-sol-teal serif italic font-normal">solitude</span>.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed tracking-tight px-4"
                    >
                        An empathetic AI companion designed to help you navigate stress,
                        find clarity, and reclaim your balance through thoughtful reflection.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
                >
                    <Link href="/chat" className="btn-sol-primary group w-full sm:w-auto !px-10 !py-5 text-lg">
                        Begin Journey
                        <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </Link>
                    <Link href="/about" className="btn-sol-secondary w-full sm:w-auto !px-10 !py-5 text-lg">
                        Our Way
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
