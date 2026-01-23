'use client';

import Link from 'next/link';
import '../home.css';
import './resources.css';

export default function ResourcesPage() {
    const helplines = [
        { name: "AASRA", phone: "91-9820466726", label: "24/7 Crisis Support" },
        { name: "Vandrevala", phone: "1860-2662-345", label: "Mental Health Support" },
        { name: "iCall", phone: "9152987821", label: "TISS Counselling" }
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
                        <Link href="/features" className="link">Features</Link>
                        <Link href="/chat" className="btn btn-primary btn-sm">Talk Now</Link>
                    </div>
                </div>
            </nav>

            <main style={{ paddingTop: '8rem' }}>
                <section className="container">
                    <div className="section-title reveal">
                        <h1 className="serif">Wellness Resources</h1>
                        <p>Reaching out is the first step toward healing.</p>
                    </div>

                    <div className="helpline-grid-zen reveal">
                        {helplines.map((h, i) => (
                            <div key={i} className="card zen-card">
                                <span className="zen-tag">{h.label}</span>
                                <h3>{h.name}</h3>
                                <p className="phone serif">{h.phone}</p>
                                <a href={`tel:${h.phone.replace(/-/g, '')}`} className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }}>Call Now</a>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <style jsx>{`
        .helpline-grid-zen { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; margin-top: 4rem; }
        .zen-card { text-align: center; border-radius: 2rem; }
        .zen-tag { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary-500); font-weight: 700; margin-bottom: 1rem; display: block; }
        .phone { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0.5rem 0; }
      `}</style>
            <footer className="footer-zen">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <Link href="/" className="brand small">✦ Solitude</Link>
                        <p>Your mental sanctuary since 2025.</p>
                    </div>
                    <div className="footer-links">
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/contact">Support</Link>
                        <div className="helpline-hint">Crisis? Call 9152987821 (India)</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
