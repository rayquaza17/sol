"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, Wind } from "lucide-react";
import Link from "next/link";
import { AnimatedBackground } from "../components/AnimatedBackground";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "login" | "register";

interface InputFieldProps {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    icon: React.ReactNode;
    autoComplete?: string;
    showToggle?: boolean;
    onToggle?: () => void;
    showPassword?: boolean;
}

// ─── Input Field Component ────────────────────────────────────────────────────

function InputField({
    id,
    label,
    type,
    value,
    onChange,
    placeholder,
    icon,
    autoComplete,
    showToggle,
    onToggle,
    showPassword,
}: InputFieldProps) {
    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={id}
                className="text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
                {label}
            </label>
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sol-teal transition-colors duration-300">
                    {icon}
                </span>
                <input
                    id={id}
                    type={showToggle ? (showPassword ? "text" : "password") : type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 pl-11 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-sol-teal/50 focus:bg-white/[0.07] transition-all duration-300 pr-11"
                />
                {showToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // TODO: wire to auth backend
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <InputField
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                autoComplete="email"
            />
            <InputField
                id="login-password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                icon={<Lock size={16} />}
                autoComplete="current-password"
                showToggle
                onToggle={() => setShowPassword((p) => !p)}
                showPassword={showPassword}
            />

            <div className="flex justify-end">
                <Link
                    href="/forgot-password"
                    className="text-xs text-slate-500 hover:text-sol-teal transition-colors duration-200"
                >
                    Forgot password?
                </Link>
            </div>

            <motion.button
                type="submit"
                disabled={loading || !email || !password}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sol-primary w-full !py-3.5 !rounded-2xl gap-3 mt-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-sol-deep/30 border-t-sol-deep rounded-full inline-block"
                        />
                        Signing in…
                    </span>
                ) : (
                    <>
                        Enter Sanctuary <Wind size={17} />
                    </>
                )}
            </motion.button>
        </form>
    );
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // TODO: wire to auth backend
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
    };

    const isStrong = password.length >= 8;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <InputField
                id="reg-name"
                label="Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Your name"
                icon={<User size={16} />}
                autoComplete="name"
            />
            <InputField
                id="reg-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                icon={<Mail size={16} />}
                autoComplete="email"
            />
            <div className="flex flex-col gap-2">
                <InputField
                    id="reg-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="At least 8 characters"
                    icon={<Lock size={16} />}
                    autoComplete="new-password"
                    showToggle
                    onToggle={() => setShowPassword((p) => !p)}
                    showPassword={showPassword}
                />
                {/* Strength bar */}
                {password.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: isStrong ? "100%" : `${(password.length / 8) * 100}%`,
                                }}
                                className={`h-full rounded-full transition-colors duration-500 ${isStrong ? "bg-sol-teal" : "bg-orange-400/70"
                                    }`}
                            />
                        </div>
                        <span className={`text-[11px] font-medium ${isStrong ? "text-sol-teal" : "text-orange-400/80"}`}>
                            {isStrong ? "Strong" : "Short"}
                        </span>
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
                By creating an account, you agree to our{" "}
                <Link href="/privacy" className="text-sol-teal/80 hover:text-sol-teal underline underline-offset-2 transition-colors">
                    Privacy Policy
                </Link>
                . Your conversations are private and never shared.
            </p>

            <motion.button
                type="submit"
                disabled={loading || !name || !email || !isStrong}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sol-primary w-full !py-3.5 !rounded-2xl gap-3 mt-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-sol-deep/30 border-t-sol-deep rounded-full inline-block"
                        />
                        Creating account…
                    </span>
                ) : (
                    <>
                        Create Account <ArrowRight size={17} />
                    </>
                )}
            </motion.button>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
    const [tab, setTab] = useState<Tab>("login");

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center selection:bg-sol-teal/30 px-4">
            <AnimatedBackground />

            {/* Back to home */}
            <div className="fixed top-6 left-6 z-50">
                <Link
                    href="/"
                    className="flex items-center gap-3 group"
                    aria-label="Back to Solitude home"
                >
                    <div className="w-10 h-10 bg-sol-teal/15 rounded-xl flex items-center justify-center text-sol-teal group-hover:scale-105 transition-transform duration-300 border border-sol-teal/20">
                        <Sparkles size={20} className="group-hover:animate-pulse" />
                    </div>
                    <span className="text-lg font-heading font-bold tracking-tight text-white group-hover:text-sol-teal transition-colors duration-300">
                        Solitude
                    </span>
                </Link>
            </div>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
            >
                {/* Glass card */}
                <div className="bg-sol-glass backdrop-blur-3xl border border-sol-glass-border rounded-[2.5rem] overflow-hidden shadow-2xl">

                    {/* Header */}
                    <div className="px-8 pt-10 pb-6 text-center border-b border-white/[0.05]">
                        {/* Animated icon */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-14 h-14 bg-sol-teal/15 rounded-2xl flex items-center justify-center text-sol-teal mx-auto mb-5 border border-sol-teal/20"
                        >
                            <Sparkles size={26} />
                        </motion.div>

                        <h1 className="text-2xl font-heading font-bold text-white tracking-tight mb-1">
                            {tab === "login" ? "Welcome back" : "Begin your journey"}
                        </h1>
                        <p className="text-sm text-slate-400">
                            {tab === "login"
                                ? "Your sanctuary is waiting for you."
                                : "A calm space, just for you."}
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex border-b border-white/[0.05]">
                        {(["login", "register"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex-1 py-4 text-sm font-semibold uppercase tracking-widest transition-all duration-300 relative ${tab === t ? "text-sol-teal" : "text-slate-500 hover:text-slate-300"
                                    }`}
                                aria-selected={tab === t}
                            >
                                {t === "login" ? "Sign In" : "Register"}
                                {tab === t && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-sol-teal rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Form body */}
                    <div className="px-8 py-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={tab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                            >
                                {tab === "login" ? <LoginForm /> : <RegisterForm />}
                            </motion.div>
                        </AnimatePresence>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-7">
                            <div className="flex-1 h-px bg-white/[0.06]" />
                            <span className="text-xs text-slate-600 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        {/* Continue without account */}
                        <Link href="/chat">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn-sol-secondary w-full !py-3.5 !rounded-2xl gap-2 text-sm cursor-pointer text-center"
                            >
                                Continue as guest
                            </motion.div>
                        </Link>
                    </div>

                    {/* Footer note */}
                    <div className="px-8 pb-8 text-center">
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Conversations are never stored or shared.{" "}
                            <Link href="/privacy" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">
                                Learn more
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Subtle bottom glow */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-sol-teal/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </div>
    );
}
