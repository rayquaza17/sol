'use client';

import Link from 'next/link';
import '../home.css';

export default function PrivacyPage() {
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
                        <Link href="/chat" className="btn btn-primary btn-sm">Start Chat</Link>
                    </div>
                </div>
            </nav>

            <main style={{ paddingTop: '8rem' }}>
                <section className="container reveal">
                    <div className="section-title">
                        <h1 className="serif">Privacy Policy</h1>
                        <p>Your trust is our foundation.</p>
                    </div>

                    <div className="card glass" style={{ marginTop: '3rem', padding: '4rem', maxWidth: '800px', margin: '3rem auto' }}>
                        <h2 className="serif" style={{ marginBottom: '1.5rem' }}>100% Private Conversations</h2>
                        <p style={{ marginBottom: '1.5rem' }}>
                            We believe that mental health support should be absolute. At Solitude, we do not
                            store your personal chat history on our servers. All processing is transient or
                            stored only in your local browser session.
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            We do not sell your data. We do not track you. We exist only to provide a safe
                            space for your emotional well-being.
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
