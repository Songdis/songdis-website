// src/app/pricing/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import CompareDistributors from "@/components/sections/pricing/ComparisonDIstrubutor";
import FAQSection from "@/components/sections/pricing/FAQSection";
import PricingHero from "@/components/sections/pricing/PricingHero";
import PricingSection from "@/components/sections/pricing/PricingSection";


export default function PricingPage() {
  return (
    <main>
      <Navbar />
      <PricingHero />
      <PricingSection/>
      <CompareDistributors/>
      <FAQSection/>
      <Footer/>
    </main>
  );
}