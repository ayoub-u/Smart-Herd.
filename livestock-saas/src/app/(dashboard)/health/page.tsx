"use client";
import { useState, useMemo } from "react";
import { Plus, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { SearchBar }     from "@/components/ui/SearchBar";
import { Select }        from "@/components/ui/Select";
import { Modal }         from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState }    from "@/components/ui/EmptyState";
import { StatusBadge, healthVariant, vaccinationVariant } from "@/components/ui/StatusBadge";
import { FormField, inputClass, selectClass, textareaClass } from "@/components/ui/FormField";
import { cn, formatDate } from "@/lib/utils";
import { useAuth }        from "@/contexts/AuthContext";
import { useAnimals }     from "@/hooks/useAnimals";
import { useHealth }      from "@/hooks/useHealth";
import type { HealthInsertPayload, VaccinationInsertPayload } from "@/hooks/useHealth";

export default function HealthPage() {
  const { farm } = useAuth();
  const farmId   = farm?.id ?? null;
  const { animals }  = useAnimals(farmId);
  const { healthRecords, vaccinations, loading, error, addHealthRecord, addVaccination, markVaccinationDone, deleteHealthRecord, deleteVaccination } = useHealth(farmId);

  const [tab,         setTab]         = useState<"records"|"vaccines">("records");
  const [search,      setSearch]      = useState("");
  const [showAdd,     setShowAdd]     = useState(false);
  const [showAddVax,  setShowAddVax]  = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string|null>(null);
  const [toDelete,    setToDelete]    = useState<string|null>(null);
  const [toDeleteVax, setToDeleteVax] = useState<string|null>(null);

  const [hrAnimal,   setHrAnimal]   = useState("");
  const [hrDate,     setHrDate]     = useState(new Date().toISOString().split("T")[0]);
  const [hrType,     setHrType]     = useState<"vaccination"|"treatment"|"checkup"|"surgery">("checkup");
  const [hrDesc,     setHrDesc]     = useState("");
  const [hrVet,      setHrVet]      = useState("");
  const [hrMed,      setHrMed]      = useState("");
  const [hrDose,     setHrDose]     = useState("");
  const [hrCost,     setHrCost]     = useState("");
  const [hrFollowUp, setHrFollowUp] = useState("");
  const [hrNotes,    setHrNotes]    = useState("");

  const [vaxAnimal,  setVaxAnimal]  = useState("");
  const [vaxName,    setVaxName]    = useState("");
  const [vaxDue,     setVaxDue]     = useState("");
  const [vaxPriority,setVaxPriority]= useState<"high"|"medium"|"low">("medium");

  const filteredRecords = useMemo(()=>{
    const q = search.toLowerCase();
    return healthRecords.filter(r=>!q||r.description.toLowerCase().includes(q)||r.type.includes(q));
  },[healthRecords, search]);

  const filteredVax = useMemo(()=>{
    const q = search.toLowerCase();
    return vaccinations.filter(v=>!q||v.animalName.toLowerCase().includes(q)||v.vaccine.toLowerCase().includes(q));
  },[vaccinations, search]);

  const sickCount    = animals.filter(a=>a.healthStatus==="sick"||a.healthStatus==="critical").length;
  const overdueCount = vaccinations.filter(v=>v.status==="overdue").length;
  const dueSoonCount = vaccinations.filter(v=>v.status==="due-soon").length;

  async function handleAddRecord() {
    if (!hrAnimal||!hrDesc) { setSubmitError("Animal and description are required."); return; }
    setSubmitting(true); setSubmitError(null);
    const payload: HealthInsertPayload = {
      animal_id: hrAnimal, record_date: hrDate, record_type: hrType,
      description: hrDesc, veterinarian: hrVet||undefined,
      medication: hrMed||undefined, dosage: hrDose||undefined,
      cost: hrCost?parseFloat(hrCost):undefined,
      next_follow_up: hrFollowUp||undefined, notes: hrNotes||undefined,
    };
    const { error } = await addHealthRecord(payload);
    setSubmitting(false);
    if (error) { setSubmitError(error); return; }
    setShowAdd(false);
    setHrAnimal(""); setHrDesc(""); setHrVet(""); setHrMed(""); setHrDose(""); setHrCost(""); setHrFollowUp(""); setHrNotes("");
  }

  async function handleAddVax() {
    if (!vaxAnimal||!vaxName||!vaxDue) { setSubmitError("Animal, vaccine name and due date are required."); return; }
    setSubmitting(true); setSubmitError(null);
    const payload: VaccinationInsertPayload = {
      animal_id: vaxAnimal, vaccine_name: vaxName, due_date: vaxDue,
      status: new Date(vaxDue)<new Date()?"overdue":"scheduled", priority: vaxPriority,
    };
    const { error } = await addVaccination(payload);
    setSubmitting(false);
    if (error) { setSubmitError(error); return; }
    setShowAddVax(false);
    setVaxAnimal(""); setVaxName(""); setVaxDue("");
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {(sickCount>0||overdueCount>0) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0"/>
          <p className="text-sm text-red-700">
            {sickCount>0&&<><strong>{sickCount} animal{sickCount>1?"s":""}</strong> need{sickCount===1?"s":""} medical attention. </>}
            {overdueCount>0&&<><strong>{overdueCount} vaccination{overdueCount>1?"s":""}</strong> overdue.</>}
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:"Total Animals", value:animals.length, color:"bg-emerald-50 text-emerald-700"},
          {label:"Sick/Critical",  value:sickCount,      color:"bg-red-50 text-red-700"},
          {label:"Overdue Vax",    value:overdueCount,   color:"bg-amber-50 text-amber-700"},
          {label:"Due Soon",       value:dueSoonCount,   color:"bg-blue-50 text-blue-700"},
        ].map(s=>(
          <div key={s.label} className={cn("rounded-2xl p-4 text-center",s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-card p-1.5">
        {(["records","vaccines"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn("flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize",
            tab===t?"bg-emerald-600 text-white":"text-gray-500 hover:text-gray-900 hover:bg-gray-50")}>
            {t==="records"?`Health Records (${healthRecords.length})`:`Vaccinations (${vaccinations.length})`}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 items-center justify-between flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder={tab==="records"?"Search records…":"Search vaccinations…"} className="flex-1 min-w-[200px] max-w-sm"/>
        <button onClick={()=>{setSubmitError(null);tab==="records"?setShowAdd(true):setShowAddVax(true);}}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={16}/>{tab==="records"?"Add Health Record":"Schedule Vaccine"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {/* Health Records */}
      {tab==="records" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {loading?(
            <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
          ):filteredRecords.length===0?(
            <EmptyState icon="🩺" title="No health records" message="Add health records to track your animals' medical history."/>
          ):filteredRecords.map(r=>(
            <div key={r.id} className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      r.type==="vaccination"?"bg-emerald-50 text-emerald-700":r.type==="treatment"?"bg-red-50 text-red-700":"bg-blue-50 text-blue-700"
                    )}>{r.type}</span>
                    <p className="text-sm font-medium text-gray-800">{r.description}</p>
                  </div>
                  {r.medication&&<p className="text-xs text-gray-500 mt-1">💊 {r.medication}{r.dosage?` · ${r.dosage}`:""}</p>}
                  {r.veterinarian&&<p className="text-xs text-gray-400 mt-0.5">👨‍⚕️ {r.veterinarian}</p>}
                  {r.notes&&<p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{r.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-700">{formatDate(r.date)}</p>
                  {r.cost>0&&<p className="text-sm font-bold text-gray-900 mt-1">{r.cost.toLocaleString()} DZD</p>}
                  <button onClick={()=>setToDelete(r.id)} className="text-xs text-red-500 hover:underline mt-1">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vaccinations */}
      {tab==="vaccines" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {loading?(
            <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"/>)}</div>
          ):filteredVax.length===0?(
            <EmptyState icon="💉" title="No vaccinations scheduled" message="Schedule vaccinations to keep track of your herd's health."/>
          ):filteredVax.map(v=>(
            <div key={v.id} className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  v.status==="overdue"?"bg-red-500":v.status==="due-soon"?"bg-amber-500":v.status==="completed"?"bg-emerald-500":"bg-blue-500")}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{v.animalName}</p>
                  <p className="text-xs text-gray-400">{v.vaccine} · Due: {formatDate(v.dueDate)}</p>
                </div>
                <StatusBadge label={v.status} variant={vaccinationVariant(v.status)}/>
                {v.status!=="completed"&&(
                  <>
                    <button onClick={()=>markVaccinationDone(v.id)} className="text-xs text-emerald-600 font-semibold hover:underline whitespace-nowrap">Mark Done</button>
                    <button onClick={()=>setToDeleteVax(v.id)} className="text-xs text-red-500 font-semibold hover:underline whitespace-nowrap">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Health Record Modal */}
      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setSubmitError(null);}} title="Add Health Record" size="lg"
        footer={<>
          <button onClick={()=>setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAddRecord} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {submitting?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Save Record"}
          </button>
        </>}>
        <div className="space-y-4">
          {submitError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{submitError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Animal" required>
              <select value={hrAnimal} onChange={e=>setHrAnimal(e.target.value)} className={selectClass}>
                <option value="">Select animal…</option>
                {animals.map(a=><option key={a.id} value={a.id}>{a.name} ({a.tag||"no tag"})</option>)}
              </select>
            </FormField>
            <FormField label="Date" required><input type="date" value={hrDate} onChange={e=>setHrDate(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Record Type" required>
              <select value={hrType} onChange={e=>setHrType(e.target.value as typeof hrType)} className={selectClass}>
                <option value="checkup">Checkup</option><option value="vaccination">Vaccination</option>
                <option value="treatment">Treatment</option><option value="surgery">Surgery</option>
              </select>
            </FormField>
            <FormField label="Veterinarian"><input type="text" value={hrVet} onChange={e=>setHrVet(e.target.value)} placeholder="Dr. Name" className={inputClass}/></FormField>
            <FormField label="Medication"><input type="text" value={hrMed} onChange={e=>setHrMed(e.target.value)} placeholder="Medication name" className={inputClass}/></FormField>
            <FormField label="Dosage"><input type="text" value={hrDose} onChange={e=>setHrDose(e.target.value)} placeholder="e.g. 5ml" className={inputClass}/></FormField>
            <FormField label="Cost (DZD)"><input type="number" value={hrCost} onChange={e=>setHrCost(e.target.value)} placeholder="0" className={inputClass}/></FormField>
            <FormField label="Next Follow-up"><input type="date" value={hrFollowUp} onChange={e=>setHrFollowUp(e.target.value)} className={inputClass}/></FormField>
          </div>
          <FormField label="Description" required><input type="text" value={hrDesc} onChange={e=>setHrDesc(e.target.value)} placeholder="Brief description" className={inputClass}/></FormField>
          <FormField label="Notes"><textarea rows={3} value={hrNotes} onChange={e=>setHrNotes(e.target.value)} className={textareaClass}/></FormField>
        </div>
      </Modal>

      {/* Add Vaccination Modal */}
      <Modal open={showAddVax} onClose={()=>{setShowAddVax(false);setSubmitError(null);}} title="Schedule Vaccination"
        footer={<>
          <button onClick={()=>setShowAddVax(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleAddVax} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold">
            {submitting?<><Loader2 size={15} className="animate-spin"/>Saving…</>:"Schedule"}
          </button>
        </>}>
        <div className="space-y-4">
          {submitError&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{submitError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Animal" required>
              <select value={vaxAnimal} onChange={e=>setVaxAnimal(e.target.value)} className={selectClass}>
                <option value="">Select animal…</option>
                {animals.map(a=><option key={a.id} value={a.id}>{a.name} ({a.tag||"no tag"})</option>)}
              </select>
            </FormField>
            <FormField label="Vaccine Name" required><input type="text" value={vaxName} onChange={e=>setVaxName(e.target.value)} placeholder="e.g. FMD Vaccine" className={inputClass}/></FormField>
            <FormField label="Due Date" required><input type="date" value={vaxDue} onChange={e=>setVaxDue(e.target.value)} className={inputClass}/></FormField>
            <FormField label="Priority">
              <select value={vaxPriority} onChange={e=>setVaxPriority(e.target.value as typeof vaxPriority)} className={selectClass}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </FormField>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={()=>setToDelete(null)} onConfirm={async()=>{if(toDelete)await deleteHealthRecord(toDelete);setToDelete(null);}}
        title="Delete Record" message="Permanently delete this health record? This cannot be undone." confirmLabel="Delete" danger/>
      <ConfirmDialog open={!!toDeleteVax} onClose={()=>setToDeleteVax(null)} onConfirm={async()=>{if(toDeleteVax)await deleteVaccination(toDeleteVax);setToDeleteVax(null);}}
        title="Delete Vaccination" message="Permanently delete this vaccination record? This cannot be undone." confirmLabel="Delete" danger/>
    </div>
  );
}
