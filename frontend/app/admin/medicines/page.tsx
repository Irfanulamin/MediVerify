"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";

interface Medicine {
  _id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  price: number;
  isVerified: boolean;
}

export default function AdminMedicinesPage() {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filtered, setFiltered] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/medicines?limit=100`)
      .then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setMedicines(data);
        setFiltered(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? medicines.filter(
            (m) =>
              m.name.toLowerCase().includes(q) ||
              m.genericName?.toLowerCase().includes(q)
          )
        : medicines
    );
  }, [search, medicines]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
          {t.admin.medicineDb}
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.admin.searchMedicines}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm w-56"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">No medicines found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                {[t.admin.colName, t.admin.colGeneric, t.admin.colManufacturer, t.admin.colPrice, t.admin.colVerified].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((med, i) => (
                <motion.tr
                  key={med._id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-smooth"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{med.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{med.genericName}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{med.manufacturer}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] tabular-nums">৳{med.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      med.isVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[var(--card)] text-[var(--muted-foreground)]"
                    }`}>
                      {med.isVerified ? "Yes" : "No"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
