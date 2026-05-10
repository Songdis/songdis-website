"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

/* ─── Types ───────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "ayo" | "user";
  content: string;
  chips?: string[];
  timestamp: Date;
}

/* ─── System prompt — gives Ayo context about the user ──────── */
const SYSTEM_PROMPT = `You are Ayo, an AI music intelligence assistant built into Songdis — a music distribution platform for African artists. 

Your role is to help artists with:
- Planning and strategizing their music releases
- Understanding their streaming analytics and earnings
- Drafting editorial pitches to DSPs (Spotify, Apple Music, etc.)
- Generating ideas for cover artwork and marketing
- Growing their streams and fanbase
- Navigating music distribution and royalties

The artist you're speaking to is VJazzy, an Afrobeats artist based in Nigeria on the Songdis Growth Plan.
Their catalog: 4 releases, 16 total streams, $13,004 total earnings. Their latest release is "Scatter the Place".

Keep responses concise, practical, and encouraging. Use music industry knowledge. Occasionally use relevant emojis. Never break character — you are always Ayo.`;

/* ─── Initial Ayo message ─────────────────────────────────────── */
const INITIAL_MESSAGE: Message = {
  id: "initial",
  role: "ayo",
  content: `Hey VJazzy! 👋 I'm Ayo — your music intelligence assistant.

I've been analyzing your catalog and I have some things to share. Here's your quick snapshot:

🎵 4 releases across 5 platforms
📊 16 total streams — solid organic start
💰 $13,004 total earnings
⚡ Scatter the Place is in its critical editorial pitch window right now

What would you like to work on today?`,
  chips: ["Draft my editorial pitch", "Plan my next release", "Help me grow my streams"],
  timestamp: new Date(),
};

/* ─── Message bubble ──────────────────────────────────────────── */
function AyoMessage({ message, onChipClick }: { message: Message; onChipClick?: (chip: string) => void }) {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
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
              <button
                key={chip}
                onClick={() => onChipClick?.(chip)}
                className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/30 hover:bg-[#C30100]/40 rounded-full px-3 py-1.5 transition-colors"
              >
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
      <div className="rounded-2xl rounded-tr-none bg-[#C30100]/15 border border-[#C30100]/20 px-5 py-4 max-w-[75%]">
        <p className="font-body text-white/80 text-sm leading-relaxed">{message.content}</p>
      </div>
      <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
        <Image src="/images/ayo.svg" alt="You" width={18} height={18} unoptimized />
      </div>
    </div>
  );
}

/* ─── Typing indicator ────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
        <Image src="/images/ayo.svg" alt="Ayo" width={18} height={18} unoptimized />
      </div>
      <div className="rounded-2xl rounded-tl-none bg-[#1A0808] border border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function AyoAIPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
      /* ── Anthropic API call ────────────────────────────────────
       * Build conversation history for context — excludes the
       * initial Ayo message which is handled by the system prompt.
       * When backend is ready, route this through your server to
       * keep the API key server-side.
       * ────────────────────────────────────────────────────────── */
      const history = messages
        .filter((m) => m.id !== "initial")
        .map((m) => ({
          role: m.role === "ayo" ? "assistant" : "user",
          content: m.content,
        }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            ...history,
            { role: "user", content: text.trim() },
          ],
        }),
      });

      const data = await response.json();
      const replyText =
        data?.content?.find((b: { type: string }) => b.type === "text")?.text ??
        "I couldn't process that. Please try again.";

      const ayoMsg: Message = {
        id: `ayo-${Date.now()}`,
        role: "ayo",
        content: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, ayoMsg]);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "ayo",
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <DashboardLayout>
      {/*
       * Ayo AI is a full-height chat — it needs to escape the normal
       * scrollable content area and fill the remaining viewport height.
       * We use negative margin + explicit height to achieve this.
       */}
      <div
        className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#0E0808] overflow-hidden"
        style={{ height: "calc(100vh - 140px)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Image src="/images/ayo.svg" alt="Ayo" width={22} height={22} unoptimized />
          </div>
          <div>
            <p className="font-heading text-white uppercase text-sm tracking-wide">AYO AI</p>
            <p className="flex items-center gap-1.5 font-body text-xs mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400">Online</span>
              <span className="text-white/40">· Your music intelligence assistant</span>
            </p>
          </div>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {messages.map((msg) =>
            msg.role === "ayo" ? (
              <AyoMessage
                key={msg.id}
                message={msg}
                onChipClick={(chip) => sendMessage(chip)}
              />
            ) : (
              <UserMessage key={msg.id} message={msg} />
            )
          )}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-6 py-4 border-t border-white/[0.06]">
          <div className="flex items-end gap-3 rounded-2xl border border-white/[0.08] bg-[#180F0F] px-4 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Ayo anything about your music..."
              rows={1}
              className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none resize-none leading-relaxed max-h-32 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-[#C30100] hover:bg-red-700 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendIcon />
            </button>
          </div>
          <p className="font-body text-white/20 text-[10px] text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}