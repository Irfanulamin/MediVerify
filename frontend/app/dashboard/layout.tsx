"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, LogOut, Home, Zap, AlertTriangle, Menu, History, Bookmark, GitCompare, User } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, toggle } = useLanguage();
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    axios.get("/api/auth/me").then((res) => {
      setUserName(res.data.email?.split("@")[0] ?? "");
    }).catch(() => {
      router.replace("/login");
    });
  }, [router]);

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: lang === "bn" ? "যাচাই" : "Verify", icon: ShieldCheck },
    { href: "/dashboard/interactions", label: lang === "bn" ? "মিথস্ক্রিয়া" : "Interactions", icon: Zap },
    { href: "/dashboard/alerts", label: lang === "bn" ? "সতর্কতা" : "Alerts", icon: AlertTriangle },
    { href: "/dashboard/history", label: lang === "bn" ? "ইতিহাস" : "History", icon: History },
    { href: "/dashboard/saved", label: lang === "bn" ? "সংরক্ষিত" : "Saved", icon: Bookmark },
    { href: "/dashboard/compare", label: lang === "bn" ? "তুলনা" : "Compare", icon: GitCompare },
    { href: "/dashboard/profile", label: lang === "bn" ? "প্রোফাইল" : "Profile", icon: User },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[var(--border)]">
        <span className="size-7 rounded-lg bg-[var(--foreground)] grid place-items-center flex-shrink-0">
          <ShieldCheck className="size-3.5 text-[var(--background)]" strokeWidth={2.5} />
        </span>
        <span className="font-semibold text-sm text-[var(--foreground)]">MediVerify</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t border-[var(--border)] pt-3">
        {userName && (
          <p className="px-3 py-1 text-xs text-[var(--muted-foreground)] truncate">
            {userName}
          </p>
        )}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-smooth"
        >
          <span className="text-xs font-mono">{lang === "en" ? "EN" : "বাং"}</span>
          {lang === "en" ? "বাংলা" : "English"}
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-smooth"
        >
          <Home className="size-4" strokeWidth={1.8} />
          {lang === "bn" ? "হোম" : "Home"}
        </Link>
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-[var(--border)] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5">
            <Menu className="size-5 text-[var(--foreground)]" />
          </button>
          <span className="font-semibold text-sm">MediVerify</span>
          <button onClick={handleLogout} className="p-1.5">
            <LogOut className="size-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
