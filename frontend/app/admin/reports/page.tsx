"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plus, DatabaseZap } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UnverifiedReport {
  _id: string;
  medicineName: string;
  manufacturer?: string;
  purchaseLocation?: string;
  notes?: string;
  reportedBy?: string;
  status: "pending" | "reviewed";
  createdAt: string;
}

interface UnfoundMedicine {
  name: string;
  count: number;
  lastSearched: string;
}

type Tab = "unfound" | "reports";

export default function AdminReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("unfound");

  const [reports, setReports] = useState<UnverifiedReport[]>([]);
  const [unfound, setUnfound] = useState<UnfoundMedicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      axios.get("/api/proxy/admin/analytics/unfound-medicines"),
      axios.get("/api/proxy/unverified-reports"),
    ]).then(([unfoundRes, reportsRes]) => {
      if (unfoundRes.status === "fulfilled") setUnfound(unfoundRes.value.data);
      if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  const markReviewed = async (id: string) => {
    await axios.patch(`/api/proxy/unverified-reports/${id}`, {});
    setReports((prev) => prev.filter((r) => r._id !== id));
    toast.success("Marked as reviewed");
  };

  const goAddMedicine = (name: string) => {
    router.push(`/admin/medicines?prefill=${encodeURIComponent(name)}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">Reports</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Unfound medicine searches and user-submitted reports</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          {(["unfound", "reports"] as Tab[]).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-smooth ${
                tab === tb
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tb === "unfound" ? `Not in DB (${unfound.length})` : `User Reports (${reports.length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />)}</div>
      ) : tab === "unfound" ? (
        unfound.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--muted-foreground)]">
            No unfound medicine searches yet.
          </div>
        ) : (
          <div className="glass-card overflow-x-auto rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Medicine Name", "Search Count", "Last Searched", "Action"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unfound.map((item) => (
                  <tr key={item.name} className="border-b border-[var(--border)] last:border-0 hover:bg-white/30 transition-smooth">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.name}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--muted-foreground)]">{item.count}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap text-xs">
                      {new Date(item.lastSearched).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => goAddMedicine(item.name)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-smooth whitespace-nowrap"
                      >
                        <Plus className="size-3" /> Add to Database
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        reports.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--muted-foreground)]">
            No pending reports.
          </div>
        ) : (
          <div className="glass-card overflow-x-auto rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Medicine", "Manufacturer", "Where Bought", "Notes", "Reported By", "Date", "Actions"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/30 transition-smooth align-top">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)] whitespace-nowrap">{report.medicineName}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{report.manufacturer || "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{report.purchaseLocation || "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-xs">
                      <span className="line-clamp-2">{report.notes || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs whitespace-nowrap">{report.reportedBy || "—"}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => goAddMedicine(report.medicineName)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-smooth whitespace-nowrap"
                        >
                          <DatabaseZap className="size-3" /> Add to DB
                        </button>
                        <button
                          onClick={() => markReviewed(report._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-smooth whitespace-nowrap"
                        >
                          <CheckCircle2 className="size-3" /> Reviewed
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
