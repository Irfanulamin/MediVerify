"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, AlertTriangle, Users,
  Database, Menu, Inbox, Bell, LogOut, Search, Settings, Plus,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";
import { LogoutConfirmModal } from "@/app/components/dashboard/LogoutConfirmModal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, toggle } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [pendingAlerts, setPendingAlerts] = useState(0);

  useEffect(() => {
    axios.get("/api/auth/me").then((res) => {
      if (res.data.role !== "admin") { router.replace("/dashboard"); return; }
      setAdminName(res.data.email?.split("@")[0] ?? "Admin");
      setChecked(true);
    }).catch(() => { router.replace("/login"); });
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    axios.get("/api/proxy/admin/stats")
      .then((res) => setPendingAlerts(res.data?.pendingAlerts ?? 0))
      .catch(() => {});
  }, [checked, pathname]);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
  };

  const navItems = [
    { href: "/admin", label: t.admin.overview, icon: LayoutDashboard },
    { href: "/admin/alerts", label: t.admin.alertsMgmt, icon: AlertTriangle },
    { href: "/admin/users", label: t.admin.users, icon: Users },
    { href: "/admin/medicines", label: t.admin.medicineDb, icon: Database },
    { href: "/admin/reports", label: t.admin.reports, icon: Inbox },
  ];

  const initials = adminName.slice(0, 2).toUpperCase();

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="size-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 px-4 py-5 border-b border-[var(--border)]">
        <Image src="/logo.png" alt="MediVerify" width={28} height={28} className="flex-shrink-0" />
          <p className="font-semibold text-sm text-[var(--foreground)] block">MediVerify</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth ${
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium shadow-soft"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/10"
              }`}
            >
              <Icon className="size-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.8} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-[var(--border)] pt-3 space-y-1">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/10 transition-smooth"
        >
          <span className="text-xs font-mono">{lang === "en" ? "EN" : "বাং"}</span>
          {lang === "en" ? t.dashboard.langBengali : t.dashboard.langEnglish}
        </button>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 transition-smooth"
        >
          <LogOut className="size-4" strokeWidth={1.8} />
          {t.dashboard.logout}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-mesh">
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 border-r border-[var(--border)] sticky top-0 h-screen bg-white/90 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 w-60 border-r border-[var(--border)] z-50 md:hidden bg-white/95 backdrop-blur-xl"
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 md:px-8 py-3 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 md:hidden">
            <Menu className="size-5 text-[var(--foreground)]" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-xl hover:bg-[var(--card)] transition-smooth">
              <Bell className="size-4 text-[var(--muted-foreground)]" />
              {pendingAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center">
                  {pendingAlerts > 9 ? "9+" : pendingAlerts}
                </span>
              )}
            </button>
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              <span className="size-7 rounded-full bg-[var(--accent)] text-white grid place-items-center text-[10px] font-bold">
                {initials}
              </span>
              <span className="text-sm text-[var(--foreground)] font-medium">{adminName}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
