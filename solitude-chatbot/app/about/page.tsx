'use client';

import Link from 'next/link';
import '../home.css';

export default function AboutPage() {
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
                        <Link href="/features" className="link">Sanctuary</Link>
                        <Link href="/resources" className="link">Resources</Link>
                        <Link href="/chat" className="btn btn-primary btn-sm">Start Breathing</Link>
                    </div>
                </div>
            </nav>

            <main style={{ paddingTop: '8rem' }}>
                <section className="container reveal">
                    <div className="section-title">
                        <h1 className="serif" style={{ fontSize: '3.5rem' }}>Our Mission</h1>
                        <p>A journey toward inner peace and emotional resilience.</p>
                    </div>

                    <div className="card glass" style={{ marginTop: '3rem', padding: '4rem', maxWidth: '900px', margin: '3rem auto' }}>
                        <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
                            Solitude was created with a simple belief: that everyone deserves a safe,
                            private sanctuary to process their emotions without judgment.
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            In a world that never stops talking, we provide the space to listen—to yourself.
                            Inspired by the quiet rhythms of nature, our AI companion is designed to
                            offer empathetic, localized support focused on your well-being.
                        </p>
                    </div>
                </section>
            </main>

            <footer className="footer-zen">
                <div className="container">
                    <p style={{ textAlign: 'center', opacity: 0.5 }}>© 2025 Solitude Sanctuary</p>
                </div>
            </footer>
        </div>
    );
}
