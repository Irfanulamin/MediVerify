"use client";

import { type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: ReactNode;
  /** Highlighted in bold inside the body (e.g. the medicine being deleted). */
  itemName?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "danger" | "default";
  /** Shown in red below the body for destructive actions. */
  cannotUndoText?: string;
  loading?: boolean;
}

/**
 * Confirmation dialog. For destructive actions pass variant="danger" to get a
 * red warning icon, a red "cannot be undone" line, and a red confirm button.
 * All copy is passed in as props so it stays language-agnostic (EN/BN).
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  itemName,
  confirmLabel,
  cancelLabel,
  variant = "default",
  cannotUndoText,
  loading = false,
}: ConfirmDialogProps) {
  const danger = variant === "danger";

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onCancel}
      maxWidth={440}
      hideClose
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={loading} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        {danger && (
          <span className="grid size-12 place-items-center rounded-full bg-red-50">
            <AlertTriangle className="size-6 text-[var(--danger)]" strokeWidth={2} />
          </span>
        )}
        <h2 className="text-[18px] font-medium text-[var(--foreground)]">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {description}
            {itemName && <span className="font-semibold text-[var(--foreground)]"> {itemName}</span>}
          </p>
        )}
        {danger && cannotUndoText && (
          <p className="text-xs font-medium text-[var(--danger)]">{cannotUndoText}</p>
        )}
      </div>
    </Modal>
  );
}
