"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Heart, PenTool, Activity } from "lucide-react";

export function ActivityStats() {
    const [stats, setStats] = useState({ conversations: 8, moods: 0, reflections: 0 });

    const loadStats = () => {
        const localStats = JSON.parse(localStorage.getItem('user_stats') || '{"moods":0,"reflections":0}');
        // We simulate `conversations` safely defaulting to 8 as per user instructions if no backend
        setStats({
            conversations: localStats.conversations || 8,
            moods: localStats.moods || 0,
            reflections: localStats.reflections || 0,
        });
    };

    useEffect(() => {
        loadStats();
        window.addEventListener('localStatsUpdated', loadStats);
        return () => window.removeEventListener('localStatsUpdated', loadStats);
    }, []);

    return (
        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-5 backdrop-blur-sm">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <Activity size={16} className="text-sol-teal" /> Your Activity
            </h3>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <MessageCircle size={16} />
                        </div>
                        <span className="text-sm text-slate-300">Conversations</span>
                    </div>
                    <span className="text-white font-bold">{stats.conversations}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                            <Heart size={16} />
                        </div>
                        <span className="text-sm text-slate-300">Mood Check-ins</span>
                    </div>
                    <span className="text-white font-bold">{stats.moods}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sol-teal/10 text-sol-teal flex items-center justify-center">
                            <PenTool size={16} />
                        </div>
                        <span className="text-sm text-slate-300">Reflections</span>
                    </div>
                    <span className="text-white font-bold">{stats.reflections}</span>
                </div>
            </div>
        </div>
    );
}
