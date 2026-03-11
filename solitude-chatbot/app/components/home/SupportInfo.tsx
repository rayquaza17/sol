import { ShieldAlert, PhoneCall, Users, HeartPulse } from "lucide-react";

export function SupportInfo() {
    return (
        <section className="py-16 px-6 max-w-5xl mx-auto border-t border-white/5">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start justify-between">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
                        <ShieldAlert size={14} /> When to seek help
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Solitude is an AI, not a therapist.</h2>
                    <p className="text-slate-400 leading-relaxed max-w-lg">
                        If you're feeling overwhelmed, experiencing a mental health crisis, or having thoughts of self-harm, please consider reaching out to professional support or trusted individuals immediately.
                    </p>
                </div>

                <div className="flex-1 w-full bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
                    <h3 className="text-sm font-semibold text-white mb-4">Immediate Steps</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                <Users size={16} />
                            </div>
                            <span className="text-sm text-slate-300 mt-1">Talk to someone you trust, like a friend or family member.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                                <PhoneCall size={16} />
                            </div>
                            <span className="text-sm text-slate-300 mt-1">Contact local mental health crisis helplines.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sol-teal/10 text-sol-teal flex items-center justify-center shrink-0">
                                <HeartPulse size={16} />
                            </div>
                            <span className="text-sm text-slate-300 mt-1">Seek out a certified therapist or medical professional.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
