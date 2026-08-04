"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface BankOption {
  code: string;
  name: string;
}


export default function BankSelect({
  banks,
  value,
  onChange,
  isLoading = false,
  label = "Bank",
}: {
  banks: BankOption[];
  value: string;
  onChange: (code: string) => void;
  isLoading?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = banks.find((b) => b.code === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    const starts: BankOption[] = [];
    const contains: BankOption[] = [];

    for (const b of banks) {
      const name = b.name.toLowerCase();
      if (name.startsWith(q)) starts.push(b);
      else if (name.includes(q)) contains.push(b);
    }

    return [...starts, ...contains];
  }, [banks, query]);


  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.children[highlighted]?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  const choose = (bank: BankOption) => {
    onChange(bank.code);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setHighlighted((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && matches[highlighted]) choose(matches[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="block font-body text-white/40 text-[11px] mb-1.5">{label}</label>

      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls="bank-options"
        aria-autocomplete="list"
        value={open ? query : selected?.name ?? ""}
        placeholder={isLoading ? "Loading banks..." : "Search for your bank"}
        disabled={isLoading}
        onFocus={() => { setOpen(true); setHighlighted(0); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
        onKeyDown={onKeyDown}
        className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 pr-9 font-body text-white text-sm placeholder:text-white/20 outline-none focus:border-[#C30100] transition-colors disabled:opacity-50"
      />

      <span className="pointer-events-none absolute right-3 top-[34px] text-white/30">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {open && !isLoading && (
        <ul
          ref={listRef}
          id="bank-options"
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#1A0808] shadow-xl"
        >
          {matches.length === 0 && (
            <li className="px-4 py-3 font-body text-white/35 text-xs">
              No bank matches “{query}”.
            </li>
          )}

          {matches.map((bank, i) => (
            <li
              key={bank.code}
              role="option"
              aria-selected={bank.code === value}
              onMouseDown={(e) => { e.preventDefault(); choose(bank); }}
              onMouseEnter={() => setHighlighted(i)}
              className={[
                "px-4 py-2.5 font-body text-sm cursor-pointer transition-colors",
                i === highlighted ? "bg-[#C30100]/15 text-white" : "text-white/70",
                bank.code === value ? "font-medium" : "",
              ].join(" ")}
            >
              {bank.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
