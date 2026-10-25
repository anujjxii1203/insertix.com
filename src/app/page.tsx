import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import AboutSection from "@/components/sections/AboutSection";
import TeamSection from "@/components/sections/TeamSection";
import RecentWorkSection from "@/components/sections/RecentWorkSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/sections/Footer";
import WhatsAppFloating from "@/components/ui/WhatsAppFloating";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#FFFFFF] text-[#0A0A0A] selection:bg-[#FDECEC] selection:text-[#D40000]">

      {/* Navigation Header */}
      <Navbar />

      {/* 1. Hero Section (Insertix Media) */}
      <HeroSection />

      {/* 2. Work (Services Showcase) */}
      <ServicesSection />

      {/* 3. About (Mission, Story, Metric Counters, Brand Logomarks) */}
      <AboutSection />

      {/* 4. Members (Team Collective) */}
      <TeamSection />

      {/* 5. Recent Work (Filterable Portfolio Showcase with Modal) */}
      <RecentWorkSection />

      {/* Bonus: Client Testimonials */}
      <TestimonialsSection />

      {/* 6. Contact Us (Inquiry Form + Direct WhatsApp) */}
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* Floating Action Button */}
      <WhatsAppFloating />
    </main>
  );
}
