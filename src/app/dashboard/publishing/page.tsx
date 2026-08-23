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
import AccessCheckout from "@/components/dashboard/publishing/AccessCheckout";
import IpiGuide from "@/components/dashboard/publishing/IpiGuide";
import PublishingIntro from "@/components/dashboard/publishing/PublishingIntro";
import SessionBooked from "@/components/dashboard/publishing/SessionBooked";
import SessionBooking from "@/components/dashboard/publishing/SessionBooking";
import SplitsPanel from "@/components/dashboard/publishing/SplitsPanel";
import {
  getCheckoutStatus,
  type BookedSession,
  AFFILIATION_HINTS,
  SPLIT_IN_FLIGHT,
  createHelpRequest,
  createWriter,
  getPublishingOverview,
  type PublishingOverview,
  type PublishingWriter,
} from "@/lib/api/publishing";

type Mode =
  | { kind: "intro" }
  | { kind: "guide"; profileId: number }
  | { kind: "booking"; profileId: number }
  | { kind: "booked"; session: BookedSession }
  | { kind: "pay"; profileId: number }
  | { kind: "list" } | { kind: "ask"; profileId: number } | { kind: "form"; profileId: number } | { kind: "help"; profileId: number };

export default function PublishingPage() {
  const [overview, setOverview] = useState<PublishingOverview | null>(null);
  const [profiles, setProfiles] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /*
   * Opens on the pitch, not the product. An artist arriving here has usually never heard
   * of a writer share or an IPI — leading with the form asks them to fill in something
   * they do not know they need. The intro explains why the money exists first, and the
   * moment they have seen the price it hands off to the artist list.
   *
   * Anyone who has already registered a songwriter skips it — see the effect below.
   */
  const [mode, setMode] = useState<Mode>({ kind: "intro" });
  const [banner, setBanner] = useState<string | null>(null);
  const [tab, setTab] = useState<"writers" | "splits">("writers");
  /** Artists already paid for. Anything not in here goes through checkout first. */
  const [paidIds, setPaidIds] = useState<number[]>([]);
  const [sessions, setSessions] = useState<BookedSession[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [ov, pf, st] = await Promise.all([
      getPublishingOverview(),
      getProfile(),
      getCheckoutStatus(),
    ]);

    if (!st.error && st.data) {
      setPaidIds(st.data.paid_profile_ids ?? []);
      setSessions(st.data.sessions ?? []);
    }

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

  /*
   * Coming back from the payment page.
   *
   * The browser returns the instant the provider is done, while the webhook that actually
   * grants access is a separate call a second or two behind. So arrival is treated as
   * "check again shortly", never as proof of payment — polling stops as soon as the state
   * changes, or after a few tries so a cancelled payment does not spin forever.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const paid = new URLSearchParams(window.location.search).get("paid");

    if (!paid || paid === "cancelled") return;

    let tries = 0;

    const t = setInterval(() => {
      tries += 1;
      void load();

      if (tries >= 6) clearInterval(t);
    }, 2500);

    return () => clearInterval(t);
  }, [load]);

  /*
   * Show the confirmation once a session payment has actually landed.
   *
   * Driven by the sessions list rather than the redirect, because the redirect only means
   * the provider finished — the booking is real when the webhook says so. Fires once, and
   * only for a booking made in the last few minutes, so revisiting the page later does not
   * throw an old confirmation back at someone.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("paid") !== "session") return;

    const fresh = sessions.find(
      (x) =>
        x.status === "booked" &&
        x.paid_at !== null &&
        Date.now() - new Date(x.paid_at).getTime() < 15 * 60_000,
    );

    if (fresh) {
      setMode((m) => (m.kind === "booked" ? m : { kind: "booked", session: fresh }));
    }
  }, [sessions]);

  /*
   * The pitch is for people who have not started. Once a writer or a split exists, it is
   * noise between them and their data, so the page opens on the list instead. Only ever
   * moves the landing state — never interrupts someone mid-flow.
   */
  useEffect(() => {
    if (!overview) return;

    const started = overview.writers.length > 0 || overview.splits.length > 0;

    if (started) {
      setMode((m) => (m.kind === "intro" ? { kind: "list" } : m));
    }
  }, [overview]);

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
      {/*
        720px suits the form flow — a single column of questions reads badly any wider.
        The intro is a two-column pitch and was being crushed into that same width, which
        left the headline about 330px wide and wrapping onto five lines. It gets its own
        measure instead of forcing every screen to share one.
      */}
      <div
        className={`mx-auto w-full px-1 pb-24 sm:px-0 ${
          mode.kind === "intro" ? "max-w-[1120px]" : "max-w-[720px]"
        }`}
      >
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
        ) : mode.kind === "intro" ? (
          <PublishingIntro
            onStart={() => setMode({ kind: "list" })}
            sharePercent={overview.publisher_share_percent}
          />
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
            /* Paid artists skip checkout — the fee is once per artist, not per attempt. */
            onYes={() =>
              setMode(
                paidIds.includes(mode.profileId)
                  ? { kind: "form", profileId: mode.profileId }
                  : { kind: "pay", profileId: mode.profileId },
              )
            }
            onNo={() => setMode({ kind: "guide", profileId: mode.profileId })}
            onBack={() => setMode({ kind: "list" })}
          />
        ) : mode.kind === "guide" ? (
          <IpiGuide
            onHaveIpi={() =>
              setMode(
                paidIds.includes(mode.profileId)
                  ? { kind: "form", profileId: mode.profileId }
                  : { kind: "pay", profileId: mode.profileId },
              )
            }
            onDoItForMe={() => setMode({ kind: "booking", profileId: mode.profileId })}
            onBack={() => setMode({ kind: "ask", profileId: mode.profileId })}
          />
        ) : mode.kind === "booking" ? (
          <SessionBooking
            artistProfileId={mode.profileId}
            onBack={() => setMode({ kind: "guide", profileId: mode.profileId })}
          />
        ) : mode.kind === "booked" ? (
          <SessionBooked session={mode.session} onDone={() => setMode({ kind: "list" })} />
        ) : mode.kind === "pay" ? (
          <AccessCheckout
            artist={profileName(mode.profileId)}
            artistProfileId={mode.profileId}
            onBack={() => setMode({ kind: "ask", profileId: mode.profileId })}
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
/** Three segments: this question, then payment, then the writer's details. */
function StepBar({ active }: { active: number }) {
  return (
    <div className="mt-4 flex gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors ${
            i <= active ? "bg-[#C30100]" : "bg-white/12"
          }`}
        />
      ))}
    </div>
  );
}

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
    <div className="mx-auto max-w-[520px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <BackLink onClick={onBack} />
      <StepBar active={0} />

      <h2 className="mt-5 font-heading text-xl uppercase leading-[1.2] tracking-wide text-white sm:text-2xl">
        Is {artist} registered with a PRO?
      </h2>

      {/* Names the local PRO as well as the international ones — most artists reading this
          are in Nigeria, and a list of only US and UK bodies reads as "not for me". */}
      <p className="mt-3 font-body text-sm leading-relaxed text-white/55">
        A PRO — a performing rights organisation like PRS, ASCAP, BMI, or the national PRO
        here in Nigeria — collects songwriting royalties. When you join one, they issue you
        an <b className="text-white/85">IPI number</b>. We need that number to register you
        as a songwriter.
      </p>

      <div className="mt-6 space-y-2.5">
        <button
          onClick={onYes}
          className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
        >
          Yes — I have my IPI
        </button>
        <button
          onClick={onNo}
          className="flex min-h-[56px] w-full items-center justify-center rounded-full border border-white/20 px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:border-white/40"
        >
          Not yet — help me get one
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
