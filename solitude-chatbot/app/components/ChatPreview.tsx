"use client";

import { motion } from "framer-motion";
import { User, Bot, Send } from "lucide-react";

export function ChatPreview() {
    return (
        <section className="py-32 px-6 bg-gradient-to-b from-transparent via-sol-teal/[0.02] to-transparent">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-6xl font-bold font-heading"
                    >
                        A gentle conversation
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg"
                    >
                        Experience a connection that prioritizes your peace of mind.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-sol-glass backdrop-blur-3xl border border-sol-glass-border rounded-[2.5rem] transition-all duration-500 hover:border-sol-teal/20 p-0 overflow-hidden relative shadow-2xl shadow-sol-teal/5"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-sol-teal/10 flex items-center justify-center border border-sol-teal/20">
                                <Bot className="w-6 h-6 text-sol-teal" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold text-lg">Solitude</h4>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-sol-teal animate-pulse" />
                                    <span className="text-xs text-slate-400 font-medium tracking-wide">Listening...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="p-10 space-y-10 min-h-[450px]">
                        <div className="flex justify-start gap-5">
                            <div className="w-10 h-10 rounded-xl bg-sol-teal/10 flex items-center justify-center flex-shrink-0 border border-sol-teal/20">
                                <Bot className="w-5 h-5 text-sol-teal" />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="bg-sol-navy/40 backdrop-blur-md p-5 rounded-3xl rounded-tl-none max-w-[80%] text-slate-200 text-lg leading-relaxed border border-white/5"
                            >
                                I&apos;m here for you. How are you feeling in this quiet moment?
                            </motion.div>
                        </div>

                        <div className="flex justify-end gap-5">
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-sol-teal text-sol-deep p-5 rounded-3xl rounded-tr-none max-w-[80%] font-medium text-lg leading-relaxed shadow-lg shadow-sol-teal/10"
                            >
                                I&apos;ve been feeling a bit overwhelmed lately. Everything feels so fast.
                            </motion.div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                                <User className="w-5 h-5 text-slate-300" />
                            </div>
                        </div>

                        <div className="flex justify-start gap-5">
                            <div className="w-10 h-10 rounded-xl bg-sol-teal/10 flex items-center justify-center flex-shrink-0 border border-sol-teal/20">
                                <Bot className="w-5 h-5 text-sol-teal" />
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 }}
                                className="bg-sol-navy/40 backdrop-blur-md p-5 rounded-3xl rounded-tl-none max-w-[80%] text-slate-200 text-lg leading-relaxed border border-white/5"
                            >
                                Take a deep breath. It&apos;s okay to slow down. Tell me more about what&apos;s on your mind—I&apos;m listening.
                            </motion.div>
                        </div>
                    </div>

                    {/* Input mock */}
                    <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
                        <div className="flex-grow p-4 bg-sol-glass backdrop-blur-3xl border border-sol-glass-border rounded-[1.5rem] text-slate-500 text-sm font-medium">
                            Type your thoughts...
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-sol-teal flex items-center justify-center shadow-lg shadow-sol-teal/20 hover:scale-105 transition-transform cursor-pointer">
                            <Send className="w-6 h-6 text-sol-deep" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
