"use client";

import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Optional call-to-action (e.g. a button). */
  action?: ReactNode;
  className?: string;
}

/**
 * Centered empty state for tables and lists — large light-purple icon, title,
 * helpful subtitle, and an optional action. Never leave a list area blank.
 */
export function EmptyState({ icon: Icon, title, subtitle, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}>
      <span className="grid size-16 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] mb-4">
        <Icon className="size-7 text-[var(--accent)]" strokeWidth={1.6} />
      </span>
      <p className="text-[18px] font-medium text-[var(--foreground)]">{title}</p>
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)] max-w-sm">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
