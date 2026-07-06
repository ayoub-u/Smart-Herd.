import { HeroSection }         from "@/components/marketing/HeroSection";
import { FeaturesSection }      from "@/components/marketing/FeaturesSection";
import { PricingSection }       from "@/components/marketing/PricingSection";
import { TestimonialsSection }  from "@/components/marketing/TestimonialsSection";
import { CTASection }           from "@/components/marketing/CTASection";

export const metadata = {
  title: "SmartHerd — Livestock Management SaaS",
  description: "The all-in-one platform for dairy, beef and sheep farm management.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </>
  );
}
