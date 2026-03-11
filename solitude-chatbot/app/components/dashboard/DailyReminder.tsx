"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const REMINDERS = [
    "Take a short break and breathe for a moment.",
    "Focus on one small task today instead of everything at once.",
    "Remember that progress can be gradual.",
    "It's okay to pause and reset your energy.",
    "Be kind to yourself today, you're doing your best.",
    "Small steps are still moving forward."
];

export function DailyReminder() {
    const [reminder, setReminder] = useState("");

    useEffect(() => {
        // Pick a random reminder on mount
        const random = REMINDERS[Math.floor(Math.random() * REMINDERS.length)];
        setReminder(random);
    }, []);

    if (!reminder) return null;

    return (
        <div className="bg-sol-teal/[0.05] border border-sol-teal/20 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <Sparkles size={80} className="text-sol-teal" />
            </div>

            <div className="relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-sol-teal mb-3 flex items-center gap-2">
                    <Sparkles size={14} /> Daily Reminder
                </h3>
                <p className="text-slate-200 leading-relaxed font-serif italic text-lg pr-4">
                    "{reminder}"
                </p>
            </div>
        </div>
    );
}
