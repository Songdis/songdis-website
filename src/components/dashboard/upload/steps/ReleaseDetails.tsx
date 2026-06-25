// "use client";

// import { useState, useRef, useCallback, useEffect } from "react";
// import Image from "next/image";
// import type { UploadState } from "../UploadModal";
// import { StepHeader, StepProgress, StepActions } from "../UploadModal";
// import { getArtSuggestions, generateArt, getArtStatus } from "@/lib/api/ayo";
// import { useToast } from "@/components/ui/Toast";

// /* ─── Ayo Artwork Generator modal ─────────────────────────────── */
// /* DES-011: wired to real Ayo API endpoints */
// function ArtworkGenerator({
//   onClose,
//   onSelect,
// }: {
//   onClose: () => void;
//   onSelect: (url: string) => void;
// }) {
//   const [theme, setTheme] = useState("");
//   const [visual, setVisual] = useState("");
//   const [prompt, setPrompt] = useState("");
//   const [selectedTag, setSelectedTag] = useState("");
//   const [suggestions, setSuggestions] = useState<string[]>([]);
//   const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
//   const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [genStatus, setGenStatus] = useState("");
//   const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const { error: toastError } = useToast();

//   useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

//   const handleGetSuggestions = async () => {
//     if (!theme.trim()) return;
//     setIsLoadingSuggestions(true);
//     setSuggestions([]);
//     const res = await getArtSuggestions({ themes: theme, imagery: visual });
//     if (res.error) {
//       toastError("Failed to get suggestions", res.error);
//     } else {
//       const d = res.data as Record<string, unknown>;
//       const list = ((d?.suggestions ?? d?.prompts ?? []) as string[]);
//       setSuggestions(list);
//     }
//     setIsLoadingSuggestions(false);
//   };

//   const startPolling = useCallback((jobId: string) => {
//     if (pollRef.current) clearInterval(pollRef.current);
//     pollRef.current = setInterval(async () => {
//       const res = await getArtStatus(jobId);
//       if (res.error) {
//         clearInterval(pollRef.current!);
//         setIsGenerating(false);
//         toastError("Artwork generation failed", res.error);
//         return;
//       }
//       const d = res.data as Record<string, unknown>;
//       const imageUrl = (d?.imageUrl ?? d?.image_url) as string | undefined;
//       setGenStatus((d?.status as string) ?? "");
//       if (d?.status === "completed" || imageUrl) {
//         clearInterval(pollRef.current!);
//         setIsGenerating(false);
//         if (imageUrl) setGeneratedUrl(imageUrl);
//       } else if (d?.status === "failed") {
//         clearInterval(pollRef.current!);
//         setIsGenerating(false);
//         toastError("Artwork generation failed", "Please try again.");
//       }
//     }, 3000);
//   }, [toastError]);

//   const handleGenerate = async () => {
//     if (!prompt.trim()) return;
//     setIsGenerating(true);
//     setGeneratedUrl(null);
//     setGenStatus("pending");

//     const res = await generateArt({ prompt });
//     if (res.error) {
//       toastError("Failed to start generation", res.error);
//       setIsGenerating(false);
//       return;
//     }

//     const d = res.data as Record<string, unknown>;
//     const imageUrl = (d?.imageUrl ?? d?.image_url) as string | undefined;

//     if (imageUrl) {
//       setGeneratedUrl(imageUrl);
//       setIsGenerating(false);
//       return;
//     }

//     const jobId = (d?.job_id ?? d?.jobId) as string | undefined;
//     if (jobId) {
//       startPolling(jobId);
//     } else {
//       setIsGenerating(false);
//     }
//   };

//   const tags = ["Auto-futurist", "Bold & Minimal", "Streets Afrobeats"];

//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6" onClick={onClose}>
//       <div
//         className="relative w-full max-w-[860px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 overflow-y-auto max-h-[90vh]"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
//           <CloseIcon />
//         </button>

//         <StepHeader title="AI Artwork Generator" subtitle="Create unique album art with Ayo AI" />

//         <div className="flex flex-col gap-5">
//           {/* Step 1: Themes + suggestions */}
//           <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
//             <p className="font-body text-white text-xs font-semibold mb-0.5">Step 1 — Describe your vision</p>
//             <p className="font-body text-white/50 text-[11px] mb-3">Tell Ayo your themes and visual ideas to get AI-crafted prompts</p>
//             <div className="flex flex-col gap-3">
//               <Field label="Themes & Concepts">
//                 <input value={theme} onChange={(e) => setTheme(e.target.value)}
//                   placeholder="e.g. dark and moody, celebration, Afrobeats energy"
//                   className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//               </Field>
//               <Field label="Visual Elements (optional)">
//                 <input value={visual} onChange={(e) => setVisual(e.target.value)}
//                   placeholder="e.g. city skyline, golden sunset, village setting"
//                   className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//               </Field>
//               <button
//                 onClick={handleGetSuggestions}
//                 disabled={isLoadingSuggestions || !theme.trim()}
//                 className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 hover:border-white/40 py-3.5 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
//               >
//                 {isLoadingSuggestions ? (
//                   <><SpinIcon /> Getting suggestions...</>
//                 ) : "Get Prompt Suggestions"}
//               </button>
//             </div>

//             {suggestions.length > 0 && (
//               <div className="mt-4 flex flex-col gap-2">
//                 <p className="font-body text-white/50 text-xs mb-1">Click a suggestion to use it as your prompt:</p>
//                 {suggestions.map((s, i) => (
//                   <button key={i} onClick={() => setPrompt(s)}
//                     className={["text-left font-body text-xs rounded-xl border px-4 py-3 transition-colors leading-relaxed",
//                       prompt === s ? "border-[#C30100]/50 bg-[#C30100]/10 text-white" : "border-white/[0.06] bg-[#0E0808] text-white/60 hover:border-white/20 hover:text-white"].join(" ")}>
//                     {s}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Step 2: Generate */}
//           <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
//             <p className="font-body text-white text-xs font-semibold mb-0.5">Step 2 — Generate Artwork</p>
//             <p className="font-body text-white/50 text-[11px] mb-3">Use a suggestion above or write your own custom prompt</p>
//             <Field label="Prompt">
//               <textarea
//                 value={prompt}
//                 onChange={(e) => setPrompt(e.target.value)}
//                 placeholder="Describe the artwork you want to generate..."
//                 rows={4}
//                 className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
//               />
//             </Field>
//             <button
//               onClick={handleGenerate}
//               disabled={isGenerating || !prompt.trim()}
//               className="mt-3 w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
//             >
//               {isGenerating ? (
//                 <><SpinIcon /> {genStatus === "processing" ? "Processing..." : "Generating..."}</>
//               ) : (
//                 <><SparkleIcon /> Generate Artwork</>
//               )}
//             </button>
//           </div>

//           {/* Result */}
//           {generatedUrl && (
//             <div className="rounded-xl border border-[#C30100]/30 p-4">
//               <p className="font-body text-white text-xs font-semibold mb-3">Generated Artwork</p>
//               <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0E0808] mb-4">
//                 <Image src={generatedUrl} alt="Generated artwork" fill className="object-cover" unoptimized />
//               </div>
//               <div className="flex gap-3">
//                 <button onClick={() => { setGeneratedUrl(null); setPrompt(""); }}
//                   className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
//                   Regenerate
//                 </button>
//                 <button
//                   onClick={() => { onSelect(generatedUrl); onClose(); }}
//                   className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
//                 >
//                   Use This Artwork
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─── Field wrapper ───────────────────────────────────────────── */
// function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
//   return (
//     <div className="flex flex-col gap-1.5">
//       <label className="font-body text-white/70 text-xs">{label}</label>
//       {children}
//       {hint && <p className="font-body text-white/30 text-[11px] leading-relaxed">{hint}</p>}
//     </div>
//   );
// }

// function DashSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
//   return (
//     <div className="relative">
//       <select value={value} onChange={(e) => onChange(e.target.value)}
//         className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8">
//         {options.map((o) => <option key={o} value={o}>{o}</option>)}
//       </select>
//       <ChevronIcon />
//     </div>
//   );
// }

// /* ─── Main component ──────────────────────────────────────────── */
// interface Props {
//   state: UploadState;
//   update: (patch: Partial<UploadState>) => void;
//   onBack: () => void;
//   onContinue: () => void;
//   onSaveDraft?: () => void;
// }

// export default function ReleaseDetails({ state, update, onBack, onContinue, onSaveDraft }: Props) {
//   const [artworkGen, setArtworkGen] = useState(false);
//   const fileRef = useRef<HTMLInputElement>(null);

//   const releaseTypeLabel =
//     state.releaseType === "single" ? "Upload Single" :
//     state.releaseType === "album" ? "Upload Album" : "Upload Mixtape";

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const url = URL.createObjectURL(file);
//     update({ artwork: url, artworkFile: file });
//   };

//   return (
//     <>
//       <div className="p-8 max-h-[90vh] overflow-y-auto">
//         <StepHeader title={releaseTypeLabel} subtitle="Complete all steps to submit your release for distribution" />
//         <StepProgress current={1} />

//         {/* Generate with Ayo — DES-011: opens wired modal */}
//         <button
//           onClick={() => setArtworkGen(true)}
//           className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] py-4 mb-5 transition-colors"
//         >
//           <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
//             <AyoIcon />
//           </div>
//           <span className="font-body text-[#C30100] text-sm">Generate Cover Art with Ayo</span>
//         </button>

//         {/* Artwork upload */}
//         {state.artwork ? (
//           <div className="relative w-40 h-40 mx-auto mb-6 rounded-xl overflow-hidden group cursor-pointer" onClick={() => fileRef.current?.click()}>
//             <Image src={state.artwork} alt="Artwork" fill className="object-cover" unoptimized />
//             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//               <p className="font-body text-white text-xs">Change</p>
//             </div>
//           </div>
//         ) : (
//           <button onClick={() => fileRef.current?.click()}
//             className="w-full border-2 border-dashed border-[#C30100]/40 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#C30100]/70 transition-colors mb-5">
//             <UploadIcon />
//             <p className="font-body text-white/50 text-sm">Click to upload artwork</p>
//             <p className="font-body text-white/25 text-xs">or drag and drop · Min 3000×3000px · Max 10MB</p>
//           </button>
//         )}
//         <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

//         {/* Form grid */}
//         <div className="grid grid-cols-2 gap-x-6 gap-y-5">
//           <Field label="Release Title" hint="Enter your song or project name exactly as you want it shown.">
//             <input value={state.releaseTitle} onChange={(e) => update({ releaseTitle: e.target.value })}
//               placeholder="e.g Scatter the place"
//               className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//           </Field>

//           <Field label="Release Version (Optional)" hint="Leave empty unless Remix or Deluxe Edition.">
//             <input value={state.releaseVersion} onChange={(e) => update({ releaseVersion: e.target.value })}
//               placeholder="eg deluxe, remix"
//               className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//           </Field>

//           <Field label="Primary Artist" hint="Your artist name. Add features in the next step.">
//             <input value={state.primaryArtist} onChange={(e) => update({ primaryArtist: e.target.value })}
//               placeholder="e.g. Vjazzy"
//               className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//           </Field>

//           <Field label="Label" hint="Label name that appears on stores. Defaults to SongDis Ltd.">
//             <input value={state.label} onChange={(e) => update({ label: e.target.value })}
//               placeholder="Your label name for this release"
//               className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//           </Field>

//           <Field label="Meta data language" hint="What language is your song title written in?">
//             <DashSelect value={state.metaLanguage} onChange={(v) => update({ metaLanguage: v })}
//               options={["English", "French", "Spanish", "Yoruba", "Igbo", "Hausa"]} />
//           </Field>

//           <Field label="UPC Code (Optional)" hint="Leave empty. We will give you one for free.">
//             <input value={state.upcCode} onChange={(e) => update({ upcCode: e.target.value })}
//               placeholder="Auto generated if left blank"
//               className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
//           </Field>

//           <Field label="C Line (Copyright)" hint="Who owns the song/lyrics?">
//             <DashSelect value={state.cLine} onChange={(v) => update({ cLine: v })} options={["2026", "2025", "2024", "2023"]} />
//           </Field>

//           <Field label="P Line" hint="Who owns the audio recording?">
//             <DashSelect value={state.pLine} onChange={(v) => update({ pLine: v })} options={["2026", "2025", "2024", "2023"]} />
//           </Field>

//           <Field label="Release Type" hint="1–3 songs = Single. 4–6 = EP. 7+ = Album.">
//             <input
//               value={state.releaseType === "single" ? "Single" : state.noOfTracks >= 7 ? "Album" : state.noOfTracks >= 4 ? "EP" : "Album/EP"}
//               disabled
//               className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white/50 text-sm outline-none cursor-not-allowed" />
//           </Field>

//           <Field label="No of Tracks" hint={state.releaseType === "single" ? "Singles can only have 1 track." : "Enter the number of tracks."}>
//             <input type="number" min={1} max={50} value={state.noOfTracks}
//               disabled={state.releaseType === "single"}
//               onChange={(e) => update({ noOfTracks: Math.max(1, parseInt(e.target.value) || 1) })}
//               className={["w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors",
//                 state.releaseType === "single" ? "text-white/50 cursor-not-allowed" : ""].join(" ")} />
//           </Field>

//           <Field label="Explicit Content" hint="Does your song contain strong language or adult content?">
//             <DashSelect value={state.explicitContent} onChange={(v) => update({ explicitContent: v })} options={["Yes", "No", "Clean"]} />
//           </Field>

//           <Field label="Cover Art AI Use" hint="If you used AI to make your cover art, notify it.">
//             <DashSelect value={state.coverArtAiUse} onChange={(v) => update({ coverArtAiUse: v })} options={["None", "Partial AI", "Fully AI Generated"]} />
//           </Field>
//         </div>

//         <div className="mt-8">
//           <StepActions onBack={onBack} onSaveDraft={onSaveDraft} onContinue={onContinue} />
//         </div>
//       </div>

//       {artworkGen && (
//         <ArtworkGenerator
//           onClose={() => setArtworkGen(false)}
//           onSelect={(url) => {
//             update({ artwork: url, coverArtAiUse: "Fully AI Generated" });
//           }}
//         />
//       )}
//     </>
//   );
// }

// /* ─── Icons ───────────────────────────────────────────────────── */
// function UploadIcon() { return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
// function AyoIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#C30100"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }
// function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
// function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
// function SparkleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }
// function SpinIcon() { return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>; }


"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import type { UploadState } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";
import { getArtSuggestions, generateArt, getArtStatus } from "@/lib/api/ayo";
import { useToast } from "@/components/ui/Toast";

/* ─── Ayo Artwork Generator modal ─────────────────────────────── */
/* DES-011: wired to real Ayo API endpoints */
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
  const [selectedTag, setSelectedTag] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { error: toastError } = useToast();

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleGetSuggestions = async () => {
    if (!theme.trim()) return;
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    const res = await getArtSuggestions({ themes: theme, imagery: visual });
    if (res.error) {
      toastError("Failed to get suggestions", res.error);
    } else {
      const d = res.data as Record<string, unknown>;
      const list = ((d?.suggestions ?? d?.prompts ?? []) as string[]);
      setSuggestions(list);
    }
    setIsLoadingSuggestions(false);
  };

  const startPolling = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await getArtStatus(jobId);
      if (res.error) {
        clearInterval(pollRef.current!);
        setIsGenerating(false);
        toastError("Artwork generation failed", res.error);
        return;
      }
      const d = res.data as Record<string, unknown>;
      const imageUrl = (d?.imageUrl ?? d?.image_url) as string | undefined;
      setGenStatus((d?.status as string) ?? "");
      if (d?.status === "completed" || imageUrl) {
        clearInterval(pollRef.current!);
        setIsGenerating(false);
        if (imageUrl) setGeneratedUrl(imageUrl);
      } else if (d?.status === "failed") {
        clearInterval(pollRef.current!);
        setIsGenerating(false);
        toastError("Artwork generation failed", "Please try again.");
      }
    }, 3000);
  }, [toastError]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedUrl(null);
    setGenStatus("pending");

    const res = await generateArt({ prompt });
    if (res.error) {
      toastError("Failed to start generation", res.error);
      setIsGenerating(false);
      return;
    }

    const d = res.data as Record<string, unknown>;
    const imageUrl = (d?.imageUrl ?? d?.image_url) as string | undefined;

    if (imageUrl) {
      setGeneratedUrl(imageUrl);
      setIsGenerating(false);
      return;
    }

    const jobId = (d?.job_id ?? d?.jobId) as string | undefined;
    if (jobId) {
      startPolling(jobId);
    } else {
      setIsGenerating(false);
    }
  };

  const tags = ["Auto-futurist", "Bold & Minimal", "Streets Afrobeats"];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6" onClick={onClose}>
      <div
        className="relative w-full max-w-[860px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <StepHeader title="AI Artwork Generator" subtitle="Create unique album art with Ayo AI" />

        <div className="flex flex-col gap-5">
          {/* Step 1: Themes + suggestions */}
          <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
            <p className="font-body text-white text-xs font-semibold mb-0.5">Step 1 — Describe your vision</p>
            <p className="font-body text-white/50 text-[11px] mb-3">Tell Ayo your themes and visual ideas to get AI-crafted prompts</p>
            <div className="flex flex-col gap-3">
              <Field label="Themes & Concepts">
                <input value={theme} onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. dark and moody, celebration, Afrobeats energy"
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
              </Field>
              <Field label="Visual Elements (optional)">
                <input value={visual} onChange={(e) => setVisual(e.target.value)}
                  placeholder="e.g. city skyline, golden sunset, village setting"
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
              </Field>
              <button
                onClick={handleGetSuggestions}
                disabled={isLoadingSuggestions || !theme.trim()}
                className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 hover:border-white/40 py-3.5 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isLoadingSuggestions ? (
                  <><SpinIcon /> Getting suggestions...</>
                ) : "Get Prompt Suggestions"}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="font-body text-white/50 text-xs mb-1">Click a suggestion to use it as your prompt:</p>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => setPrompt(s)}
                    className={["text-left font-body text-xs rounded-xl border px-4 py-3 transition-colors leading-relaxed",
                      prompt === s ? "border-[#C30100]/50 bg-[#C30100]/10 text-white" : "border-white/[0.06] bg-[#0E0808] text-white/60 hover:border-white/20 hover:text-white"].join(" ")}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Generate */}
          <div className="rounded-xl border border-dashed border-[#C30100]/30 p-4">
            <p className="font-body text-white text-xs font-semibold mb-0.5">Step 2 — Generate Artwork</p>
            <p className="font-body text-white/50 text-[11px] mb-3">Use a suggestion above or write your own custom prompt</p>
            <Field label="Prompt">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the artwork you want to generate..."
                rows={4}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
              />
            </Field>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-3 w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <><SpinIcon /> {genStatus === "processing" ? "Processing..." : "Generating..."}</>
              ) : (
                <><SparkleIcon /> Generate Artwork</>
              )}
            </button>
          </div>

          {/* Result */}
          {generatedUrl && (
            <div className="rounded-xl border border-[#C30100]/30 p-4">
              <p className="font-body text-white text-xs font-semibold mb-3">Generated Artwork</p>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#0E0808] mb-4">
                <Image src={generatedUrl} alt="Generated artwork" fill className="object-cover" unoptimized />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setGeneratedUrl(null); setPrompt(""); }}
                  className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                  Regenerate
                </button>
                <button
                  onClick={() => { onSelect(generatedUrl); onClose(); }}
                  className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
                >
                  Use This Artwork
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Field wrapper ───────────────────────────────────────────── */
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
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8">
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
        <StepHeader title={releaseTypeLabel} subtitle="Complete all steps to submit your release for distribution" />
        <StepProgress current={1} />

        {/* Generate with Ayo — DES-011: opens wired modal */}
        <button
          onClick={() => setArtworkGen(true)}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] py-4 mb-5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <AyoIcon />
          </div>
          <span className="font-body text-[#C30100] text-sm">Generate Cover Art with Ayo</span>
        </button>

        {/* Artwork upload */}
        {state.artwork ? (
          <div className="relative w-40 h-40 mx-auto mb-6 rounded-xl overflow-hidden group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Image src={state.artwork} alt="Artwork" fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="font-body text-white text-xs">Change</p>
            </div>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#C30100]/40 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#C30100]/70 transition-colors mb-5">
            <UploadIcon />
            <p className="font-body text-white/50 text-sm">Click to upload artwork</p>
            <p className="font-body text-white/25 text-xs">or drag and drop · Min 3000×3000px · Max 10MB</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Form grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Release Title" hint="Enter your song or project name exactly as you want it shown.">
            <input value={state.releaseTitle} onChange={(e) => update({ releaseTitle: e.target.value })}
              placeholder="e.g Scatter the place"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          <Field label="Release Version (Optional)" hint="Leave empty unless Remix or Deluxe Edition.">
            <input value={state.releaseVersion} onChange={(e) => update({ releaseVersion: e.target.value })}
              placeholder="eg deluxe, remix"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          <Field label="Primary Artist" hint="Your artist name. Add features in the next step.">
            <input value={state.primaryArtist} onChange={(e) => update({ primaryArtist: e.target.value })}
              placeholder="e.g. Vjazzy"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          <Field label="Label" hint="Label name that appears on stores. Defaults to SongDis Ltd.">
            <input value={state.label} onChange={(e) => update({ label: e.target.value })}
              placeholder="Your label name for this release"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          <Field label="Meta data language" hint="What language is your song title written in?">
            <DashSelect value={state.metaLanguage} onChange={(v) => update({ metaLanguage: v })}
              options={["English", "French", "Spanish", "Yoruba", "Igbo", "Hausa"]} />
          </Field>

          <Field label="UPC Code (Optional)" hint="Leave empty. We will give you one for free.">
            <input value={state.upcCode} onChange={(e) => update({ upcCode: e.target.value })}
              placeholder="Auto generated if left blank"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>

          <Field label="C Line (Copyright)" hint="Who owns the song/lyrics?">
            <DashSelect value={state.cLine} onChange={(v) => update({ cLine: v })} options={["2026", "2025", "2024", "2023"]} />
          </Field>

          <Field label="P Line" hint="Who owns the audio recording?">
            <DashSelect value={state.pLine} onChange={(v) => update({ pLine: v })} options={["2026", "2025", "2024", "2023"]} />
          </Field>

          <Field label="Release Type" hint="1–3 songs = Single. 4–6 = EP. 7+ = Album.">
            <input
              value={state.releaseType === "single" ? "Single" : state.noOfTracks >= 7 ? "Album" : state.noOfTracks >= 4 ? "EP" : "Album/EP"}
              disabled
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white/50 text-sm outline-none cursor-not-allowed" />
          </Field>

          <Field label="No of Tracks" hint={state.releaseType === "single" ? "Singles can only have 1 track." : "Enter the number of tracks."}>
            <input type="number" min={1} max={50} value={state.noOfTracks}
              disabled={state.releaseType === "single"}
              onChange={(e) => update({ noOfTracks: Math.max(1, parseInt(e.target.value) || 1) })}
              className={["w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors",
                state.releaseType === "single" ? "text-white/50 cursor-not-allowed" : ""].join(" ")} />
          </Field>

          <Field label="Explicit Content" hint="Does your song contain strong language or adult content?">
            <DashSelect value={state.explicitContent} onChange={(v) => update({ explicitContent: v })} options={["Yes", "No", "Clean"]} />
          </Field>

          <Field label="Cover Art AI Use" hint="If you used AI to make your cover art, notify it.">
            <DashSelect value={state.coverArtAiUse} onChange={(v) => update({ coverArtAiUse: v })} options={["None", "Partial AI", "Fully AI Generated"]} />
          </Field>
        </div>

        <div className="mt-8">
          <StepActions onBack={onBack} onSaveDraft={onSaveDraft} onContinue={onContinue} />
        </div>
      </div>

      {artworkGen && (
        <ArtworkGenerator
          onClose={() => setArtworkGen(false)}
          onSelect={(url) => {
            update({ artwork: url, coverArtAiUse: "Fully AI Generated" });
          }}
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
function SpinIcon() { return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>; }