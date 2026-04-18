// src/app/publishing/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PublishingDashboard from "@/components/sections/publishing/PublishingDashboard";
import PublishingHero from "@/components/sections/publishing/PublishingHero";
import SyncLicensing from "@/components/sections/publishing/SyncLicensing";
import WhatWeCollect from "@/components/sections/publishing/WhatWeCollect";

export default function PublishingPage() {
  return (
    <main>
      <Navbar />
      <PublishingHero />
      <WhatWeCollect/>
      <SyncLicensing/>
      <PublishingDashboard/>
      <Footer/>
    </main>
  );
}