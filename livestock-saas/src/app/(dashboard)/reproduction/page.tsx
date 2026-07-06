"use client";
import { animals, mockReproductionRecords } from "@/data/mockData";
import { Heart, Plus } from "lucide-react";
import { cn, formatDate, daysUntil } from "@/lib/utils";

const pregnantAnimals = animals.filter((a) => a.pregnancyStatus === "pregnant" && a.expectedBirthDate);
const openAnimals     = animals.filter((a) => a.pregnancyStatus === "open" && a.type !== "bull");

function getAge(dob: string) {
  const y = new Date().getFullYear() - new Date(dob).getFullYear();
  return `${y}y`;
}

export default function ReproductionPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Pregnant",            icon:"🤰", value: animals.filter((a) => a.pregnancyStatus==="pregnant").length,  color:"bg-violet-100 text-violet-600" },
          { label:"Lactating",           icon:"🥛", value: animals.filter((a) => a.pregnancyStatus==="lactating").length, color:"bg-blue-100 text-blue-600"     },
          { label:"Open / Available",    icon:"🔄", value: openAnimals.length,                                            color:"bg-amber-100 text-amber-600"   },
          { label:"Births in 30 days",   icon:"🐮", value: pregnantAnimals.filter((a) => daysUntil(a.expectedBirthDate!) < 30).length, color:"bg-emerald-100 text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl", s.color)}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pregnant animals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Pregnancy Tracking</h3>
              <p className="text-xs text-gray-400 mt-0.5">Confirmed pregnancies & due dates</p>
            </div>
            <span className="badge bg-violet-50 text-violet-700 border-violet-200">{pregnantAnimals.length} pregnant</span>
          </div>
          <div className="divide-y divide-gray-50">
            {pregnantAnimals.map((a) => {
              const daysLeft = daysUntil(a.expectedBirthDate!);
              const progress = Math.max(0, Math.min(100, Math.round(((280 - daysLeft) / 280) * 100)));
              return (
                <div key={a.id} className="p-5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-xl">🐄</div>
                      <div>
                        <p className="font-semibold text-gray-800">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.breed} · {a.tag}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", daysLeft < 30 ? "text-amber-600" : "text-violet-600")}>{daysLeft}d left</p>
                      <p className="text-xs text-gray-400">{formatDate(a.expectedBirthDate!)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Gestation progress</span><span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", daysLeft < 30 ? "bg-amber-400" : "bg-violet-500")} style={{ width:`${progress}%` }} />
                    </div>
                  </div>
                  {a.inseminationDate && (
                    <p className="text-xs text-gray-400 mt-2"><span className="font-medium">Inseminated:</span> {formatDate(a.inseminationDate)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Open + Recent records */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Open Animals</h3>
                <p className="text-xs text-gray-400">Ready for insemination</p>
              </div>
              <button className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors">
                <Plus size={14} />Schedule AI
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {openAnimals.map((a) => (
                <div key={a.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/70">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
                    {a.type === "cow" ? "🐄" : "🐑"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.breed} · {getAge(a.dateOfBirth)}</p>
                  </div>
                  <button className="text-xs text-blue-600 font-medium bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors">
                    Inseminate
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Records</h3>
              <button className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium"><Plus size={14} />Add</button>
            </div>
            <div className="divide-y divide-gray-50">
              {mockReproductionRecords.map((r) => (
                <div key={r.id} className="px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          r.type==="insemination"    ? "bg-blue-50 text-blue-700"     :
                          r.type==="pregnancy-check" ? "bg-violet-50 text-violet-700" :
                          r.type==="heat"            ? "bg-pink-50 text-pink-700"     : "bg-emerald-50 text-emerald-700"
                        )}>{r.type.toUpperCase()}</span>
                        <p className="text-sm font-medium text-gray-800">{r.animalName}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{formatDate(r.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add event form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Record Reproduction Event</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Animal</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400">
              {animals.filter((a) => a.type !== "bull").map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Event Type</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option>Heat Detection</option><option>Insemination</option>
              <option>Pregnancy Check</option><option>Birth</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date</label>
            <input type="date" defaultValue="2024-07-14"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Result</label>
            <input type="text" placeholder="confirmed / heat detected"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
          <textarea rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Add notes…" />
        </div>
        <button className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
          Save Record
        </button>
      </div>
    </div>
  );
}
