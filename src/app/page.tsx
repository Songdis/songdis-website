import Navbar from "@/components/layout/Navbar";
import FeaturesSection from "@/components/sections/FeaturesSection";
import GlobalDistribution from "@/components/sections/GlobalDistrubution";
import HeroSection from "@/components/sections/HeroSection";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <GlobalDistribution/>
      {/* <FeaturesSection/> */}
      {/* Additional sections will be added here as they are built */}
    </main>
  );
}