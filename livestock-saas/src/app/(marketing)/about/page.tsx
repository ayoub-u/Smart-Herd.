import Link from "next/link";
import { ROUTES } from "@/constants";

export const metadata = { title: "About" };



const VALUES = [
  { icon: "🌱", title: "Farmer First",      desc: "Every feature starts with a real farmer's problem. We don't build things farmers don't need." },
  { icon: "🔒", title: "Data Privacy",      desc: "Your farm data is yours. " },
  { icon: "📱", title: "Simple by Design",  desc: "Software should be as easy to use as your phone. " },
  { icon: "🌍", title: "Built for Everyone",desc: "From a 10-cow family farm to a 500-head commercial operation — SmartHerd works for all scales." },
];

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Mission */}
      {/* <section className="section-padding bg-gradient-to-b from-emerald-50 to-white">
        <div className="container-xl max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Our Story</p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
             <br /> 
          </h1>
          <p className="text-xl text-gray-500 mt-6 leading-relaxed">
            
          </p>
        </div>
      </section> */}

      {/* Stats */}
      <section className="py-16 bg-white border-y border-gray-100">
        {/* <div className="container-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,400+", label: "Farms onboarded" },
              { value: "180K+",  label: "Animals tracked" },
              { value: "12",     label: "Countries" },
              { value: "2022",   label: "Founded" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-emerald-600">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div> */}
      </section>

      {/* Values */}
      <section className="section-padding bg-gray-50">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-white">
        <div className="container-xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12"></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-emerald-600">
        <div className="container-xl text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Join our growing community</h2>
          
          <Link href={ROUTES.LOGIN} className="inline-block bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-emerald-50 transition-colors">
            Start Free Trial →
          </Link>
        </div>
      </section>
    </div>
  );
}
