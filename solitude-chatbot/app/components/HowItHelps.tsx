"use client";

import { motion } from "framer-motion";
import { MessageCircle, Shield, Heart, Wind } from "lucide-react";

const features = [
    {
        icon: <MessageCircle className="w-6 h-6 text-sol-teal" />,
        title: "Empathic Dialogue",
        description: "An AI that mirrors your emotions with poetic precision, offering space without pressure.",
        className: "md:col-span-2 md:row-span-1",
    },
    {
        icon: <Shield className="w-6 h-6 text-sol-teal" />,
        title: "Silent Sanctuary",
        description: "Your reflections are private. End-to-end respect for your personal clarity.",
        className: "md:col-span-1 md:row-span-1",
    },
    {
        icon: <Wind className="w-6 h-6 text-sol-teal" />,
        title: "Inward Breath",
        description: "Mindfulness tools woven into conversation, grounding you when the world feels loud.",
        className: "md:col-span-1 md:row-span-1",
    },
    {
        icon: <Heart className="w-6 h-6 text-sol-teal" />,
        title: "Kind Presence",
        description: "A companion that understands the rhythm of solitude and the weight of deep thought.",
        className: "md:col-span-2 md:row-span-1",
    },
];

export function HowItHelps() {
    return (
        <section className="py-32 px-6 relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                    <div className="max-w-xl space-y-4">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-sol-teal text-xs uppercase tracking-[0.3em] font-semibold"
                        >
                            The Experience
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-6xl font-bold font-heading"
                        >
                            Designed for <br />
                            <span className="serif italic font-normal text-sol-teal">quiet</span> strength.
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-lg max-w-md leading-relaxed"
                    >
                        We step away from the noise of traditional social tech,
                        creating a focused space where your mind can breathe.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`${feature.className} bg-sol-glass backdrop-blur-3xl border border-sol-glass-border rounded-[2.5rem] p-10 transition-all duration-[400ms] hover:border-sol-teal/30 hover:bg-white/[0.06] flex flex-col justify-between group`}
                        >
                            <div className="w-14 h-14 bg-sol-teal/5 rounded-2xl flex items-center justify-center mb-12 group-hover:scale-110 transition-transform duration-500 border border-sol-teal/10">
                                {feature.icon}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-semibold text-white tracking-tight">{feature.title}</h3>
                                <p className="text-slate-400 text-lg leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
