"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";

interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  price?: number;
  requiresPrescription?: boolean;
  uses?: string[];
  sideEffects?: string[];
  safeAlternatives?: string[];
  fakeIndicators?: string[];
  isVerified?: boolean;
}

interface MedicineForm {
  name: string;
  genericName: string;
  manufacturer: string;
  price: string;
  requiresPrescription: boolean;
  uses: string;
  sideEffects: string;
  safeAlternatives: string;
  fakeIndicators: string;
}

const emptyForm: MedicineForm = {
  name: "", genericName: "", manufacturer: "", price: "",
  requiresPrescription: false, uses: "", sideEffects: "", safeAlternatives: "", fakeIndicators: "",
};

function toForm(m: Medicine): MedicineForm {
  return {
    name: m.name, genericName: m.genericName ?? "", manufacturer: m.manufacturer ?? "",
    price: m.price != null ? String(m.price) : "", requiresPrescription: m.requiresPrescription ?? false,
    uses: (m.uses ?? []).join(", "), sideEffects: (m.sideEffects ?? []).join(", "),
    safeAlternatives: (m.safeAlternatives ?? []).join(", "),
    fakeIndicators: (m.fakeIndicators ?? []).join(", "),
  };
}

function csv(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function MedicinesContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<MedicineForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMedicines = () => {
    axios.get("/api/proxy/medicines?limit=200")
      .then((r) => setMedicines(r.data?.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMedicines();
    const prefill = searchParams.get("prefill");
    if (prefill) openAdd(prefill);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return medicines;
    return medicines.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.genericName ?? "").toLowerCase().includes(q)
    );
  }, [search, medicines]);

  const openAdd = (prefillName?: string) => {
    setEditing(null);
    setForm({ ...emptyForm, name: prefillName ?? "" });
    setModalOpen(true);
  };

  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm(toForm(m));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t.admin.medNameRequired); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), genericName: form.genericName.trim(),
      manufacturer: form.manufacturer.trim(),
      price: form.price ? Number(form.price) : 0,
      requiresPrescription: form.requiresPrescription,
      uses: csv(form.uses), sideEffects: csv(form.sideEffects),
      safeAlternatives: csv(form.safeAlternatives),
      fakeIndicators: csv(form.fakeIndicators),
    };
    try {
      if (editing) {
        const r = await axios.patch(`/api/proxy/medicines/${editing._id}`, payload);
        setMedicines((prev) => prev.map((m) => (m._id === editing._id ? r.data : m)));
        toast.success(t.admin.medUpdated);
      } else {
        const r = await axios.post("/api/proxy/medicines", payload);
        setMedicines((prev) => [r.data, ...prev]);
        toast.success(t.admin.medAdded);
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t.admin.medSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/proxy/medicines/${deleteTarget._id}`);
      setMedicines((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      toast.success(t.admin.medDeleted);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t.admin.medDeleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] transition-smooth";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
          {t.admin.medicineDb}
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.admin.searchMedicines}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm w-52"
            />
          </div>
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 transition-smooth"
          >
            <Plus className="size-4" /> {t.admin.medAdd}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--muted-foreground)]">{t.admin.noMedicines}</div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[t.admin.colName, t.admin.colGeneric, t.admin.colManufacturer, t.admin.colPrice, "Rx", t.admin.colActions].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((med) => (
                <tr key={med._id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/30 transition-smooth">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{med.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{med.genericName || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{med.manufacturer || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] tabular-nums">৳{med.price ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{med.requiresPrescription ? t.compare.yes : t.compare.no}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(med)} className="p-1.5 rounded-lg hover:bg-[var(--card)] text-[var(--muted-foreground)] transition-smooth">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(med)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-smooth" title={t.admin.deleteBtn}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <div className="glass-card rounded-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X className="size-4" />
                </button>
                <h2 className="font-semibold text-[var(--foreground)] mb-5">
                  {editing ? t.admin.medEdit : t.admin.medAdd}
                </h2>
                <div className="space-y-3">
                  <Field label={`${t.admin.colName} *`}>
                    <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.admin.colGeneric}>
                      <input value={form.genericName} onChange={(e) => setForm((f) => ({ ...f, genericName: e.target.value }))} className={inputCls} />
                    </Field>
                    <Field label={t.admin.colManufacturer}>
                      <input value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} className={inputCls} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.admin.colPrice}>
                      <input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={inputCls} />
                    </Field>
                    <Field label={t.admin.medFieldRequiresRx}>
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm((f) => ({ ...f, requiresPrescription: e.target.checked }))} className="rounded" />
                        <span className="text-sm text-[var(--foreground)]">{t.compare.yes}</span>
                      </label>
                    </Field>
                  </div>
                  <Field label={t.admin.medFieldUses}>
                    <textarea rows={2} value={form.uses} onChange={(e) => setForm((f) => ({ ...f, uses: e.target.value }))} className={inputCls + " resize-none"} />
                  </Field>
                  <Field label={t.admin.medFieldSideEffects}>
                    <textarea rows={2} value={form.sideEffects} onChange={(e) => setForm((f) => ({ ...f, sideEffects: e.target.value }))} className={inputCls + " resize-none"} />
                  </Field>
                  <Field label={t.admin.medFieldAlternatives}>
                    <input value={form.safeAlternatives} onChange={(e) => setForm((f) => ({ ...f, safeAlternatives: e.target.value }))} className={inputCls} />
                  </Field>
                  <Field label={t.admin.medFieldFakeIndicators}>
                    <textarea rows={2} value={form.fakeIndicators} onChange={(e) => setForm((f) => ({ ...f, fakeIndicators: e.target.value }))} className={inputCls + " resize-none"} />
                  </Field>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 transition-smooth disabled:opacity-40 mt-2"
                  >
                    {saving ? t.admin.medSaving : editing ? t.admin.medSaveChanges : t.admin.medAdd}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
        title={t.admin.deleteMedicineTitle}
        description={t.admin.deleteMedicineBody}
        itemName={deleteTarget?.name}
        cannotUndoText={t.admin.cannotBeUndone}
        confirmLabel={t.admin.deleteBtn}
        cancelLabel={t.admin.cancel}
        loading={deleting}
      />
    </div>
  );
}

export default function AdminMedicinesPage() {
  return (
    <Suspense>
      <MedicinesContent />
    </Suspense>
  );
}
