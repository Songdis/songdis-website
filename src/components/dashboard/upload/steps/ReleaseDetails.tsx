"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { UploadState } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";

/* ─── AI Artwork Generator sub-modal ─────────────────────────── */
function ArtworkGenerator({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [theme, setTheme] = useState("");
  const [visual, setVisual] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedTag, setSelectedTag] = useState("Auto-futurist");
  const [generated, setGenerated] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tags = ["Auto-futurist", "Bold & Minimal", "Streets Afrobeats"];

  const handleGenerate = async () => {
    setLoading(true);
    // Mock generated images — swap for real API call
    await new Promise((r) => setTimeout(r, 1200));
    setGenerated([
      "/images/generated/art-1.jpg",
      "/images/generated/art-2.jpg",
      "/images/generated/art-3.jpg",
      "/images/generated/art-4.jpg",
    ]);
    setSelectedImage("/images/generated/art-1.jpg");
    setLoading(false);
  };

  const showResults = generated.length > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[860px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <StepHeader title="AI Artwork Generator" subtitle="Create unique album art with AI" />
        <StepProgress current={1} />

        <div className="flex flex-col gap-5">
          <Field label="Themes & Concepts">
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g dark and moody"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>

          <Field label="Visual elements (optional)">
            <textarea
              value={visual}
              onChange={(e) => setVisual(e.target.value)}
              placeholder="e.g include city skyline, show energy, red and gold colors..."
              rows={3}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
            />
          </Field>

          {/* Ayo suggestions */}
          <div className="flex items-start gap-3 rounded-xl border border-[#C30100]/20 bg-[#C30100]/5 px-4 py-4">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0"><AyoIcon /></div>
            <div>
              <p className="font-body text-yellow-400 text-xs font-semibold mb-1">
                Ayo suggests for <span className="text-white">"your release"</span>
              </p>
              <p className="font-body text-white/60 text-xs leading-relaxed mb-3">
                Based on your Afrobeats genre, bold colors and high-energy compositions typically perform best for playlist editorial consideration.
                Suggested mood: <span className="text-[#C30100]">Afrobeats energy, vibrant</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={[
                      "font-body text-xs px-3 py-1.5 rounded-full border transition-colors",
                      selectedTag === t
                        ? "border-[#C30100] bg-[#C30100]/20 text-white"
                        : "border-white/20 text-white/50 hover:border-white/40",
                    ].join(" ")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Field label={showResults ? "Use your own prompt or add a reference artwork using the attachment" : "Use your own prompt"}>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g include city skyline, show energy, red and gold colors..."
                rows={3}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 pr-10 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
              />
              {showResults && (
                <button className="absolute bottom-3 right-3 text-white/40 hover:text-white transition-colors">
                  <AttachIcon />
                </button>
              )}
            </div>
          </Field>

          {/* Generated options */}
          {showResults && (
            <div>
              <p className="font-body text-white text-sm mb-3">Choose a generated option</p>
              <div className="grid grid-cols-4 gap-3">
                {generated.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={[
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      selectedImage === img ? "border-[#C30100]" : "border-transparent",
                    ].join(" ")}
                  >
                    <div className="w-full h-full bg-[#0E0808] flex items-center justify-center text-white/20 text-xs">
                      Art {i + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate / action buttons */}
          {!showResults ? (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-4 transition-all flex items-center justify-center gap-2"
            >
              <SparkleIcon />
              {loading ? "Generating..." : "Generate"}
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setGenerated([])} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                Back
              </button>
              <button onClick={handleGenerate} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors flex items-center justify-center gap-2">
                <SaveIcon /> Save Draft
              </button>
              <button
                onClick={() => { if (selectedImage) onSelect(selectedImage); onClose(); }}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Form field wrapper ──────────────────────────────────────── */
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
      {hint && <p className="font-body text-white/30 text-[11px] leading-relaxed">{hint}</p>}
    </div>
  );
}

function DashSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronIcon />
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
interface Props {
  state: UploadState;
  update: (patch: Partial<UploadState>) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
}

export default function ReleaseDetails({ state, update, onBack, onContinue, onSaveDraft }: Props) {
  const [artworkGen, setArtworkGen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const releaseTypeLabel =
    state.releaseType === "single" ? "Upload Single" :
    state.releaseType === "album" ? "Upload Album" : "Upload Mixtape";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    update({ artwork: url, artworkFile: file });
  };

  return (
    <>
      <div className="p-8 max-h-[90vh] overflow-y-auto">
        <StepHeader
          title={releaseTypeLabel}
          subtitle="Complete all steps to submit your release for distribution"
        />
        <StepProgress current={1} />

        {/* Generate with Ayo */}
        <button
          onClick={() => setArtworkGen(true)}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] py-4 mb-5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <AyoIcon />
          </div>
          <span className="font-body text-[#C30100] text-sm">Generate with Ayo</span>
        </button>

        {/* Artwork upload */}
        {state.artwork ? (
          <div className="relative w-40 h-40 mx-auto mb-6 rounded-xl overflow-hidden group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Image src={state.artwork} alt="Artwork" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="font-body text-white text-xs">Change</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#C30100]/40 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#C30100]/70 transition-colors mb-5 group"
          >
            <UploadIcon />
            <p className="font-body text-white/50 text-sm">Click to upload artwork</p>
            <p className="font-body text-white/25 text-xs">or drag and drop · Min 3000×3000px · Max 10MB</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Field
            label="Release Title"
            hint="Enter your song or project name exactly as you want it shown. Double-check spelling — this is what fans will see on all platforms."
          >
            <input
              value={state.releaseTitle}
              onChange={(e) => update({ releaseTitle: e.target.value })}
              placeholder="e.g Scatter the place"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>

          <Field
            label="Release Version (Optional)"
            hint="Leave this empty unless it is a special version like a Remix or Deluxe Edition. For a normal release, skip it."
          >
            <input
              value={state.releaseVersion}
              onChange={(e) => update({ releaseVersion: e.target.value })}
              placeholder="eg deluxe, remix"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>

          <Field
            label="Primary Artist"
            hint="Choose your artist name. If someone else is featured on the song, you will add them in the next step — not here."
          >
            <input
              value={state.primaryArtist}
              onChange={(e) => update({ primaryArtist: e.target.value })}
              placeholder="e.g. Vjazzy"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>

          <Field
            label="Label"
            hint="This is the label name that appears on stores next to your music. It defaults to SongDis Ltd."
          >
            <input
              value={state.label}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="Your label name for this release"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>

          <Field label="Meta data language" hint="What language is your song title written in?">
            <DashSelect value={state.metaLanguage} onChange={(v) => update({ metaLanguage: v })} options={["English", "French", "Spanish", "Yoruba", "Igbo", "Hausa"]} />
          </Field>

          <Field label="UPC Code (Optional)" hint="Leave this empty. We will give you one for free.">
            <input
              value={state.upcCode}
              onChange={(e) => update({ upcCode: e.target.value })}
              placeholder="Auto generated if left blank"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>

          <Field label="C Line (Copyright)" hint="Who owns the song/lyrics? (Usually the Songwriter or Publisher)">
            <DashSelect value={state.cLine} onChange={(v) => update({ cLine: v })} options={["2026", "2025", "2024", "2023"]} />
          </Field>

          <Field label="P Line" hint="Who owns the audio recording? (Usually the Artist or Label)">
            <DashSelect value={state.pLine} onChange={(v) => update({ pLine: v })} options={["2026", "2025", "2024", "2023"]} />
          </Field>

          <Field label="Release Type" hint="1 to 3 songs = Single. 4 to 6 songs = EP. 7 or more songs = Album.">
            <input
              value={
                state.releaseType === "single" ? "Single" :
                state.releaseType === "mixtape"
                  ? (state.noOfTracks >= 7 ? "Mixtape (Album)" : state.noOfTracks >= 4 ? "Mixtape (EP)" : "Mixtape")
                  : state.noOfTracks >= 7 ? "Album" :
                state.noOfTracks >= 4 ? "EP" : "Album/EP"
              }
              disabled
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white/50 text-sm outline-none cursor-not-allowed"
            />
          </Field>

          <Field
            label="No of Tracks"
            hint={state.releaseType === "single" ? "Singles can only have 1 track." : "Enter the number of tracks in your release."}
          >
            <input
              type="number"
              min={1}
              max={50}
              value={state.noOfTracks}
              disabled={state.releaseType === "single"}
              onChange={(e) => update({ noOfTracks: Math.max(1, parseInt(e.target.value) || 1) })}
              className={[
                "w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors",
                state.releaseType === "single" ? "text-white/50 cursor-not-allowed" : "",
              ].join(" ")}
            />
          </Field>

          <Field label="Explicit Content" hint="Does your song contain strong language or adult content?">
            <DashSelect value={state.explicitContent} onChange={(v) => update({ explicitContent: v })} options={["Yes", "No", "Clean"]} />
          </Field>

          <Field label="Cover Art AI Use" hint="If you used AI to make your cover art, notify it. Some stores need to know this.">
            <DashSelect value={state.coverArtAiUse} onChange={(v) => update({ coverArtAiUse: v })} options={["None", "Partial AI", "Fully AI Generated"]} />
          </Field>
        </div>

        <div className="mt-8">
          <StepActions
            onBack={onBack}
            onSaveDraft={onSaveDraft}
            onContinue={onContinue}
          />
        </div>
      </div>

      {artworkGen && (
        <ArtworkGenerator
          onClose={() => setArtworkGen(false)}
          onSelect={(url) => update({ artwork: url })}
        />
      )}
    </>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function UploadIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function AyoIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#C30100"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SparkleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }
function SaveIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>; }
function AttachIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>; }