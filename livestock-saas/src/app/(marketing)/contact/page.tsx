"use client";
import { useState } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="pt-24">
      {/* Header */}
      <section className="section-padding bg-gradient-to-b from-emerald-50 to-white pb-10">
        <div className="container-xl max-w-2xl mx-auto text-center">
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Contact</p>
          <h1 className="text-5xl font-bold text-gray-900">Get in touch</h1>
          <p className="text-lg text-gray-500 mt-4">
            Have a question or want to talk about your farm's needs? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding pt-10 bg-white">
        <div className="container-xl max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Info */}
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Contact details</h3>
              <div className="space-y-4">
                {[
                  { icon: Mail,    label: "Email",   value: "contact@smartherd.io" },
                  { icon: Phone,   label: "Phone",   value: "+213 5 49 38 14 30" , href: "tel:+213549381430" },
                 // { icon: MapPin,  label: "Office",  value: "Tlemcen, Algeria"   },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm font-medium text-gray-800 mt-0.5 hover:underline">{value}</a>
                      ) : (
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <p className="font-semibold text-emerald-800 text-sm">Support hours</p>
              <p className="text-xs text-emerald-600 mt-1">Sunday – Thursday</p>
              <p className="text-xs text-emerald-600">8:00 AM – 6:00 PM (GMT+1)</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-emerald-900">Message sent!</h3>
                <p className="text-emerald-700 mt-2">We'll get back to you within one business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name *</label>
                    <input
                      required name="name" value={form.name} onChange={handleChange}
                      placeholder="Ahmed Benali"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Email *</label>
                    <input
                      required type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="ahmed@yourfarm.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Subject *</label>
                  <select
                    required name="subject" value={form.subject} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white"
                  >
                    <option value="">Select a subject</option>
                    <option>General inquiry</option>
                    <option>Technical support</option>
                    <option>Billing question</option>
                    <option>Enterprise / custom pricing</option>
                    <option>Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Message *</label>
                  <textarea
                    required name="message" value={form.message} onChange={handleChange}
                    rows={5} placeholder="Tell us about your farm and what you need..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
