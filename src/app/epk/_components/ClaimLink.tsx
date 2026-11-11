"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow } from "./Poster";

/** "Search your artist name → Get my EPK": straight into sign-up with the name carried over. */
export default function ClaimLink({ tone = "light", id = "hero-search" }: { tone?: "light" | "dark"; id?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(name.trim() ? `/sign-up?name=${encodeURIComponent(name.trim())}` : "/sign-up");
  };

  const dark = tone === "dark";

  return (
    <form onSubmit={go} className="flex w-full max-w-[560px] flex-col gap-2 sm:flex-row sm:gap-0">
      <label htmlFor={id} className="sr-only">
        Your artist name
      </label>
      <div
        className={[
          "flex min-h-[56px] flex-1 items-center gap-3 border-2 px-4",
          dark ? "border-[#F4F4F4] bg-[#F4F4F4]" : "border-[#101010] bg-white",
        ].join(" ")}
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id={id}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search your artist name"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[17px] text-[#101010] outline-none placeholder:text-[#6B6B6B]"
        />
      </div>
      <button type="submit" className="group flex min-h-[56px] items-stretch">
        <span className="grid w-14 place-items-center bg-[#101010] sm:border-y-2 sm:border-[#101010]">
          <Arrow />
        </span>
        <span className="el flex flex-1 items-center justify-center bg-[#0038FF] px-6 text-[14px] text-white group-hover:underline">
          Get my EPK
        </span>
      </button>
    </form>
  );
}
