"use client";

/**
 * Publishing — register a songwriter with the publisher.
 *
 * The screen is built around one fact: an IPI is issued by a PRO on affiliation, and
 * nothing here can create one. `writer-ipi` is required upstream, so an artist without a
 * PRO cannot be registered at all.
 *
 * That is why the first thing asked is whether they have a PRO, and why "I don't" is a
 * real destination rather than a link under the field. Left as free text, an IPI box gets
 * guesses typed into it — and a wrong IPI registers an artist's songwriter shares against
 * someone else at the PRO, which is far harder to undo than being stopped here.
 *
 * Mobile first throughout: single column, full-width controls, 44px touch targets, and
 * nothing that depends on hover to be discoverable.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getProfile, type ArtistProfile } from "@/lib/api/auth";
import SplitsPanel from "@/components/dashboard/publishing/SplitsPanel";
import {
  AFFILIATION_HINTS,
  SPLIT_IN_FLIGHT,
  createHelpRequest,
  createWriter,
  getPublishingOverview,
  type PublishingOverview,
  type PublishingWriter,
} from "@/lib/api/publishing";

type Mode = { kind: "list" } | { kind: "ask"; profileId: number } | { kind: "form"; profileId: number } | { kind: "help"; profileId: number };

export default function PublishingPage() {
  const [overview, setOverview] = useState<PublishingOverview | null>(null);
  const [profiles, setProfiles] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [banner, setBanner] = useState<string | null>(null);
  const [tab, setTab] = useState<"writers" | "splits">("writers");

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, pf] = await Promise.all([getPublishingOverview(), getProfile()]);

    if (ov.error) setError(ov.error);
    else if (ov.data) setError(null), setOverview(ov.data);

    if (!pf.error && pf.data) {
      const raw = pf.data as unknown as Record<string, unknown>;
      const list = Array.isArray(raw.profiles)
        ? (raw.profiles as ArtistProfile[])
        : Array.isArray(pf.data)
          ? (pf.data as unknown as ArtistProfile[])
          : Array.isArray(raw.data)
            ? (raw.data as ArtistProfile[])
            : [];
      setProfiles(list);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const writerFor = useCallback(
    (profileId: number): PublishingWriter | undefined =>
      overview?.writers.find((w) => w.artist_profile_id === profileId),
    [overview]
  );

  const profileName = useCallback(
    (id: number) => {
      const p = profiles.find((x) => x.id === id);
      return p?.stage_name || p?.full_name || `Artist ${id}`;
    },
    [profiles]
  );

  /*
   * A pending writer settles on the queue, so the page polls while any is in flight.
   * Without this the artist sits on "Registering…" forever and reloads to find out —
   * which reads as broken even though it worked.
   */
  const hasPending = useMemo(
    () =>
      (overview?.writers ?? []).some((w) => w.status === "pending") ||
      (overview?.splits ?? []).some((s) => SPLIT_IN_FLIGHT.includes(s.status)),
    [overview]
  );

  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(() => void load(), 6000);
    return () => clearInterval(t);
  }, [hasPending, load]);

  return (
    <DashboardLayout pageTitle="Publishing">
      <div className="mx-auto w-full max-w-[720px] px-1 pb-24 sm:px-0">
        {banner && (
          <div className="mb-4 rounded-xl border border-green-500/25 bg-green-500/[0.07] px-4 py-3">
            <p className="font-body text-sm text-green-300">{banner}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.07] px-4 py-3">
            <p className="font-body text-sm text-white">{error}</p>
          </div>
        )}

        {loading && !overview ? (
          <Skeleton />
        ) : !overview ? null : !overview.entitled ? (
          <UpgradeNotice />
        ) : mode.kind === "list" ? (
          <>
            <div className="mb-4 inline-flex w-full rounded-full border border-white/[0.07] bg-[#0E0808] p-1">
              {(["writers", "splits"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`min-h-[40px] flex-1 rounded-full font-heading text-[11px] uppercase tracking-widest transition-colors ${
                    tab === t ? "bg-[#C30100] text-white" : "text-white/45 hover:text-white/80"
                  }`}
                >
                  {t === "writers" ? "Songwriters" : "Splits"}
                </button>
              ))}
            </div>

            {tab === "splits" ? (
              <SplitsPanel
                splits={overview.splits}
                writers={overview.writers}
                onChanged={(message) => {
                  if (message) setBanner(message);
                  void load();
                }}
              />
            ) : (
          <WriterList
            profiles={profiles}
            writerFor={writerFor}
            configured={overview.configured}
            onStart={(profileId) => setMode({ kind: "ask", profileId })}
          />
            )}
          </>
        ) : mode.kind === "ask" ? (
          <ProQuestion
            artist={profileName(mode.profileId)}
            onYes={() => setMode({ kind: "form", profileId: mode.profileId })}
            onNo={() => setMode({ kind: "help", profileId: mode.profileId })}
            onBack={() => setMode({ kind: "list" })}
          />
        ) : mode.kind === "form" ? (
          <WriterForm
            artist={profileName(mode.profileId)}
            profileId={mode.profileId}
            affiliations={overview.affiliations}
            onBack={() => setMode({ kind: "ask", profileId: mode.profileId })}
            onDone={(message) => {
              setBanner(message);
              setMode({ kind: "list" });
              void load();
            }}
          />
        ) : (
          <HelpForm
            artist={profileName(mode.profileId)}
            profileId={mode.profileId}
            onBack={() => setMode({ kind: "ask", profileId: mode.profileId })}
            onDone={(message) => {
              setBanner(message);
              setMode({ kind: "list" });
              void load();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

function UpgradeNotice() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#140C0C] p-6 text-center">
      <h2 className="font-heading text-lg uppercase tracking-wide text-white">Publishing</h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-white/55">
        Register your songwriters with our publisher so your writing share is collected
        wherever your music is performed. Available on the Growth plan and above.
      </p>
      <Link
        href="/dashboard/subscription"
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#C30100] px-6 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
      >
        See plans
      </Link>
    </div>
  );
}

function StatusPill({ status }: { status: PublishingWriter["status"] }) {
  const map = {
    pending: ["Registering…", "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"],
    registered: ["Registered", "border-green-500/25 bg-green-500/[0.08] text-green-300"],
    failed: ["Needs attention", "border-[#C30100]/30 bg-[#C30100]/[0.08] text-[#ff6b68]"],
  } as const;
  const [label, cls] = map[status];

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-body text-[11px] ${cls}`}>
      {label}
    </span>
  );
}

function WriterList({
  profiles,
  writerFor,
  configured,
  onStart,
}: {
  profiles: ArtistProfile[];
  writerFor: (id: number) => PublishingWriter | undefined;
  configured: boolean;
  onStart: (profileId: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="font-heading text-lg uppercase tracking-wide text-white">Songwriters</h2>
        <p className="mt-1 font-body text-xs leading-relaxed text-white/45">
          One songwriter per artist. We register them with our publisher so their writing
          share is collected.
        </p>
      </div>

      {!configured && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
          <p className="font-body text-xs leading-relaxed text-white/75">
            Publishing is not switched on for this environment yet. You can look, but
            registrations will not go through.
          </p>
        </div>
      )}

      {profiles.length === 0 && (
        <p className="rounded-xl border border-white/[0.07] bg-[#140C0C] px-4 py-6 text-center font-body text-sm text-white/45">
          You have no artist profiles yet.
        </p>
      )}

      {profiles.map((p) => {
        const writer = writerFor(p.id);
        const name = p.stage_name || p.full_name || `Artist ${p.id}`;

        return (
          <div key={p.id} className="rounded-xl border border-white/[0.07] bg-[#140C0C] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-semibold text-white">{name}</p>
                {writer ? (
                  <p className="mt-0.5 truncate font-body text-xs text-white/45">
                    {writer.first_name} {writer.last_name} · {writer.affiliation} · IPI {writer.ipi}
                  </p>
                ) : (
                  <p className="mt-0.5 font-body text-xs text-white/40">No songwriter registered</p>
                )}
              </div>
              {writer && <StatusPill status={writer.status} />}
            </div>

            {writer?.status === "failed" && writer.last_error && (
              <p className="mt-3 rounded-lg border border-[#C30100]/25 bg-[#C30100]/[0.06] px-3 py-2 font-body text-[11px] leading-relaxed text-white/70">
                {writer.last_error}
              </p>
            )}

            {(!writer || writer.status === "failed") && (
              <button
                onClick={() => onStart(p.id)}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/15 font-heading text-[11px] uppercase tracking-widest text-white transition-colors hover:border-white/35"
              >
                {writer ? "Try again" : "Register songwriter"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The question that decides everything else. */
function ProQuestion({
  artist,
  onYes,
  onNo,
  onBack,
}: {
  artist: string;
  onYes: () => void;
  onNo: () => void;
  onBack: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <BackLink onClick={onBack} />
      <h2 className="mt-3 font-heading text-lg uppercase leading-tight tracking-wide text-white">
        Is {artist} registered with a PRO?
      </h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-white/55">
        A PRO — a performing rights organisation like ASCAP, BMI, PRS or COSON — collects
        songwriting royalties. When you join one, they issue you an <b className="text-white/80">IPI
        number</b>. We need that number to register you as a songwriter.
      </p>

      <div className="mt-5 space-y-2.5">
        <button
          onClick={onYes}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
        >
          Yes — I have my IPI
        </button>
        <button
          onClick={onNo}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/15 px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:border-white/35"
        >
          No, or I'm not sure
        </button>
      </div>
    </div>
  );
}

function WriterForm({
  artist,
  profileId,
  affiliations,
  onBack,
  onDone,
}: {
  artist: string;
  profileId: number;
  affiliations: string[];
  onBack: () => void;
  onDone: (message: string) => void;
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [ipi, setIpi] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const digits = ipi.replace(/\D+/g, "");
  const ready =
    first.trim() && last.trim() && email.trim() && affiliation && digits.length >= 5 && !busy;

  const submit = async () => {
    setBusy(true);
    setErr(null);

    const res = await createWriter({
      artist_profile_id: profileId,
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim(),
      affiliation,
      ipi: digits,
    });

    setBusy(false);

    if (res.error) {
      setErr(res.errors?.ipi?.[0] ?? res.error);
      return;
    }

    onDone("Submitted. We are registering this songwriter — it usually takes a minute.");
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <BackLink onClick={onBack} />
      <h2 className="mt-3 font-heading text-lg uppercase tracking-wide text-white">
        Songwriter for {artist}
      </h2>
      <p className="mt-2 font-body text-xs leading-relaxed text-white/50">
        Use the writer&rsquo;s <b className="text-white/75">legal name</b>, exactly as their PRO
        holds it — not a stage name. A stage name here cannot be matched to a real person and
        the registration is rejected.
      </p>

      <div className="mt-5 space-y-3.5">
        <Field label="First name (legal)">
          <input value={first} onChange={(e) => setFirst(e.target.value)} className={inputCls} autoComplete="given-name" />
        </Field>
        <Field label="Last name (legal)">
          <input value={last} onChange={(e) => setLast(e.target.value)} className={inputCls} autoComplete="family-name" />
        </Field>
        <Field label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" className={inputCls} autoComplete="email" />
        </Field>

        <Field label="Which PRO issued the IPI?">
          <select value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className={inputCls}>
            <option value="">Choose one…</option>
            {affiliations.map((a) => (
              <option key={a} value={a}>
                {a}
                {AFFILIATION_HINTS[a] ? ` — ${AFFILIATION_HINTS[a]}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-1.5 font-body text-[11px] leading-relaxed text-white/35">
            This has to be the PRO that gave you the number below. A mismatch fails later,
            after we have told you it worked.
          </p>
        </Field>

        <Field label="IPI number">
          <input
            value={ipi}
            onChange={(e) => setIpi(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 7806814"
            className={inputCls}
          />
          <p className="mt-1.5 font-body text-[11px] leading-relaxed text-white/35">
            Digits only — your PRO shows it on your membership profile. It is usually 7 to 11
            digits.
          </p>
        </Field>

        {err && (
          <p className="rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
            {err}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!ready}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Submitting…" : "Register songwriter"}
        </button>
      </div>
    </div>
  );
}

function HelpForm({
  artist,
  profileId,
  onBack,
  onDone,
}: {
  artist: string;
  profileId: number;
  onBack: () => void;
  onDone: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);

    const res = await createHelpRequest({
      artist_profile_id: profileId,
      full_name: name.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || undefined,
      country: country.trim() || undefined,
      note: note.trim() || undefined,
    });

    setBusy(false);

    if (res.error) {
      setErr(res.error);
      return;
    }

    onDone("Thanks — our team will be in touch about getting you affiliated.");
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <BackLink onClick={onBack} />
      <h2 className="mt-3 font-heading text-lg uppercase leading-tight tracking-wide text-white">
        Let&rsquo;s get {artist} affiliated
      </h2>

      <div className="mt-3 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="font-body text-xs leading-relaxed text-white/60">
          You can&rsquo;t be registered as a songwriter without an IPI, and only a PRO can
          issue one. Joining is something you do once, and it is what makes your songwriting
          royalties collectable at all.
        </p>
        <p className="font-body text-xs leading-relaxed text-white/60">
          Most artists we work with join <b className="text-white/80">ASCAP</b> or{" "}
          <b className="text-white/80">BMI</b>, which accept international writers, or{" "}
          <b className="text-white/80">COSON</b> / <b className="text-white/80">MCSN</b> in
          Nigeria. Leave your details and we will walk you through it.
        </p>
      </div>

      <div className="mt-4 space-y-3.5">
        <Field label="Email">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" className={inputCls} autoComplete="email" />
        </Field>
        <Field label="Full name (optional)">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone or WhatsApp (optional)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputCls} autoComplete="tel" />
        </Field>
        <Field label="Country (optional)">
          <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Anything we should know? (optional)">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </Field>

        {err && (
          <p className="rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
            {err}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!email.trim() || busy}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Sending…" : "Ask for help"}
        </button>
      </div>
    </div>
  );
}

/* ── Small shared bits ──────────────────────────────────────────── */

const inputCls =
  "w-full min-h-[48px] rounded-xl border border-white/10 bg-[#0E0808] px-3.5 font-body text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#C30100]/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-body text-xs text-white/40 transition-colors hover:text-white"
    >
      ← Back
    </button>
  );
}
