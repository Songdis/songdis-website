"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  chat,
  generateBio,
  saveBio,
  type BioResponse,
  type ChatMessage,
} from "@/lib/api/ayo";
import { useToast } from "@/components/ui/Toast";

type Tab = "chat" | "bio";

interface Message {
  id: string;
  role: "ayo" | "user";
  content: string;
  chips?: string[];
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "ayo",
  content: `Hey! I'm Ayo your music intelligence assistant.\n\nI can help you grow your career, plan releases, and navigate the music industry. I can also chat in English, Pidgin, Igbo, Hausa, and Yoruba. What would you like to work on today?`,
  chips: ["Draft my editorial pitch", "Plan my next release", "Help me grow my streams", "Generate bio"],
  timestamp: new Date(),
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
      {hint && <p className="font-body text-white/30 text-[11px]">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors";
const textareaCls = `${inputCls} resize-none`;

function BioGenerator() {
  const [form, setForm] = useState({
    artist_name: "",
    genre: "",
    popular_work: "",
    uniqueness: "",
  });
  const [result, setResult] = useState<BioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast, error: toastError } = useToast();

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleGenerate = async () => {
    if (!form.artist_name || !form.genre) return;
    setIsLoading(true);
    setResult(null);
    setSaved(false);
    const res = await generateBio(form);
    if (res.error) {
      toastError("Bio generation failed", res.error);
    } else {
      setResult(res.data as BioResponse);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    const bioText = result?.bio ?? result?.long_bio ?? result?.short_bio ?? "";
    if (!bioText) return;
    setIsSaving(true);
    const res = await saveBio(bioText);
    if (res.error) {
      toastError("Failed to save bio", res.error);
    } else {
      setSaved(true);
      toast({ type: "success", title: "Bio saved to your profile" });
    }
    setIsSaving(false);
  };

  const bio = result?.bio ?? result?.long_bio ?? result?.short_bio ?? "";

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-6">
        <h3 className="font-heading text-white uppercase text-sm tracking-wide mb-5">Artist Bio Generator</h3>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Artist Name">
              <input value={form.artist_name} onChange={(e) => update("artist_name", e.target.value)}
                placeholder="e.g. Vjazzy" className={inputCls} />
            </Field>
            <Field label="Genre">
              <input value={form.genre} onChange={(e) => update("genre", e.target.value)}
                placeholder="e.g. Afrobeats" className={inputCls} />
            </Field>
          </div>
          <Field label="Popular Work" hint="Your most known song, album, or achievement">
            <input value={form.popular_work} onChange={(e) => update("popular_work", e.target.value)}
              placeholder="e.g. Scatter the Place" className={inputCls} />
          </Field>
          <Field label="What makes you unique?" hint="Accolades, achievements, or distinctive qualities">
            <textarea value={form.uniqueness} onChange={(e) => update("uniqueness", e.target.value)}
              placeholder="e.g. 10 songs on Top 100 Billboard Nigeria, known for blending Afrobeats with Highlife..."
              rows={3} className={textareaCls} />
          </Field>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !form.artist_name || !form.genre}
            className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                Generating...
              </span>
            ) : "Generate Bio"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && bio && (
        <div className="rounded-2xl border border-[#C30100]/30 bg-[#180F0F] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-white uppercase text-sm tracking-wide">Generated Bio</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(bio); toast({ type: "success", title: "Bio copied" }); }}
                className="font-body text-white/50 text-xs border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white flex items-center gap-1.5"
              >
                <CopyIcon /> Copy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || saved}
                className="font-body text-xs border border-[#C30100]/50 hover:border-[#C30100] rounded-full px-3 py-1.5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                style={{ color: saved ? "#22c55e" : "#C30100" }}
              >
                {isSaving ? "Saving..." : saved ? "Saved" : "Save to Profile"}
              </button>
            </div>
          </div>
          <p className="font-body text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{bio}</p>

          {result.short_bio && result.short_bio !== bio && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-2">Short Bio</p>
              <p className="font-body text-white/60 text-sm leading-relaxed">{result.short_bio}</p>
            </div>
          )}
          {result.long_bio && result.long_bio !== bio && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-2">Long Bio</p>
              <p className="font-body text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{result.long_bio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AyoMessage({ message, onChipClick }: { message: Message; onChipClick?: (chip: string) => void }) {
  return (
    <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
      <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
        <Image src="/images/ayo.svg" alt="Ayo" width={18} height={18} unoptimized />
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-2xl rounded-tl-none bg-[#1A0808] border border-white/[0.07] px-5 py-4">
          <p className="font-body text-white/80 text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
        </div>
        {message.chips && message.chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.chips.map((chip) => (
              <button key={chip} onClick={() => onChipClick?.(chip)}
                className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/30 hover:bg-[#C30100]/40 rounded-full px-3 py-1.5 transition-colors">
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="rounded-2xl rounded-tr-none bg-[#C30100]/15 border border-[#C30100]/20 px-4 sm:px-5 py-3 sm:py-4 max-w-[90%] sm:max-w-[75%]">
        <p className="font-body text-white/80 text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
      <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
        <Image src="/images/ayo.svg" alt="Ayo" width={18} height={18} unoptimized />
      </div>
      <div className="rounded-2xl rounded-tl-none bg-[#1A0808] border border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatTab({ initialMessage }: { initialMessage?: string }) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitialRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialMessage && !sentInitialRef.current && !isLoading) {
      sentInitialRef.current = true;
      sendMessage(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history: ChatMessage[] = messages
        .filter((m) => m.id !== "initial")
        .map((m) => ({
          role: m.role === "ayo" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        }));

      history.push({ role: "user", content: text.trim() });

      const res = await chat(history);

      if (res.error) {
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`,
          role: "ayo",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        }]);
      } else {
        const data = res.data as { reply: string };
        setMessages((prev) => [...prev, {
          id: `ayo-${Date.now()}`,
          role: "ayo",
          content: data.reply,
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: "ayo",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)] min-h-[400px] sm:min-h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-2 pb-4">
        {messages.map((m) =>
          m.role === "ayo"
            ? <AyoMessage key={m.id} message={m} onChipClick={(chip) => sendMessage(chip)} />
            : <UserMessage key={m.id} message={m} />
        )}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-3 rounded-2xl border border-white/[0.08] bg-[#180F0F] px-4 py-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder="Ask Ayo anything..."
            rows={1}
            className="flex-1 bg-transparent font-body text-white text-base placeholder:text-white/25 outline-none resize-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="shrink-0 w-9 h-9 rounded-full bg-[#C30100] flex items-center justify-center hover:bg-[#a80000] transition-colors disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </div>
        <p className="font-body text-white/20 text-[10px] text-center mt-2">
          Ayo is an AI assistant. Always verify important decisions with professionals.
        </p>
      </div>
    </div>
  );
}

function AyoAIContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("chat");

  const tabs: { id: Tab; label: string }[] = [
    { id: "chat", label: "Chat with Ayo" },
    { id: "bio", label: "Bio Generator" },
  ];

  return (
    <DashboardLayout pageTitle="Ayo">
      <div className="flex flex-col gap-5">

        {/* Header */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Image src="/images/ayo.svg" alt="Ayo" width={22} height={22} unoptimized />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-heading text-white uppercase text-sm tracking-wide">Ayo</p>
                <span className="font-body text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2 py-0.5 uppercase tracking-wider">AI Powered</span>
              </div>
              <p className="font-body text-white/50 text-xs mt-0.5">
                Your music intelligence assistant · Speaks English, Pidgin, Igbo, Hausa & Yoruba
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-white/[0.06] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "font-heading uppercase text-sm tracking-wide pb-3 border-b-2 transition-all",
                tab === t.id ? "text-white border-white" : "text-white/40 border-transparent hover:text-white/70",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "chat" && <ChatTab initialMessage={searchParams.get("msg") ?? undefined} />}
        {tab === "bio" && <BioGenerator />}

      </div>
    </DashboardLayout>
  );
}

export default function AyoAIPage() {
  return (
    <Suspense>
      <AyoAIContent />
    </Suspense>
  );
}

function SendIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function CopyIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>; }
