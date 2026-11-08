"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTopup,
  getShoutOut,
  getTopup,
  importFans,
  naira,
  previewShoutOut,
  quoteShoutOut,
  sendShoutOut,
  type ShoutOutOverview,
  type ShoutOutQuote,
  type ShoutOutTopup,
} from "@/lib/api/shout-out";

const card = "rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 sm:p-6";
const label = "font-body text-white/50 text-xs mb-1.5 block";
const input =
  "w-full rounded-xl border border-white/[0.1] bg-[#0E0808] px-4 py-3 font-body text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#C30100]/60";
const primaryBtn =
  "font-heading text-white uppercase text-[11px] tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80000] disabled:opacity-40 disabled:cursor-not-allowed px-6 min-h-[44px] transition-colors";
const ghostBtn =
  "font-heading text-white uppercase text-[11px] tracking-widest rounded-full border border-white/15 hover:border-white/40 px-5 min-h-[40px] transition-colors";

export function ShoutOutPage() {
  const [data, setData] = useState<ShoutOutOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);

  const apply = useCallback((res: Awaited<ReturnType<typeof getShoutOut>>) => {
    if (res.error || !res.data) {
      setError(res.error ?? "Could not load Shout Out.");
      return;
    }
    setError(null);
    setData(res.data);
  }, []);

  const load = useCallback(() => {
    getShoutOut().then(apply);
  }, [apply]);

  useEffect(() => {
    let alive = true;
    getShoutOut().then((res) => alive && apply(res));
    return () => {
      alive = false;
    };
  }, [apply]);

  if (error && !data) {
    return <p className="font-body text-white/60 text-sm">{error}</p>;
  }

  if (!data) {
    return <div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" />;
  }

  const emailsLeft = Math.floor(data.balance_kobo / data.price_kobo);

  return (
    <div className="flex flex-col gap-5">
      <p className="font-body text-white/55 text-sm max-w-2xl">
        Email the fans who pre-saved your music, straight from your artist name. When a release goes live, everyone
        who pre-saved it gets told automatically. Each email costs {naira(data.price_kobo)} from your Shout Out balance.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={card}>
          <p className="font-body text-white/50 text-sm">Shout Out balance</p>
          <p className="font-heading text-white text-3xl mt-2">{naira(data.balance_kobo)}</p>
          <p className="font-body text-white/40 text-xs mt-1">
            Enough for {emailsLeft.toLocaleString()} email{emailsLeft === 1 ? "" : "s"}
          </p>
          <button onClick={() => setTopupOpen(true)} className={`${primaryBtn} mt-4`}>
            Top up
          </button>
        </div>

        <div className={card}>
          <p className="font-body text-white/50 text-sm">Your fans</p>
          <p className="font-heading text-white text-3xl mt-2">{data.fans.total.toLocaleString()}</p>
          <p className="font-body text-white/40 text-xs mt-1">
            From your pre-saves{data.fans.unsubscribed ? ` · ${data.fans.unsubscribed} unsubscribed` : ""}
          </p>
          <ImportFans releases={data.fans.by_release} onDone={load} />
        </div>
      </div>

      <Compose data={data} onSent={load} onTopUp={() => setTopupOpen(true)} />

      <History data={data} />

      {topupOpen && (
        <TopupModal
          minKobo={data.min_topup_kobo}
          onClose={() => setTopupOpen(false)}
          onPaid={load}
        />
      )}
    </div>
  );
}

function Compose({
  data,
  onSent,
  onTopUp,
}: {
  data: ShoutOutOverview;
  onSent: () => void;
  onTopUp: () => void;
}) {
  const [artistId, setArtistId] = useState<number | null>(data.artists[0]?.id ?? null);
  const [releaseId, setReleaseId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [quote, setQuote] = useState<ShoutOutQuote | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<{ from: string; reply_to: string; subject: string; html: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const openPreview = async () => {
    if (!artistId) return;
    setPreviewing(true);
    const res = await previewShoutOut({
      artist_profile_id: artistId,
      subject: subject.trim(),
      body: body.trim(),
      link_url: link.trim() || undefined,
    });
    setPreviewing(false);
    if (res.error || !res.data) {
      setMessage({ ok: false, text: res.errors?.link_url?.[0] ?? res.error ?? "Could not load the preview." });
      return;
    }
    setPreview(res.data);
  };

  useEffect(() => {
    let alive = true;
    quoteShoutOut(releaseId).then((res) => alive && res.data && setQuote(res.data));
    return () => {
      alive = false;
    };
  }, [releaseId, data.balance_kobo, data.fans.total]);

  const ready = !!artistId && subject.trim().length >= 3 && body.trim().length >= 5 && (quote?.recipients ?? 0) > 0;
  const short = (quote?.shortfall_kobo ?? 0) > 0;

  const send = async () => {
    if (!artistId) return;
    setSending(true);
    setMessage(null);
    const res = await sendShoutOut({
      artist_profile_id: artistId,
      subject: subject.trim(),
      body: body.trim(),
      link_url: link.trim() || undefined,
      music_upload_id: releaseId,
    });
    setSending(false);
    setConfirming(false);
    if (res.error) {
      setMessage({ ok: false, text: res.error });
      return;
    }
    setMessage({ ok: true, text: `Sending to ${res.data?.recipients_count ?? quote?.recipients} fans.` });
    setSubject("");
    setBody("");
    setLink("");
    onSent();
  };

  if (data.artists.length === 0) {
    return (
      <div className={card}>
        <p className="font-body text-white/60 text-sm">Create an artist profile first. Emails are sent in your artist name.</p>
      </div>
    );
  }

  return (
    <div className={card}>
      <p className="font-heading text-white uppercase text-sm tracking-wide">Send a Shout Out</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <span className={label}>From</span>
          <select value={artistId ?? ""} onChange={(e) => setArtistId(Number(e.target.value))} className={input}>
            {data.artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.stage_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={label}>To</span>
          <select
            value={releaseId ?? ""}
            onChange={(e) => setReleaseId(e.target.value ? Number(e.target.value) : null)}
            className={input}
          >
            <option value="">All my fans ({data.fans.total.toLocaleString()})</option>
            {data.fans.by_release.map((r) => (
              <option key={r.id} value={r.id}>
                Pre-saved {r.title} ({r.fans.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <span className={label}>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="New single this Friday" className={input} />
      </div>
      <div className="mt-4">
        <span className={label}>Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="Write to your fans like you would on a voice note."
          className={`${input} resize-y`}
        />
      </div>
      <div className="mt-4">
        <span className={label}>Link (optional, shows a Listen now button)</span>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" className={input} />
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="font-body text-white/60 text-sm">
          {quote
            ? quote.recipients === 0
              ? "No fans to email yet."
              : `${quote.recipients.toLocaleString()} fan${quote.recipients === 1 ? "" : "s"} × ${naira(quote.price_kobo)} = ${naira(quote.cost_kobo)}`
            : " "}
        </p>

        {short ? (
          <button onClick={onTopUp} className={primaryBtn}>
            Top up {naira(quote!.shortfall_kobo)} to send
          </button>
        ) : confirming ? (
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className={ghostBtn} disabled={sending}>
              Back
            </button>
            <button onClick={send} className={primaryBtn} disabled={sending}>
              {sending ? "Sending…" : `Send for ${naira(quote?.cost_kobo ?? 0)}`}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={openPreview} className={ghostBtn} disabled={!artistId || previewing}>
              {previewing ? "Loading…" : "Preview"}
            </button>
            <button onClick={() => setConfirming(true)} className={primaryBtn} disabled={!ready}>
              Send
            </button>
          </div>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Email preview"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full sm:max-w-xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#140C0C] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
              <div className="min-w-0 font-body text-xs leading-relaxed">
                <p className="text-white/40">From <span className="text-white/80">{preview.from}</span></p>
                <p className="text-white/40">Replies go to <span className="text-white/80">{preview.reply_to}</span></p>
                <p className="text-white text-sm font-semibold mt-1 truncate">{preview.subject}</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-white/40 hover:text-white text-xl leading-none shrink-0" aria-label="Close preview">
                ×
              </button>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              sandbox=""
              className="w-full flex-1 min-h-[60vh] bg-[#f4f4f5]"
            />
            <p className="font-body text-white/35 text-[11px] px-5 py-3">
              This is exactly what a fan sees. &quot;Ada&quot; is a sample name; each fan sees their own.
            </p>
          </div>
        </div>
      )}

      {message && (
        <p className={`font-body text-sm mt-3 ${message.ok ? "text-[#25D366]" : "text-[#ff6b6b]"}`}>{message.text}</p>
      )}
    </div>
  );
}

function ImportFans({ releases, onDone }: { releases: ShoutOutOverview["fans"]["by_release"]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [releaseId, setReleaseId] = useState<number | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${ghostBtn} mt-4`}>
        Import fans (CSV)
      </button>
    );
  }

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    const res = await importFans(file, releaseId);
    setBusy(false);
    if (res.error) {
      setResult(res.error);
      return;
    }
    setResult(`Added ${res.data?.added ?? 0} fan${res.data?.added === 1 ? "" : "s"}.`);
    onDone();
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="font-body text-white/60 text-xs" />
      <p className="font-body text-white/35 text-[11px]">Needs an &quot;email&quot; column. &quot;name&quot; and &quot;phone&quot; are optional.</p>
      {releases.length > 0 && (
        <select value={releaseId ?? ""} onChange={(e) => setReleaseId(e.target.value ? Number(e.target.value) : null)} className={input}>
          <option value="">Not for a specific release</option>
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      )}
      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#C30100]" />
        <span className="font-body text-white/55 text-xs">These fans agreed to hear from me.</span>
      </label>
      <div className="flex gap-2">
        <button onClick={upload} disabled={!consent || busy} className={primaryBtn}>
          {busy ? "Importing…" : "Import"}
        </button>
        <button onClick={() => setOpen(false)} className={ghostBtn}>
          Cancel
        </button>
      </div>
      {result && <p className="font-body text-white/60 text-xs">{result}</p>}
    </div>
  );
}

function History({ data }: { data: ShoutOutOverview }) {
  const [tab, setTab] = useState<"sends" | "balance">("sends");

  return (
    <div className={card}>
      <div className="flex gap-4 border-b border-white/[0.06] pb-3">
        {(["sends", "balance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-heading uppercase text-[11px] tracking-widest ${tab === t ? "text-white" : "text-white/35 hover:text-white/60"}`}
          >
            {t === "sends" ? "Sent" : "Balance history"}
          </button>
        ))}
      </div>

      {tab === "sends" ? (
        data.broadcasts.length === 0 ? (
          <p className="font-body text-white/40 text-sm mt-4">Nothing sent yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-white/[0.05]">
            {data.broadcasts.map((b) => (
              <li key={b.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-white text-sm truncate">{b.subject}</p>
                  <p className="font-body text-white/40 text-xs mt-0.5">
                    {b.type === "release_live" ? "Release is live · " : ""}
                    {statusText(b)}
                  </p>
                </div>
                <p className="font-body text-white/60 text-xs shrink-0">{naira(b.charged_kobo - b.refunded_kobo)}</p>
              </li>
            ))}
          </ul>
        )
      ) : data.ledger.length === 0 ? (
        <p className="font-body text-white/40 text-sm mt-4">No top-ups or charges yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-white/[0.05]">
          {data.ledger.map((l) => (
            <li key={l.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-white text-sm truncate">{l.description}</p>
                <p className="font-body text-white/35 text-xs mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
              </div>
              <p className={`font-body text-sm shrink-0 ${l.amount_kobo >= 0 ? "text-[#25D366]" : "text-white/70"}`}>
                {l.amount_kobo >= 0 ? "+" : "−"}
                {naira(Math.abs(l.amount_kobo))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function statusText(b: ShoutOutOverview["broadcasts"][number]): string {
  switch (b.status) {
    case "awaiting_funds":
      return `Waiting for a top-up · ${b.recipients_count} fans`;
    case "queued":
    case "sending":
      return `Sending to ${b.recipients_count} fans…`;
    case "sent":
      return `Sent to ${b.sent_count} fan${b.sent_count === 1 ? "" : "s"}${b.failed_count ? ` · ${b.failed_count} refunded` : ""}`;
    default:
      return "Could not be sent · refunded";
  }
}

function TopupModal({ minKobo, onClose, onPaid }: { minKobo: number; onClose: () => void; onPaid: () => void }) {
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topup, setTopup] = useState<ShoutOutTopup | null>(null);
  const [copied, setCopied] = useState(false);

  // Watch for the transfer landing.
  useEffect(() => {
    if (!topup || topup.status === "paid") return;
    const id = setInterval(async () => {
      const res = await getTopup(topup.reference);
      if (res.data) {
        setTopup(res.data);
        if (res.data.status === "paid") onPaid();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [topup, onPaid]);

  const start = async () => {
    setBusy(true);
    setError(null);
    const res = await createTopup(Number(amount));
    setBusy(false);
    if (res.error || !res.data) {
      setError(res.errors?.amount?.[0] ?? res.error ?? "Something went wrong.");
      return;
    }
    setTopup(res.data);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#140C0C] p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <p className="font-heading text-white uppercase text-sm tracking-wide">Top up Shout Out</p>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        {!topup ? (
          <>
            <span className={`${label} mt-5`}>Amount (₦)</span>
            <input
              type="number"
              inputMode="numeric"
              min={minKobo / 100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={input}
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {[2000, 5000, 10000, 25000].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))} className="font-body text-white/60 text-xs rounded-full border border-white/10 hover:border-white/30 px-3 py-1.5">
                  ₦{v.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="font-body text-white/40 text-xs mt-3">
              ₦{Number(amount || 0).toLocaleString()} sends {Math.floor((Number(amount || 0) * 100) / 2500).toLocaleString()} emails.
            </p>
            {error && <p className="font-body text-[#ff6b6b] text-xs mt-2">{error}</p>}
            <button onClick={start} disabled={busy || Number(amount) * 100 < minKobo} className={`${primaryBtn} w-full mt-5`}>
              {busy ? "Getting bank details…" : "Get bank details"}
            </button>
          </>
        ) : topup.status === "paid" ? (
          <div className="mt-6 text-center">
            <p className="font-heading text-[#25D366] text-2xl">{naira(topup.amount_received_kobo)} added</p>
            <p className="font-body text-white/50 text-sm mt-2">Your balance is ready to use.</p>
            <button onClick={onClose} className={`${primaryBtn} w-full mt-6`}>
              Done
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <p className="font-body text-white/60 text-sm">
              Transfer <span className="text-white font-semibold">{naira(topup.amount_requested_kobo)}</span> to:
            </p>
            <div className="mt-3 rounded-2xl bg-[#0E0808] border border-white/[0.06] p-4">
              <p className="font-body text-white/40 text-xs">{topup.bank_name}</p>
              <div className="flex items-center justify-between gap-3 mt-1">
                <p className="font-heading text-white text-2xl tracking-wider">{topup.account_number}</p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(topup.account_number ?? "");
                    setCopied(true);
                  }}
                  className="font-body text-[#C30100] text-xs shrink-0"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="font-body text-white/50 text-xs mt-1">{topup.account_name}</p>
            </div>
            <p className="font-body text-white/40 text-xs mt-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Waiting for your transfer. Your balance updates by itself, and you can close this.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
