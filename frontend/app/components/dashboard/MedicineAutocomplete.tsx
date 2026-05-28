"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import axios from "axios";

interface Suggestion {
  name: string;
  manufacturer?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick?: (name: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function MedicineAutocomplete({ value, onChange, onPick, placeholder, label, required }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    if (lockRef.current) {
      lockRef.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/proxy/medicines/search`, { params: { q } });
        const raw = res.data;
        const list: Suggestion[] = Array.isArray(raw)
          ? raw
              .slice(0, 5)
              .map((item: unknown) =>
                typeof item === "string"
                  ? { name: item }
                  : { name: (item as Suggestion).name, manufacturer: (item as Suggestion).manufacturer }
              )
              .filter((s) => s.name)
          : [];
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  const pick = (name: string) => {
    lockRef.current = true;
    onChange(name);
    setOpen(false);
    setSuggestions([]);
    onPick?.(name);
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)] pointer-events-none" />
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
        />
        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-soft overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s.name)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--card)] transition-smooth flex flex-col gap-0.5"
              >
                <span className="text-[var(--foreground)]">{s.name}</span>
                {s.manufacturer && (
                  <span className="text-xs text-[var(--muted-foreground)]">{s.manufacturer}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
