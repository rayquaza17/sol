"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind } from "lucide-react";

export function BreathingExercise() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");

    useEffect(() => {
        if (!isActive) {
            setPhase("idle");
            return;
        }

        // Breathing cycle: Inhale (4s) -> Hold (4s) -> Exhale (6s)
        let phaseTimer: NodeJS.Timeout;

        const runCycle = () => {
            setPhase("inhale");
            phaseTimer = setTimeout(() => {
                setPhase("hold");
                phaseTimer = setTimeout(() => {
                    setPhase("exhale");
                    phaseTimer = setTimeout(runCycle, 6000); // Trigger next cycle after 6s exhale
                }, 4000);
            }, 4000);
        };

        runCycle();

        return () => clearTimeout(phaseTimer);
    }, [isActive]);

    // Circle scale animations based on phase
    const getScale = () => {
        if (phase === "idle") return 1;
        if (phase === "inhale") return 1.8;
        if (phase === "hold") return 1.8;
        if (phase === "exhale") return 1;
        return 1;
    };

    // Instruction text
    const getInstruction = () => {
        if (phase === "idle") return "Ready to begin?";
        if (phase === "inhale") return "Breathe in (4s)";
        if (phase === "hold") return "Hold (4s)";
        if (phase === "exhale") return "Breathe out (6s)";
    };

    return (
        <section className="py-16 px-6 max-w-5xl mx-auto">
            <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-[40px] p-10 md:p-16 text-center relative overflow-hidden backdrop-blur-sm">

                <div className="relative z-10 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sol-teal/10 text-sol-teal text-xs font-bold uppercase tracking-widest mb-6">
                        <Wind size={14} /> Calm Breathing Exercise
                    </div>

                    <p className="text-slate-300 max-w-lg mx-auto mb-12">
                        Breathe in for 4 seconds, hold for 4 seconds, and breathe out for 6 seconds.
                    </p>

                    {/* Interactive breathing circle */}
                    <div className="relative w-48 h-48 flex items-center justify-center mb-12">
                        {/* Static outer ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/5" />

                        {/* Animated breathing circle */}
                        <motion.div
                            animate={{ scale: getScale() }}
                            transition={{
                                duration: phase === "inhale" ? 4 : phase === "hold" ? 0.5 : phase === "exhale" ? 6 : 1,
                                ease: phase === "hold" ? "linear" : "easeInOut"
                            }}
                            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-colors duration-1000 ${isActive ? 'bg-sol-teal' : 'bg-white/10'
                                }`}
                        >
                            {/* Inner pulse ring when idle */}
                            {!isActive && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full bg-white/20"
                                />
                            )}
                        </motion.div>

                        {/* Dynamic Text inside the circle space */}
                        <div className="absolute z-20 pointer-events-none w-full text-center mix-blend-difference">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={phase}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={`font-semibold tracking-wide ${isActive ? 'text-white' : 'text-slate-400'}`}
                                >
                                    {getInstruction()}
                                </motion.span>
                            </AnimatePresence>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`px-8 py-3 rounded-xl font-semibold transition-all ${isActive
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                            }`}
                    >
                        {isActive ? "Stop Exercise" : "Start Exercise"}
                    </button>
                </div>
            </div>
        </section>
    );
}
