import { Sparkles, Phone, Heart, Users, BookOpen, ExternalLink, Headphones, Brain, Wind, Moon } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AnimatedBackground } from '../components/AnimatedBackground';

export const metadata = {
    title: 'Wellness Library | Solitude',
    description: 'Curated mental health resources, articles, helplines, and self-help tools.',
};

// ── Data ──────────────────────────────────────────────────────────────────────

const helplines = [
    {
        name: 'AASRA',
        phone: '91-9820466627',
        label: '24/7 Crisis Support',
        desc: 'For those struggling with thoughts of self-harm or deep emotional distress.',
    },
    {
        name: 'Vandrevala Foundation',
        phone: '1860-2662-345',
        label: 'Mental Health Support',
        desc: 'Free 24×7 psychological counselling for anyone across India.',
    },
    {
        name: 'iCall (TISS)',
        phone: '9152987821',
        label: 'Support Helpline',
        desc: 'Counselling services by trained professionals for all emotional needs.',
    },
];

const articleCategories = [
    {
        icon: Brain,
        label: 'Understanding Anxiety',
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/20',
        articles: [
            {
                title: 'What Is Anxiety? (And What It Isn\'t)',
                source: 'Healthline',
                url: 'https://www.healthline.com/health/anxiety',
                desc: 'A clear, evidence-based explainer on what anxiety is, its types, and how it manifests.',
            },
            {
                title: 'How to Stop Anxious Thoughts',
                source: 'Psychology Today',
                url: 'https://www.psychologytoday.com/us/basics/anxiety',
                desc: 'Practical cognitive strategies for interrupting anxious thought loops.',
            },
            {
                title: 'Anxiety & the Body: Why You Feel It Physically',
                source: 'Verywell Mind',
                url: 'https://www.verywellmind.com/physical-symptoms-of-anxiety-2584245',
                desc: 'Explains the physical sensations of anxiety and why your body reacts the way it does.',
            },
        ],
    },
    {
        icon: Moon,
        label: 'Stress & Burnout',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        articles: [
            {
                title: 'Recognising Burnout Before It Happens',
                source: 'Harvard Business Review',
                url: 'https://hbr.org/2016/11/beating-burnout',
                desc: 'Research-backed signs of burnout and how to intervene early before it becomes chronic.',
            },
            {
                title: 'The Science of Stress',
                source: 'American Psychological Association',
                url: 'https://www.apa.org/topics/stress',
                desc: 'The APA\'s comprehensive resource on stress — causes, effects, and management strategies.',
            },
            {
                title: 'How to Recover From Academic Burnout',
                source: 'Verywell Mind',
                url: 'https://www.verywellmind.com/student-burnout-4800166',
                desc: 'Targeted guidance for students experiencing exhaustion and loss of motivation.',
            },
        ],
    },
    {
        icon: Wind,
        label: 'Mindfulness & Grounding',
        color: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
        articles: [
            {
                title: 'A Beginner\'s Guide to Mindfulness Meditation',
                source: 'Mindful.org',
                url: 'https://www.mindful.org/meditation/mindfulness-getting-started/',
                desc: 'Step-by-step introduction to mindfulness practice, suitable for complete beginners.',
            },
            {
                title: 'The 5-4-3-2-1 Grounding Technique',
                source: 'Healthline',
                url: 'https://www.healthline.com/health/grounding-techniques',
                desc: 'Simple sensory grounding exercises to bring yourself back to the present moment.',
            },
            {
                title: 'Box Breathing: How to Calm Your Nervous System',
                source: 'Cleveland Clinic',
                url: 'https://health.clevelandclinic.org/box-breathing-benefits',
                desc: 'How and why controlled breathing directly reduces physiological stress responses.',
            },
        ],
    },
    {
        icon: Heart,
        label: 'Self-Compassion & Motivation',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        articles: [
            {
                title: 'Self-Compassion: The Antidote to Self-Criticism',
                source: 'Greater Good Magazine (UC Berkeley)',
                url: 'https://greatergood.berkeley.edu/topic/self-compassion',
                desc: 'Research-grounded articles on treating yourself with the same kindness you\'d give a friend.',
            },
            {
                title: 'Why Motivation Comes After Action, Not Before',
                source: 'James Clear',
                url: 'https://jamesclear.com/motivation',
                desc: 'A practical reframe on motivation that removes the need to "feel ready" first.',
            },
            {
                title: 'How to Stop Procrastinating (And Why You Start)',
                source: 'Verywell Mind',
                url: 'https://www.verywellmind.com/the-psychology-of-procrastination-2795944',
                desc: 'The psychology behind procrastination and evidence-based strategies to move forward.',
            },
        ],
    },
];

const tools = [
    {
        icon: Headphones,
        name: 'Insight Timer',
        category: 'Meditation & Sleep',
        desc: 'The world\'s largest free library of guided meditations, sleep music, and breathing exercises.',
        url: 'https://insighttimer.com',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
    },
    {
        icon: Brain,
        name: 'Woebot',
        category: 'CBT-Based Companion',
        desc: 'An evidence-based chatbot that teaches cognitive behavioural therapy techniques through conversation.',
        url: 'https://woebothealth.com',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
    },
    {
        icon: BookOpen,
        name: 'Moodfit',
        category: 'Mood Tracking',
        desc: 'Track your mood, thoughts, and habits over time to identify patterns and triggers.',
        url: 'https://www.getmoodfit.com',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
    },
    {
        icon: Wind,
        name: 'Calm',
        category: 'Breathing & Mindfulness',
        desc: 'Guided breathing sessions, sleep stories, and daily mindfulness practices.',
        url: 'https://www.calm.com',
        color: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
    },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
    return (
        <div className="min-h-screen flex flex-col pt-32 relative">
            <AnimatedBackground />
            <Navbar />

            <main className="flex-grow max-w-6xl mx-auto px-6 py-20 w-full relative z-10 space-y-28">

                {/* ── Header ── */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 font-bold text-xs uppercase tracking-widest border border-red-500/20">
                        <Heart size={14} fill="currentColor" /> You are not alone
                    </div>
                    <h1 className="text-5xl md:text-6xl text-white serif italic">Wellness Library</h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Curated resources — helplines, articles, and self-help tools — to support your mental wellbeing journey.
                    </p>
                </div>

                {/* ── Helplines ── */}
                <section>
                    <SectionHeading icon={Phone} label="Crisis Helplines" subtitle="Speak to someone right now — free and confidential." />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                        {helplines.map((h, i) => (
                            <div key={i} className="bg-sol-glass backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-xl flex flex-col h-full group transition-all duration-500 hover:border-sol-teal/50">
                                <div className="mb-5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sol-teal bg-sol-teal/10 px-3 py-1 rounded-full">{h.label}</span>
                                    <h3 className="text-xl mt-4 text-white font-bold">{h.name}</h3>
                                </div>
                                <p className="text-slate-400 mb-7 flex-grow leading-relaxed text-sm italic">{h.desc}</p>
                                <div className="space-y-3">
                                    <div className="text-2xl font-bold text-white tracking-tight">{h.phone}</div>
                                    <a
                                        href={`tel:${h.phone.replace(/[-\s]/g, '')}`}
                                        className="btn-sol-primary w-full gap-2 !py-4 shadow-none hover:shadow-lg hover:shadow-sol-teal/20"
                                    >
                                        <Phone size={16} /> Call Now
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Articles ── */}
                <section>
                    <SectionHeading icon={BookOpen} label="Reading List" subtitle="Evidence-based articles, guides, and perspectives — curated for you." />
                    <div className="grid md:grid-cols-2 gap-8 mt-10">
                        {articleCategories.map((cat, ci) => {
                            const Icon = cat.icon;
                            return (
                                <div key={ci} className={`bg-sol-glass backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 space-y-6`}>
                                    {/* Category header */}
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${cat.bg} ${cat.color} border ${cat.border}`}>
                                        <Icon size={13} /> {cat.label}
                                    </div>
                                    {/* Article list */}
                                    <div className="space-y-4">
                                        {cat.articles.map((article, ai) => (
                                            <a
                                                key={ai}
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
                                            >
                                                <ExternalLink size={14} className={`${cat.color} mt-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`} />
                                                <div className="space-y-1 min-w-0">
                                                    <div className="text-white text-sm font-semibold leading-snug group-hover:text-sol-teal transition-colors">
                                                        {article.title}
                                                    </div>
                                                    <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">{article.source}</div>
                                                    <div className="text-slate-400 text-xs leading-relaxed">{article.desc}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Self-Help Tools ── */}
                <section>
                    <SectionHeading icon={Sparkles} label="Self-Help Tools" subtitle="Apps and platforms that can complement your wellbeing practice." />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                        {tools.map((tool, i) => {
                            const Icon = tool.icon;
                            return (
                                <a
                                    key={i}
                                    href={tool.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-sol-glass backdrop-blur-xl border border-white/10 hover:border-white/20 p-7 rounded-[2rem] flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tool.bg} ${tool.color} border ${tool.border}`}>
                                        <Icon size={22} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${tool.color}`}>{tool.category}</div>
                                        <div className="text-white font-semibold text-base">{tool.name}</div>
                                    </div>
                                    <p className="text-slate-400 text-xs leading-relaxed flex-grow">{tool.desc}</p>
                                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${tool.color} group-hover:gap-2.5 transition-all duration-200`}>
                                        Visit <ExternalLink size={11} />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* ── Global note ── */}
                <div className="p-10 rounded-[3rem] bg-sol-glass backdrop-blur-xl border border-white/10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                        <Users size={120} />
                    </div>
                    <div className="relative z-10 space-y-4 max-w-2xl">
                        <h2 className="text-3xl font-heading font-bold italic text-white font-serif">Outside India?</h2>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            Visit{' '}
                            <a href="https://www.befrienders.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-sol-teal hover:text-sol-accent transition-colors">Befrienders Worldwide</a>
                            {' '}or{' '}
                            <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-sol-teal hover:text-sol-accent transition-colors">IASP</a>
                            {' '}to find crisis support services in your country.
                        </p>
                        <div className="flex items-center gap-2 pt-4 text-sm font-medium text-sol-teal">
                            <Sparkles size={16} /> Every life is precious.
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}

// ── Shared section heading component ─────────────────────────────────────────

function SectionHeading({ icon: Icon, label, subtitle }: { icon: React.ElementType; label: string; subtitle: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-sol-teal/10 rounded-xl flex items-center justify-center text-sol-teal border border-sol-teal/20">
                    <Icon size={18} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-white">{label}</h2>
            </div>
            <p className="text-slate-400 text-sm">{subtitle}</p>
        </div>
    );
}
