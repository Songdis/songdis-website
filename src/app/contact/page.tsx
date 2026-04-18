// src/app/contact/page.tsx
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ContactForm from "@/components/sections/contact/ContactForm";
import ContactHero from "@/components/sections/contact/ContactHero";
import ContactInformation from "@/components/sections/contact/ContactInformation";

export default function ContactPage() {
  return (
    <main>
      <Navbar />
      <ContactHero />
      <ContactForm/>
      <ContactInformation/>
      <Footer/>
    </main>
  );
}