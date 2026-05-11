"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const MESSAGES = [
    "Small progress still counts.",
    "Taking a short break can reset your focus.",
    "You don't need to solve everything today.",
    "Consistency matters more than perfection.",
    "Rest is part of the process, not a pause from it.",
    "One kind thought toward yourself goes a long way.",
    "Showing up is already enough — even on hard days.",
    "It's okay to not have it all figured out right now.",
];

export function PersonalReminder() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        const random = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
        setMessage(random);
    }, []);

    if (!message) return null;

    return (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-3 relative overflow-hidden group">
            {/* Decorative glow */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-sol-teal/5 blur-2xl pointer-events-none group-hover:bg-sol-teal/10 transition-all duration-700" />

            <div className="flex items-center gap-2 relative z-10">
                <div className="w-7 h-7 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <Heart size={14} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Personal Reminder</p>
            </div>

            <p className="text-slate-200 font-serif italic text-lg leading-relaxed relative z-10">
                "{message}"
            </p>
        </div>
    );
}
