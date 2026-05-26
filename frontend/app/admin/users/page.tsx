"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mv_token");
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)] mb-8">
        {t.admin.users}
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                {[t.admin.colName, t.admin.colEmail, t.admin.colRole, t.admin.colJoined].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <motion.tr
                  key={user._id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-smooth"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{user.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user.role === "admin"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-[var(--card)] text-[var(--muted-foreground)]"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
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
