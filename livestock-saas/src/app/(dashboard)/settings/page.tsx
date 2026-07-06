"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Building2, Bell, Shield, CreditCard, Globe, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id:"profile",       label:"Profile",       icon: User       },
  { id:"farm",          label:"Farm",          icon: Building2  },
  { id:"notifications", label:"Notifications", icon: Bell       },
  { id:"security",      label:"Security",      icon: Shield     },
  { id:"billing",       label:"Billing",       icon: CreditCard },
] as const;

type TabId = typeof TABS[number]["id"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400";

export default function SettingsPage() {
  const { user, farm } = useAuth();
  const [tab, setTab]  = useState<TabId>("profile");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="md:col-span-1">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-card p-2 space-y-0.5">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  tab===t.id ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"
                )}>
                <t.icon size={16} className={tab===t.id ? "text-white" : "text-gray-400"} />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-card p-6">

          {/* Profile */}
          {tab==="profile" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Profile Settings</h2>
                <p className="text-sm text-gray-400 mt-0.5">Manage your personal information</p>
              </div>
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center text-white text-xl font-black">
                  {user?.avatarInitials ?? "AB"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
                  <button className="text-xs text-emerald-600 font-medium mt-1 hover:underline">Change photo</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <input type="text" defaultValue={user?.fullName} className={INPUT} />
                </Field>
                <Field label="Email Address">
                  <input type="email" defaultValue={user?.email} className={INPUT} />
                </Field>
                <Field label="Phone">
                  <input type="tel" placeholder="+213 555 000 000" className={INPUT} />
                </Field>
                <Field label="Language">
                  <select className={INPUT + " bg-white"}>
                    <option>English</option>
                    <option>Français</option>
                    <option>العربية</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* Farm */}
          {tab==="farm" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Farm Settings</h2>
                <p className="text-sm text-gray-400 mt-0.5">Your farm profile and configuration</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Farm Name">
                  <input type="text" defaultValue={farm?.name} className={INPUT} />
                </Field>
                <Field label="Country">
                  <input type="text" defaultValue={farm?.country} className={INPUT} />
                </Field>
                <Field label="Location / Region">
                  <input type="text" defaultValue={farm?.location} className={INPUT} />
                </Field>
                <Field label="Farm Size (hectares)">
                  <input type="number" defaultValue={farm?.hectares} className={INPUT} />
                </Field>
                <Field label="Timezone">
                  <select className={INPUT + " bg-white"}>
                    <option>Africa/Algiers (GMT+1)</option>
                    <option>Europe/Paris (GMT+1)</option>
                    <option>UTC</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <select className={INPUT + " bg-white"}>
                    <option>DZD — Algerian Dinar</option>
                    <option>USD — US Dollar</option>
                    <option>EUR — Euro</option>
                  </select>
                </Field>
              </div>
              <div>
                <Field label="Farm Description">
                  <textarea rows={3} className={INPUT + " resize-none"} placeholder="Brief description of your farm operation…" />
                </Field>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab==="notifications" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Notification Preferences</h2>
                <p className="text-sm text-gray-400 mt-0.5">Choose what alerts you want to receive</p>
              </div>
              {[
                { label:"Vaccination reminders",    sub:"Alert when vaccines are due or overdue",     default:true  },
                { label:"Low feed stock alerts",    sub:"Alert when feed drops below reorder level",  default:true  },
                { label:"Sick animal alerts",       sub:"Alert when an animal's health status changes",default:true  },
                { label:"Heat detection alerts",    sub:"Alert when heat signs are detected",          default:true  },
                { label:"Calving reminders",        sub:"Alert 7 days before expected birth",          default:true  },
                { label:"Milk production reports",  sub:"Daily summary of milk production",            default:false },
                { label:"Weekly farm summary",      sub:"Weekly email digest of farm performance",     default:false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Security */}
          {tab==="security" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Security</h2>
                <p className="text-sm text-gray-400 mt-0.5">Manage your password and account security</p>
              </div>
              <div className="space-y-4">
                <Field label="Current Password">
                  <input type="password" placeholder="••••••••" className={INPUT} />
                </Field>
                <Field label="New Password">
                  <input type="password" placeholder="••••••••" className={INPUT} />
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" placeholder="••••••••" className={INPUT} />
                </Field>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <p className="font-semibold mb-1">Password requirements</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Minimum 8 characters</li>
                  <li>✓ At least one uppercase letter</li>
                  <li>✓ At least one number</li>
                </ul>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="font-semibold text-gray-800 text-sm mb-1">Two-Factor Authentication</p>
                <p className="text-xs text-gray-400 mb-3">Add an extra layer of security to your account</p>
                <button className="text-sm font-medium text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {/* Billing */}
          {tab==="billing" && (
            <div className="space-y-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Billing & Plan</h2>
                <p className="text-sm text-gray-400 mt-0.5">Manage your subscription and payments</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-900">Professional Plan</p>
                    <p className="text-sm text-emerald-700 mt-0.5">$79 / month · Billed monthly</p>
                    <p className="text-xs text-emerald-600 mt-1">Up to 250 animals · All features included</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">Active</span>
                    <p className="text-xs text-emerald-600 mt-1">Renews Aug 1, 2024</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label:"Plan",          value:"Professional" },
                  { label:"Animals Used",  value:"14 / 250"     },
                  { label:"Next Invoice",  value:"Aug 1, 2024"  },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button className="text-sm font-medium text-emerald-600 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors">
                  Upgrade Plan
                </button>
                <button className="text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  View Invoices
                </button>
              </div>
            </div>
          )}

          {/* Save button — shown on all tabs */}
          {tab !== "billing" && (
            <div className="flex items-center gap-3 pt-5 mt-5 border-t border-gray-100">
              <button onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                <Save size={15} />
                {saved ? "Saved!" : "Save Changes"}
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Discard</button>
              {saved && <p className="text-xs text-emerald-600 font-medium">✓ Changes saved successfully</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
