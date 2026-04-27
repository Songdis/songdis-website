// src/app/privacy/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PrivacyHero from "@/components/sections/privacy-policy/PrivacyHero";
import PrivacyPolicyContent from "@/components/sections/privacy-policy/PrivacyPolicyContent";

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <PrivacyHero />
      <PrivacyPolicyContent/>
      <Footer/>
    </main>
  );
}
