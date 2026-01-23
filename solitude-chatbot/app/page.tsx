'use client';

import Link from 'next/link';
import './home.css';

export default function Home() {
  const quotes = [
    { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
    { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" }
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
            <Link href="/about" className="link">Our Story</Link>
            <Link href="/features" className="link">Sanctuary</Link>
            <Link href="/resources" className="link">Resources</Link>
            <Link href="/chat" className="btn btn-primary btn-sm">Start Breathing</Link>
          </div>
        </div>
      </nav>

      <main>
        <header className="hero-section">
          <div className="blob-bg">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
          </div>

          <div className="container hero-inner reveal">
            <p className="hero-tagline serif">Breathe. Talk. Heal.</p>
            <h1 className="hero-heading">
              A gentle <span className="gradient-text">sanctuary</span> for your mind.
            </h1>
            <p className="hero-subtext">
              Find peace in the quiet moments. Solitude is your private space to reflect,
              restore, and rediscover yourself through nature-inspired support.
            </p>
            <div className="hero-btn-group">
              <Link href="/chat" className="btn btn-primary">Enter Sanctuary</Link>
              <Link href="/about" className="btn btn-secondary">Learn More</Link>
            </div>

            <div className="stats-strip">
              <div className="stat"><span>24/7</span> Support</div>
              <div className="stat-sep">•</div>
              <div className="stat"><span>100%</span> Private</div>
              <div className="stat-sep">•</div>
              <div className="stat"><span>Secure</span> Encryption</div>
            </div>
          </div>
        </header>

        <section className="quote-section">
          <div className="container">
            <div className="quote-box glass">
              <span className="quote-icon">❝</span>
              <p className="quote-text serif">{quotes[0].text}</p>
              <p className="quote-author">— {quotes[0].author}</p>
            </div>
          </div>
        </section>

        <section className="features-showcase">
          <div className="container">
            <div className="section-title">
              <h2 className="serif">Sanctuary Features</h2>
              <p>Thoughtfully designed for your emotional well-being.</p>
            </div>

            <div className="feature-reveal-grid">
              <div className="feat-box card">
                <div className="feat-icon">🌬️</div>
                <h3>Mindful Breathing</h3>
                <p>Guided rhythms to help you sync with the natural flow of life.</p>
              </div>
              <div className="feat-box card">
                <div className="feat-icon">🧠</div>
                <h3>Empathetic AI</h3>
                <p>A judgment-free companion ready to listen whenever you need to talk.</p>
              </div>
              <div className="feat-box card">
                <div className="feat-icon">🌲</div>
                <h3>Forest Sounds</h3>
                <p>Immersive auditory experiences that bring the peace of the forest to you.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

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
