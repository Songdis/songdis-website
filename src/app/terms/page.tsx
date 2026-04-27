// src/app/terms/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import TermsContent from "@/components/sections/terms/TermsContent";
import TermsHero from "@/components/sections/terms/TermsHero";

export default function TermsPage() {
  return (
    <main>
      <Navbar />
      <TermsHero />
      <TermsContent/>
      <Footer/>
    </main>
  );
}