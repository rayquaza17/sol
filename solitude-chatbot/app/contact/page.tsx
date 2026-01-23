'use client';

import Link from 'next/link';
import '../home.css';

export default function ContactPage() {
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
                        <h1 className="serif">Contact Support</h1>
                        <p>We're here to help you find your peace.</p>
                    </div>

                    <div className="card glass" style={{ marginTop: '3rem', padding: '4rem', maxWidth: '800px', margin: '3rem auto', textAlign: 'center' }}>
                        <h2 className="serif" style={{ marginBottom: '1rem' }}>Get in Touch</h2>
                        <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>support@solitude.ai</p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            For technical issues or partnerships, please reach out via email.
                        </p>
                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--primary-50)', borderRadius: '1rem' }}>
                            <p style={{ fontWeight: 700, color: 'var(--primary-600)' }}>EMERGENCY NOTICE</p>
                            <p style={{ fontSize: '0.9rem' }}>If you are in immediate danger or in crisis, please use our <Link href="/resources" style={{ color: 'var(--primary-500)', fontWeight: 600 }}>Resources Page</Link> to find local helplines.</p>
                        </div>
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
