"use client";
import { useState, useMemo, useRef } from "react";
import type { Animal } from "@/types";
import { Plus, QrCode, ChevronRight, Download, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { SearchBar }     from "@/components/ui/SearchBar";
import { Select }        from "@/components/ui/Select";
import { Modal }         from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState }    from "@/components/ui/EmptyState";
import { Pagination }    from "@/components/ui/Pagination";
import { StatusBadge, healthVariant, pregnancyVariant } from "@/components/ui/StatusBadge";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, getAge } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useAuth }    from "@/contexts/AuthContext";
import { useAnimals } from "@/hooks/useAnimals";
import type { AnimalInsertPayload } from "@/hooks/useAnimals";

const PAGE_SIZE = 8;

const BREED_COLORS: Record<string, string> = {
  "Holstein Friesian":"bg-slate-100 text-slate-700","Jersey":"bg-amber-50 text-amber-700",
  "Simmental":"bg-orange-50 text-orange-700","Brown Swiss":"bg-stone-100 text-stone-700",
  "Ayrshire":"bg-red-50 text-red-700","Merino":"bg-purple-50 text-purple-700",
};

function AnimalCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden animate-pulse">
      <div className="px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gray-100" />
          <div className="space-y-1.5"><div className="w-16 h-4 rounded-full bg-gray-100" /><div className="w-14 h-4 rounded-full bg-gray-100" /></div>
        </div>
        <div className="mt-3 space-y-1.5"><div className="w-24 h-4 rounded bg-gray-100" /><div className="w-32 h-3 rounded bg-gray-100" /></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between"><div className="w-24 h-4 rounded-full bg-gray-100" /><div className="w-12 h-3 rounded bg-gray-100" /></div>
        <div className="grid grid-cols-3 gap-2 pt-1">{[1,2,3].map(i=><div key={i} className="space-y-1"><div className="w-full h-2 rounded bg-gray-100" /><div className="w-full h-3 rounded bg-gray-100" /></div>)}</div>
      </div>
    </div>
  );
}

function AnimalCard({ animal, onDelete }: { animal: Animal; onDelete: (a: Animal) => void }) {
  const emoji = animal.type === "cow" ? "🐄" : animal.type === "bull" ? "🐂" : "🐑";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn("px-4 pt-4 pb-3 border-b border-gray-50",
        animal.healthStatus==="sick"?"bg-red-50/60":animal.healthStatus==="recovering"?"bg-amber-50/60":"")}>
        <div className="flex items-start justify-between">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0",
            animal.healthStatus==="sick"?"bg-red-100":animal.healthStatus==="recovering"?"bg-amber-100":"bg-emerald-50")}>{emoji}</div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge label={animal.healthStatus}   variant={healthVariant(animal.healthStatus)}      dot />
            <StatusBadge label={animal.pregnancyStatus} variant={pregnancyVariant(animal.pregnancyStatus)} />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="font-bold text-gray-900 text-base">{animal.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{animal.tag||"No tag"}{animal.rfid?` · RFID …${animal.rfid.slice(-6)}`:""}</p>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",BREED_COLORS[animal.breed]??"bg-gray-100 text-gray-600")}>{animal.breed||"Unknown breed"}</span>
          <span className="text-xs text-gray-400">{animal.dateOfBirth?getAge(animal.dateOfBirth):"Age unknown"}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center"><p className="text-xs text-gray-400">Weight</p><p className="text-sm font-bold text-gray-800">{animal.weight>0?<>{animal.weight}<span className="text-xs font-normal text-gray-400">kg</span></>:"—"}</p></div>
          <div className="text-center border-x border-gray-100"><p className="text-xs text-gray-400">Milk/d</p><p className="text-sm font-bold text-gray-800">{animal.milkYieldToday>0?`${animal.milkYieldToday}L`:"—"}</p></div>
          <div className="text-center"><p className="text-xs text-gray-400">DIM</p><p className="text-sm font-bold text-gray-800">{animal.daysInMilk>0?animal.daysInMilk:"—"}</p></div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1"><QrCode size={11}/>{animal.location||"No location"}</span>
          <div className="flex items-center gap-2">
            <Link href={`${ROUTES.ANIMALS}/${animal.id}`} className="text-xs text-emerald-600 font-medium hover:underline">View</Link>
            <button onClick={()=>onDelete(animal)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
            <ChevronRight size={14} className="text-gray-300"/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnimalsPage() {
  const { farm } = useAuth();
  const farmId = farm?.id ?? null;
  const { animals, loading, error, addAnimal, deleteAnimal } = useAnimals(farmId);

  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [statusFilter,setStatus]      = useState("all");
  const [page,        setPage]        = useState(1);
  const [showAdd,     setShowAdd]     = useState(false);
  const [toDelete,    setToDelete]    = useState<Animal|null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string|null>(null);
  const formRef = useRef<HTMLFormElement|null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return animals.filter(a => {
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q);
      const matchT = typeFilter==="all"   || a.type===typeFilter;
      const matchS = statusFilter==="all" || a.healthStatus===statusFilter;
      return matchQ && matchT && matchS;
    });
  }, [animals, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length/PAGE_SIZE);
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  async function handleAddAnimal() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const animal_name = (fd.get("animal_name") as string)?.trim();
    if (!animal_name) { setSubmitError("Animal name is required."); return; }
    setSubmitting(true); setSubmitError(null);

    const payload: AnimalInsertPayload = {
      animal_name,
      ear_tag:             (fd.get("ear_tag")              as string)?.trim()||undefined,
      rfid:                (fd.get("rfid")                 as string)?.trim()||undefined,
      species:             (fd.get("species")              as "cow"|"sheep"|"bull"),
      breed:               (fd.get("breed")                as string)?.trim()||undefined,
      birth_date:          (fd.get("birth_date")           as string)||undefined,
      weight:              fd.get("weight")    ? parseFloat(fd.get("weight") as string)   : undefined,
      health_status:       (fd.get("health_status")        as "healthy"|"sick"|"recovering"|"critical"),
      reproductive_status: (fd.get("reproductive_status")  as "open"|"pregnant"|"lactating"|"dry"),
      location:            (fd.get("location")             as string)?.trim()||undefined,
      sire:                (fd.get("sire")                 as string)?.trim()||undefined,
      dam:                 (fd.get("dam")                  as string)?.trim()||undefined,
      notes:               (fd.get("notes")                as string)?.trim()||undefined,
      acquisition_date:    (fd.get("acquisition_date")     as string)||undefined,
      acquisition_cost:    fd.get("acquisition_cost") ? parseFloat(fd.get("acquisition_cost") as string) : undefined,
    };

    const { error } = await addAnimal(payload);
    setSubmitting(false);
    if (error) { setSubmitError(error); return; }
    setShowAdd(false); setSubmitError(null); formRef.current.reset(); setPage(1);
  }

  async function handleDelete(animal: Animal) {
    await deleteAnimal(animal.id);
    if (paged.length===1 && page>1) setPage(page-1);
  }

  const SUMMARY = [
    { label:"All",   value:"all",   count:animals.length },
    { label:"Cows",  value:"cow",   count:animals.filter(a=>a.type==="cow").length },
    { label:"Bulls", value:"bull",  count:animals.filter(a=>a.type==="bull").length },
    { label:"Sheep", value:"sheep", count:animals.filter(a=>a.type==="sheep").length },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5"/>
          <div><p className="font-semibold text-red-800 text-sm">Unable to load animals</p><p className="text-xs text-red-600 mt-0.5">{error}</p></div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          <SearchBar value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search name, tag, breed…" className="flex-1 min-w-[200px] max-w-sm"/>
          <Select value={typeFilter} onChange={v=>{setTypeFilter(v);setPage(1);}} options={[{label:"All Types",value:"all"},{label:"Cows",value:"cow"},{label:"Bulls",value:"bull"},{label:"Sheep",value:"sheep"}]}/>
          <Select value={statusFilter} onChange={v=>{setStatus(v);setPage(1);}} options={[{label:"All Health",value:"all"},{label:"Healthy",value:"healthy"},{label:"Sick",value:"sick"},{label:"Recovering",value:"recovering"},{label:"Critical",value:"critical"}]}/>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"><Download size={15}/>Export</button>
          <button onClick={()=>{setSubmitError(null);setShowAdd(true);}} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"><Plus size={16}/>Add Animal</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {SUMMARY.map(chip=>(
          <button key={chip.value} onClick={()=>{setTypeFilter(chip.value);setPage(1);}}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
              typeFilter===chip.value?"bg-emerald-600 text-white":"bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
            {chip.label}
            <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-bold",typeFilter===chip.value?"bg-emerald-500 text-white":"bg-gray-100 text-gray-500")}>{chip.count}</span>
          </button>
        ))}
        <p className="ml-auto text-sm text-gray-400">{loading?"Loading…":`${filtered.length} of ${animals.length} animals`}</p>
      </div>

      {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><AnimalCardSkeleton key={i}/>)}</div>}

      {!loading && !error && animals.length===0 && (
        <EmptyState icon="🐄" title="No animals yet" message="Add your first animal to start tracking your herd."
          action={<button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"><Plus size={16}/>Add First Animal</button>}/>
      )}

      {!loading && !error && animals.length>0 && filtered.length===0 && (
        <EmptyState icon="🔍" title="No animals match your search" message="Try adjusting your filters."
          action={<button onClick={()=>{setSearch("");setTypeFilter("all");setStatus("all");}} className="text-sm text-emerald-600 font-semibold hover:underline">Clear all filters</button>}/>
      )}

      {!loading && paged.length>0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paged.map(a=><AnimalCard key={a.id} animal={a} onDelete={setToDelete}/>)}
        </div>
      )}

      {!loading && <Pagination page={page} totalPages={totalPages} onPage={setPage} total={filtered.length} pageSize={PAGE_SIZE}/>}

      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setSubmitError(null);}} title="Add New Animal"
        subtitle="Fill in the details. Animal Name is required."
        size="lg"
        footer={<>
          <button onClick={()=>{setShowAdd(false);setSubmitError(null);}} disabled={submitting} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleAddAnimal} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {submitting?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Animal"}
          </button>
        </>}>
        <form ref={formRef} className="space-y-4">
          {submitError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"><AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5"/><p className="text-xs text-red-700">{submitError}</p></div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Animal Name" required><input name="animal_name" type="text" placeholder="e.g. Bella" required className={inputClass}/></FormField>
            <FormField label="Tag / Ear Tag"><input name="ear_tag" type="text" placeholder="e.g. COW-001" className={inputClass}/></FormField>
            <FormField label="RFID"><input name="rfid" type="text" placeholder="15-digit RFID" className={inputClass}/></FormField>
            <FormField label="Type" required><select name="species" defaultValue="cow" className={selectClass}><option value="cow">Cow</option><option value="bull">Bull</option><option value="sheep">Sheep</option></select></FormField>
            <FormField label="Breed"><input name="breed" type="text" placeholder="e.g. Holstein Friesian" className={inputClass}/></FormField>
            <FormField label="Date of Birth"><input name="birth_date" type="date" className={inputClass}/></FormField>
            <FormField label="Weight (kg)"><input name="weight" type="number" min="0" step="0.1" placeholder="0" className={inputClass}/></FormField>
            <FormField label="Location / Barn"><input name="location" type="text" placeholder="e.g. Barn A" className={inputClass}/></FormField>
            <FormField label="Health Status"><select name="health_status" defaultValue="healthy" className={selectClass}><option value="healthy">Healthy</option><option value="sick">Sick</option><option value="recovering">Recovering</option><option value="critical">Critical</option></select></FormField>
            <FormField label="Pregnancy Status"><select name="reproductive_status" defaultValue="open" className={selectClass}><option value="open">Open</option><option value="pregnant">Pregnant</option><option value="lactating">Lactating</option><option value="dry">Dry</option></select></FormField>
            <FormField label="Sire"><input name="sire" type="text" placeholder="Sire name or ID" className={inputClass}/></FormField>
            <FormField label="Dam"><input name="dam" type="text" placeholder="Dam name or ID" className={inputClass}/></FormField>
            <FormField label="Acquisition Date"><input name="acquisition_date" type="date" className={inputClass}/></FormField>
            <FormField label="Acquisition Cost"><input name="acquisition_cost" type="number" min="0" step="0.01" placeholder="0.00" className={inputClass}/></FormField>
          </div>
          <FormField label="Additional Notes"><textarea name="notes" rows={3} placeholder="Any additional notes…" className={textareaClass}/></FormField>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={()=>setToDelete(null)} onConfirm={()=>{if(toDelete)handleDelete(toDelete);setToDelete(null);}}
        title="Delete Animal" message={`Permanently delete ${toDelete?.name??"this animal"}? This cannot be undone.`} confirmLabel="Delete Animal" danger/>
    </div>
  );
}
