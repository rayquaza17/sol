import Link from 'next/link';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ChatInterface from './ChatInterface';

export default function ChatPage() {
    return (
        <div className="min-h-screen bg-solitude-sand-50 flex flex-col">
            {/* Minimal Nav */}
            <nav className="h-20 w-full flex items-center justify-between px-8 z-10">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="p-2 rounded-xl bg-white border border-solitude-sand-100 group-hover:border-solitude-teal-500/20 transition-colors">
                        <ArrowLeft size={20} className="text-solitude-slate-500 group-hover:text-solitude-teal-500 transition-colors" />
                    </div>
                    <span className="text-lg font-heading font-bold text-solitude-slate-900">Back Home</span>
                </Link>

                <Link href="/" className="flex items-center gap-2">
                    <Sparkles size={20} className="text-solitude-teal-500" />
                    <span className="text-xl font-heading font-bold text-solitude-slate-900 tracking-tight">Solitude</span>
                </Link>

                {/* Empty div for balancing flexbox */}
                <div className="w-32 hidden md:block" />
            </nav>

            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <ChatInterface />
            </main>

            {/* Subtle Background Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/4 left-10 w-96 h-96 bg-solitude-teal-50/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-solitude-accent/20 rounded-full blur-[80px]" />
            </div>
        </div>
    );
}
