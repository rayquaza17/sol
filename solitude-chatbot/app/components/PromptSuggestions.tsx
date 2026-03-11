'use client';

import { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PromptItem {
    icon: string;
    text: string;
}

interface PromptSuggestionsProps {
    onSelect: (text: string) => void;
}

// ── Full prompt pool (12 entries) ─────────────────────────────────────────────
const PROMPT_POOL: PromptItem[] = [
    { icon: '📚', text: "I feel stressed about exams. Can you help?" },
    { icon: '😟', text: "I've been feeling anxious lately." },
    { icon: '💪', text: "I need advice for staying motivated." },
    { icon: '💬', text: "I just want to talk about something on my mind." },
    { icon: '🌿', text: "Help me calm down when I feel overwhelmed." },
    { icon: '😴', text: "I've been procrastinating a lot lately." },
    { icon: '🧠', text: "I feel mentally exhausted." },
    { icon: '📖', text: "I'm struggling to focus on studying." },
    { icon: '🌧️', text: "I'm feeling really unmotivated these days." },
    { icon: '🗂️', text: "I need help organizing my thoughts." },
    { icon: '⏰', text: "I feel overwhelmed with work and deadlines." },
    { icon: '🤯', text: "I don't know how to deal with stress right now." },
];

// ── Random subset selector ────────────────────────────────────────────────────
function pickRandom(pool: PromptItem[], count: number): PromptItem[] {
    // Fisher-Yates shuffle on a shallow copy, then take the first `count`
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

// ── Framer Motion variants ────────────────────────────────────────────────────
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: { duration: 0.3, ease: 'easeOut' as const },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.45, ease: 'easeOut' as const },
    },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function PromptSuggestions({ onSelect }: PromptSuggestionsProps) {
    // Lazy initializer: runs once on mount, never again — gives 4 or 5 prompts
    const [displayed] = useState<PromptItem[]>(() => {
        const count = Math.random() < 0.5 ? 4 : 5;
        return pickRandom(PROMPT_POOL, count);
    });

    const isOddCount = displayed.length % 2 !== 0;

    return (
        <motion.div
            key="prompt-suggestions"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-6 px-2 py-6"
            aria-label="Conversation starter suggestions"
        >
            {/* Header */}
            <motion.div variants={cardVariants} className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2 text-sol-teal mb-1" aria-hidden="true">
                    <Sparkles size={18} className="opacity-80" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-white tracking-tight">
                    How can I help you today?
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                    Choose a prompt to get started, or type your own below.
                </p>
            </motion.div>

            {/* Suggestion Grid */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl"
                role="group"
                aria-label="Suggestion prompts"
            >
                {displayed.map((suggestion, index) => {
                    const isLastAndAlone = isOddCount && index === displayed.length - 1;
                    return (
                        <motion.button
                            key={suggestion.text}
                            variants={cardVariants}
                            onClick={() => onSelect(suggestion.text)}
                            whileHover={{ scale: 1.025, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.18 }}
                            className={[
                                'group flex items-start gap-3 text-left',
                                'bg-sol-glass backdrop-blur-xl',
                                'border border-white/10',
                                'hover:border-sol-teal/40 hover:bg-white/[0.06]',
                                'rounded-2xl p-4',
                                'transition-all duration-300',
                                'cursor-pointer',
                                'outline-none focus-visible:ring-2 focus-visible:ring-sol-teal',
                                isLastAndAlone ? 'sm:col-span-2' : '',
                            ].join(' ')}
                            aria-label={`Start conversation: ${suggestion.text}`}
                        >
                            <span
                                className="text-xl mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                                aria-hidden="true"
                            >
                                {suggestion.icon}
                            </span>
                            <span className="text-sm font-medium text-slate-200 group-hover:text-white leading-relaxed transition-colors duration-200">
                                {suggestion.text}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
