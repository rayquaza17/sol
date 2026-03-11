import { AnimatedBackground } from "./components/AnimatedBackground";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/home/HeroSection";
import { FeatureCards } from "./components/home/FeatureCards";
import { BreathingExercise } from "./components/home/BreathingExercise";
import { DailyAffirmation } from "./components/home/DailyAffirmation";
import { WellbeingTip } from "./components/home/WellbeingTip";
import { SupportInfo } from "./components/home/SupportInfo";

export default function Home() {
  return (
    <div className="relative min-h-screen selection:bg-sol-teal/30">
      <AnimatedBackground />
      <Navbar />

      <main className="pb-16 pt-16">
        <HeroSection />
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent my-8" />
        
        <FeatureCards />
        
        <BreathingExercise />
        
        <section className="py-16 px-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DailyAffirmation />
                <WellbeingTip />
            </div>
        </section>

        <SupportInfo />
      </main>

      <Footer />
    </div>
  );
}
