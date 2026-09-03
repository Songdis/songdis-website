"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Quote as QuoteIcon,
  Trash2,
} from "lucide-react";
import type {
  PressKitEditorState,
  PressKitMediaItem,
  PressKitQuote,
  SectionKey,
} from "@/lib/api/press-kit";
import { sectionOrderAllows } from "@/lib/api/press-kit";
import type { UsePressKit } from "@/lib/hooks/usePressKit";
import { CoSignPanel } from "./CoSignPanel";
import {
  FailureNotice,
  FilePicker,
  IconButton,
  InlineArea,
  InlineField,
  Notice,
  Panel,
  SecondaryButton,
} from "./primitives";
import { ACCENT_TEXT, headlineStyle, sectionMeta, themeVars } from "./theme";


function SectionFrame({
  sectionKey,
  index,
  total,
  hidden,
  onMove,
  onToggle,
  children,
  disableUp,
  disableDown,
}: {
  sectionKey: SectionKey;
  index: number;
  total: number;
  hidden: boolean;
  onMove: (key: SectionKey, direction: -1 | 1) => void;
  onToggle: (key: SectionKey) => void;
  disableUp?: boolean;
  disableDown?: boolean;
  children: React.ReactNode;
}) {
  const meta = sectionMeta(sectionKey);

  return (
    <Panel className={hidden ? "opacity-55" : ""}>
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading text-white uppercase text-[12px] tracking-[0.14em]">
                {meta.label}
              </h3>
              {hidden && (
                <span className="font-body text-[9.5px] uppercase tracking-wider text-white/45 border border-white/10 rounded-full px-2 py-px">
                  Hidden
                </span>
              )}
              {!meta.live && (
                <span
                  className="font-body text-[9.5px] uppercase tracking-wider rounded-full px-2 py-px border"
                  style={{ color: "#fab219", borderColor: "#fab21955" }}
                >
                  Not live yet
                </span>
              )}
            </div>
            <p className="font-body text-white/35 text-[11px] mt-1 leading-relaxed">
              {meta.hint}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <IconButton
              label={`Move ${meta.label} up`}
              disabled={disableUp ?? index === 0}
              onClick={() => onMove(sectionKey, -1)}
            >
              <ChevronUp size={15} aria-hidden />
            </IconButton>
            <IconButton
              label={`Move ${meta.label} down`}
              disabled={disableDown ?? index === total - 1}
              onClick={() => onMove(sectionKey, 1)}
            >
              <ChevronDown size={15} aria-hidden />
            </IconButton>
            <IconButton
              label={hidden ? `Show ${meta.label}` : `Hide ${meta.label}`}
              active={hidden}
              onClick={() => onToggle(sectionKey)}
            >
              {hidden ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
            </IconButton>
          </div>
        </div>

        {children}
      </div>
    </Panel>
  );
}


export function HeroEditor({ kit }: { kit: UsePressKit }) {
  const { draft } = kit;
  const cover = draft.kit.cover_image_url ?? draft.artist.avatar_url;

  return (
    <Panel>
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          ...themeVars(draft.kit.theme),
          background:
            "linear-gradient(160deg, var(--pk-tint), var(--pk-bg-deep) 60%, var(--pk-bg))",
        }}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 22%" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,7,8,.55) 0%, transparent 32%, rgba(14,7,8,.7) 66%, var(--pk-bg) 100%)",
          }}
          aria-hidden
        />

        <div className="relative p-4 sm:p-5 flex flex-col gap-4 min-h-[220px] justify-end">
          <div className="flex items-center gap-2 flex-wrap">
            <FilePicker onPick={(file) => void kit.replaceCover(file)}>
              {(open) => (
                <SecondaryButton onClick={open}>
                  <ImagePlus size={13} aria-hidden />
                  {cover ? "Change cover photo" : "Add a cover photo"}
                </SecondaryButton>
              )}
            </FilePicker>
            {draft.kit.cover_image_url && (
              <SecondaryButton danger onClick={kit.removeCover}>
                <Trash2 size={13} aria-hidden />
                Remove
              </SecondaryButton>
            )}
          </div>

          {kit.coverFailure && (
            <FailureNotice
              title="Cover photo could not be replaced"
              error={
                kit.coverFailure.status === 404 || kit.coverFailure.status === 405
                  ? "Cover photo upload is not available on the server yet. Everything else on this page still saves."
                  : kit.coverFailure.error
              }
              errors={kit.coverFailure.errors}
            />
          )}

          <div className="flex flex-col gap-2.5 max-w-xl">
            <InlineField
              label="Eyebrow"
              value={draft.kit.eyebrow ?? ""}
              maxLength={120}
              placeholder="Naija street-hop · Press kit"
              hint="The small line above your name."
              onChange={(v) => kit.patchKit({ eyebrow: v.trim() === "" ? null : v })}
            />

            <div>
              <p className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40 mb-1">
                Artist name
              </p>
              <p
                className="text-white text-2xl sm:text-3xl leading-none"
                style={headlineStyle(draft.kit.headline_font)}
              >
                {draft.artist.name || "Your artist name"}
              </p>
              <p className="font-body text-white/35 text-[11px] mt-1.5">
                Taken from your artist profile. Change it in Settings — your web address
                will not move.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}


export function EditorSections({
  kit,
  profileId,
  artistName,
}: {
  kit: UsePressKit;
  profileId: number;
  artistName: string;
}) {
  const order = kit.draft.kit.section_order;

  /** Would a swap with the neighbour end in a legal order? Mirrors the hook's clamp. */
  const canMove = (key: SectionKey, direction: -1 | 1): boolean => {
    const from = order.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return false;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    return sectionOrderAllows(next);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {order.map((key, i) => (
        <SectionFrame
          key={key}
          sectionKey={key}
          index={i}
          total={order.length}
          hidden={kit.isHidden(key)}
          onMove={kit.moveSection}
          onToggle={kit.toggleSection}
          disableUp={!canMove(key, -1)}
          disableDown={!canMove(key, 1)}
        >
          <SectionBody
            sectionKey={key}
            kit={kit}
            profileId={profileId}
            artistName={artistName}
          />
        </SectionFrame>
      ))}
    </div>
  );
}

function SectionBody({
  sectionKey,
  kit,
  profileId,
  artistName,
}: {
  sectionKey: SectionKey;
  kit: UsePressKit;
  profileId: number;
  artistName: string;
}) {
  switch (sectionKey) {
    case "glance":
      return <GlanceBody kit={kit} />;
    case "bio":
      return <BioBody kit={kit} />;
    case "listen":
      return <ListenBody kit={kit} />;
    case "press":
      return <PressBody kit={kit} />;
    case "photos":
      return <PhotosBody kit={kit} />;
    case "live":
      return <SpotlightsBody kit={kit} />;
    case "contact":
      return <ContactBody kit={kit} />;
    case "kit":
      return (
        <Notice tone="warning">
          A downloadable PDF + ZIP is not part of this release, so this block is not
          rendered on your public page yet. Leave it where it is — the order is saved and
          it will appear the moment the download is built.
        </Notice>
      );
    case "join":
      return (
        <Notice tone="warning">
          Email capture is not part of this release, so this block is not rendered on your
          public page yet.
        </Notice>
      );
    case "cosign":
      return (
        <CoSignPanel profileId={profileId} artistName={artistName} bare />
      );
    default:
      return null;
  }
}


function GlanceBody({ kit }: { kit: UsePressKit }) {
  const facts = kit.draft.kit.facts;
  const set = (patch: Partial<typeof facts>) =>
    kit.patchKit({ facts: { ...facts, ...patch } });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <InlineField
        label="Genre"
        value={facts.genre ?? ""}
        placeholder="Street-hop · Trap"
        onChange={(v) => set({ genre: v.trim() === "" ? null : v })}
      />
      <InlineField
        label="Based in"
        value={facts.based_in ?? ""}
        placeholder="Lagos, Nigeria"
        onChange={(v) => set({ based_in: v.trim() === "" ? null : v })}
      />
      <div className="sm:col-span-2">
        <InlineField
          label="For fans of"
          value={facts.for_fans_of ?? ""}
          placeholder="Zlatan · Seyi Vibez · Shallipopi"
          hint="Two or three artists a curator will recognise."
          onChange={(v) => set({ for_fans_of: v.trim() === "" ? null : v })}
        />
      </div>
    </div>
  );
}


function BioBody({ kit }: { kit: UsePressKit }) {
  return (
    <div className="flex flex-col gap-3">
      <InlineArea
        label="Bio"
        value={kit.draft.artist.bio ?? ""}
        minRows={5}
        maxLength={2000}
        placeholder="Who you are, what you sound like, what you have done. Written so a journalist can paste it straight into a piece."
        hint="Third person reads better in press than first."
        onChange={kit.setBio}
      />
    </div>
  );
}


function ListenBody({ kit }: { kit: UsePressKit }) {
  const [url, setUrl] = useState("");
  const releases = kit.draft.releases;
  const added = releases.filter((r) => r.source === "spotify");

  const submit = async () => {
    if (!url.trim() || kit.releases.adding) return;
    const ok = await kit.addRelease(url);
    if (ok) setUrl("");
  };

  return (
    <div className="flex flex-col gap-3">
      {releases.length === 0 ? (
        <Notice>
          Nothing here yet. Releases you put out through Songdis appear automatically once
          they are live on the stores — add anything you released elsewhere below.
        </Notice>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {releases.slice(0, 12).map((release) => {
            const removing =
              release.source === "spotify" && kit.releases.removing.includes(release.id);

            return (
              <div key={`${release.source}:${release.id}`} className="min-w-0 group/rel relative">
                <div
                  className={[
                    "aspect-square rounded-lg overflow-hidden bg-white/[0.04] border border-white/[0.06] transition-opacity",
                    removing ? "opacity-30" : "",
                  ].join(" ")}
                >
                  {release.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={release.cover}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                {release.source === "spotify" && (
                  <button
                    type="button"
                    onClick={() => void kit.removeRelease(release.id)}
                    disabled={removing}
                    aria-label={`Remove ${release.title}`}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-white/70 opacity-0 group-hover/rel:opacity-100 focus-visible:opacity-100 hover:text-white hover:border-white/30 transition-opacity disabled:cursor-not-allowed"
                  >
                    {removing ? (
                      <Loader2 size={11} className="animate-spin" aria-hidden />
                    ) : (
                      <Trash2 size={11} aria-hidden />
                    )}
                  </button>
                )}

                <p className="font-body text-white/75 text-[11px] mt-1.5 truncate">
                  {release.title}
                </p>
                <div className="flex items-center gap-1.5">
                  {release.year && (
                    <p className="font-body text-white/30 text-[10px]">{release.year}</p>
                  )}
                  {release.source === "spotify" && (
                    <p className="font-body text-white/25 text-[10px]">· Added</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Link2
              size={13}
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
              disabled={kit.releases.adding}
              placeholder="Paste a Spotify song or album link"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 font-body text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 disabled:opacity-50"
            />
          </div>

          <SecondaryButton onClick={() => void submit()} disabled={kit.releases.adding || !url.trim()}>
            {kit.releases.adding ? (
              <Loader2 size={13} className="animate-spin" aria-hidden />
            ) : (
              <Plus size={13} aria-hidden />
            )}
            {kit.releases.adding ? "Adding…" : "Add release"}
          </SecondaryButton>
        </div>

        <p className="font-body text-white/30 text-[11px]">
          For music you released elsewhere. Songdis releases appear on their own once live.
          {added.length > 0 && ` ${added.length} added so far.`} Saved straight away — no
          need to press save.
        </p>
      </div>

      {kit.releases.failure && (
        <FailureNotice
          title="That release was not added"
          error={kit.releases.failure.error}
          errors={kit.releases.failure.errors}
        />
      )}
    </div>
  );
}


function PressBody({ kit }: { kit: UsePressKit }) {
  const { quotes, placements } = kit.draft.kit;
  const [placementDraft, setPlacementDraft] = useState("");

  const setQuote = (i: number, patch: Partial<PressKitQuote>) => {
    const next = quotes.map((q, idx) => (idx === i ? { ...q, ...patch } : q));
    kit.patchKit({ quotes: next });
  };

  const addPlacement = () => {
    const label = placementDraft.trim();
    if (!label) return;
    kit.patchKit({ placements: [...placements, { label }] });
    setPlacementDraft("");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Quotes */}
      <div className="flex flex-col gap-3">
        <p className="font-body text-[10px] uppercase tracking-[0.14em] text-white/40">
          Quotes
        </p>

        {quotes.length === 0 && (
          <Notice>
            No quotes yet. One line from a blog, a radio host or a playlist editor does
            more than three paragraphs of your own.
          </Notice>
        )}

        {quotes.map((quote, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/[0.07] bg-black/20 p-3 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <QuoteIcon size={14} className="text-white/25 mt-1 shrink-0" aria-hidden />
              <div className="flex-1 min-w-0">
                <InlineArea
                  label="Quote"
                  minRows={2}
                  maxLength={280}
                  value={quote.quote}
                  placeholder="One of the sharpest new voices coming out of Lagos right now."
                  onChange={(v) => setQuote(i, { quote: v })}
                />
              </div>
              <IconButton
                label="Remove this quote"
                onClick={() =>
                  kit.patchKit({ quotes: quotes.filter((_, idx) => idx !== i) })
                }
              >
                <Trash2 size={14} aria-hidden />
              </IconButton>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:pl-7">
              <InlineField
                label="Source"
                value={quote.source}
                placeholder="Music Blog"
                onChange={(v) => setQuote(i, { source: v })}
              />
              <InlineField
                label="Year"
                value={quote.year}
                maxLength={4}
                inputMode="text"
                placeholder="2026"
                onChange={(v) => setQuote(i, { year: v.replace(/[^0-9]/g, "") })}
              />
            </div>
          </div>
        ))}

        <SecondaryButton
          onClick={() =>
            kit.patchKit({ quotes: [...quotes, { quote: "", source: "", year: "" }] })
          }
        >
          <Plus size={13} aria-hidden />
          Add a quote
        </SecondaryButton>
      </div>

      {/* Placements */}
      <div className="flex flex-col gap-3">
        <p className="font-body text-[10px] uppercase tracking-[0.14em] text-white/40">
          Placements
        </p>

        {placements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {placements.map((placement, i) => (
              <span
                key={`${placement.label}-${i}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3.5 pr-1.5 py-1.5"
              >
                <span className="font-body text-white/80 text-[12px]">
                  {placement.label}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${placement.label}`}
                  onClick={() =>
                    kit.patchKit({ placements: placements.filter((_, idx) => idx !== i) })
                  }
                  className="w-5 h-5 rounded-full grid place-items-center text-white/40 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
                >
                  <Trash2 size={11} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <InlineField
              label="Add a placement"
              value={placementDraft}
              placeholder="Spotify · Naija Hits"
              onChange={setPlacementDraft}
            />
          </div>
          <div className="pb-0.5">
            <SecondaryButton onClick={addPlacement} disabled={placementDraft.trim() === ""}>
              <Plus size={13} aria-hidden />
              Add
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}


function PhotosBody({ kit }: { kit: UsePressKit }) {
  return (
    <div className="flex flex-col gap-3">
      <MediaGrid
        items={kit.draft.photos}
        removing={kit.media.removing}
        onRemove={(id) => void kit.removeMedia(id)}
        emptyLabel="No press photos yet."
      />

      <div className="flex items-center gap-2 flex-wrap">
        <FilePicker
          disabled={kit.media.uploading}
          onPick={(file) => void kit.addPhoto(file)}
        >
          {(open) => (
            <SecondaryButton onClick={open} disabled={kit.media.uploading}>
              {kit.media.uploading ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <ImagePlus size={13} aria-hidden />
              )}
              {kit.media.uploading ? "Uploading…" : "Add a photo"}
            </SecondaryButton>
          )}
        </FilePicker>
        <span className="font-body text-white/30 text-[11px]">
          Photos upload straight away — no need to save.
        </span>
      </div>

      {kit.media.failure && (
        <FailureNotice
          title="That photo did not upload"
          error={kit.media.failure.error}
          errors={kit.media.failure.errors}
        />
      )}
    </div>
  );
}


function SpotlightsBody({ kit }: { kit: UsePressKit }) {
  const [pending, setPending] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const reset = () => {
    setPending(null);
    setTitle("");
    setDescription("");
  };

  const submit = async () => {
    if (!pending) return;
    const ok = await kit.addSpotlight(pending, title, description);
    if (ok) reset();
  };

  return (
    <div className="flex flex-col gap-3">
      {kit.draft.spotlights.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
          {kit.draft.spotlights.map((item) => (
            <SpotlightTile
              key={item.id}
              item={item}
              removing={kit.media.removing.includes(item.id)}
              onRemove={() => void kit.removeMedia(item.id)}
            />
          ))}
        </div>
      )}

      {kit.draft.spotlights.length === 0 && !pending && (
        <Notice>
          Nothing here yet. A spotlight is a show, a festival slot or a milestone — one
          image with a line about it.
        </Notice>
      )}

      {pending ? (
        <div className="rounded-lg border border-white/[0.08] bg-black/20 p-3 flex flex-col gap-3">
          <p className="font-body text-white/70 text-[12px] truncate">{pending.name}</p>
          <InlineField
            label="Title"
            value={title}
            maxLength={120}
            placeholder="Headline show"
            onChange={setTitle}
          />
          <InlineArea
            label="Description"
            value={description}
            minRows={2}
            placeholder="The Warehouse, Lagos — Aug 2026."
            onChange={setDescription}
          />
          <div className="flex items-center gap-2">
            <SecondaryButton
              onClick={() => void submit()}
              disabled={kit.media.uploading || title.trim() === ""}
            >
              {kit.media.uploading ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <Plus size={13} aria-hidden />
              )}
              {kit.media.uploading ? "Uploading…" : "Add spotlight"}
            </SecondaryButton>
            <SecondaryButton onClick={reset} disabled={kit.media.uploading}>
              Cancel
            </SecondaryButton>
          </div>
          {title.trim() === "" && (
            <p className="font-body text-white/35 text-[11px]">
              A title is what appears under the circle — without one the spotlight reads
              as a stray photo.
            </p>
          )}
        </div>
      ) : (
        <FilePicker disabled={kit.media.uploading} onPick={setPending}>
          {(open) => (
            <SecondaryButton onClick={open} disabled={kit.media.uploading}>
              <Plus size={13} aria-hidden />
              Add a spotlight
            </SecondaryButton>
          )}
        </FilePicker>
      )}

      {kit.media.failure && (
        <FailureNotice
          title="That spotlight did not upload"
          error={kit.media.failure.error}
          errors={kit.media.failure.errors}
        />
      )}
    </div>
  );
}

function SpotlightTile({
  item,
  removing,
  onRemove,
}: {
  item: PressKitMediaItem;
  removing: boolean;
  onRemove: () => void;
}) {
  return (
    <div className={`w-20 shrink-0 text-center ${removing ? "opacity-40" : ""}`}>
      <div
        className="w-20 h-20 rounded-full p-[2.5px] relative"
        style={{ background: `linear-gradient(135deg, ${ACCENT_TEXT}, #f5a623)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.title ?? ""}
          className="w-full h-full rounded-full object-cover border-[2.5px] border-[#180F0F]"
          loading="lazy"
        />
        <button
          type="button"
          aria-label={`Remove ${item.title ?? "spotlight"}`}
          onClick={onRemove}
          disabled={removing || item.id <= 0}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full grid place-items-center bg-[#0E0808] border border-white/15 text-white/60 hover:text-white disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
        >
          <Trash2 size={11} aria-hidden />
        </button>
      </div>
      <p className="font-body text-white/70 text-[11px] mt-1.5 truncate">
        {item.title ?? "Untitled"}
      </p>
    </div>
  );
}


function ContactBody({ kit }: { kit: UsePressKit }) {
  const contacts = kit.draft.kit.contacts;
  const set = (patch: Partial<typeof contacts>) =>
    kit.patchKit({ contacts: { ...contacts, ...patch } });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <InlineField
        label="Bookings"
        type="email"
        inputMode="email"
        value={contacts.bookings ?? ""}
        placeholder="bookings@yourname.com"
        onChange={(v) => set({ bookings: v.trim() === "" ? null : v.trim() })}
      />
      <InlineField
        label="Management"
        type="email"
        inputMode="email"
        value={contacts.management ?? ""}
        placeholder="mgmt@yourname.com"
        onChange={(v) => set({ management: v.trim() === "" ? null : v.trim() })}
      />
      <div className="sm:col-span-2">
        <InlineField
          label="Press / sync"
          type="email"
          inputMode="email"
          value={contacts.press ?? ""}
          placeholder="press@yourname.com"
          hint="Leave any of these blank and the row simply will not appear."
          onChange={(v) => set({ press: v.trim() === "" ? null : v.trim() })}
        />
      </div>
    </div>
  );
}


function MediaGrid({
  items,
  removing,
  onRemove,
  emptyLabel,
}: {
  items: PressKitMediaItem[];
  removing: number[];
  onRemove: (id: number) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <Notice>{emptyLabel}</Notice>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {items.map((item) => {
        const busy = removing.includes(item.id);
        return (
          <div
            key={item.id}
            className={`relative aspect-square rounded-lg overflow-hidden border border-white/[0.06] ${
              busy ? "opacity-40" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            <button
              type="button"
              aria-label="Remove this photo"
              onClick={() => onRemove(item.id)}
              disabled={busy || item.id <= 0}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full grid place-items-center bg-black/65 backdrop-blur-sm text-white/80 hover:text-white border border-white/15 disabled:opacity-30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
            >
              <Trash2 size={12} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
