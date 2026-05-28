"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<UnverifiedReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const r = await axios.get("/api/proxy/unverified-reports");
      setReports(r.data);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const markReviewed = async (id: string) => {
    try {
      await axios.patch(`/api/proxy/unverified-reports/${id}`, {});
      setReports((prev) => prev.filter((r) => r._id !== id));
      toast.success("Marked as reviewed");
    } catch {
      toast.error("Failed to update");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
          Unverified Reports
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          User-submitted medicines awaiting review. Verify off-platform, then mark reviewed to clear from the queue.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] p-10 text-center">
          <p className="text-[var(--muted-foreground)] text-sm">
            No pending reports. Nice work clearing the queue.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                {["Medicine", "Manufacturer", "Where bought", "Notes", "Reported by", "Submitted", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((report, i) => (
                <motion.tr
                  key={report._id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-smooth align-top"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="px-4 py-3 font-medium text-[var(--foreground)] whitespace-nowrap">
                    {report.medicineName}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{report.manufacturer || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{report.purchaseLocation || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-xs">
                    {report.notes ? (
                      <span className="line-clamp-3">{report.notes}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs whitespace-nowrap">
                    {report.reportedBy || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => markReviewed(report._id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-smooth whitespace-nowrap"
                    >
                      <CheckCircle2 className="size-3" />
                      Mark Reviewed
                    </button>
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
