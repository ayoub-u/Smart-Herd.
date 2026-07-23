"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, Edit3, MapPin, Calendar, Weight, Droplets, Trash2, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { supabase }     from "@/lib/supabase";
import { useAuth }      from "@/contexts/AuthContext";
import { useAnimals }   from "@/hooks/useAnimals";
import { useHealth }    from "@/hooks/useHealth";
import { useReproduction } from "@/hooks/useReproduction";
import type { AnimalUpdatePayload } from "@/hooks/useAnimals";
import { Modal }        from "@/components/ui/Modal";
import { ConfirmDialog }from "@/components/ui/ConfirmDialog";
import { StatusBadge, healthVariant, pregnancyVariant } from "@/components/ui/StatusBadge";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, getAge, formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants";
import type { Animal } from "@/types";
import type { DbAnimal } from "@/types/supabase";
import { dbToAnimal } from "@/hooks/useAnimals";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TABS = ["Overview","Health","Reproduction","Production","Edit"] as const;
type Tab = typeof TABS[number];

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl space-y-5 animate-pulse">
      <div className="w-32 h-4 bg-gray-100 rounded"/>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="h-24 bg-gray-100"/>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 border-4 border-white"/>
            <div className="pb-1 space-y-2"><div className="w-40 h-5 bg-gray-100 rounded"/><div className="w-28 h-3 bg-gray-100 rounded"/></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            {[1,2,3,4].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl"/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnimalProfilePage({ params }: { params:{ id: string }}) {
  const { id }  = params;
  const router  = useRouter();
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { updateAnimal, deleteAnimal } = useAnimals(farmId);
  const { healthRecords }  = useHealth(farmId);
  const { records: reproRecords } = useReproduction(farmId);

  const [animal,  setAnimal]  = useState<Animal|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string|null>(null);
  const [tab,     setTab]     = useState<Tab>("Overview");
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string|null>(null);

  const [editName,     setEditName]     = useState("");
  const [editTag,      setEditTag]      = useState("");
  const [editRfid,     setEditRfid]     = useState("");
  const [editSpecies,  setEditSpecies]  = useState<"cow"|"bull"|"sheep">("cow");
  const [editBreed,    setEditBreed]    = useState("");
  const [editBirthDate,setEditBirthDate]= useState("");
  const [editWeight,   setEditWeight]   = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editHealth,   setEditHealth]   = useState("healthy");
  const [editPreg,     setEditPreg]     = useState("open");
  const [editSire,     setEditSire]     = useState("");
  const [editDam,      setEditDam]      = useState("");
  const [editAcqDate,  setEditAcqDate]  = useState("");
  const [editAcqCost,  setEditAcqCost]  = useState("");
  const [editNotes,    setEditNotes]    = useState("");

  const fetchAnimal = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const { data, error: e } = await supabase.from("animals").select("*").eq("id", id).single();
      if (e) { setError(e.code==="PGRST116"?"Animal not found.":e.message); return; }
      const mapped = dbToAnimal(data as DbAnimal);
      setAnimal(mapped);
      setEditName(mapped.name);
      setEditTag(mapped.tag);
      setEditRfid(mapped.rfid);
      setEditSpecies(mapped.type);
      setEditBreed(mapped.breed);
      setEditBirthDate(mapped.dateOfBirth);
      setEditWeight(mapped.weight > 0 ? String(mapped.weight) : "");
      setEditLocation(mapped.location);
      setEditHealth(mapped.healthStatus);
      setEditPreg(mapped.pregnancyStatus);
      setEditSire(mapped.sire);
      setEditDam(mapped.dam);
      setEditAcqDate(mapped.acquisitionDate);
      setEditAcqCost(mapped.acquisitionCost > 0 ? String(mapped.acquisitionCost) : "");
      setEditNotes(mapped.notes);
    } catch (err) { setError(err instanceof Error?err.message:"Failed to load animal"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAnimal(); }, [fetchAnimal]);

  async function handleSave() {
    if (!animal) return;
    setSaving(true); setSaveError(null);
    const payload: AnimalUpdatePayload = {
      animal_name:         editName.trim()     || animal.name,
      ear_tag:             editTag.trim()       || undefined,
      rfid:                editRfid.trim()      || undefined,
      species:             editSpecies,
      breed:               editBreed.trim()     || undefined,
      birth_date:          editBirthDate        || undefined,
      weight:              editWeight           ? parseFloat(editWeight)   : undefined,
      location:            editLocation.trim()  || undefined,
      health_status:       editHealth           as Animal["healthStatus"],
      reproductive_status: editPreg             as Animal["pregnancyStatus"],
      sire:                editSire.trim()      || undefined,
      dam:                 editDam.trim()       || undefined,
      acquisition_date:    editAcqDate          || undefined,
      acquisition_cost:    editAcqCost          ? parseFloat(editAcqCost) : undefined,
      notes:               editNotes.trim()     || undefined,
    };
    const { error } = await updateAnimal(animal.id, payload);
    setSaving(false);
    if (error) { setSaveError(error); return; }
    await fetchAnimal(); setShowEdit(false); setSaveError(null);
  }

  async function handleDelete() {
    if (!animal) return;
    await deleteAnimal(animal.id);
    router.push(ROUTES.ANIMALS);
  }

  if (loading) return <ProfileSkeleton/>;

  if (error||!animal) {
    return (
      <div className="max-w-5xl space-y-4">
        <Link href={ROUTES.ANIMALS} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft size={16}/>Back to Animals</Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3"/>
          <p className="font-semibold text-red-800">{error??"Animal not found"}</p>
          <Link href={ROUTES.ANIMALS} className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:underline">← Back to Animals</Link>
        </div>
      </div>
    );
  }

  const emoji  = animal.type==="cow"?"🐄":animal.type==="bull"?"🐂":"🐑";
  const animalHealthRecs = healthRecords.filter(r=>r.animalId===animal.id);
  const animalReproRecs  = reproRecords.filter(r=>r.animalId===animal.id);

  const mockWeek = [
    {day:"Mon",liters:animal.milkYieldAvg||0},{day:"Tue",liters:animal.milkYieldToday||0},
    {day:"Wed",liters:animal.milkYieldAvg||0},{day:"Thu",liters:animal.milkYieldToday||0},
    {day:"Fri",liters:animal.milkYieldAvg||0},{day:"Sat",liters:animal.milkYieldToday||0},{day:"Sun",liters:animal.milkYieldAvg||0},
  ];

  return (
    <div className="max-w-5xl space-y-5">
      <Link href={ROUTES.ANIMALS} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"><ArrowLeft size={16}/>Back to Animals</Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="h-20 gradient-green relative">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle, white 1px, transparent 1px)",backgroundSize:"30px 30px"}}/>
          {/* Avatar overlaps banner — kept inside banner div so it clips correctly */}
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl">{emoji}</div>
          </div>
        </div>
        <div className="px-6 pb-6 pt-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-900">{animal.name}</h2>
                  <StatusBadge label={animal.healthStatus}   variant={healthVariant(animal.healthStatus)}      dot/>
                  <StatusBadge label={animal.pregnancyStatus} variant={pregnancyVariant(animal.pregnancyStatus)}/>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{animal.breed||"Unknown breed"} · {animal.tag||"No tag"}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><QrCode size={15}/>QR Code</button>
              <button onClick={()=>setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"><Edit3 size={15}/>Edit</button>
              <button onClick={()=>setShowDelete(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium"><Trash2 size={15}/>Delete</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            {[
              {icon:Calendar,label:"Age",       value:animal.dateOfBirth?getAge(animal.dateOfBirth):"Unknown", bg:"bg-emerald-50 text-emerald-600"},
              {icon:Weight,  label:"Weight",    value:animal.weight>0?`${animal.weight} kg`:"Unknown",         bg:"bg-blue-50 text-blue-600"},
              {icon:Droplets,label:"Milk Today",value:animal.milkYieldToday>0?`${animal.milkYieldToday}L`:"—", bg:"bg-cyan-50 text-cyan-600"},
              {icon:MapPin,  label:"Location",  value:animal.location||"Not set",                               bg:"bg-violet-50 text-violet-600"},
            ].map(({icon:Icon,label,value,bg})=>(
              <div key={label} className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",bg)}><Icon size={15}/></div>
                <div><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-semibold text-gray-800">{value}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-card p-1.5 overflow-x-auto">
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn("flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
            tab===t?"bg-emerald-600 text-white shadow-sm":"text-gray-500 hover:text-gray-900 hover:bg-gray-50")}>{t}</button>
        ))}
      </div>

      {tab==="Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-1.5">
            <h3 className="font-semibold text-gray-900 mb-3">Identity</h3>
            {[["Tag",animal.tag||"—"],["RFID",animal.rfid||"—"],["Type",`${emoji} ${animal.type}`],["Breed",animal.breed||"—"],
              ["Date of Birth",animal.dateOfBirth?formatDate(animal.dateOfBirth):"—"],
              ["Sire",animal.sire||"—"],["Dam",animal.dam||"—"],["Location",animal.location||"—"],
              ["Acquired",animal.acquisitionDate?formatDate(animal.acquisitionDate):"—"],
              ["Acquisition Cost",animal.acquisitionCost>0?`${animal.acquisitionCost.toLocaleString()} DZD`:"—"],
            ].map(([l,v])=>(
              <div key={String(l)} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{l}</span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[60%] text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {animal.type!=="bull"&&(
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Production</h3>
                {[["Lactation #",animal.lactationNumber>0?animal.lactationNumber:"—"],
                  ["Days in Milk",animal.daysInMilk>0?animal.daysInMilk:"—"],
                  ["Today's Yield",animal.milkYieldToday>0?`${animal.milkYieldToday}L`:"—"],
                  ["Average Yield",animal.milkYieldAvg>0?`${animal.milkYieldAvg}L/day`:"—"],
                ].map(([l,v])=>(
                  <div key={String(l)} className="flex justify-between border-b border-gray-50 py-1.5 last:border-0">
                    <span className="text-sm text-gray-500">{l}</span>
                    <span className="text-sm font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{animal.notes||<span className="text-gray-400 italic">No notes added.</span>}</p>
            </div>
          </div>
        </div>
      )}

      {tab==="Health" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Health Records ({animalHealthRecs.length})</h3>
            <Link href={ROUTES.HEALTH} className="text-sm text-emerald-600 font-semibold hover:underline">Add record →</Link>
          </div>
          {animalHealthRecs.length===0 ? (
            <div className="p-10 text-center"><p className="text-4xl mb-3">🩺</p><p className="text-sm text-gray-500">No health records for this animal yet.</p></div>
          ) : animalHealthRecs.map(r=>(
            <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",r.type==="vaccination"?"bg-emerald-50 text-emerald-700":r.type==="treatment"?"bg-red-50 text-red-700":"bg-blue-50 text-blue-700")}>{r.type}</span>
                    <p className="text-sm font-medium text-gray-800">{r.description}</p></div>
                  {r.medication&&<p className="text-xs text-gray-500 mt-1">💊 {r.medication}{r.dosage?` · ${r.dosage}`:""}</p>}
                  {r.veterinarian&&<p className="text-xs text-gray-400">👨‍⚕️ {r.veterinarian}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-700">{formatDate(r.date)}</p>
                  {r.cost>0&&<p className="text-sm font-bold text-gray-900 mt-1">{r.cost} DZD</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="Reproduction" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Reproduction Records ({animalReproRecs.length})</h3>
            <Link href={ROUTES.REPRODUCTION} className="text-sm text-emerald-600 font-semibold hover:underline">Add event →</Link>
          </div>
          {animalReproRecs.length===0 ? (
            <div className="p-10 text-center"><p className="text-4xl mb-3">❤️</p><p className="text-sm text-gray-500">No reproduction records for this animal yet.</p></div>
          ) : animalReproRecs.map(r=>(
            <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      r.type==="insemination"?"bg-blue-50 text-blue-700":r.type==="pregnancy-check"?"bg-violet-50 text-violet-700":
                      r.type==="heat"?"bg-pink-50 text-pink-700":"bg-emerald-50 text-emerald-700")}>{r.type.replace("-"," ").toUpperCase()}</span>
                    {r.result&&<span className="text-xs text-gray-500">→ {r.result}</span>}
                  </div>
                  {r.notes&&<p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                  {r.bull&&<p className="text-xs text-gray-400">Bull: {r.bull}</p>}
                </div>
                <p className="text-xs font-medium text-gray-500 shrink-0">{formatDate(r.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="Production" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Milk Production</h3>
          <p className="text-xs text-gray-400 mb-4">Based on current daily average and yield</p>
          {animal.type==="bull" ? (
            <div className="py-12 text-center text-gray-400"><p className="text-4xl mb-3">🐂</p><p className="text-sm">Bulls do not have milk production records.</p></div>
          ) : animal.milkYieldAvg===0 && animal.milkYieldToday===0 ? (
            <div className="py-12 text-center text-gray-400"><p className="text-4xl mb-3">🥛</p><p className="text-sm">No milk yield data. Set milk yield in the animal edit form.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockWeek} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="day" tick={{fontSize:12,fill:"#9ca3af"}}/>
                <YAxis tick={{fontSize:12,fill:"#9ca3af"}}/>
                <Tooltip formatter={v=>[`${v}L`,"Milk"]}/>
                <Line type="monotone" dataKey="liters" stroke="#059669" strokeWidth={2.5} dot={{fill:"#059669",r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {tab==="Edit" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Edit Animal</h3>
          {saveError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-700">{saveError}</div>}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Animal Name" required><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className={inputClass}/></FormField>
              <FormField label="Tag / Ear Tag"><input type="text" value={editTag} onChange={e=>setEditTag(e.target.value)} className={inputClass}/></FormField>
              <FormField label="RFID"><input type="text" value={editRfid} onChange={e=>setEditRfid(e.target.value)} placeholder="15-digit RFID" className={inputClass}/></FormField>
              <FormField label="Type">
                <select value={editSpecies} onChange={e=>setEditSpecies(e.target.value as "cow"|"bull"|"sheep")} className={selectClass}>
                  <option value="cow">Cow</option><option value="bull">Bull</option><option value="sheep">Sheep</option>
                </select>
              </FormField>
              <FormField label="Breed"><input type="text" value={editBreed} onChange={e=>setEditBreed(e.target.value)} className={inputClass}/></FormField>
              <FormField label="Date of Birth"><input type="date" value={editBirthDate} onChange={e=>setEditBirthDate(e.target.value)} className={inputClass}/></FormField>
              <FormField label="Weight (kg)"><input type="number" value={editWeight} onChange={e=>setEditWeight(e.target.value)} min="0" step="0.1" className={inputClass}/></FormField>
              <FormField label="Location / Barn"><input type="text" value={editLocation} onChange={e=>setEditLocation(e.target.value)} className={inputClass}/></FormField>
              <FormField label="Health Status"><select value={editHealth} onChange={e=>setEditHealth(e.target.value)} className={selectClass}><option value="healthy">Healthy</option><option value="sick">Sick</option><option value="recovering">Recovering</option><option value="critical">Critical</option></select></FormField>
              <FormField label="Pregnancy Status"><select value={editPreg} onChange={e=>setEditPreg(e.target.value)} className={selectClass}><option value="open">Open</option><option value="pregnant">Pregnant</option><option value="lactating">Lactating</option><option value="dry">Dry</option></select></FormField>
              <FormField label="Sire"><input type="text" value={editSire} onChange={e=>setEditSire(e.target.value)} placeholder="Sire name or ID" className={inputClass}/></FormField>
              <FormField label="Dam"><input type="text" value={editDam} onChange={e=>setEditDam(e.target.value)} placeholder="Dam name or ID" className={inputClass}/></FormField>
              <FormField label="Acquisition Date"><input type="date" value={editAcqDate} onChange={e=>setEditAcqDate(e.target.value)} className={inputClass}/></FormField>
              <FormField label="Acquisition Cost"><input type="number" value={editAcqCost} onChange={e=>setEditAcqCost(e.target.value)} min="0" step="0.01" className={inputClass}/></FormField>
            </div>
            <FormField label="Notes"><textarea rows={3} value={editNotes} onChange={e=>setEditNotes(e.target.value)} className={textareaClass}/></FormField>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-bold px-6 py-2.5 rounded-xl">
                {saving?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Changes"}
              </button>
              <button onClick={()=>setTab("Overview")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-6 py-2.5 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={showEdit} onClose={()=>{setShowEdit(false);setSaveError(null);}} title={`Edit ${animal.name}`} size="lg"
        footer={<>
          <button onClick={()=>{setShowEdit(false);setSaveError(null);}} disabled={saving} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {saving?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Changes"}
          </button>
        </>}>
        <div className="space-y-4">
          {saveError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{saveError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Name" required><input type="text" value={editName} onChange={e=>setEditName(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Tag"><input type="text" value={editTag} onChange={e=>setEditTag(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Weight (kg)"><input type="number" value={editWeight} onChange={e=>setEditWeight(e.target.value)} min="0" step="0.1" className={inputClass}/></FormField>
            <FormField label="Location"><input type="text" value={editLocation} onChange={e=>setEditLocation(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Health Status"><select value={editHealth} onChange={e=>setEditHealth(e.target.value)} className={selectClass}><option value="healthy">Healthy</option><option value="sick">Sick</option><option value="recovering">Recovering</option><option value="critical">Critical</option></select></FormField>
            <FormField label="Pregnancy Status"><select value={editPreg} onChange={e=>setEditPreg(e.target.value)} className={selectClass}><option value="open">Open</option><option value="pregnant">Pregnant</option><option value="lactating">Lactating</option><option value="dry">Dry</option></select></FormField>
          </div>
          <FormField label="Notes"><textarea rows={3} value={editNotes} onChange={e=>setEditNotes(e.target.value)} className={textareaClass}/></FormField>
        </div>
      </Modal>

      <ConfirmDialog open={showDelete} onClose={()=>setShowDelete(false)} onConfirm={handleDelete}
        title="Delete Animal" message={`Permanently delete ${animal.name}? All associated records will be lost.`} confirmLabel="Delete Permanently" danger/>
    </div>
  );
}
