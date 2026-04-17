// src/app/community/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import CommunityHero from "@/components/sections/community/CommunityHero";
import WhatYouCanExpect from "@/components/sections/community/WhatYouCanExpect";


export default function CommunityPage() {
  return (
    <main>
      <Navbar />
      <CommunityHero />
      <WhatYouCanExpect/>
      <Footer/>
    </main>
  );
}