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
import BackToTop from "@/components/ui/BackToTop";
import { getTeam, getSiteSettings, getTestimonials, getProjects } from "@/lib/db";
import { serialize } from "@/lib/serialize";

// ISR: Revalidate every 60 seconds (blazing fast CDN + 95% less Vercel server compute)
export const revalidate = 60;

export default async function Home() {
  const [rawTeam, rawSettings, rawTestimonials, rawProjects] = await Promise.all([
    getTeam(true).catch(() => []),
    getSiteSettings().catch(() => undefined),
    getTestimonials(true).catch(() => []),
    getProjects(true).catch(() => []),
  ]);

  const initialTeam = serialize(rawTeam);
  const initialSettings = serialize(rawSettings);
  const initialTestimonials = serialize(rawTestimonials);
  const initialProjects = serialize(rawProjects);

  return (
    <main className="relative min-h-screen bg-[#FFFFFF] text-[#0A0A0A] selection:bg-[#FDECEC] selection:text-[#D40000]">
      {/* Navigation Header */}
      <Navbar />

      {/* 1. Hero Section (Insertix Media) */}
      <HeroSection initialSettings={initialSettings} />

      {/* 2. Work (Services Showcase) */}
      <ServicesSection initialSettings={initialSettings} />

      {/* 3. About (Mission, Story, Metric Counters, Brand Logomarks) */}
      <AboutSection initialSettings={initialSettings} />

      {/* 4. Members (Team Collective) */}
      <TeamSection initialTeam={initialTeam} initialSettings={initialSettings} />

      {/* 5. Recent Work (Filterable Portfolio Showcase with Modal) */}
      <RecentWorkSection initialSettings={initialSettings} initialProjects={initialProjects} />

      {/* Bonus: Client Testimonials */}
      <TestimonialsSection initialSettings={initialSettings} initialTestimonials={initialTestimonials} />

      {/* 6. Contact Us (Inquiry Form + Direct WhatsApp) */}
      <ContactSection initialSettings={initialSettings} />

      {/* Footer */}
      <Footer initialSettings={initialSettings} />

      {/* Center Fixed Back-to-Top Button */}
      <BackToTop />

      {/* Floating Action Button */}
      <WhatsAppFloating />
    </main>
  );
}
