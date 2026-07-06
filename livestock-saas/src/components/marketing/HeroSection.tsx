import Link from "next/link";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { ROUTES } from "@/constants";

const TRUST_POINTS = ["Free 7-day trial", "No credit card required", "Cancel anytime"];

const DASHBOARD_PREVIEW = {
  stats: [
    { label: "Animals",     value: "147",   sub: "+3 this week",  color: "bg-emerald-500" },
    { label: "Milk Today",  value: "2,340L", sub: "+8% vs avg",   color: "bg-blue-500"    },
    { label: "Pregnant",    value: "23",    sub: "4 due soon",    color: "bg-violet-500"  },
    { label: "Feed Stock",  value: "18d",   sub: "2 items low",   color: "bg-amber-500"   },
  ],
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white pt-32 pb-20 px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-green-100/40 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              New: AI-powered health alerts now available
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              Manage your{" "}
              <span className="text-emerald-600">livestock</span>{" "}
              like a pro
            </h1>

            <p className="mt-6 text-xl text-gray-500 leading-relaxed max-w-xl">
              SmartHerd gives every farmer — from small family operations to large commercial herds — 
              a professional platform to track animals, milk, health and finances in one place.
            </p>

            {/* Trust points */}
            <div className="flex flex-wrap gap-4 mt-6">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {point}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href={ROUTES.LOGIN}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors shadow-lg shadow-emerald-200"
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <Link
                href={ROUTES.FEATURES}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3.5 rounded-2xl transition-colors"
              >
                <Play size={16} className="text-emerald-600" />
                See how it works
              </Link>
            </div>

            {/* Social proof numbers */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-gray-100">
              {[
                { value: "2,400+", label: "Farms using SmartHerd" },
                { value: "180K+", label: "Animals tracked" },
                { value: "4.9★",  label: "Average rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard preview */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-50 rounded-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 m-4">
              {/* Fake top bar */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-base font-bold text-gray-900">Farm Dashboard</p>
                  <p className="text-xs text-gray-400">Ayoub Family Farm </p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
              </div>

              {/* Stat cards preview */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {DASHBOARD_PREVIEW.stats.map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3.5">
                    <div className={`w-8 h-8 rounded-lg ${s.color} mb-2`} />
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Fake chart bar */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-3">Milk Production — Last 7 Days</p>
                <div className="flex items-end gap-1.5 h-16">
                  {[65, 72, 58, 80, 68, 85, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-emerald-500 rounded-sm opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <span key={i} className="flex-1 text-center text-[9px] text-gray-400">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
