"use client";

import { useState, useEffect } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIPS = [
    "Focus on one small task instead of everything at once.",
    "Short breaks can improve focus and reduce stress.",
    "Writing down your thoughts can help clear your mind.",
    "Drink a glass of water—hydration affects your mood.",
    "Step outside for 5 minutes of fresh air and sunlight.",
    "Limit your screen time before going to sleep.",
    "Declutter your immediate workspace to reduce cognitive overload.",
    "Acknowledge one thing you are grateful for today."
];

export function WellbeingTip() {
    const [tip, setTip] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const getNewTip = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            const random = TIPS[Math.floor(Math.random() * TIPS.length)];
            setTip(random);
            setIsRefreshing(false);
        }, 300);
    };

    useEffect(() => {
        getNewTip();
    }, []);

    return (
        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-3xl p-8 backdrop-blur-sm relative group flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-2">
                    <Lightbulb size={16} /> Wellbeing Tip
                </h3>
                <button
                    onClick={getNewTip}
                    className="p-2 rounded-xl text-orange-400/60 hover:text-orange-400 hover:bg-orange-400/10 transition-colors"
                    title="Get another tip"
                >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.p
                    key={tip}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg text-slate-300 leading-relaxed flex-1"
                >
                    {tip}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
