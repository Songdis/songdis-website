"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Globe, Loader2 } from "lucide-react";
import { request } from "@/lib/api/core";

interface DomainState {
  domain: { hostname: string; status: "pending" | "active"; ssl_status: string | null; error: string | null; url: string } | null;
  record: { type: string; name: string; target: string };
  available: boolean;
}

/**
 * Connect the artist's own domain: they add one CNAME (www → domains.getepk.si) and forward
 * the bare domain to www at their registrar. Status is checked on demand and every ten
 * minutes on the server.
 */
export function DomainPanel({ artistId }: { artistId: number }) {
  const [state, setState] = useState<DomainState | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"add" | "check" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const base = `/epk/artists/${artistId}/domain`;

  useEffect(() => {
    let live = true;
    request<DomainState>(base, { method: "GET" }, true).then((res) => {
      if (live && res.data) setState(res.data);
    });
    return () => {
      live = false;
    };
  }, [base]);

  const run = async (kind: "add" | "check" | "remove") => {
    setBusy(kind);
    setError(null);
    const res = await request<DomainState>(
      kind === "check" ? `${base}/check` : base,
      kind === "add"
        ? { method: "POST", body: JSON.stringify({ hostname: input }) }
        : { method: kind === "remove" ? "DELETE" : "POST" },
      true
    );
    setBusy(null);
    if (res.error) setError(res.error);
    else if (res.data) setState(res.data);
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (!state || !state.available) return null;
  const d = state.domain;
  const bare = d ? d.hostname.replace(/^www\./, "") : null;

  return (
    <section className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-[#FF5A1F]" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold">Your own domain</h2>
          <p className="mt-1 text-[14px] text-white/55">
            Put this press kit on a domain you own, like yourname.com.
          </p>

          {!d ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) void run("add");
              }}
              className="mt-4 flex flex-wrap gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="yourname.com"
                autoComplete="off"
                spellCheck={false}
                className="min-w-[200px] flex-1 rounded-xl bg-black/30 px-4 py-2.5 text-[15px] outline-none ring-1 ring-white/15 focus:ring-[#FF5A1F]"
              />
              <button
                type="submit"
                disabled={busy !== null || !input.trim()}
                className="rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-black disabled:opacity-50"
              >
                {busy === "add" ? "Connecting…" : "Connect"}
              </button>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="flex flex-wrap items-center gap-2 text-[15px]">
                <span className="font-semibold">{d.hostname}</span>
                {d.status === "active" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1ED760]/15 px-2.5 py-0.5 text-[12.5px] text-[#1ED760]">
                    <Check className="h-3.5 w-3.5" /> Live
                  </span>
                ) : (
                  <span className="rounded-full bg-[#FF5A1F]/15 px-2.5 py-0.5 text-[12.5px] text-[#FF8A5C]">
                    Waiting for DNS
                  </span>
                )}
              </p>

              {d.status === "active" ? (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[14px] text-white/70 underline underline-offset-4">
                  Open {d.hostname}
                </a>
              ) : (
                <ol className="space-y-3 text-[14px] text-white/70">
                  <li>
                    <span className="text-white">1.</span> Where you bought the domain, add this DNS record:
                    <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-black/30 p-3 font-mono text-[13px]">
                      <span className="text-white/40">Type</span>
                      <span>{state.record.type}</span>
                      <span className="text-white/40">Name</span>
                      <button type="button" onClick={() => copy(state.record.name)} className="flex items-center gap-1.5 text-left">
                        {state.record.name} {copied === state.record.name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-white/40" />}
                      </button>
                      <span className="text-white/40">Value</span>
                      <button type="button" onClick={() => copy(state.record.target)} className="flex items-center gap-1.5 text-left">
                        {state.record.target} {copied === state.record.target ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-white/40" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    <span className="text-white">2.</span> Set up &ldquo;URL forwarding&rdquo; (sometimes called redirect) from{" "}
                    <span className="text-white">{bare}</span> to <span className="text-white">https://{d.hostname}</span>, so the
                    address without www works too.
                  </li>
                  <li>
                    <span className="text-white">3.</span> It usually goes live within an hour; we check every ten minutes.
                    {d.error && <span className="mt-1 block text-[13px] text-[#FF8A5C]">Last check: {d.error}</span>}
                  </li>
                </ol>
              )}

              <div className="flex flex-wrap items-center gap-4">
                {d.status !== "active" && (
                  <button
                    type="button"
                    onClick={() => void run("check")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13.5px] hover:border-white/35"
                  >
                    {busy === "check" && <Loader2 className="h-4 w-4 animate-spin" />} Check now
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void run("remove")}
                  disabled={busy !== null}
                  className="text-[13.5px] text-white/40 hover:text-[#FF7A5C]"
                >
                  {busy === "remove" ? "Removing…" : "Disconnect"}
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-[13.5px] text-[#FF7A5C]">{error}</p>}
        </div>
      </div>
    </section>
  );
}
