"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 px-6 sm:px-8 max-w-5xl mx-auto flex flex-col items-center text-center">
            {/* Soft decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sol-teal/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sol-teal/10 border border-sol-teal/20 text-sol-teal text-sm font-medium mb-8">
                    <Sparkles size={16} />
                    <span>Your Mental Wellbeing Companion</span>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-bold text-white tracking-tight leading-[1.1] mb-6">
                    A calm space to <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sol-teal to-blue-400">talk, reflect, and reset.</span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Solitude is an AI-powered mental wellbeing assistant designed to help you reflect, manage stress, and find perspective.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/chat">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-sol-teal text-sol-deep px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-colors hover:bg-sol-accent shadow-[0_0_30px_-5px_var(--sol-teal)] shadow-sol-teal/30 text-lg w-full sm:w-auto justify-center"
                        >
                            Start a Conversation <ArrowRight size={20} />
                        </motion.button>
                    </Link>
                    <Link href="/resources">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white/[0.05] text-white border border-white/10 px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-colors hover:bg-white/10 text-lg w-full sm:w-auto justify-center"
                        >
                            Explore Wellbeing Tools
                        </motion.button>
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}
