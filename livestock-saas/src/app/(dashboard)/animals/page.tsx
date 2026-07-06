"use client";
import { useState, useMemo } from "react";
import { animals as initialAnimals } from "@/data/mockData";
import type { Animal } from "@/types";
import { Plus, QrCode, ChevronRight, Download } from "lucide-react";
import Link from "next/link";
import { SearchBar }    from "@/components/ui/SearchBar";
import { Select }       from "@/components/ui/Select";
import { Modal }        from "@/components/ui/Modal";
import { ConfirmDialog }from "@/components/ui/ConfirmDialog";
import { EmptyState }   from "@/components/ui/EmptyState";
import { Pagination }   from "@/components/ui/Pagination";
import { StatusBadge, healthVariant, pregnancyVariant } from "@/components/ui/StatusBadge";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, getAge } from "@/lib/utils";
import { ROUTES } from "@/constants";

const PAGE_SIZE = 8;

const BREED_COLORS: Record<string, string> = {
  "Holstein Friesian":"bg-slate-100 text-slate-700",
  "Jersey":"bg-amber-50 text-amber-700",
  "Simmental":"bg-orange-50 text-orange-700",
  "Brown Swiss":"bg-stone-100 text-stone-700",
  "Ayrshire":"bg-red-50 text-red-700",
  "Guernsey":"bg-yellow-50 text-yellow-700",
  "Montbeliarde":"bg-blue-50 text-blue-700",
  "Merino":"bg-purple-50 text-purple-700",
  "Awassi":"bg-pink-50 text-pink-700",
};

function AnimalForm({ animal }: { animal?: Animal }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Animal Name" required>
          <input type="text" defaultValue={animal?.name} placeholder="e.g. Bella" className={inputClass} />
        </FormField>
        <FormField label="Tag / Ear Tag" required>
          <input type="text" defaultValue={animal?.tag} placeholder="e.g. COW-001" className={inputClass} />
        </FormField>
        <FormField label="RFID">
          <input type="text" defaultValue={animal?.rfid} placeholder="15-digit RFID" className={inputClass} />
        </FormField>
        <FormField label="Type" required>
          <select defaultValue={animal?.type ?? "cow"} className={selectClass}>
            <option value="cow">Cow</option>
            <option value="bull">Bull</option>
            <option value="sheep">Sheep</option>
          </select>
        </FormField>
        <FormField label="Breed" required>
          <input type="text" defaultValue={animal?.breed} placeholder="e.g. Holstein Friesian" className={inputClass} />
        </FormField>
        <FormField label="Date of Birth" required>
          <input type="date" defaultValue={animal?.dateOfBirth} className={inputClass} />
        </FormField>
        <FormField label="Weight (kg)">
          <input type="number" defaultValue={animal?.weight} placeholder="0" className={inputClass} />
        </FormField>
        <FormField label="Location / Barn">
          <input type="text" defaultValue={animal?.location} placeholder="e.g. Barn A" className={inputClass} />
        </FormField>
        <FormField label="Health Status">
          <select defaultValue={animal?.healthStatus ?? "healthy"} className={selectClass}>
            <option value="healthy">Healthy</option>
            <option value="sick">Sick</option>
            <option value="recovering">Recovering</option>
            <option value="critical">Critical</option>
          </select>
        </FormField>
        <FormField label="Pregnancy Status">
          <select defaultValue={animal?.pregnancyStatus ?? "open"} className={selectClass}>
            <option value="open">Open</option>
            <option value="pregnant">Pregnant</option>
            <option value="lactating">Lactating</option>
            <option value="dry">Dry</option>
          </select>
        </FormField>
        <FormField label="Sire (Father)">
          <input type="text" defaultValue={animal?.sire} placeholder="Sire name" className={inputClass} />
        </FormField>
        <FormField label="Dam (Mother)">
          <input type="text" defaultValue={animal?.dam} placeholder="Dam name" className={inputClass} />
        </FormField>
        <FormField label="Acquisition Date">
          <input type="date" defaultValue={animal?.acquisitionDate} className={inputClass} />
        </FormField>
        <FormField label="Acquisition Cost ($)">
          <input type="number" defaultValue={animal?.acquisitionCost} placeholder="0" className={inputClass} />
        </FormField>
      </div>
      <FormField label="Notes">
        <textarea rows={3} defaultValue={animal?.notes} placeholder="Additional notes..." className={textareaClass} />
      </FormField>
    </div>
  );
}

function AnimalCard({ animal, onDelete }: { animal: Animal; onDelete: (a: Animal) => void }) {
  const emoji = animal.type === "cow" ? "🐄" : animal.type === "bull" ? "🐂" : "🐑";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn("px-4 pt-4 pb-3 border-b border-gray-50",
        animal.healthStatus === "sick" ? "bg-red-50/60" :
        animal.healthStatus === "recovering" ? "bg-amber-50/60" : ""
      )}>
        <div className="flex items-start justify-between">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0",
            animal.healthStatus === "sick" ? "bg-red-100" :
            animal.healthStatus === "recovering" ? "bg-amber-100" : "bg-emerald-50"
          )}>{emoji}</div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge label={animal.healthStatus} variant={healthVariant(animal.healthStatus)} dot />
            <StatusBadge label={animal.pregnancyStatus} variant={pregnancyVariant(animal.pregnancyStatus)} />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="font-bold text-gray-900 text-base">{animal.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{animal.tag} · RFID …{animal.rfid.slice(-6)}</p>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", BREED_COLORS[animal.breed] ?? "bg-gray-100 text-gray-600")}>
            {animal.breed}
          </span>
          <span className="text-xs text-gray-400">{getAge(animal.dateOfBirth)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-xs text-gray-400">Weight</p>
            <p className="text-sm font-bold text-gray-800">{animal.weight}<span className="text-xs font-normal text-gray-400">kg</span></p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-xs text-gray-400">Milk/d</p>
            <p className="text-sm font-bold text-gray-800">{animal.milkYieldToday > 0 ? animal.milkYieldToday + "L" : "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">DIM</p>
            <p className="text-sm font-bold text-gray-800">{animal.daysInMilk > 0 ? animal.daysInMilk : "—"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1"><QrCode size={11} />{animal.location}</span>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.ANIMALS + "/" + animal.id} className="text-xs text-emerald-600 font-medium hover:underline">View</Link>
            <button onClick={() => onDelete(animal)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnimalsPage() {
  const [animals, setAnimals] = useState(initialAnimals);
  const [search,  setSearch]  = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [page, setPage]             = useState(1);
  const [showAdd,  setShowAdd]      = useState(false);
  const [toDelete, setToDelete]     = useState<Animal | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return animals.filter((a) => {
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q);
      const matchT = typeFilter === "all" || a.type === typeFilter;
      const matchS = statusFilter === "all" || a.healthStatus === statusFilter;
      return matchQ && matchT && matchS;
    });
  }, [animals, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, tag, breed…" className="flex-1 min-w-[200px] max-w-sm" />
          <Select value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={[{label:"All Types",value:"all"},{label:"Cows",value:"cow"},{label:"Bulls",value:"bull"},{label:"Sheep",value:"sheep"}]} />
          <Select value={statusFilter} onChange={(v) => { setStatus(v); setPage(1); }}
            options={[{label:"All Health",value:"all"},{label:"Healthy",value:"healthy"},{label:"Sick",value:"sick"},{label:"Recovering",value:"recovering"}]} />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={15} />Export
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} />Add Animal
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {[{label:"All",value:"all",count:animals.length},{label:"Cows",value:"cow",count:animals.filter(a=>a.type==="cow").length},{label:"Bulls",value:"bull",count:animals.filter(a=>a.type==="bull").length},{label:"Sheep",value:"sheep",count:animals.filter(a=>a.type==="sheep").length}].map((c) => (
          <button key={c.value} onClick={() => { setTypeFilter(c.value); setPage(1); }}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              typeFilter===c.value ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}>
            {c.label}
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold",
              typeFilter===c.value ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
            )}>{c.count}</span>
          </button>
        ))}
        <p className="ml-auto text-sm text-gray-400">{filtered.length} of {animals.length} animals</p>
      </div>

      {paged.length === 0 ? (
        <EmptyState icon="🐄" title="No animals found" message="Try adjusting your search or filters."
          action={<button onClick={() => { setSearch(""); setTypeFilter("all"); setStatus("all"); }} className="text-sm text-emerald-600 font-semibold hover:underline">Clear filters</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map((a) => <AnimalCard key={a.id} animal={a} onDelete={setToDelete} />)}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Animal" subtitle="Fill in the animal details below" size="lg"
        footer={
          <>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">Save Animal</button>
          </>
        }>
        <AnimalForm />
      </Modal>

      <ConfirmDialog
        open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) setAnimals((p) => p.filter((x) => x.id !== toDelete.id)); setToDelete(null); }}
        title="Delete Animal"
        message={`Are you sure you want to delete ${toDelete?.name ?? "this animal"}? This action cannot be undone.`}
        confirmLabel="Delete Animal" danger
      />
    </div>
  );
}
