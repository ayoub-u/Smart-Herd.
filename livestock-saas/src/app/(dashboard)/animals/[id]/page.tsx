"use client";
import { use, useState } from "react";
import { animals, mockHealthRecords, mockReproductionRecords } from "@/data/mockData";
import { notFound } from "next/navigation";
import { ArrowLeft, QrCode, Edit3, MapPin, Calendar, Weight, Droplets, Heart } from "lucide-react";
import Link from "next/link";
import { cn, getAge, formatDate, getStatusColor, getPregnancyColor } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MOCK_WEEK = [
  { day:"Mon", liters:30.2 }, { day:"Tue", liters:31.5 }, { day:"Wed", liters:29.8 },
  { day:"Thu", liters:32.1 }, { day:"Fri", liters:30.7 }, { day:"Sat", liters:31.9 }, { day:"Sun", liters:32.5 },
];

const TABS = ["Overview","Health","Vaccination","Reproduction","Nutrition","Production"] as const;
type Tab = typeof TABS[number];

export default function AnimalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const animal   = animals.find((a) => a.id === id);
  if (!animal) notFound();

  const [tab, setTab] = useState<Tab>("Overview");
  const emoji = animal.type === "cow" ? "🐄" : animal.type === "bull" ? "🐂" : "🐑";

  const healthRecs = mockHealthRecords.filter((r) => r.animalId === animal.id);
  const reproRecs  = mockReproductionRecords.filter((r) => r.animalId === animal.id);

  return (
    <div className="max-w-5xl space-y-5">
      <Link href={ROUTES.ANIMALS} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} />Back to Animals
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="h-24 gradient-green relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage:"radial-gradient(circle, white 1px, transparent 1px)", backgroundSize:"30px 30px" }} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-8">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl">{emoji}</div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900">{animal.name}</h2>
                  <span className={cn("badge", getStatusColor(animal.healthStatus))}>{animal.healthStatus}</span>
                  <span className={cn("badge", getPregnancyColor(animal.pregnancyStatus))}>{animal.pregnancyStatus}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{animal.breed} · {animal.tag}</p>
              </div>
            </div>
            <div className="flex gap-2 pb-1">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <QrCode size={15} />QR Code
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                <Edit3 size={15} />Edit
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            {[
              { icon: Calendar, label:"Age",        value: getAge(animal.dateOfBirth), color:"bg-emerald-50 text-emerald-600" },
              { icon: Weight,   label:"Weight",     value: `${animal.weight} kg`,      color:"bg-blue-50 text-blue-600"      },
              { icon: Droplets, label:"Milk Today", value: animal.milkYieldToday > 0 ? `${animal.milkYieldToday}L` : "—", color:"bg-cyan-50 text-cyan-600" },
              { icon: MapPin,   label:"Location",   value: animal.location,            color:"bg-violet-50 text-violet-600"  },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-card p-1.5 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              tab === t ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Identity</h3>
            {[
              ["Animal ID",   animal.id],
              ["Tag",         animal.tag],
              ["RFID",        animal.rfid],
              ["Type",        `${emoji} ${animal.type}`],
              ["Breed",       animal.breed],
              ["Date of Birth", formatDate(animal.dateOfBirth)],
              ["Sire",        animal.sire],
              ["Dam",         animal.dam],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {animal.milkYieldToday > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Production</h3>
                {[
                  ["Lactation #",    animal.lactationNumber],
                  ["Days in Milk",   animal.daysInMilk],
                  ["Today's Yield",  `${animal.milkYieldToday}L`],
                  ["Average Yield",  `${animal.milkYieldAvg}L/day`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between border-b border-gray-50 py-1.5">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{animal.notes}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-2">
              <h3 className="font-semibold text-gray-900 mb-3">Financial</h3>
              {[
                ["Acquisition Date", formatDate(animal.acquisitionDate)],
                ["Acquisition Cost", `$${animal.acquisitionCost.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between border-b border-gray-50 py-1.5">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Health */}
      {tab === "Health" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Health Records</h3></div>
          {healthRecs.length === 0 ? (
            <div className="p-10 text-center text-gray-400"><p className="text-sm">No health records found.</p></div>
          ) : healthRecs.map((r) => (
            <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      r.type === "vaccination" ? "bg-emerald-50 text-emerald-700" :
                      r.type === "treatment"   ? "bg-red-50 text-red-700"         :
                      r.type === "checkup"     ? "bg-blue-50 text-blue-700"       : "bg-purple-50 text-purple-700"
                    )}>{r.type}</span>
                    <p className="text-sm font-medium text-gray-800">{r.description}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.notes}</p>
                  {r.medication && <p className="text-xs text-gray-500 mt-1">💊 {r.medication} · {r.dosage}</p>}
                  <p className="text-xs text-gray-400 mt-1">👨‍⚕️ {r.veterinarian}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-700">{formatDate(r.date)}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">${r.cost}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reproduction */}
      {tab === "Reproduction" && (
        <div className="space-y-4">
          {animal.expectedBirthDate && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 flex items-center gap-3">
              <Heart size={20} className="text-violet-600" />
              <div>
                <p className="font-semibold text-violet-900">Expected Calving / Birth</p>
                <p className="text-sm text-violet-700">{formatDate(animal.expectedBirthDate)}</p>
                {animal.inseminationDate && <p className="text-xs text-violet-500 mt-0.5">Inseminated: {formatDate(animal.inseminationDate)}</p>}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Reproduction Records</h3></div>
            {reproRecs.length === 0 ? (
              <div className="p-10 text-center text-gray-400"><p className="text-sm">No reproduction records found.</p></div>
            ) : reproRecs.map((r) => (
              <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        r.type === "insemination"    ? "bg-blue-50 text-blue-700"     :
                        r.type === "pregnancy-check" ? "bg-violet-50 text-violet-700" :
                        r.type === "heat"            ? "bg-pink-50 text-pink-700"     : "bg-emerald-50 text-emerald-700"
                      )}>{r.type.toUpperCase()}</span>
                      {r.result && <span className="text-xs text-gray-500">→ {r.result}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.notes}</p>
                    {r.technician && <p className="text-xs text-gray-400">Tech: {r.technician}</p>}
                  </div>
                  <p className="text-xs font-medium text-gray-500 shrink-0">{formatDate(r.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production */}
      {tab === "Production" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">7-Day Milk Production</h3>
          {animal.milkYieldToday > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={MOCK_WEEK} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day"    tick={{ fontSize:12, fill:"#9ca3af" }} />
                <YAxis                  tick={{ fontSize:12, fill:"#9ca3af" }} />
                <Tooltip />
                <Line type="monotone" dataKey="liters" stroke="#059669" strokeWidth={2.5} dot={{ fill:"#059669", r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm">Animal is not currently in production.</p>
            </div>
          )}
        </div>
      )}

      {(tab === "Vaccination" || tab === "Nutrition") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center text-gray-400">
          <div className="text-4xl mb-3">{tab === "Vaccination" ? "💉" : "🌾"}</div>
          <p className="font-medium text-gray-600">{tab} Records</p>
          <p className="text-sm mt-1">See the dedicated {tab === "Vaccination" ? "Health" : "Nutrition"} section for full records.</p>
          <Link href={tab === "Vaccination" ? ROUTES.HEALTH : ROUTES.NUTRITION}
            className="inline-block mt-4 text-emerald-600 font-semibold text-sm hover:underline">
            Go to {tab} →
          </Link>
        </div>
      )}
    </div>
  );
}
