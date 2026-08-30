"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { chat, type ChatMessage } from "@/lib/api/ayo";

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
  content: "Hey! I'm Ayo \u2014 your music intelligence assistant.\n\nI can help you grow your career, plan releases, and navigate the music industry. What would you like to work on today?",
  chips: ["Draft my editorial pitch", "Plan my next release", "Help me grow my streams"],
  timestamp: new Date(),
};

function AyoBubble({ message, onChipClick }: { message: Message; onChipClick?: (chip: string) => void }) {
  return (
    <div className="flex items-start gap-2.5 max-w-[85%]">
      <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Image src="/images/ayo.svg" alt="Ayo" width={14} height={14} unoptimized />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="rounded-2xl rounded-tl-none bg-[#1A0808] border border-white/[0.07] px-4 py-3">
          <p className="font-body text-white/80 text-[13px] leading-relaxed whitespace-pre-line">{message.content}</p>
        </div>
        {message.chips && message.chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.chips.map((chip) => (
              <button key={chip} onClick={() => onChipClick?.(chip)}
                className="font-body text-white text-[11px] bg-[#C30100]/20 border border-[#C30100]/30 hover:bg-[#C30100]/40 rounded-full px-2.5 py-1 transition-colors">
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end">
      <div className="rounded-2xl rounded-tr-none bg-[#C30100]/15 border border-[#C30100]/20 px-4 py-3 max-w-[80%]">
        <p className="font-body text-white/80 text-[13px] leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
        <Image src="/images/ayo.svg" alt="Ayo" width={14} height={14} unoptimized />
      </div>
      <div className="rounded-2xl rounded-tl-none bg-[#1A0808] border border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}


const EXIT_MS = 150;

export default function AyoChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);


  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);

      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setIsVisible(true));
      });

      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setIsVisible(false);
    const timer = setTimeout(() => setIsMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
        // Also drops empty messages — the API rejects them and one stuck in state would
        // break every later turn. See the note on the Ayo page, same reasoning.
        .filter((m) => m.id !== "initial" && m.content.trim() !== "")
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
        const data = res.data as { reply: string; truncated?: boolean };
        const reply = (data.reply ?? "").trim();

        setMessages((prev) => [...prev, {
          id: `ayo-${Date.now()}`,
          role: "ayo",
          // Never an empty bubble: it renders blank, and the API rejects it in the next
          // request's history, which would break every following turn.
          content: reply !== ""
            ? reply
            : "Sorry, I didn't manage to put that into words. Try asking again.",
          chips: data.truncated && reply !== "" ? ["Finish that thought"] : undefined,
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
    <>
      {/* Chat Panel */}
      {isMounted && (
        <div
          className={[
            "fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px]",
            "origin-bottom-right will-change-[opacity,transform]",
            "transition-[opacity,transform]",
            isVisible
              ? "opacity-100 translate-y-0 scale-100 duration-200 ease-out"
              : "opacity-0 translate-y-2 scale-95 duration-150 ease-in pointer-events-none",
            "motion-reduce:transform-none motion-reduce:transition-opacity",
          ].join(" ")}
          aria-hidden={!isVisible}
        >
          <div className="flex flex-col h-[500px] max-h-[calc(100vh-8rem)] rounded-2xl border border-white/[0.12] bg-[#1C1212] shadow-2xl shadow-black/60 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#180F0F] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Image src="/images/ayo.svg" alt="Ayo" width={16} height={16} unoptimized />
                </div>
                <div>
                  <p className="font-heading text-white uppercase text-xs tracking-wide">Ayo AI</p>
                  <p className="font-body text-white/40 text-[10px]">English · Pidgin · Igbo · Hausa · Yoruba</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#140C0C]">
              {messages.map((m) =>
                m.role === "ayo"
                  ? <AyoBubble key={m.id} message={m} onChipClick={(chip) => sendMessage(chip)} />
                  : <UserBubble key={m.id} message={m} />
              )}
              {isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/[0.08] bg-[#1C1212]">
              <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-[#180F0F] px-3 py-2.5">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                  }}
                  placeholder="Ask Ayo anything..."
                  rows={1}
                  className="flex-1 bg-transparent font-body text-white text-base placeholder:text-white/25 outline-none resize-none max-h-20"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 w-8 h-8 rounded-full bg-[#C30100] flex items-center justify-center hover:bg-[#a80000] transition-colors disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="font-body text-white/20 text-[9px] text-center mt-1.5">
                Ayo is an AI assistant. Always verify important decisions with professionals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={[
          "fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg",
          "transition-[background-color,transform,border-color] duration-300 ease-out active:scale-95",
          isOpen
            ? "bg-[#1A0808] border border-white/[0.15]"
            : "bg-[#C30100] hover:bg-[#a80000] hover:scale-105",
          "motion-reduce:transition-none motion-reduce:transform-none",
        ].join(" ")}
        aria-label={isOpen ? "Close Ayo chat" : "Open Ayo chat"}
        aria-expanded={isOpen}
      >
      
        <span className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
          <span
            className={[
              "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-opacity motion-reduce:transform-none",
              isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75",
            ].join(" ")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>

          <span
            className={[
              "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-opacity motion-reduce:transform-none",
              isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100",
            ].join(" ")}
          >
            <Image src="/images/ayo.svg" alt="" width={26} height={26} unoptimized />
          </span>
        </span>
      </button>
    </>
  );
}
