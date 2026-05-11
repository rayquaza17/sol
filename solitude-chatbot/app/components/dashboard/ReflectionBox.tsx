"use client";

import { useState, useEffect } from "react";
import { Send, Edit3 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../context/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReflectionEntry {
    date: string; // YYYY-MM-DD
    content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0];

function getLastReflection(): string | null {
    try {
        const entries: ReflectionEntry[] = JSON.parse(
            localStorage.getItem("reflection_entries") || "[]"
        );
        if (!entries.length) return null;
        return entries[entries.length - 1].content;
    } catch {
        return null;
    }
}

function saveReflectionEntry(content: string): void {
    const entries: ReflectionEntry[] = JSON.parse(
        localStorage.getItem("reflection_entries") || "[]"
    );
    entries.push({ date: todayStr(), content });
    localStorage.setItem("reflection_entries", JSON.stringify(entries));
    window.dispatchEvent(new Event("localStatsUpdated"));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReflectionBox() {
    const { user } = useAuth();
    const [reflection, setReflection] = useState("");
    const [lastReflection, setLastReflection] = useState<string | null>(null);

    useEffect(() => {
        setLastReflection(getLastReflection());
    }, []);

    const handleSave = async () => {
        if (!reflection.trim()) return;

        saveReflectionEntry(reflection.trim());
        setLastReflection(reflection.trim());
        setReflection("");

        if (user) {
            try {
                // Optional Supabase storage (fails cleanly if table missing)
                await supabase.from("reflections").insert([
                    { user_id: user.id, content: reflection.trim(), date: todayStr() }
                ]);
            } catch {
                // Local storage is the source of truth
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
