"use client";

import { motion } from "framer-motion";
import { MessageCircle, PenTool, LayoutDashboard, HeartPulse } from "lucide-react";

const FEATURES = [
    {
        title: "AI Emotional Support",
        description: "Talk through stress, anxiety, and challenges.",
        icon: <MessageCircle size={24} />,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "Guided Reflection",
        description: "Explore your thoughts through supportive conversation.",
        icon: <PenTool size={24} />,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
    {
        title: "Personal Dashboard",
        description: "Track moods, reflections, and personal insights.",
        icon: <LayoutDashboard size={24} />,
        color: "text-orange-400",
        bg: "bg-orange-400/10"
    },
    {
        title: "Wellbeing Tools",
        description: "Simple tools designed to help you relax and refocus.",
        icon: <HeartPulse size={24} />,
        color: "text-sol-teal",
        bg: "bg-sol-teal/10"
    }
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export function FeatureCards() {
    return (
        <section className="py-16 px-6 max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-heading font-bold text-white mb-4">How Solitude Supports You</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    A safe, private space to process your emotions and build healthier mental habits.
                </p>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {FEATURES.map((feature, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="bg-neutral-800/40 border border-neutral-700/50 backdrop-blur-sm p-6 rounded-3xl hover:bg-neutral-800/60 transition-colors group"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${feature.bg} ${feature.color}`}>
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
