"use client";

import { motion } from "framer-motion";
import { Shield, Eye, Heart } from "lucide-react";

const principles = [
    {
        icon: <Shield className="w-6 h-6 text-sol-teal" />,
        title: "Absolute Privacy",
        description: "Your voice belongs only to you. We don&apos;t sell your soul, we protect your sanctuary.",
    },
    {
        icon: <Eye className="w-6 h-6 text-sol-teal" />,
        title: "No Judgment",
        description: "A neutral space to unravel complex emotions without the weight of expectations.",
    },
    {
        icon: <Heart className="w-6 h-6 text-sol-teal" />,
        title: "Human Centered",
        description: "Technology that feels organic, prioritizing empathy over cold algorithms.",
    },
];

export function Philosophy() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-sol-teal text-xs uppercase tracking-[0.3em] font-semibold"
                            >
                                Our Core
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-5xl md:text-6xl font-bold font-heading leading-tight"
                            >
                                Built on <br />
                                <span className="serif italic font-normal text-sol-teal">quiet</span> ethics.
                            </motion.h2>
                        </div>

                        <div className="space-y-8">
                            {principles.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex gap-6 items-start"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-sol-teal/10 flex items-center justify-center flex-shrink-0 border border-sol-teal/20">
                                        {p.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-semibold text-white">{p.title}</h4>
                                        <p className="text-slate-400 leading-relaxed max-w-sm">{p.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] bg-sol-glass backdrop-blur-3xl rounded-[3rem] border border-sol-glass-border overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-sol-teal/20 via-transparent to-sol-deep pointer-events-none" />
                            <div className="absolute inset-0 flex items-center justify-center p-12 text-center flex-col gap-6">
                                <p className="text-3xl md:text-4xl serif italic text-white/90 leading-relaxed font-light font-serif">
                                    &ldquo;True silence is the rest of the mind; it is to the spirit what sleep is to the body, nourishment and refreshment.&rdquo;
                                </p>
                                <span className="text-sol-teal/60 uppercase tracking-[0.2em] text-xs font-semibold">— William Penn</span>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sol-teal/10 rounded-full blur-[60px]" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sol-accent/10 rounded-full blur-[60px]" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
