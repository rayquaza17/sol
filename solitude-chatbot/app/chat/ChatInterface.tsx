'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Send, Sparkles, LogOut, Heart, Info, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';

import { MoodLevel } from '@/lib/ai/engine/types';
import PromptSuggestions from '@/app/components/PromptSuggestions';
import { CursorGlow } from '@/app/components/chat/CursorGlow';

interface MoodOption {
    level: 1 | 2 | 3 | 4 | 5;
    emoji: string;
    label: string;
}

const moodOptions: MoodOption[] = [
    { level: 1, emoji: '😢', label: 'Struggling' },
    { level: 2, emoji: '😔', label: 'Down' },
    { level: 3, emoji: '😐', label: 'Okay' },
    { level: 4, emoji: '🙂', label: 'Good' },
    { level: 5, emoji: '😊', label: 'Great' }
];

interface Quote {
    id: number;
    text: string;
    author: string | null;
}

import quotesData from '../data/quotes.json';

interface LocalMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: Date;
}

export default function ChatInterface() {
    const [currentMood, setCurrentMood] = useState<MoodLevel>(null);
    const [showMoodCheckIn, setShowMoodCheckIn] = useState(true);
    const [messages, setMessages] = useState<LocalMessage[]>([
        {
            id: 'initial-1',
            role: 'assistant',
            content: "Welcome to Solitude. This is your safe space. How are you feeling in this quiet moment?",
            createdAt: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const [currentQuote] = useState<Quote | null>(() => {
        const quotes = quotesData.quotes as Quote[];
        return quotes[Math.floor(Math.random() * quotes.length)];
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReduceMotion = useReducedMotion();

    // ── Voice Input ──────────────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Feature detection — browser-only, never runs on SSR
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
        if (!SR) return;

        setVoiceSupported(true);

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const transcript: string = event.results[0][0].transcript;
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.warn('[Voice] SpeechRecognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, []);

    const toggleVoice = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        if (isListening) {
            recognition.abort();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    };




    const scrollToBottom = useCallback(() => {
        if (!isUserScrolling) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isUserScrolling]);

    // Handle scroll detection
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setIsUserScrolling(!isNearBottom);
        }
    };

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    // Reset idle timer on user interaction
    const resetIdleTimer = () => {
        setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            setIsIdle(true);
        }, 30000); // 30 seconds
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    // Initialize idle timer
    useEffect(() => {
        resetIdleTimer();
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, []);

    // ── Context Recovery: vague-input patterns ───────────────────────────────
    const VAGUE_PATTERN = /^(help|idk|nothing|i\s*don'?t\s*know|\.\.+|ok|okay|hmm+|uh+|um+|fine|whatever|dunno|nah|meh)$/i;
    const CONTEXT_RECOVERY_RESPONSE =
        "I'm here to listen. If you'd like, you could tell me what's been on your mind lately, " +
        "ask for advice about something specific, or just talk about how you're feeling. " +
        "There's no pressure — take your time.";

    const isVagueInput = (text: string): boolean => {
        const trimmed = text.trim();
        return trimmed.length <= 20 && VAGUE_PATTERN.test(trimmed);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const trimmedInput = input.trim();

        const userMsg: LocalMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmedInput,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setIsUserScrolling(false);
        resetIdleTimer();

        // ── Context Recovery: handle vague/unclear inputs locally ─────────────
        if (isVagueInput(trimmedInput)) {
            setTimeout(() => {
                const recoveryMsg: LocalMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: CONTEXT_RECOVERY_RESPONSE,
                    createdAt: new Date()
                };
                setMessages(prev => [...prev, recoveryMsg]);
                setIsLoading(false);
            }, 900);
            return;
        }

        // Simulate "thinking" time
        const delay = Math.random() * 1000 + 1000; // 1-2 seconds

        setTimeout(async () => {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [...messages, userMsg],
                        mood: currentMood
                    })
                });

                const data = await response.json();

                const botMsg: LocalMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.content,
                    createdAt: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            } catch (error) {
                console.error('Fetch error:', error);
                const errorMsg: LocalMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "I'm having a little trouble finding my words right now. I'm still here with you, though.",
                    createdAt: new Date()
                };
                setMessages(prev => [...prev, errorMsg]);
            } finally {
                setIsLoading(false);
            }
        }, delay);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !isLoading) {
                handleSend();
            }
        }
    };

    const handleMoodSelect = (mood: 1 | 2 | 3 | 4 | 5) => {
        setCurrentMood(mood);
        setShowMoodCheckIn(false);
    };

    const handleReflectOnQuote = () => {
        if (!currentQuote) return;

        const reflectionPrompt = `I'd like to reflect on this quote: "${currentQuote.text}"`;
        setInput(reflectionPrompt);
        setIsIdle(false);

        // Focus textarea
        textareaRef.current?.focus();
    };

    const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        resetIdleTimer();
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-7rem)] max-w-4xl mx-auto w-full bg-sol-glass backdrop-blur-3xl border border-sol-glass-border rounded-[3rem] overflow-hidden shadow-2xl relative z-10 transition-colors duration-500">
            <CursorGlow isActive={isLoading} />
            {/* Chat Header */}
            <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
                <div className="flex items-center gap-5">
                    <div
                        className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg border border-white/5 bg-sol-teal/10 text-sol-teal"
                        aria-hidden="true"
                    >
                        <Sparkles size={28} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-white tracking-tight">Solitude</h2>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase opacity-70 text-sol-teal">
                            <motion.span
                                animate={shouldReduceMotion ? { opacity: 0.8 } : { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="w-2 h-2 rounded-full bg-sol-teal"
                            />
                            Your safe space
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                        className="p-3 text-slate-400 hover:text-white transition-all duration-300 rounded-2xl bg-white/5 border border-white/5"
                        aria-label="Information"
                    >
                        <Info size={20} />
                    </motion.button>
                    <Link
                        href="/"
                        className="btn-sol-secondary !px-6 !py-3 !text-sm gap-2 rounded-2xl"

                    >
                        <LogOut size={18} /> Exit
                    </Link>
                </div>
            </header>



            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto px-6 py-8 space-y-6 scroll-smooth scrollbar-none relative"
                role="log"
                aria-label="Chat history"
                aria-live="polite"
            >
                {/* Mood Check-In Overlay */}
                <AnimatePresence>
                    {showMoodCheckIn && messages.length === 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-x-0 bottom-0 top-0 bg-sol-deep/98 backdrop-blur-2xl flex items-center justify-center z-50 rounded-[3rem]"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="mood-checkin-title"
                        >
                            <motion.div
                                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, y: 20 }}
                                animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-center max-w-md px-8 py-10 bg-sol-deep/50 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
                            >
                                <h3 id="mood-checkin-title" className="text-2xl font-heading font-bold text-white mb-3">
                                    How are you feeling right now?
                                </h3>
                                <p className="text-slate-300 text-sm mb-8">
                                    This helps me support you better (completely optional)
                                </p>

                                <div className="flex gap-4 justify-center mb-8" role="group" aria-label="Select your current mood">
                                    {moodOptions.map((mood) => (
                                        <motion.button
                                            key={mood.level}
                                            onClick={() => handleMoodSelect(mood.level)}
                                            whileHover={shouldReduceMotion ? {} : { scale: 1.15, y: -5 }}
                                            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 shadow-sm transition-all duration-[250ms] group outline-none focus-visible:ring-2 focus-visible:ring-sol-teal"
                                            aria-label={`I feel ${mood.label}`}
                                        >
                                            <span className="text-4xl" aria-hidden="true">{mood.emoji}</span>
                                            <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
                                                {mood.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>

                                <motion.button
                                    onClick={() => setShowMoodCheckIn(false)}
                                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                                    className="text-sm text-slate-400 hover:text-white font-medium transition-colors duration-[250ms] focus-visible:ring-2 focus-visible:ring-sol-teal rounded-lg px-4 py-2"
                                    aria-label="Skip mood check-in for now"
                                >
                                    Skip for now
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Conversation Starter Prompts — shown only before any user message */}
                <AnimatePresence>
                    {messages.length === 1 && !showMoodCheckIn && (
                        <PromptSuggestions
                            onSelect={(text) => {
                                setInput(text);
                                textareaRef.current?.focus();
                            }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {messages.map((msg: LocalMessage, index: number) => (
                        <motion.div
                            key={msg.id}
                            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
                            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                duration: 0.6,
                                ease: [0.16, 1, 0.3, 1],
                                delay: index === messages.length - 1 ? 0.05 : 0
                            }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] px-7 py-5 rounded-[2rem] leading-relaxed cursor-default shadow-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-br-[0.5rem]'
                                    : 'bg-sol-glass backdrop-blur-3xl text-white rounded-bl-[0.5rem] border border-white/5'
                                    }`}
                            >
                                <p className="text-lg leading-relaxed font-light">{msg.content}</p>
                                <div className={`mt-3 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ${msg.role === 'user' ? 'text-white' : 'text-slate-400'
                                    }`}>
                                    <span className="sr-only">Sent at </span>
                                    {(msg.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <motion.div
                            key="typing-indicator"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="flex justify-start"
                            role="status"
                            aria-label="Solitude is typing"
                        >
                            <div className="bg-sol-glass backdrop-blur-3xl px-7 py-4 rounded-[2rem] rounded-bl-[0.5rem] border border-white/5 flex items-center gap-4 shadow-sm">
                                {/* Icon */}
                                <Sparkles size={14} className="text-sol-teal opacity-70 flex-shrink-0" aria-hidden="true" />

                                {/* Label */}
                                <span className="text-sm text-slate-400 italic font-light tracking-wide select-none">
                                    Solitude is typing
                                </span>

                                {/* Animated dots */}
                                <span className="flex items-center gap-1.5" aria-hidden="true">
                                    {[0, 1, 2].map((i) => (
                                        <motion.span
                                            key={i}
                                            animate={{
                                                scale: [1, 1.4, 1],
                                                opacity: [0.3, 0.9, 0.3],
                                                y: [0, -3, 0]
                                            }}
                                            transition={{
                                                duration: 1.4,
                                                repeat: Infinity,
                                                delay: i * 0.22,
                                                ease: 'easeInOut'
                                            }}
                                            className="w-1.5 h-1.5 bg-sol-teal rounded-full"
                                        />
                                    ))}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Idle State Quote Display */}
                <AnimatePresence>
                    {isIdle && messages.length > 1 && currentQuote && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none"
                            aria-live="polite"
                        >
                            <div className="max-w-lg text-center px-8 py-8 bg-sol-deep/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl mx-4 pointer-events-auto">
                                <motion.blockquote
                                    animate={shouldReduceMotion ? { opacity: 0.9 } : { opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-lg leading-relaxed text-slate-200 italic mb-4"
                                >
                                    &quot;{currentQuote.text}&quot;
                                </motion.blockquote>

                                {currentQuote.author && (
                                    <p className="text-sm text-slate-400 mb-4">— {currentQuote.author}</p>
                                )}

                                <motion.button
                                    onClick={handleReflectOnQuote}
                                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-2 pointer-events-auto text-sm text-sol-teal hover:text-sol-accent focus-visible:ring-2 focus-visible:ring-sol-teal rounded-lg px-4 py-2 outline-none transition-colors duration-[250ms]"
                                    aria-label={`Reflect on this quote: ${currentQuote.text}`}
                                >
                                    Reflect on this &rarr;
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Input Zone */}
            <footer className="px-10 pb-10 pt-6 flex-shrink-0">
                <form onSubmit={handleSend} className="relative">
                    <motion.div
                        whileFocus={shouldReduceMotion ? {} : { scale: 1.002 }}
                        transition={{ duration: 0.4 }}
                    >
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            className={`w-full bg-slate-800 border border-white/5 focus:border-sol-teal/50 focus:ring-8 focus:ring-sol-teal/5 px-8 py-6 rounded-[2.5rem] text-white placeholder:text-slate-400 outline-none text-lg leading-relaxed resize-none overflow-hidden transition-all duration-300 ${voiceSupported ? 'pr-36' : 'pr-20'}`}
                            placeholder="Share your thoughts gently..."
                            value={input}
                            onChange={onInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={resetIdleTimer}
                            aria-label="Type your message"
                            style={{ minHeight: '72px', maxHeight: '200px' }}
                        />
                    </motion.div>
                    {/* Mic button — only rendered when Web Speech API is supported */}
                    {voiceSupported && (
                        <motion.button
                            type="button"
                            onClick={toggleVoice}
                            whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute right-20 bottom-4 w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center ${isListening
                                ? 'bg-red-500/90 text-white shadow-xl shadow-red-500/30 ring-4 ring-red-400/40 animate-pulse'
                                : 'bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-sol-teal'
                                }`}
                            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                            aria-pressed={isListening}
                        >
                            {isListening ? <MicOff size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
                        </motion.button>
                    )}

                    <motion.button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        whileHover={shouldReduceMotion || !input.trim() || isLoading ? {} : { scale: 1.05, y: -2 }}
                        whileTap={shouldReduceMotion || !input.trim() || isLoading ? {} : { scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-4 bottom-4 w-14 h-14 bg-sol-teal text-sol-deep rounded-2xl disabled:opacity-20 transition-all duration-300 shadow-xl shadow-sol-teal/20 flex items-center justify-center hover:bg-sol-accent"
                        aria-label="Send message"
                    >
                        <Send size={24} aria-hidden="true" />
                    </motion.button>
                </form>

                {/* Helper hints */}
                <div className="mt-6 flex items-center justify-between px-4 text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">
                    <span>Shift + Enter for new line</span>
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2"><Heart size={12} className="text-sol-teal" aria-hidden="true" /> Sanctuary Secured</span>
                        <span className="flex items-center gap-2">Crisis Support: <span className="text-sol-teal" aria-label="Crisis helpline number">9152987821</span></span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
