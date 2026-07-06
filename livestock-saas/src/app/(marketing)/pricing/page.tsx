import { PricingSection } from "@/components/marketing/PricingSection";
import { CTASection }     from "@/components/marketing/CTASection";
import Link from "next/link";
import { ROUTES } from "@/constants";

export const metadata = { title: "Pricing" };

const FAQS = [
  { q: "Is there a free trial?",           a: "Yes — every plan includes a 7-day free trial. No credit card required to start." },
  { q: "Can I change plans later?",        a: "Absolutely. You can upgrade or downgrade at any time. Changes take effect immediately." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards and bank transfers for annual plans." },
  { q: "Is my data safe?",                 a: "Your data is fully isolated per farm (multi-tenant architecture) and encrypted at rest and in transit." },
  { q: "Do you offer a discount for annual billing?", a: "Yes — annual plans save 20% compared to monthly billing." },
  { q: "What happens after my trial?",     a: "You'll be prompted to choose a plan. If you don't, your account enters read-only mode — no data is deleted." },
];

export default function PricingPage() {
  return (
    <div className="pt-24">
      <PricingSection />

      {/* FAQ */}
      <section className="section-padding bg-white">
        <div className="container-xl max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border border-gray-100 rounded-2xl p-6">
                <p className="font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            Still have questions?{" "}
            <Link href={ROUTES.CONTACT} className="text-emerald-600 hover:underline font-medium">
              Contact our team →
            </Link>
          </p>
        </div>
      </section>

      <CTASection />
    </div>
  );
}
