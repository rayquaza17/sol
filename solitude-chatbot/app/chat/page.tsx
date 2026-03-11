import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ChatInterface from './ChatInterface';
import { AntiGravityBackground } from '../components/chat/AntiGravityBackground';
import CalmSidePanel from '../components/chat/CalmSidePanel';

export default function ChatPage() {
    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden">
            <AntiGravityBackground />
            
            {/* Minimal Nav - consistent padding with other pages */}
            <nav className="fixed top-0 w-full h-24 flex items-center justify-between px-6 md:px-12 z-20">
                <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-80">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-sol-teal/20 transition-colors">
                        <ArrowLeft size={20} className="text-slate-400 group-hover:text-sol-teal transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors tracking-widest uppercase">Return Home</span>
                </Link>

                <div className="flex items-center gap-2 opacity-50">
                    <Sparkles size={16} className="text-sol-teal" />
                    <span className="text-sm font-heading font-semibold text-white tracking-widest uppercase">Sanctuary Mode</span>
                </div>
            </nav>

            <main className="w-full h-screen pt-24 pb-6 px-4 md:px-6 relative z-10 overflow-y-auto xl:overflow-hidden lg:scrollbar-none">
                <div className="max-w-[85rem] mx-auto h-full flex flex-col xl:grid xl:grid-cols-[1fr_320px] gap-6 items-start pb-20 xl:pb-0">
                    <div className="w-full flex-shrink-0">
                        <ChatInterface />
                    </div>
                    <CalmSidePanel />
                </div>
            </main>
        </div>
    );
}
