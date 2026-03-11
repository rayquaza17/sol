"use client";

import { useState, useEffect } from "react";
import { Send, Edit3 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../context/AuthProvider";

export function ReflectionBox() {
    const { user } = useAuth();
    const [reflection, setReflection] = useState("");
    const [lastReflection, setLastReflection] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("last_reflection");
        if (saved) {
            setLastReflection(saved);
        }
    }, []);

    const handleSave = async () => {
        if (!reflection.trim()) return;

        localStorage.setItem("last_reflection", reflection);
        setLastReflection(reflection);
        setReflection("");

        // Increment local stats
        const stats = JSON.parse(localStorage.getItem('user_stats') || '{"moods":0,"reflections":0}');
        stats.reflections = (stats.reflections || 0) + 1;
        localStorage.setItem('user_stats', JSON.stringify(stats));
        // Dispatch event so ActivityStats can update
        window.dispatchEvent(new Event('localStatsUpdated'));

        if (user) {
            try {
                // Optional Supabase storage
                await supabase.from("reflections").insert([
                    { user_id: user.id, content: reflection }
                ]);
            } catch (error) {
                // Fails cleanly if table missing
            }
        }
    };

    return (
        <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
                <Edit3 size={16} className="text-sol-teal" /> Quick Reflection
            </h3>

            <div className="relative">
                <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write something on your mind today..."
                    className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] focus:border-sol-teal/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none outline-none transition-colors"
                    rows={3}
                />
                <button
                    onClick={handleSave}
                    disabled={!reflection.trim()}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-sol-teal hover:bg-sol-accent text-sol-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={14} />
                </button>
            </div>

            {lastReflection && (
                <div className="mt-2 pt-4 border-t border-white/[0.05]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Last Reflection</p>
                    <p className="text-sm text-slate-300 italic">"{lastReflection}"</p>
                </div>
            )}
        </div>
    );
}
