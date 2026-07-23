"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnimals } from "@/hooks/useAnimals";
import { User, Building2, Bell, Shield, CreditCard, Save, CheckCircle2, Plug, Trash2 } from "lucide-react";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const TABS = [
  { id:"profile",       label:"Profile",       icon: User       },
  { id:"farm",          label:"Farm",          icon: Building2  },
  { id:"notifications", label:"Notifications", icon: Bell       },
  { id:"security",      label:"Security",      icon: Shield     },
  { id:"billing",       label:"Billing",       icon: CreditCard },
  { id:"integrations",  label:"Integrations",  icon: Plug       },
] as const;

type TabId = typeof TABS[number]["id"];

const NOTIF_PREFS = [
  { key:"vax",       label:"Vaccination reminders",        sub:"Alert when vaccines are due or overdue",       default:true  },
  { key:"feed",      label:"Low feed stock alerts",        sub:"Alert when feed drops below reorder level",    default:true  },
  { key:"sick",      label:"Sick animal alerts",           sub:"When an animal's health status changes",       default:true  },
  { key:"heat",      label:"Heat detection alerts",        sub:"Alert when heat signs are detected",           default:true  },
  { key:"calving",   label:"Calving reminders",            sub:"7 days before expected birth",                 default:true  },
  { key:"milkreport",label:"Daily milk summary",           sub:"Daily digest of milk production",              default:false },
  { key:"weekly",    label:"Weekly farm summary",          sub:"Weekly email performance report",              default:false },
  { key:"billing",   label:"Billing notifications",        sub:"Invoice and payment alerts",                   default:true  },
];

const INTEGRATIONS = [
  { name:"WhatsApp",       desc:"Send alerts via WhatsApp Business",      status:"available",  icon:"📱" },
  { name:"Email (SMTP)",   desc:"Custom email server for notifications",   status:"connected",  icon:"✉️" },
  { name:"Farm ERP",       desc:"Sync with your existing ERP system",      status:"available",  icon:"🏭" },
  { name:"Weather API",    desc:"Local weather for feed & grazing planning",status:"available", icon:"🌤️" },
  { name:"Milk Lab",       desc:"Import quality results from milk lab",     status:"available",  icon:"🔬" },
  { name:"Vet Platform",   desc:"Share health records with your vet",       status:"available",  icon:"🏥" },
];

export default function SettingsPage() {
  const { user, farm } = useAuth();
  const { animals } = useAnimals(farm?.id ?? null);
  const animalCount = animals.length;
  const [tab,   setTab]   = useState<TabId>("profile");
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_PREFS.map((p) => [p.key, p.default]))
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="md:col-span-1">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-card p-2 space-y-0.5">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  tab === t.id ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"
                )}>
                <t.icon size={16} className={tab === t.id ? "text-white" : "text-gray-400"} />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Quick info */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-4 space-y-1.5">
            <p className="text-xs font-bold text-emerald-800">Professional Plan</p>
            <p className="text-xs text-emerald-600">{animalCount} / 250 animals used</p>
            <div className="h-1.5 bg-emerald-200 rounded-full">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width:`${Math.min(100,(animalCount/250)*100).toFixed(1)}%` }} />
            </div>
            <p className="text-[10px] text-emerald-500">Renews Aug 1, 2024</p>
          </div>
        </div>

        {/* Content panel */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-card p-6">

          {/* ── PROFILE ─────────────────────────────── */}
          {tab === "profile" && (
            <div className="space-y-5">
              <div><h2 className="font-bold text-gray-900 text-lg">Profile Settings</h2><p className="text-sm text-gray-400 mt-0.5">Manage your personal information</p></div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center text-white text-xl font-black shrink-0">
                  {user?.avatarInitials ?? "AB"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
                  <button className="text-xs text-emerald-600 font-semibold mt-1 hover:underline">Change photo</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required><input type="text" defaultValue={user?.fullName} className={inputClass} /></FormField>
                <FormField label="Email Address" required><input type="email" defaultValue={user?.email} className={inputClass} /></FormField>
                <FormField label="Phone"><input type="tel" placeholder="+213 555 000 000" className={inputClass} /></FormField>
                <FormField label="Role">
                  <select defaultValue={user?.role} className={selectClass}>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="worker">Worker</option>
                  </select>
                </FormField>
                <FormField label="Language">
                  <select className={selectClass}><option>English</option><option>Français</option><option>العربية</option></select>
                </FormField>
                <FormField label="Date Format">
                  <select className={selectClass}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select>
                </FormField>
              </div>
            </div>
          )}

          {/* ── FARM ────────────────────────────────── */}
          {tab === "farm" && (
            <div className="space-y-5">
              <div><h2 className="font-bold text-gray-900 text-lg">Farm Settings</h2><p className="text-sm text-gray-400 mt-0.5">Your farm profile and configuration</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Farm Name" required><input type="text" defaultValue={farm?.name} className={inputClass} /></FormField>
                <FormField label="Country"><input type="text" defaultValue={farm?.country} className={inputClass} /></FormField>
                <FormField label="Location / Region"><input type="text" defaultValue={farm?.location} className={inputClass} /></FormField>
                <FormField label="Farm Size (hectares)"><input type="number" defaultValue={farm?.hectares} className={inputClass} /></FormField>
                <FormField label="Timezone">
                  <select className={selectClass}>
                    <option>Africa/Algiers (GMT+1)</option>
                    <option>Europe/Paris (GMT+1)</option>
                    <option>UTC</option>
                  </select>
                </FormField>
                <FormField label="Currency">
                  <select className={selectClass}>
                    <option>DZD — Algerian Dinar</option>
                    <option>USD — US Dollar</option>
                    <option>EUR — Euro</option>
                    <option>MAD — Moroccan Dirham</option>
                  </select>
                </FormField>
                <FormField label="Milk Price (per liter)"><input type="number" step="0.01" placeholder="0.50" className={inputClass} /></FormField>
                <FormField label="Livestock Type">
                  <select className={selectClass}>
                    <option>Mixed (Dairy + Beef)</option>
                    <option>Dairy Only</option>
                    <option>Beef Only</option>
                    <option>Sheep / Small Ruminants</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Farm Description">
                <textarea rows={3} className={textareaClass} placeholder="Brief description of your farming operation…" />
              </FormField>
            </div>
          )}

          {/* ── NOTIFICATIONS ───────────────────────── */}
          {tab === "notifications" && (
            <div className="space-y-5">
              <div><h2 className="font-bold text-gray-900 text-lg">Notification Preferences</h2><p className="text-sm text-gray-400 mt-0.5">Choose which alerts you receive</p></div>
              <div className="space-y-0.5">
                {NOTIF_PREFS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" checked={prefs[item.key]} onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))} className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Notification channels</p>
                <div className="flex gap-3 flex-wrap mt-2">
                  {["In-app","Email","SMS","WhatsApp"].map((ch) => (
                    <label key={ch} className="flex items-center gap-1.5 text-xs text-blue-700 cursor-pointer">
                      <input type="checkbox" defaultChecked={ch==="In-app"||ch==="Email"} className="accent-blue-600" />{ch}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECURITY ────────────────────────────── */}
          {tab === "security" && (
            <div className="space-y-5">
              <div><h2 className="font-bold text-gray-900 text-lg">Security</h2><p className="text-sm text-gray-400 mt-0.5">Password and account security settings</p></div>
              <div className="space-y-4 max-w-sm">
                <FormField label="Current Password"><input type="password" placeholder="••••••••" className={inputClass} /></FormField>
                <FormField label="New Password"><input type="password" placeholder="••••••••" className={inputClass} /></FormField>
                <FormField label="Confirm New Password"><input type="password" placeholder="••••••••" className={inputClass} /></FormField>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 max-w-sm">
                <p className="font-semibold mb-2">Password requirements</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Minimum 8 characters</li>
                  <li>✓ At least one uppercase letter</li>
                  <li>✓ At least one number</li>
                  <li>✓ At least one special character</li>
                </ul>
              </div>
              <div className="pt-5 border-t border-gray-100 space-y-4">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">Add an extra layer of security with 2FA</p>
                  <button className="text-sm font-semibold text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors">Enable 2FA</button>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">Active Sessions</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">Devices currently logged in to your account</p>
                  {[
                    { device:"Chrome · Windows", location:"Tlemcen, Algeria", time:"Current session", current:true },
                    { device:"Safari · iPhone", location:"Tlemcen, Algeria",  time:"2 hours ago",     current:false },
                  ].map((s) => (
                    <div key={s.device} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{s.device}</p>
                        <p className="text-xs text-gray-400">{s.location} · {s.time}</p>
                      </div>
                      {s.current ? (
                        <StatusBadge label="Current" variant="green" />
                      ) : (
                        <button className="text-xs text-red-500 font-semibold hover:underline">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BILLING ─────────────────────────────── */}
          {tab === "billing" && (
            <div className="space-y-5">
              <div><h2 className="font-bold text-gray-900 text-lg">Billing & Plan</h2><p className="text-sm text-gray-400 mt-0.5">Manage your subscription and invoices</p></div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-emerald-900 text-lg">Professional Plan</p>
                    <p className="text-sm text-emerald-700 mt-0.5">$79 / month · Billed monthly</p>
                    <p className="text-xs text-emerald-600 mt-1">Up to 250 animals · All features included</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge label="Active" variant="green" />
                    <p className="text-xs text-emerald-600 mt-1.5">Renews Aug 1, 2024</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {label:"Plan",          value:"Professional"},
                  {label:"Animals Used",  value:`${animalCount} / 250`},
                  {label:"Next Invoice",  value:"Aug 1, 2024"},
                ].map((i) => (
                  <div key={i.label} className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-xs text-gray-400">{i.label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{i.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-3">Payment Method</p>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Visa ending in 4242</p>
                    <p className="text-xs text-gray-400">Expires 12/2026</p>
                  </div>
                  <button className="ml-auto text-xs text-emerald-600 font-semibold hover:underline">Update</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="text-sm font-semibold text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors">Upgrade Plan</button>
                <button className="text-sm font-semibold text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">View Invoices</button>
                <button className="text-sm font-semibold text-red-500 border border-red-200 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors">Cancel Plan</button>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-800 text-sm mb-3">Recent Invoices</p>
                {[
                  {date:"Jul 1, 2024", amount:"$79.00", status:"Paid"},
                  {date:"Jun 1, 2024", amount:"$79.00", status:"Paid"},
                  {date:"May 1, 2024", amount:"$79.00", status:"Paid"},
                ].map((inv) => (
                  <div key={inv.date} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-700">{inv.date}</p>
                      <p className="text-xs text-gray-400">{inv.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge label={inv.status} variant="green" />
                      <button className="text-xs text-blue-600 font-semibold hover:underline">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS ────────────────────────── */}
          {tab === "integrations" && (
            <div className="space-y-5">
              <div><h2 className="font-bold text-gray-900 text-lg">Integrations</h2><p className="text-sm text-gray-400 mt-0.5">Connect SmartHerd with external services</p></div>
              <div className="space-y-3">
                {INTEGRATIONS.map((intg) => (
                  <div key={intg.name} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0">{intg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{intg.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{intg.desc}</p>
                    </div>
                    <div className="shrink-0">
                      {intg.status === "connected" ? (
                        <div className="flex items-center gap-2">
                          <StatusBadge label="Connected" variant="green" dot />
                          <button className="text-xs text-red-500 font-semibold hover:underline">Disconnect</button>
                        </div>
                      ) : (
                        <button className="text-sm font-semibold text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors">Connect</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800">API Access</p>
                <p className="text-xs text-blue-600 mt-1 mb-3">Use our REST API to build custom integrations</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate">sk_live_••••••••••••••••••••••••••••••</code>
                  <button className="text-xs text-blue-600 font-semibold border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-50">Copy</button>
                  <button className="text-xs text-red-500 font-semibold border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50">Rotate</button>
                </div>
              </div>
            </div>
          )}

          {/* Save button — shown on profile, farm, notifications, security tabs */}
          {!["billing","integrations"].includes(tab) && (
            <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
              <button onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                <Save size={15} />
                {saved ? "Saved!" : "Save Changes"}
              </button>
              <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Discard</button>
              {saved && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={14} />Changes saved successfully
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
