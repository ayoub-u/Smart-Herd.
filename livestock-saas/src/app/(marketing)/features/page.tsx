import Link from "next/link";
import { FEATURES, ROUTES } from "@/constants";

export const metadata = { title: "Features" };

const DETAILED_FEATURES = [
  {
    icon: "🐄", title: "Animal Management",
    points: ["RFID & QR code support","Complete life records","Weight & body condition history","Breed performance tracking","Location & barn assignment","Custom tags & notes"],
  },
  {
    icon: "🥛", title: "Milk Tracking",
    points: ["3-session daily recording","Fat & protein content logging","Top-producer rankings","Weekly & monthly trend charts","Individual cow yield history","Grade & quality tracking"],
  },
  {
    icon: "❤️", title: "Reproduction",
    points: ["Heat detection logging","AI scheduling & semen records","Pregnancy confirmation","Gestation progress tracker","Expected calving calendar","Birth & calf records"],
  },
  {
    icon: "💉", title: "Health & Vaccines",
    points: ["Vaccination calendar & reminders","Overdue alert system","Vet visit records","Medication & dosage log","Treatment cost tracking","Disease history per animal"],
  },
  {
    icon: "🌾", title: "Nutrition & Feed",
    points: ["Feed inventory management","Daily usage tracking","TMR ration calculator","Low-stock alerts","Supplier management","Cost per animal per day"],
  },
  {
    icon: "📊", title: "Analytics & Reports",
    points: ["Revenue vs cost charts","Monthly profitability","Herd health dashboard","Reproductive KPIs","Top producer rankings","Exportable PDF & CSV reports"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-b from-emerald-50 to-white">
        <div className="container-xl text-center max-w-3xl mx-auto">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Platform Features</p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Every tool your farm needs — in one place
          </h1>
          <p className="text-xl text-gray-500 mt-5 leading-relaxed">
            SmartHerd was designed from the ground up with real farmers. No bloat, no complexity —
            just the tools that actually matter.
          </p>
          <Link
            href={ROUTES.LOGIN}
            className="inline-block mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-colors"
          >
            Start Free Trial →
          </Link>
        </div>
      </section>

      {/* Detailed features */}
      <section className="section-padding bg-white">
        <div className="container-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DETAILED_FEATURES.map((f) => (
              <div key={f.title} className="border border-gray-100 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{f.title}</h3>
                <ul className="space-y-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-emerald-600">
        <div className="container-xl text-center">
          <h2 className="text-3xl font-bold text-white">Ready to see it in action?</h2>
          <p className="text-emerald-100 mt-3 mb-8">Start your 7-day free trial. No credit card needed.</p>
          <Link href={ROUTES.LOGIN} className="inline-block bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-emerald-50 transition-colors">
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
