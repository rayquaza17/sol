'use client';

import Link from 'next/link';
import '../home.css';

export default function FeaturesPage() {
    const tools = [
        { title: "AI Wisdom", icon: "✨", desc: "Thoughtful conversations powered by empathetic intelligence." },
        { title: "Breathe", icon: "🌬️", desc: "Scientific breathing patterns to calm the nervous system." },
        { title: "Soundscapes", icon: "🌲", desc: "High-fidelity nature recordings from real forest sanctuaries." }
    ];

    return (
        <div className="home-wrapper">
            <nav className="navbar glass">
                <div className="container nav-box">
                    <Link href="/" className="brand">
                        <span className="sparkle">✦</span>
                        <span>Solitude</span>
                    </Link>
                    <div className="nav-menu">
                        <Link href="/" className="link">Home</Link>
                        <Link href="/about" className="link">Our Story</Link>
                        <Link href="/resources" className="link">Resources</Link>
                        <Link href="/chat" className="btn btn-primary btn-sm">Start Breathing</Link>
                    </div>
                </div>
            </nav>

            <main style={{ paddingTop: '8rem' }}>
                <section className="container">
                    <div className="section-title reveal">
                        <h1 className="serif">The Sanctuary Tools</h1>
                        <p>Every feature is a step toward your peace of mind.</p>
                    </div>

                    <div className="tools-grid-zen">
                        {tools.map((t, i) => (
                            <div key={i} className="card tool-card">
                                <div className="tool-icon">{t.icon}</div>
                                <h3>{t.title}</h3>
                                <p>{t.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <style jsx>{`
        .tools-grid-zen { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; margin-top: 4rem; }
        .tool-card { padding: 4rem 2rem; text-align: center; border-radius: 3rem; }
        .tool-icon { font-size: 4rem; margin-bottom: 2rem; }
      `}</style>
        </div>
    );
}
