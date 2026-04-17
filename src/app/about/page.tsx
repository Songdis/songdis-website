// src/app/about/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import AboutHero from "@/components/sections/about/AboutHero";
import AboutValues from "@/components/sections/about/AboutValues";
import AboutVision from "@/components/sections/about/AboutVision";
import CustomSolutions from "@/components/sections/about/CustomSolutions";
import PartnershipsSection from "@/components/sections/about/PartnershipSection";
import WhereToFindUs from "@/components/sections/about/WhereToFindUs";

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <AboutHero />
      <AboutVision/>
      <AboutValues/>
      <PartnershipsSection/>
      <CustomSolutions/>
      <WhereToFindUs/>
      <Footer/>
    </main>
  );
}