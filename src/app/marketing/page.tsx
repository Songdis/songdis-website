// src/app/marketing/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import BudgetBasedMarketing from "@/components/sections/marketing/BudgetBasedMarketing";
import HowCampaignsWork from "@/components/sections/marketing/HowCampaignsWork";
import MarketingExpertise from "@/components/sections/marketing/MarketingExpertise";
import MarketingHero from "@/components/sections/marketing/MarketingHero";
import MarketingSolutions from "@/components/sections/marketing/MarketingSolutions";


export default function MarketingPage() {
  return (
    <main>
      <Navbar />
      <MarketingHero />
      <MarketingSolutions/>
      <BudgetBasedMarketing/>
      <HowCampaignsWork/> 
      <MarketingExpertise/>
      <Footer/>
    </main>
  );
}