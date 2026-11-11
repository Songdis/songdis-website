"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EPK_DOMAIN } from "@/lib/epk";

/** "getepk.si/[yourname]" — type a name, go straight to sign-up with it filled in. */
export default function ClaimLink({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(name.trim() ? `/sign-up?name=${encodeURIComponent(name.trim())}` : "/sign-up");
  };

  const dark = tone === "dark";

  return (
    <form
      onSubmit={go}
      className={[
        "flex w-full max-w-[520px] items-center rounded-full p-1.5 pl-5 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(255,90,31,.35)]",
        dark ? "bg-white/[0.07] ring-1 ring-white/15" : "bg-white ring-1 ring-black/10",
      ].join(" ")}
    >
      <label htmlFor="claim" className={`shrink-0 text-[15px] ${dark ? "text-white/45" : "text-black/40"}`}>
        {EPK_DOMAIN}/
      </label>
      <input
        id="claim"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="yourname"
        autoComplete="off"
        spellCheck={false}
        className={`min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none ${dark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"}`}
        aria-describedby="claim-hint"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-[#FF5A1F] px-5 py-3 text-[14px] font-semibold text-black transition hover:brightness-105 active:scale-[.98]"
      >
        {slug ? "Claim it" : "Make yours"}
      </button>
      <span id="claim-hint" className="sr-only">
        Your press kit address. Free.
      </span>
    </form>
  );
}
