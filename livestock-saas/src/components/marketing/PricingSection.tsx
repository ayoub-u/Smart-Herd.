import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PRICING_PLANS, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section className="section-padding bg-gray-50" id="pricing">
      <div className="container-xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-500 mt-4">
            Start free for 7 days. No credit card required.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-8 flex flex-col",
                plan.highlighted
                  ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-200 scale-105"
                  : "bg-white border border-gray-100 shadow-sm"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className={cn("text-xl font-bold", plan.highlighted ? "text-white" : "text-gray-900")}>
                  {plan.name}
                </h3>
                <p className={cn("text-sm mt-1 mb-6", plan.highlighted ? "text-emerald-100" : "text-gray-400")}>
                  {plan.description}
                </p>

                <div className="flex items-end gap-1 mb-8">
                  <span className={cn("text-5xl font-black", plan.highlighted ? "text-white" : "text-gray-900")}>
                    ${plan.price}
                  </span>
                  <span className={cn("text-sm mb-2", plan.highlighted ? "text-emerald-200" : "text-gray-400")}>
                    /{plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        size={16}
                        className={cn("shrink-0 mt-0.5", plan.highlighted ? "text-emerald-200" : "text-emerald-500")}
                      />
                      <span className={plan.highlighted ? "text-emerald-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={ROUTES.LOGIN}
                className={cn(
                  "mt-auto block text-center font-bold py-3 rounded-xl transition-colors",
                  plan.highlighted
                    ? "bg-white text-emerald-700 hover:bg-emerald-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ strip */}
        <p className="text-center text-sm text-gray-400 mt-10">
          All plans include a 7-day free trial · No credit card required ·{" "}
          <Link href={ROUTES.CONTACT} className="text-emerald-600 hover:underline">
            Contact us for custom pricing
          </Link>
        </p>
      </div>
    </section>
  );
}
