"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../context/AuthProvider";

const MOODS = [
    { label: "Good", emoji: "🙂", color: "hover:bg-sol-teal/20 hover:border-sol-teal/40 text-sol-teal" },
    { label: "Okay", emoji: "😐", color: "hover:bg-blue-500/20 hover:border-blue-500/40 text-blue-400" },
    { label: "Stressed", emoji: "😟", color: "hover:bg-orange-500/20 hover:border-orange-500/40 text-orange-400" },
    { label: "Low", emoji: "😔", color: "hover:bg-slate-500/20 hover:border-slate-500/40 text-slate-400" },
];

export function MoodCheckIn() {
    const { user } = useAuth();
    const [selectedMood, setSelectedMood] = useState<{ label: string; emoji: string } | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        const saved = localStorage.getItem(`mood_${today}`);
        if (saved) {
            try {
                setSelectedMood(JSON.parse(saved));
            } catch (e) { }
        }
        setHasLoaded(true);
    }, []);

    const handleSelectMood = async (mood: typeof MOODS[0]) => {
        setSelectedMood({ label: mood.label, emoji: mood.emoji });
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem(`mood_${today}`, JSON.stringify({ label: mood.label, emoji: mood.emoji }));

        // Increment local stats
        const stats = JSON.parse(localStorage.getItem('user_stats') || '{"moods":0,"reflections":0}');
        stats.moods = (stats.moods || 0) + 1;
        localStorage.setItem('user_stats', JSON.stringify(stats));
        // Dispatch event so ActivityStats can update
        window.dispatchEvent(new Event('localStatsUpdated'));

        if (user) {
            try {
                // Optional Supabase storage (fails silently if table doesn't exist)
                await supabase.from("moods").insert([
                    { user_id: user.id, mood: mood.label, emoji: mood.emoji, date: today }
                ]);
            } catch (error) {
                // Ignore backend errors as this is primarily UI personalization
            }
        }
    };

    if (!hasLoaded) return <div className="h-32 bg-white/[0.02] rounded-3xl animate-pulse"></div>;

    return (
        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-5 backdrop-blur-sm">
            <AnimatePresence mode="wait">
                {!selectedMood ? (
                    <motion.div
                        key="selector"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col gap-4"
                    >
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            How are you feeling today?
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {MOODS.map((m) => (
                                <button
                                    key={m.label}
                                    onClick={() => handleSelectMood(m)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] transition-all duration-300 ${m.color}`}
                                >
                                    <span className="text-lg">{m.emoji}</span>
                                    <span className="text-sm font-medium">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Today's Mood</p>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{selectedMood.emoji}</span>
                                <span className="text-lg text-white font-medium">{selectedMood.label}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedMood(null)}
                            className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Change
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
