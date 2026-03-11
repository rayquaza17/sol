"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Sparkles, MessageCircle, BookOpen, Heart, TrendingUp,
    Calendar, Clock, LogOut, ArrowRight, Wind, Shield,
    Flame, Star, BarChart2
} from "lucide-react";
import Link from "next/link";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { useAuth } from "../context/AuthProvider";
import { MoodCheckIn } from "../components/dashboard/MoodCheckIn";
import { ReflectionBox } from "../components/dashboard/ReflectionBox";
import { ActivityStats } from "../components/dashboard/ActivityStats";
import { DailyReminder } from "../components/dashboard/DailyReminder";


// ─── Animation Variants ───────────────────────────────────────────────────────

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

// ─── Sub Components ───────────────────────────────────────────────────────────

function StatCard({
    icon, label, value, sub, accent = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
}) {
    return (
        <motion.div
            variants={item}
            className={`flex flex-col gap-3 p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${accent
                ? "bg-sol-teal/10 border-sol-teal/25 hover:border-sol-teal/40"
                : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.12]"
                }`}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${accent ? "bg-sol-teal/20 text-sol-teal" : "bg-white/[0.06] text-slate-400"}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-heading font-bold text-white">{value}</p>
                <p className="text-sm font-medium text-slate-400">{label}</p>
                {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}

function QuickAction({
    href, icon, label, description, primary = false,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    primary?: boolean;
}) {
    return (
        <motion.div variants={item}>
            <Link href={href}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-4 p-5 rounded-3xl border cursor-pointer transition-all duration-300 ${primary
                        ? "bg-sol-teal/10 border-sol-teal/25 hover:bg-sol-teal/15 hover:border-sol-teal/40"
                        : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.12]"
                        }`}
                >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${primary ? "bg-sol-teal/20 text-sol-teal" : "bg-white/[0.07] text-slate-400"}`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
                    </div>
                    <ArrowRight size={16} className={primary ? "text-sol-teal" : "text-slate-600"} />
                </motion.div>
            </Link>
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {

    const { user, loading, signOut } = useAuth();
    const router = useRouter();


    // Redirect to /auth if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
        }
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <AnimatedBackground />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-white/10 border-t-sol-teal rounded-full"
                />
            </div>
        );
    }

    const displayName = user.user_metadata?.full_name as string | undefined;
    const firstName = displayName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";
    const avatarLetter = (displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase();

    const handleLogout = async () => {

        await signOut();
        router.push("/");
    };

    return (
        <div className="relative min-h-screen selection:bg-sol-teal/30">
            <AnimatedBackground />

            {/* Top bar */}
            <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-sol-deep/60 backdrop-blur-2xl border-b border-white/[0.05]">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 bg-sol-teal/15 rounded-xl flex items-center justify-center text-sol-teal border border-sol-teal/20 group-hover:scale-105 transition-transform">
                            <Sparkles size={18} />
                        </div>
                        <span className="font-heading font-bold text-white text-lg tracking-tight group-hover:text-sol-teal transition-colors">Solitude</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {/* Avatar pill */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                            <div className="w-6 h-6 rounded-full bg-sol-teal/30 border border-sol-teal/40 flex items-center justify-center text-sol-teal text-xs font-bold">
                                {avatarLetter}
                            </div>
                            <span className="text-slate-300 text-xs font-medium max-w-[140px] truncate hidden sm:block">
                                {user.email}
                            </span>
                        </div>

                        <motion.button
                            onClick={handleLogout}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 text-slate-500 hover:text-white transition-colors rounded-xl bg-white/5 border border-white/[0.07] hover:bg-white/10"
                            title="Sign out"
                        >
                            <LogOut size={15} />
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
                <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-8">

                    {/* ── Welcome header ── */}
                    <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm text-sol-teal font-semibold uppercase tracking-widest mb-1">Your sanctuary</p>
                            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
                                Hello, {firstName} 👋
                            </h1>
                            <p className="text-slate-400 mt-1.5 text-sm">
                                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            </p>
                        </div>

                        <Link href="/chat">
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="btn-sol-primary !py-3 !px-6 gap-3 text-sm shrink-0"
                            >
                                Start Session <Wind size={16} />
                            </motion.div>
                        </Link>
                    </motion.div>

                    {/* ── Personalization Row 1: Mood & Reminder ── */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={item}>
                            <MoodCheckIn />
                        </motion.div>
                        <motion.div variants={item}>
                            <DailyReminder />
                        </motion.div>
                    </div>

                    {/* ── Personalization Row 2: Reflection & Stats ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={item}>
                            <ReflectionBox />
                        </motion.div>
                        <motion.div variants={item}>
                            <ActivityStats />
                        </motion.div>
                    </div>

                    {/* ── Two-column: Quick actions + Mood chart ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">


                        {/* Quick actions */}
                        <motion.div variants={item} className="flex flex-col gap-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Quick actions</p>
                            <motion.div variants={container} className="flex flex-col gap-3">
                                <QuickAction
                                    href="/chat"
                                    icon={<MessageCircle size={18} />}
                                    label="Open Chat"
                                    description="Continue where you left off"
                                    primary
                                />
                                <QuickAction
                                    href="/resources"
                                    icon={<BookOpen size={18} />}
                                    label="Resource Library"
                                    description="Guided reads and exercises"
                                />
                                <QuickAction
                                    href="/about"
                                    icon={<Shield size={18} />}
                                    label="Our Philosophy"
                                    description="How Solitude supports you"
                                />
                            </motion.div>
                        </motion.div>

                        {/* Mood chart */}
                        <motion.div
                            variants={item}
                            className="flex flex-col gap-4 p-6 rounded-3xl bg-white/[0.04] border border-white/[0.07]"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Weekly mood</p>
                                    <p className="text-white font-heading font-bold text-lg mt-0.5">This week</p>
                                </div>
                                <div className="w-9 h-9 rounded-2xl bg-white/[0.06] flex items-center justify-center text-slate-400">
                                    <BarChart2 size={17} />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                                <p className="text-slate-400 font-medium mb-1">No chart data</p>
                                <p className="text-xs text-slate-500">Log your mood daily to start building your chart.</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Recent activity ── */}
                    <motion.div variants={item}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Recent sessions</p>
                        <div className="flex flex-col items-center justify-center py-10 px-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] border-dashed text-center">
                            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center text-slate-500 mb-4">
                                <MessageCircle size={20} />
                            </div>
                            <p className="text-slate-300 font-medium mb-1">No recent sessions yet</p>
                            <p className="text-sm text-slate-500 max-w-[250px] mb-6">Your conversation history will appear here once you start chatting with Solitude.</p>
                            <Link href="/chat">
                                <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10">
                                    Start a Conversation
                                </button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* ── Account section ── */}
                    <motion.div
                        variants={item}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sol-teal/15 border border-sol-teal/25 flex items-center justify-center text-sol-teal text-lg font-bold font-heading">
                                {avatarLetter}
                            </div>
                            <div>
                                <p className="font-semibold text-white">{displayName ?? "Solitude User"}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                        </div>

                        <motion.button
                            onClick={handleLogout}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="btn-sol-secondary !py-2.5 !px-5 !rounded-2xl gap-2 text-sm"
                        >
                            <LogOut size={15} /> Sign out
                        </motion.button>
                    </motion.div>

                </motion.div>
            </main>
        </div>
    );
}
