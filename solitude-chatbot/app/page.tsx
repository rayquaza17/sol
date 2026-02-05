import { AnimatedBackground } from "./components/AnimatedBackground";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { HowItHelps } from "./components/HowItHelps";
import { ChatPreview } from "./components/ChatPreview";
import { Philosophy } from "./components/Philosophy";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen selection:bg-sol-teal/30">
      <AnimatedBackground />
      <Navbar />

      <main>
        <Hero />

        {/* Subtle separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <HowItHelps />

        <ChatPreview />

        <Philosophy />
      </main>

      <Footer />
    </div>
  );
}
