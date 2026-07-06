import { FEATURES } from "@/constants";

export function FeaturesSection() {
  return (
    <section className="section-padding bg-white" id="features">
      <div className="container-xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-4xl font-bold text-gray-900 leading-tight">
            One platform, every module your farm needs
          </h2>
          <p className="text-lg text-gray-500 mt-4 leading-relaxed">
            SmartHerd replaces spreadsheets, paper records and disconnected apps
            with one clean, professional dashboard.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center text-2xl mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>

              {/* Subtle number */}
              <span className="absolute top-5 right-5 text-5xl font-black text-gray-50 group-hover:text-emerald-50 transition-colors select-none">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-16 bg-gradient-to-r from-emerald-600 to-green-700 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-bold text-white">Ready to modernise your farm?</p>
            <p className="text-emerald-100 mt-1 text-sm">Join 2,400+ farmers already using SmartHerd.</p>
          </div>
          <a
            href="/login"
            className="shrink-0 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Start Free Trial →
          </a>
        </div>
      </div>
    </section>
  );
}
