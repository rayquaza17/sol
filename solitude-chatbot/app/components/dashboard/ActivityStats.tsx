"use client";

import { useState, useEffect } from "react";
import { Heart, PenTool, Activity, CalendarCheck } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MoodEntry {
    date: string; // YYYY-MM-DD
    label: string;
    emoji: string;
}

interface ReflectionEntry {
    date: string; // YYYY-MM-DD
    content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadStats() {
    const moodEntries: MoodEntry[] = JSON.parse(
        localStorage.getItem("mood_entries") || "[]"
    );
    const reflectionEntries: ReflectionEntry[] = JSON.parse(
        localStorage.getItem("reflection_entries") || "[]"
    );

    const moodDates = new Set(moodEntries.map((e) => e.date));
    const reflectionDates = new Set(reflectionEntries.map((e) => e.date));
    const allDates = new Set([...moodDates, ...reflectionDates]);

    return {
        moods: moodEntries.length,
        reflections: reflectionEntries.length,
        daysActive: allDates.size,
    };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ActivityStats() {
    const [stats, setStats] = useState({ moods: 0, reflections: 0, daysActive: 0 });

    const refresh = () => setStats(loadStats());

    useEffect(() => {
        refresh();
        window.addEventListener("localStatsUpdated", refresh);
        return () => window.removeEventListener("localStatsUpdated", refresh);
    }, []);

    const rows = [
        {
            icon: <Heart size={15} />,
            label: "Mood Check-ins",
            value: stats.moods,
            colorClass: "bg-orange-500/10 text-orange-400",
        },
        {
            icon: <PenTool size={15} />,
            label: "Reflections Written",
            value: stats.reflections,
            colorClass: "bg-sol-teal/10 text-sol-teal",
        },
        {
            icon: <CalendarCheck size={15} />,
            label: "Days Active",
            value: stats.daysActive,
            colorClass: "bg-violet-500/10 text-violet-400",
        },
    ];

    return (
        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-5 backdrop-blur-sm">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <Activity size={16} className="text-sol-teal" /> Your Activity
            </h3>

            <div className="flex flex-col gap-3">
                {rows.map(({ icon, label, value, colorClass }) => (
                    <div
                        key={label}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                                {icon}
                            </div>
                            <span className="text-sm text-slate-300">{label}</span>
                        </div>
                        <span className="text-white font-bold">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
