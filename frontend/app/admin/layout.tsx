"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, LayoutDashboard, AlertTriangle, Users, Database, LogOut, Menu, Inbox } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    axios.get("/api/auth/me").then((res) => {
      if (res.data.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setChecked(true);
    }).catch(() => {
      router.replace("/login");
    });
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    axios
      .get("/api/proxy/unverified-reports/pending/count")
      .then((res) => setPendingReports(res.data?.count ?? 0))
      .catch(() => setPendingReports(0));
  }, [checked, pathname]);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
  };

  const navItems: { href: string; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { href: "/admin", label: t.admin.overview, icon: LayoutDashboard },
    { href: "/admin/alerts", label: t.admin.alertsMgmt, icon: AlertTriangle },
    { href: "/admin/reports", label: "Reports", icon: Inbox, badge: pendingReports },
    { href: "/admin/users", label: t.admin.users, icon: Users },
    { href: "/admin/medicines", label: t.admin.medicineDb, icon: Database },
  ];

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="size-8 rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)] animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[var(--border)]">
        <span className="size-7 rounded-lg bg-[var(--foreground)] grid place-items-center flex-shrink-0">
          <ShieldCheck className="size-3.5 text-[var(--background)]" strokeWidth={2.5} />
        </span>
        <div>
          <span className="font-semibold text-sm text-[var(--foreground)] block">MediVerify</span>
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest">Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth ${
                active
                  ? "bg-[var(--foreground)] text-[var(--background)] font-medium"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
              }`}
            >
              <Icon className="size-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.8} />
              <span className="flex-1">{label}</span>
              {badge && badge > 0 ? (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-[var(--background)] text-[var(--foreground)]"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 transition-smooth"
        >
          <LogOut className="size-4" strokeWidth={1.8} />
          {t.dashboard.logout}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-[var(--border)] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-56 bg-[var(--background)] border-r border-[var(--border)] z-50 md:hidden"
              initial={{ x: -224 }}
              animate={{ x: 0 }}
              exit={{ x: -224 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5">
            <Menu className="size-5 text-[var(--foreground)]" />
          </button>
          <span className="font-semibold text-sm">Admin</span>
          <button onClick={handleLogout} className="p-1.5">
            <LogOut className="size-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
