import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants";

export function CTASection() {
  return (
    <section className="section-padding bg-gray-900">
      <div className="container-xl text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto">
          Your farm deserves{" "}
          <span className="text-emerald-400">modern tools</span>
        </h2>
        <p className="text-lg text-gray-400 mt-6 max-w-xl mx-auto leading-relaxed">
          Stop managing your livestock with spreadsheets and paper records.
          Start your free trial today — setup takes less than 5 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-2xl transition-colors text-lg"
          >
            Start Free Trial
            <ArrowRight size={20} />
          </Link>
          <Link
            href={ROUTES.CONTACT}
            className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-colors text-lg"
          >
            Talk to Sales
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-6">
          7-day free trial · No credit card · Cancel anytime
        </p>
      </div>
    </section>
  );
}
