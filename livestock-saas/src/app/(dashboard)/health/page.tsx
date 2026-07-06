"use client";
import { useState } from "react";
import { animals, mockHealthRecords, mockVaccinationSchedule } from "@/data/mockData";
import { AlertTriangle, Plus } from "lucide-react";
import { cn, formatDate, daysUntil } from "@/lib/utils";

export default function HealthPage() {
  const [tab, setTab] = useState("vaccinations");
  const sickAnimals = animals.filter((a) => a.healthStatus === "sick" || a.healthStatus === "recovering" || a.healthStatus === "critical");
  const overdue     = mockVaccinationSchedule.filter((v) => v.status === "overdue");
  const dueSoon     = mockVaccinationSchedule.filter((v) => v.status === "due-soon");

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Healthy Animals",  icon:"✅", value: animals.filter((a) => a.healthStatus==="healthy").length,   sub:`${Math.round(animals.filter((a)=>a.healthStatus==="healthy").length/animals.length*100)}% of herd` },
          { label:"Sick / Critical",  icon:"🚨", value: animals.filter((a) => ["sick","critical"].includes(a.healthStatus)).length, sub:"Need attention" },
          { label:"Recovering",       icon:"💊", value: animals.filter((a) => a.healthStatus==="recovering").length, sub:"Under treatment" },
          { label:"Overdue Vaccines", icon:"💉", value: overdue.length, sub:`${dueSoon.length} due soon` },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sick alert */}
      {sickAnimals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600" />
            <h3 className="font-semibold text-red-800">Animals Needing Attention</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sickAnimals.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-3.5 border border-red-100 flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                  a.healthStatus==="sick" ? "bg-red-50" : a.healthStatus==="critical" ? "bg-red-100" : "bg-amber-50"
                )}>{a.type==="cow" ? "🐄" : a.type==="bull" ? "🐂" : "🐑"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.tag}</p>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block",
                    a.healthStatus==="sick" ? "bg-red-100 text-red-700" : a.healthStatus==="critical" ? "bg-red-200 text-red-800" : "bg-amber-100 text-amber-700"
                  )}>{a.healthStatus.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["vaccinations","health-records","add-record"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
              tab===t ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}>
            {t==="vaccinations" ? "Vaccination Calendar" : t==="health-records" ? "Health Records" : "Add Record"}
          </button>
        ))}
      </div>

      {/* Vaccination table */}
      {tab==="vaccinations" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Vaccination Schedule</h3>
            <button className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors">
              <Plus size={14} />Schedule
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Animal</th><th>Vaccine</th><th>Due Date</th><th>Days</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {mockVaccinationSchedule.map((v) => {
                  const days = daysUntil(v.dueDate);
                  return (
                    <tr key={v.id}>
                      <td className="font-medium text-gray-800">{v.animalName}</td>
                      <td className="text-gray-600">{v.vaccine}</td>
                      <td className="text-gray-600">{formatDate(v.dueDate)}</td>
                      <td className={cn("font-semibold", days<0 ? "text-red-600" : days<7 ? "text-amber-600" : "text-gray-600")}>
                        {days<0 ? `${Math.abs(days)}d ago` : `in ${days}d`}
                      </td>
                      <td>
                        <span className={cn("badge text-xs", v.priority==="high" ? "bg-red-50 text-red-700 border-red-200" : v.priority==="medium" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-600 border-gray-200")}>
                          {v.priority}
                        </span>
                      </td>
                      <td>
                        <span className={cn("badge text-xs", v.status==="overdue" ? "bg-red-50 text-red-700 border-red-200" : v.status==="due-soon" ? "bg-amber-50 text-amber-700 border-amber-200" : v.status==="completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                          {v.status==="overdue" && "⚠ "}{v.status}
                        </span>
                      </td>
                      <td>
                        <button className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                          Mark Done
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Health records */}
      {tab==="health-records" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Health Records</h3></div>
          <div className="divide-y divide-gray-50">
            {mockHealthRecords.map((r) => {
              const animal = animals.find((a) => a.id === r.animalId);
              return (
                <div key={r.id} className="px-5 py-4 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 text-lg",
                        r.type==="vaccination" ? "bg-emerald-50" : r.type==="treatment" ? "bg-red-50" : "bg-blue-50"
                      )}>{r.type==="vaccination" ? "💉" : r.type==="treatment" ? "💊" : "🩺"}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{animal?.name ?? r.animalId}</p>
                          <span className={cn("badge text-[10px]",
                            r.type==="vaccination" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            r.type==="treatment"   ? "bg-red-50 text-red-700 border-red-200"             :
                            "bg-blue-50 text-blue-700 border-blue-200"
                          )}>{r.type}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{r.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>
                        {r.medication && <p className="text-xs text-gray-500 mt-1">💊 {r.medication} · {r.dosage}</p>}
                        <p className="text-xs text-gray-400 mt-1">👨‍⚕️ {r.veterinarian}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-700">{formatDate(r.date)}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">${r.cost}</p>
                      {r.nextFollowUp && <p className="text-xs text-amber-600 mt-1">Follow-up: {formatDate(r.nextFollowUp)}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add record form */}
      {tab==="add-record" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-900 mb-5">Add Health Record</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Animal</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400">
                  {animals.map((a) => <option key={a.id}>{a.name} ({a.tag})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Record Type</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                  <option>Vaccination</option><option>Treatment</option><option>Checkup</option><option>Surgery</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Date</label>
                <input type="date" defaultValue="2024-07-14" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Veterinarian</label>
                <input type="text" placeholder="Dr. Name" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
              <input type="text" placeholder="Brief description" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Medication</label>
                <input type="text" placeholder="Drug name" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Dosage</label>
                <input type="text" placeholder="5ml IM" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Cost ($)</label>
                <input type="number" placeholder="0.00" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
              <textarea rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none" placeholder="Observations…" />
            </div>
            <div className="flex gap-3">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">Save Record</button>
              <button onClick={() => setTab("health-records")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
