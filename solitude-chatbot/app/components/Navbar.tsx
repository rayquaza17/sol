"use client";

import { motion } from "framer-motion";
import { Sparkles, Wind, LogOut } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "next/navigation";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.push("/");
    };

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`fixed top-0 w-full z-50 transition-all duration-500 px-6 py-6 ${isScrolled ? "bg-sol-deep/70 backdrop-blur-2xl border-b border-white/5 py-4" : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-11 h-11 bg-sol-teal/15 rounded-2xl flex items-center justify-center text-sol-teal group-hover:scale-105 transition-transform duration-500 border border-sol-teal/20">
                        <Sparkles size={24} className="group-hover:animate-pulse" />
                    </div>
                    <span className="text-2xl font-heading font-bold tracking-tight text-white group-hover:text-sol-teal transition-colors duration-300">Solitude</span>
                </Link>

                <div className="hidden md:flex items-center gap-10 font-medium">
                    <Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm uppercase tracking-[0.2em] font-semibold">Our Way</Link>
                    <Link href="/resources" className="text-slate-400 hover:text-white transition-colors text-sm uppercase tracking-[0.2em] font-semibold">Library</Link>

                    {/* Auth area — only renders after loading resolves */}
                    {!loading && (
                        user ? (
                            /* ── Signed-in badge ── */
                            <div className="flex items-center gap-3">
                                <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] hover:border-white/[0.14] transition-all duration-200">
                                    {/* Avatar initial */}
                                    <div className="w-6 h-6 rounded-full bg-sol-teal/30 border border-sol-teal/40 flex items-center justify-center text-sol-teal text-xs font-bold">
                                        {user.email?.[0].toUpperCase() ?? "U"}
                                    </div>
                                    <span className="text-slate-300 text-xs font-medium max-w-[120px] truncate">
                                        {user.email}
                                    </span>
                                </Link>
                                <motion.button
                                    onClick={handleLogout}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10"
                                    aria-label="Log out"
                                    title="Log out"
                                >
                                    <LogOut size={15} />
                                </motion.button>
                            </div>
                        ) : (
                            /* ── Guest: show Sign In link ── */
                            <Link href="/auth" className="text-slate-400 hover:text-white transition-colors text-sm uppercase tracking-[0.2em] font-semibold">Sign In</Link>
                        )
                    )}

                    <Link href="/chat" className="btn-sol-primary !py-3 !px-8 !text-sm gap-3 tracking-wide">
                        Enter Sanctuary <Wind size={18} />
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
}
