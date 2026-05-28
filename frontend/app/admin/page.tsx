"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, AlertTriangle, Database, Download, PlusCircle } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalUsers: number;
  verificationsToday: number;
  pendingAlerts: number;
  totalMedicines: number;
}
interface VerificationDetail {
  date: string; label: string; verified: number; suspicious: number;
}
interface MedicineCount { name: string; count: number; }
interface AlertType { type: string; count: number; }
interface ActivityItem { type: string; description: string; createdAt: string; }

const PIE_COLORS = ["#6d28d9", "#ef4444", "#14b8a6", "#f59e0b", "#3b82f6"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[var(--border)] rounded-xl px-3 py-2 text-sm shadow-soft">
      {label && <p className="text-[var(--muted-foreground)] text-[11px] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name ? `${p.name}: ` : ""}{p.value}
        </p>
      ))}
    </div>
  );
}

function TrendBadge({ text, variant }: { text: string; variant: "green" | "red" | "muted" }) {
  const cls = variant === "green"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : variant === "red"
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)]";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [verificationDetail, setVerificationDetail] = useState<VerificationDetail[]>([]);
  const [topMedicines, setTopMedicines] = useState<MedicineCount[]>([]);
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, detailRes, topRes, alertTypesRes, activityRes] = await Promise.allSettled([
        axios.get("/api/proxy/admin/stats"),
        axios.get("/api/proxy/admin/analytics/verifications-detail"),
        axios.get("/api/proxy/admin/analytics/top-medicines"),
        axios.get("/api/proxy/admin/analytics/alert-types"),
        axios.get("/api/proxy/admin/activity/recent"),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (detailRes.status === "fulfilled") setVerificationDetail(detailRes.value.data);
      if (topRes.status === "fulfilled") setTopMedicines(topRes.value.data);
      if (alertTypesRes.status === "fulfilled") setAlertTypes(alertTypesRes.value.data);
      if (activityRes.status === "fulfilled") setActivity(activityRes.value.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Donut center percentage
  const totalAlertCount = alertTypes.reduce((s, a) => s + a.count, 0);
  const resolvedPct = totalAlertCount > 0 && stats
    ? Math.max(0, Math.min(100, Math.round(((totalAlertCount - stats.pendingAlerts) / totalAlertCount) * 100)))
    : 0;

  // Top medicines bar widths
  const maxMedCount = topMedicines[0]?.count ?? 1;
  const totalMedSearches = topMedicines.reduce((s, m) => s + m.count, 0);
  const col1 = topMedicines.slice(0, 5);
  const col2 = topMedicines.slice(5, 10);

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.admin.justNow;
    if (mins < 60) return `${mins} ${t.admin.minutesAgo}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t.admin.hoursAgo}`;
    return `${Math.floor(hrs / 24)} ${t.admin.daysAgo}`;
  }

  const cards = [
    {
      label: t.admin.totalUsers,
      value: stats?.totalUsers ?? 0,
      icon: Users,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-l-blue-500",
      badge: <TrendBadge text={t.admin.trendUp5} variant="green" />,
    },
    {
      label: t.admin.verificationsToday,
      value: stats?.verificationsToday ?? 0,
      icon: ShieldCheck,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      border: "border-l-emerald-500",
      badge: <TrendBadge text={(stats?.verificationsToday ?? 0) > 0 ? t.admin.trendStrong : t.admin.trendZero} variant={(stats?.verificationsToday ?? 0) > 0 ? "green" : "muted"} />,
    },
    {
      label: t.admin.pendingAlerts,
      value: stats?.pendingAlerts ?? 0,
      icon: AlertTriangle,
      bg: "bg-red-50",
      iconColor: "text-red-600",
      border: "border-l-red-500",
      badge: <TrendBadge text={(stats?.pendingAlerts ?? 0) > 0 ? t.admin.trendCritical : t.admin.trendNormal} variant={(stats?.pendingAlerts ?? 0) > 0 ? "red" : "green"} />,
    },
    {
      label: t.admin.totalMedicines,
      value: stats?.totalMedicines ?? 0,
      icon: Database,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      border: "border-l-violet-500",
      badge: <TrendBadge text={t.admin.trendUp3} variant="green" />,
    },
  ];

  return (
    <div className="space-y-7">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-600">{t.admin.live}</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
            {t.admin.analyticsDashboard}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--card)] transition-smooth">
            <Download className="size-4" />
            {t.admin.downloadReport}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-smooth">
            <PlusCircle className="size-4" />
            {t.admin.addNewData}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, bg, iconColor, border, badge }, i) => (
          <motion.div
            key={label}
            className={`rounded-2xl bg-white border border-[var(--border)] border-l-[3px] ${border} p-5 shadow-soft flex flex-col gap-2`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top row: icon + badge */}
            <div className="flex items-start justify-between">
              <div className={`size-10 rounded-xl ${bg} ${iconColor} grid place-items-center`}>
                <Icon className="size-5" strokeWidth={2} />
              </div>
              {badge}
            </div>
            {/* Label */}
            <p className="text-xs text-[var(--muted-foreground)] font-medium">{label}</p>
            {/* Number */}
            {loading ? (
              <div className="h-10 w-16 bg-[var(--card)] rounded-lg animate-pulse" />
            ) : (
              <p className="text-4xl font-bold text-[var(--foreground)] tabular-nums leading-none">
                {value.toLocaleString()}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: dual-line area chart */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-[var(--border)] p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[var(--foreground)]">{t.admin.verificationsLast7}</p>
            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--accent)] inline-block" />
                {t.admin.seriesSuccess}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-teal-500 inline-block" style={{ background: "repeating-linear-gradient(90deg,#14b8a6 0 4px,transparent 4px 8px)" }} />
                {t.admin.seriesFailed}
              </span>
            </div>
          </div>
          <div className="h-52">
            {verificationDetail.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-[var(--muted-foreground)]">{t.admin.noData}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={verificationDetail} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="verifiedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6d28d9" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="verified" name={t.admin.seriesSuccess} stroke="#6d28d9" strokeWidth={2.5} fill="url(#verifiedGrad)" dot={false} activeDot={{ r: 4, fill: "#6d28d9", strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="suspicious" name={t.admin.seriesFailed} stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 3" fill="none" dot={false} activeDot={{ r: 4, fill: "#14b8a6", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: donut chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-[var(--border)] p-5 shadow-soft">
          <p className="font-semibold text-[var(--foreground)] mb-4">{t.admin.alertAnalysis}</p>
          {alertTypes.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--muted-foreground)]">{t.admin.noAlerts}</div>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={alertTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={52} outerRadius={72} strokeWidth={0}>
                      {alertTypes.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-[var(--foreground)] tabular-nums">{resolvedPct}%</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{t.admin.totalResolved}</span>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {alertTypes.map((item, i) => {
                  const pct = totalAlertCount > 0 ? Math.round((item.count / totalAlertCount) * 100) : 0;
                  return (
                    <li key={i} className="flex items-center gap-2 text-xs">
                      <span className="size-2 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[var(--muted-foreground)] flex-1 truncate">{item.type}</span>
                      <span className="font-semibold text-[var(--foreground)] tabular-nums">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Top 10 medicines */}
      <div className="rounded-2xl bg-white border border-[var(--border)] p-5 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <p className="font-semibold text-[var(--foreground)]">{t.admin.topSearchedMedicines}</p>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            {t.admin.thisMonth}
          </span>
        </div>
        {topMedicines.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">{t.admin.noData}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {[col1, col2].map((col, ci) => (
              <div key={ci} className="space-y-3">
                {col.map((med) => {
                  const barWidth = Math.round((med.count / maxMedCount) * 100);
                  const pct = totalMedSearches > 0 ? Math.round((med.count / totalMedSearches) * 100) : 0;
                  return (
                    <div key={med.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate text-[var(--foreground)] font-medium pr-2">{med.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0 tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--card)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      {activity.length > 0 && (
        <div className="rounded-2xl bg-white border border-[var(--border)] p-5 shadow-soft">
          <p className="font-semibold text-[var(--foreground)] mb-4">{t.admin.recentActivity}</p>
          <ul className="space-y-0">
            {activity.slice(0, 8).map((item, i) => {
              const isVerification = item.type === "verification";
              return (
                <li key={i} className="flex gap-3 relative pb-4 last:pb-0">
                  {i < Math.min(activity.length, 8) - 1 && (
                    <span className="absolute left-[9px] top-5 bottom-0 w-px bg-[var(--border)]" />
                  )}
                  <span className={`relative z-10 mt-0.5 size-[18px] rounded-full border-2 border-white flex-shrink-0 ${isVerification ? "bg-emerald-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-[var(--foreground)] truncate">{item.description}</p>
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] flex-shrink-0 pt-0.5">{relativeTime(item.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
