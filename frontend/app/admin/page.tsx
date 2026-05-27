"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, AlertTriangle, Database } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";

interface Stats {
  totalUsers: number;
  verificationsToday: number;
  totalAlerts: number;
  totalMedicines: number;
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/proxy/admin/stats")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: t.admin.totalUsers, value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: t.admin.verificationsToday, value: stats?.verificationsToday ?? 0, icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
    { label: t.admin.totalAlerts, value: stats?.totalAlerts ?? 0, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
    { label: t.admin.totalMedicines, value: stats?.totalMedicines ?? 0, icon: Database, color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)] mb-8">
        {t.admin.overview}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            className="glass-card rounded-2xl p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <div className={`size-10 rounded-xl ${color} grid place-items-center mb-3`}>
              <Icon className="size-5" strokeWidth={2} />
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-[var(--card)] rounded animate-pulse mb-1" />
            ) : (
              <p className="text-3xl font-bold text-[var(--foreground)] mb-1 tabular-nums">
                {value.toLocaleString()}
              </p>
            )}
            <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
