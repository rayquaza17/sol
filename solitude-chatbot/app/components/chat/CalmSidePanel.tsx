'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const AFFIRMATIONS = [
    "You don't have to solve everything today.",
    "Small progress is still progress.",
    "Taking a moment to breathe can reset your mind.",
    "You are doing better than you think.",
    "It's okay to feel whatever you're feeling."
];

export default function CalmSidePanel() {
    const [affirmation, setAffirmation] = useState("");
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        setAffirmation(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
    }, []);

    return (
        <motion.div 
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="w-full flex flex-col gap-6 relative z-10"
        >
            {/* 1. Daily Affirmation */}
            <section className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-7 space-y-3 shadow-2xl shadow-black/20">
                <h3 className="text-xs font-heading font-semibold text-white tracking-widest uppercase opacity-80">
                    Daily Affirmation
                </h3>
                <p className="text-lg font-light leading-relaxed text-slate-200">
                    {affirmation || "Taking a moment to just be."}
                </p>
            </section>

            {/* 2. Breathing Reminder */}
            <section className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-7 space-y-4 shadow-2xl shadow-black/20">
                <h3 className="text-xs font-heading font-semibold text-white tracking-widest uppercase opacity-80">
                    Calm Breathing
                </h3>
                <div className="space-y-2 text-sm font-medium text-slate-400 pl-4 border-l-2 border-sol-teal/30">
                    <p>Breathe in – 4 seconds</p>
                    <p>Hold – 4 seconds</p>
                    <p>Breathe out – 6 seconds</p>
                </div>
            </section>

            {/* 3. Gentle Reminder */}
            <section className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-7 space-y-3 shadow-2xl shadow-black/20">
                <h3 className="text-xs font-heading font-semibold text-white tracking-widest uppercase opacity-80">
                    Take Your Time
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                    You can pause and reflect here. There is no rush.
                </p>
            </section>
        </motion.div>
    );
}
