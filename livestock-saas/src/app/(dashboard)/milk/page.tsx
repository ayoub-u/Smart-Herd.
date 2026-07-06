"use client";
import { useState } from "react";
import { mockMilkRecords, mockMonthlyMilk, topProducers } from "@/data/mockData";
import { Droplets, Plus } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { cn, formatDate } from "@/lib/utils";

const last7      = mockMilkRecords.slice(-7);
const todayRecord = mockMilkRecords[mockMilkRecords.length - 1];
const avgMilk    = Math.round(last7.reduce((s, r) => s + r.total, 0) / last7.length);

export default function MilkPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Today's Production", value:`${todayRecord.total}L`,       sub:`${todayRecord.morning}L / ${todayRecord.afternoon}L / ${todayRecord.evening}L`, color:"bg-blue-500"   },
          { label:"7-Day Average",      value:`${avgMilk}L`,                 sub:"Per day",             color:"bg-emerald-500" },
          { label:"Fat Content",        value:`${todayRecord.fatContent}%`,  sub:"Today's average",     color:"bg-amber-500"   },
          { label:"Protein",            value:`${todayRecord.proteinContent}%`,sub:"Today's average",   color:"bg-violet-500"  },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.color)}>
              <Droplets size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick add */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Record Milk Entry</h3>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={15} />New Entry
          </button>
        </div>
        {showForm && (
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:"Date",           type:"date",   defaultValue:"2024-07-15", placeholder:"" },
                { label:"Morning (L)",    type:"number", defaultValue:"",           placeholder:"0.0" },
                { label:"Afternoon (L)",  type:"number", defaultValue:"",           placeholder:"0.0" },
                { label:"Evening (L)",    type:"number", defaultValue:"",           placeholder:"0.0" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} defaultValue={f.defaultValue}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">Save Entry</button>
              <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Daily Production</h3>
              <p className="text-xs text-gray-400">Morning / Afternoon / Evening sessions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7} margin={{ top:5, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:"#9ca3af" }} tickFormatter={(d) => d.split("-")[2]} />
              <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize:"11px" }} />
              <Bar dataKey="morning"   name="Morning"   fill="#34d399" stackId="a" />
              <Bar dataKey="afternoon" name="Afternoon" fill="#059669" stackId="a" />
              <Bar dataKey="evening"   name="Evening"   fill="#047857" radius={[2,2,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Top Producers</h3>
            <p className="text-xs text-gray-400 mt-0.5">Today's individual yield</p>
          </div>
          <div className="p-4 space-y-3">
            {topProducers.map((cow, i) => (
              <div key={cow.name} className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                  i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : "bg-orange-400"
                )}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{cow.name}</span>
                    <span className="text-sm font-bold text-gray-900">{cow.liters}L</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width:`${(cow.liters/35)*100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Monthly Trends</h3>
            <p className="text-xs text-gray-400">Total production & revenue</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={mockMonthlyMilk} margin={{ top:5, right:10, left:-5, bottom:0 }}>
            <defs>
              <linearGradient id="litersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#059669" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize:11, fill:"#9ca3af" }} />
            <YAxis tick={{ fontSize:11, fill:"#9ca3af" }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize:"11px" }} />
            <Area type="monotone" dataKey="liters"  name="Liters"      stroke="#059669" strokeWidth={2} fill="url(#litersGrad)" />
            <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#3b82f6" strokeWidth={2} fill="none" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* History table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Production History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>
              <th>Date</th><th>Morning</th><th>Afternoon</th><th>Evening</th>
              <th>Total</th><th>Quality</th><th>Fat %</th><th>Protein %</th>
            </tr></thead>
            <tbody>
              {[...mockMilkRecords].reverse().map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-800">{formatDate(r.date)}</td>
                  <td className="text-gray-600">{r.morning}L</td>
                  <td className="text-gray-600">{r.afternoon}L</td>
                  <td className="text-gray-600">{r.evening}L</td>
                  <td className="font-bold text-emerald-700">{r.total}L</td>
                  <td>
                    <span className={cn("badge text-xs",
                      r.quality === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      r.quality === "B" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    )}>Grade {r.quality}</span>
                  </td>
                  <td className="text-gray-600">{r.fatContent}%</td>
                  <td className="text-gray-600">{r.proteinContent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
