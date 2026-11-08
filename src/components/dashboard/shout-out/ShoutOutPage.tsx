"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTopup,
  downloadFansTemplate,
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

/* ── Shared styles (same on mobile and web) ── */
const panel = "rounded-3xl border border-white/[0.07] bg-[#160F0F]";
const fieldLabel = "font-body text-white/55 text-sm mb-2 block";
const field =
  "w-full rounded-2xl border border-white/[0.09] bg-[#0D0808] px-4 py-3.5 font-body text-white text-[15px] placeholder:text-white/30 focus:outline-none focus:border-[#C30100]/70 transition-colors";
const selectField = `${field} appearance-none pr-10 bg-no-repeat bg-[right_1rem_center] bg-[length:12px] bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%23ffffff99' stroke-width='1.5'%3E%3Cpath d='M3 4.5 6 1.5 9 4.5M3 7.5 6 10.5 9 7.5'/%3E%3C/svg%3E")]`;
const redPill =
  "w-full font-heading text-white uppercase text-xs tracking-[0.18em] rounded-full bg-[#C30100] hover:bg-[#a80000] disabled:opacity-40 disabled:cursor-not-allowed min-h-[52px] transition-colors shadow-[0_8px_24px_-8px_rgba(195,1,0,0.6)]";
const outlinePill =
  "w-full font-heading text-white uppercase text-xs tracking-[0.18em] rounded-full border border-white/20 hover:border-white/50 min-h-[48px] transition-colors";

export function ShoutOutPage() {
  const [data, setData] = useState<ShoutOutOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);
  const [fansOpen, setFansOpen] = useState(false);

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

  if (error && !data) return <p className="font-body text-white/60 text-sm">{error}</p>;
  if (!data) return <div className="h-64 rounded-3xl bg-white/[0.03] animate-pulse" />;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 max-w-6xl">
      <div className="mb-1 max-w-3xl">
        <h2 className="font-body font-bold text-white text-[26px] sm:text-3xl leading-tight tracking-tight">
          New release, show or merch? Reach your fans directly. No algorithm.
        </h2>
        <p className="font-body text-white/50 text-sm mt-2">
          {data.free_monthly} free emails every month
          {data.free_remaining < data.free_monthly ? ` · ${data.free_remaining} left this month` : ""}
        </p>
      </div>

      {/* Mobile: cards, form, history stacked. Desktop: form on the left, cards and history in a right-hand column. */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] items-start">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-start-2 lg:row-start-1">
          <div className={`${panel} p-4 sm:p-5 flex flex-col`}>
            <p className="font-body text-white/55 text-sm">Balance</p>
            <p className="font-heading text-white text-3xl mt-1">{naira(data.balance_kobo)}</p>
            <p className="font-body text-white/45 text-xs mt-1 flex-1">Only pay for what you send</p>
            <button onClick={() => setTopupOpen(true)} className={`${outlinePill} mt-4`}>
              Top up
            </button>
          </div>
          <div className={`${panel} p-4 sm:p-5 flex flex-col`}>
            <p className="font-body text-white/55 text-sm">Fans</p>
            <p className="font-heading text-white text-3xl mt-1">{data.fans.total.toLocaleString()}</p>
            <p className="font-body text-white/45 text-xs mt-1 flex-1">
              {data.fans.unsubscribed ? `${data.fans.unsubscribed} unsubscribed` : "From your pre-saves"}
            </p>
            <button onClick={() => setFansOpen(true)} className={`${redPill} mt-4 min-h-[48px]`}>
              Add fans
            </button>
          </div>
        </div>

        <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <Compose data={data} onSent={load} onTopUp={() => setTopupOpen(true)} onAddFans={() => setFansOpen(true)} />
        </div>

        <div className="lg:col-start-2 lg:row-start-2">
          <History data={data} />
        </div>
      </div>

      {topupOpen && <TopupModal minKobo={data.min_topup_kobo} priceKobo={data.price_kobo} onClose={() => setTopupOpen(false)} onPaid={load} />}
      {fansOpen && <AddFansModal releases={data.fans.by_release} onClose={() => setFansOpen(false)} onDone={load} />}
    </div>
  );
}

/* ── New Shout Out ── */

function Compose({
  data,
  onSent,
  onTopUp,
  onAddFans,
}: {
  data: ShoutOutOverview;
  onSent: () => void;
  onTopUp: () => void;
  onAddFans: () => void;
}) {
  const [artistId, setArtistId] = useState<number | null>(data.artists[0]?.id ?? null);
  const [releaseId, setReleaseId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [buttonLabel, setButtonLabel] = useState(data.button_labels[0] ?? "Listen now");
  const [link, setLink] = useState("");
  const [quote, setQuote] = useState<ShoutOutQuote | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState<{ from: string; reply_to: string; subject: string; html: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    let alive = true;
    quoteShoutOut(releaseId).then((res) => alive && res.data && setQuote(res.data));
    return () => {
      alive = false;
    };
  }, [releaseId, data.balance_kobo, data.fans.total, data.free_remaining]);

  const recipients = quote?.recipients ?? 0;
  const short = (quote?.shortfall_kobo ?? 0) > 0;
  const ready = !!artistId && subject.trim().length >= 3 && body.trim().length >= 5 && recipients > 0;
  const priceTag = quote && quote.cost_kobo === 0 ? "Free" : naira(quote?.cost_kobo ?? 0);

  const payload = () => ({
    artist_profile_id: artistId as number,
    subject: subject.trim(),
    body: body.trim(),
    link_url: link.trim() || undefined,
    button_label: link.trim() ? buttonLabel : undefined,
  });

  const openPreview = async () => {
    if (!artistId) return;
    setPreviewing(true);
    const res = await previewShoutOut(payload());
    setPreviewing(false);
    if (res.error || !res.data) {
      setMessage({ ok: false, text: res.errors?.link_url?.[0] ?? res.error ?? "Could not load the preview." });
      return;
    }
    setPreview(res.data);
  };

  const send = async () => {
    if (!artistId) return;
    setSending(true);
    setMessage(null);
    const res = await sendShoutOut({ ...payload(), music_upload_id: releaseId });
    setSending(false);
    setConfirming(false);
    if (res.error) {
      setMessage({ ok: false, text: res.errors?.link_url?.[0] ?? res.error });
      return;
    }
    setMessage({ ok: true, text: `On its way to ${res.data?.recipients_count ?? recipients} fan${recipients === 1 ? "" : "s"}.` });
    setSubject("");
    setBody("");
    setLink("");
    onSent();
  };

  if (data.artists.length === 0) {
    return (
      <div className={`${panel} p-5`}>
        <p className="font-body text-white/60 text-sm">Create an artist profile first. Shout Outs are sent in your artist name.</p>
      </div>
    );
  }

  return (
    <div className={`${panel} p-5 sm:p-7`}>
      <p className="font-heading text-white uppercase text-base tracking-[0.12em]">New Shout Out</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 mt-5">
        <label>
          <span className={fieldLabel}>From</span>
          <select value={artistId ?? ""} onChange={(e) => setArtistId(Number(e.target.value))} className={selectField}>
            {data.artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.stage_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={fieldLabel}>To</span>
          <select
            value={releaseId ?? ""}
            onChange={(e) => setReleaseId(e.target.value ? Number(e.target.value) : null)}
            className={selectField}
          >
            <option value="">All fans ({data.fans.total.toLocaleString()})</option>
            {data.fans.by_release.map((r) => (
              <option key={r.id} value={r.id}>
                Pre-saved {r.title} ({r.fans.toLocaleString()})
              </option>
            ))}
          </select>
        </label>
      </div>

      <span className={`${fieldLabel} mt-5`}>Send via</span>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative rounded-2xl border-2 border-[#C30100] bg-[#2A0D0B] px-3 py-5 flex flex-col items-center text-center">
          <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#C30100] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
          </svg>
          <p className="font-body font-semibold text-white text-base mt-2.5">Email</p>
          <span className="mt-2 rounded-full bg-white/[0.08] px-3 py-1 font-body text-white text-xs font-semibold">{naira(data.price_kobo)}</span>
        </div>

        <div className="relative rounded-2xl border border-white/[0.08] bg-[#100A0A] px-3 py-5 flex flex-col items-center text-center cursor-not-allowed" aria-disabled="true">
          <WhatsAppLogo size={28} />
          <p className="font-body font-semibold text-white/60 text-base mt-2.5">WhatsApp</p>
          <span className="mt-2 rounded-full bg-white/[0.06] px-3 py-1 font-body text-white/55 text-xs font-semibold">{naira(data.whatsapp_price_kobo)}</span>
          <span className="mt-1.5 font-body text-amber-400 text-xs font-medium">Coming soon</span>
        </div>
      </div>

      <label className="block mt-5">
        <span className={fieldLabel}>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} placeholder="New music this Friday" className={field} />
      </label>

      <label className="block mt-5">
        <span className={fieldLabel}>Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="My new single drops Friday. You heard it first."
          className={`${field} resize-y min-h-[140px]`}
        />
      </label>

      <span className={`${fieldLabel} mt-5`}>Button</span>
      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2.5">
        <select value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} className={selectField} aria-label="Button text">
          {data.button_labels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste link" inputMode="url" className={field} aria-label="Button link" />
      </div>

      <div className="mt-7">
        {recipients === 0 ? (
          <button onClick={onAddFans} className={redPill}>
            Add fans to send
          </button>
        ) : short ? (
          <button onClick={onTopUp} className={redPill}>
            Top up {naira(quote!.shortfall_kobo)} to send
          </button>
        ) : confirming ? (
          <div className="flex flex-col gap-2">
            <button onClick={send} className={redPill} disabled={sending}>
              {sending ? "Sending…" : `Confirm · ${recipients.toLocaleString()} fan${recipients === 1 ? "" : "s"} · ${priceTag}`}
            </button>
            <button onClick={() => setConfirming(false)} disabled={sending} className="font-body text-white/50 hover:text-white text-sm py-1">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className={redPill} disabled={!ready}>
            Send · {priceTag}
          </button>
        )}

        {quote && recipients > 0 && quote.free_applied > 0 && quote.cost_kobo > 0 && (
          <p className="font-body text-white/40 text-xs text-center mt-2">
            {quote.free_applied} free, then {naira(quote.price_kobo)} each
          </p>
        )}

        <button onClick={openPreview} disabled={!artistId || previewing} className="block mx-auto mt-4 font-body text-white/80 hover:text-white text-sm underline underline-offset-4 decoration-white/40">
          {previewing ? "Loading preview…" : "Preview"}
        </button>

        {message && (
          <p className={`font-body text-sm text-center mt-3 ${message.ok ? "text-[#25D366]" : "text-[#ff6b6b]"}`}>{message.text}</p>
        )}
      </div>

      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function PreviewModal({
  preview,
  onClose,
}: {
  preview: { from: string; reply_to: string; subject: string; html: string };
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose} label="Email preview" wide>
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] font-body text-xs leading-relaxed">
        <p className="text-white/45">From <span className="text-white/85">{preview.from}</span></p>
        <p className="text-white/45">Replies go to <span className="text-white/85">{preview.reply_to}</span></p>
        <p className="text-white text-sm font-semibold mt-1 truncate">{preview.subject}</p>
      </div>
      <iframe title="Email preview" srcDoc={preview.html} sandbox="" className="w-full flex-1 min-h-[60vh] bg-[#f4f4f5]" />
      <p className="font-body text-white/35 text-[11px] px-5 py-3">Exactly what a fan sees. &quot;Ada&quot; is a sample name; each fan sees their own.</p>
    </Sheet>
  );
}

/* ── Add fans ── */

function AddFansModal({
  releases,
  onClose,
  onDone,
}: {
  releases: ShoutOutOverview["fans"]["by_release"];
  onClose: () => void;
  onDone: () => void;
}) {
  const [releaseId, setReleaseId] = useState<number | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    const res = await importFans(file, releaseId);
    setBusy(false);
    if (res.error) {
      setResult({ ok: false, text: res.error });
      return;
    }
    const d = res.data;
    const notes = [
      d?.already_added ? `${d.already_added} already on your list` : null,
      d?.missing_whatsapp ? `${d.missing_whatsapp} skipped: no valid WhatsApp number` : null,
      d?.missing_email ? `${d.missing_email} skipped: no valid email` : null,
    ].filter(Boolean);
    setResult({
      ok: (d?.added ?? 0) > 0 || notes.length === 0,
      text: `Added ${d?.added ?? 0} fan${d?.added === 1 ? "" : "s"}.${notes.length ? " " + notes.join(" · ") + "." : ""}`,
    });
    onDone();
  };

  return (
    <Sheet onClose={onClose} label="Add fans">
      <div className="p-6">
        <p className="font-heading text-white uppercase text-base tracking-[0.12em]">Add fans</p>
        <p className="font-body text-white/55 text-sm mt-2">
          Fans who pre-save your releases are added automatically. You can also upload a list.
        </p>

        <div className="mt-4 rounded-2xl bg-[#0D0808] border border-white/[0.07] p-4">
          <p className="font-body text-white/80 text-sm font-semibold">Your file needs these columns</p>
          <ul className="font-body text-white/60 text-sm mt-2 space-y-1">
            <li><span className="text-white">email</span>: required</li>
            <li><span className="text-white">whatsapp</span>: required, with the country code, e.g. +2348012345678</li>
            <li><span className="text-white">name</span>: optional</li>
          </ul>
          <button
            onClick={downloadFansTemplate}
            className="mt-3 inline-flex items-center gap-1.5 font-body text-[#ff5a4f] hover:text-[#ff7a70] text-sm font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 19h16" />
            </svg>
            Download template
          </button>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="mt-5 w-full rounded-2xl border border-dashed border-white/20 hover:border-white/40 bg-[#0D0808] px-4 py-6 font-body text-white/70 text-sm text-center"
        >
          {fileName ?? "Choose a CSV file"}
          <span className="block text-white/35 text-xs mt-1">CSV with email and WhatsApp for every fan</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />

        {releases.length > 0 && (
          <label className="block mt-4">
            <span className={fieldLabel}>For a release (optional)</span>
            <select value={releaseId ?? ""} onChange={(e) => setReleaseId(e.target.value ? Number(e.target.value) : null)} className={selectField}>
              <option value="">Not for a specific release</option>
              {releases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C30100]" />
          <span className="font-body text-white/65 text-sm">These fans agreed to hear from me by email and WhatsApp.</span>
        </label>

        <button onClick={upload} disabled={!consent || !fileName || busy} className={`${redPill} mt-5`}>
          {busy ? "Adding…" : "Add fans"}
        </button>
        {result && <p className={`font-body text-sm text-center mt-3 ${result.ok ? "text-[#25D366]" : "text-[#ff6b6b]"}`}>{result.text}</p>}
      </div>
    </Sheet>
  );
}

/* ── History ── */

function History({ data }: { data: ShoutOutOverview }) {
  const [tab, setTab] = useState<"sends" | "balance">("sends");

  return (
    <div className={`${panel} p-5 sm:p-7`}>
      <div className="flex gap-5 border-b border-white/[0.06] pb-3">
        {(["sends", "balance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-heading uppercase text-[11px] tracking-[0.16em] ${tab === t ? "text-white" : "text-white/35 hover:text-white/60"}`}
          >
            {t === "sends" ? "Sent" : "Balance history"}
          </button>
        ))}
      </div>

      {tab === "sends" ? (
        data.broadcasts.length === 0 ? (
          <p className="font-body text-white/40 text-sm mt-4">Nothing sent yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-white/[0.05]">
            {data.broadcasts.map((b) => (
              <li key={b.id} className="py-3.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-white text-sm truncate">{b.subject}</p>
                  <p className="font-body text-white/40 text-xs mt-0.5">
                    {b.type === "release_live" ? "Release is live · " : ""}
                    {statusText(b)}
                  </p>
                </div>
                <p className="font-body text-white/60 text-xs shrink-0">
                  {b.charged_kobo - b.refunded_kobo === 0 ? "Free" : naira(b.charged_kobo - b.refunded_kobo)}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : data.ledger.length === 0 ? (
        <p className="font-body text-white/40 text-sm mt-4">No top-ups or charges yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-white/[0.05]">
          {data.ledger.map((l) => (
            <li key={l.id} className="py-3.5 flex items-center justify-between gap-3">
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
      return `Sent to ${b.sent_count} fan${b.sent_count === 1 ? "" : "s"}${b.failed_count ? ` · ${b.failed_count} not delivered` : ""}`;
    default:
      return "Could not be sent · refunded";
  }
}

/* ── Top up ── */

function TopupModal({
  minKobo,
  priceKobo,
  onClose,
  onPaid,
}: {
  minKobo: number;
  priceKobo: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topup, setTopup] = useState<ShoutOutTopup | null>(null);
  const [copied, setCopied] = useState(false);

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

  const emails = Math.floor((Number(amount || 0) * 100) / priceKobo);

  return (
    <Sheet onClose={onClose} label="Top up">
      <div className="p-6">
        <p className="font-heading text-white uppercase text-base tracking-[0.12em]">Top up</p>

        {!topup ? (
          <>
            <span className={`${fieldLabel} mt-5`}>Amount (₦)</span>
            <input type="number" inputMode="numeric" min={minKobo / 100} value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
            <div className="flex gap-2 mt-3 flex-wrap">
              {[2000, 5000, 10000, 25000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className={`font-body text-xs rounded-full border px-3.5 py-1.5 transition-colors ${
                    Number(amount) === v ? "border-[#C30100] text-white bg-[#2A0D0B]" : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  ₦{v.toLocaleString()}
                </button>
              ))}
            </div>
            <p className="font-body text-white/45 text-xs mt-3">
              Sends {emails.toLocaleString()} email{emails === 1 ? "" : "s"} at {naira(priceKobo)} each.
            </p>
            {error && <p className="font-body text-[#ff6b6b] text-sm mt-3">{error}</p>}
            <button onClick={start} disabled={busy || Number(amount) * 100 < minKobo} className={`${redPill} mt-6`}>
              {busy ? "Getting bank details…" : "Get bank details"}
            </button>
          </>
        ) : topup.status === "paid" ? (
          <div className="mt-6 text-center">
            <p className="font-heading text-[#25D366] text-2xl">{naira(topup.amount_received_kobo)} added</p>
            <p className="font-body text-white/50 text-sm mt-2">Your balance is ready to use.</p>
            <button onClick={onClose} className={`${redPill} mt-6`}>
              Done
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <p className="font-body text-white/60 text-sm">
              Transfer <span className="text-white font-semibold">{naira(topup.amount_requested_kobo)}</span> to:
            </p>
            <div className="mt-3 rounded-2xl bg-[#0D0808] border border-white/[0.07] p-4">
              <p className="font-body text-white/45 text-xs">{topup.bank_name}</p>
              <div className="flex items-center justify-between gap-3 mt-1">
                <p className="font-heading text-white text-2xl tracking-wider">{topup.account_number}</p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(topup.account_number ?? "");
                    setCopied(true);
                  }}
                  className="font-body text-[#ff5a4f] text-sm shrink-0"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="font-body text-white/55 text-xs mt-1">{topup.account_name}</p>
            </div>
            <p className="font-body text-white/45 text-xs mt-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Waiting for your transfer. Your balance updates by itself, so you can close this.
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ── Bottom sheet on mobile, centred dialog on web ── */

function Sheet({ children, onClose, label, wide = false }: { children: React.ReactNode; onClose: () => void; label: string; wide?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${wide ? "sm:max-w-xl" : "sm:max-w-md"} max-h-[92vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#140C0C]`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center text-white/45 hover:text-white" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div className="overflow-y-auto flex flex-col flex-1">{children}</div>
      </div>
    </div>
  );
}

/** The official WhatsApp glyph. */
function WhatsAppLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-label="WhatsApp" role="img">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
