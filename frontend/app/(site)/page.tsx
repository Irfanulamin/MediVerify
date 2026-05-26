import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import ShowcaseSection from "../components/ShowcaseSection";
import TestimonialsSection from "../components/TestimonialsSection";
import MissionVisionSection from "../components/MissionVisionSection";
import FinalCTASection from "../components/FinalCTASection";

export default function Home() {
  return (
    <main className="bg-mesh">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ShowcaseSection />
      <TestimonialsSection />
      <MissionVisionSection />
      <FinalCTASection />
    </main>
  );
}
