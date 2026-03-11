"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AFFIRMATIONS = [
    "You don’t have to solve everything today.",
    "Small progress is still progress.",
    "Taking a moment to breathe can reset your mind.",
    "You are doing better than you think.",
    "It is okay to ask for help when you need it.",
    "Your worth is not defined by your productivity.",
    "Healing is not linear, and that is perfectly okay.",
    "Be as gentle with yourself as you are with others.",
    "You have the strength to begin again right now.",
    "Your thoughts do not have to become your narrative."
];

export function DailyAffirmation() {
    const [affirmation, setAffirmation] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const getNewAffirmation = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            const random = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
            setAffirmation(random);
            setIsRefreshing(false);
        }, 300); // slight delay for animation effect
    };

    useEffect(() => {
        getNewAffirmation();
    }, []);

    return (
        <div className="bg-gradient-to-br from-sol-teal/10 to-transparent border border-sol-teal/20 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Sparkles size={120} className="text-sol-teal" />
            </div>

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-sol-teal flex items-center gap-2">
                    <Sparkles size={16} /> Daily Affirmation
                </h3>
                <button
                    onClick={getNewAffirmation}
                    className="p-2 rounded-xl text-sol-teal/60 hover:text-sol-teal hover:bg-sol-teal/10 transition-colors"
                    title="Get another affirmation"
                >
                    <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.p
                    key={affirmation}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-2xl font-serif text-white italic leading-relaxed pr-8"
                >
                    "{affirmation}"
                </motion.p>
            </AnimatePresence>
        </div>
    );
}
