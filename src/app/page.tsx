import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HeroSection from "@/components/sections/HeroSection";
import MarketingSection from "@/components/sections/MarketingSection";
import PitchPortalSection from "@/components/sections/PitchPortalSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturesSection/>
      <MarketingSection/>
      <PitchPortalSection/>
      <TestimonialsSection/>
      <Footer/>
    </main>
  );
}