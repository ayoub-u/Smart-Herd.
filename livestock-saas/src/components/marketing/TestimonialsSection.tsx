//import { TESTIMONIALS } from "@/constants";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">★</span>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-xl">
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl font-bold text-gray-900">Trusted by farmers worldwide</h2>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4"
            >
              <Stars count={t.rating} />
              <p className="text-gray-700 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div className="w-10 h-10 rounded-full gradient-green flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
