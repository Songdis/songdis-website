"use client";


import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export default function PreviewPlayer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);


  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    const onErr = () => {
      setPlaying(false);
      setFailed(true);
    };
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
  }, []);

  if (failed) return null;

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setFailed(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] px-5 py-4 text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--pk-text)] transition hover:border-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
        style={{ fontFamily: "var(--pk-headline)" }}
      >
        {playing ? (
          <Pause className="h-[17px] w-[17px] fill-current" strokeWidth={0} />
        ) : (
          <Play className="h-[17px] w-[17px] fill-current" strokeWidth={0} />
        )}
        {playing ? "Pause preview" : "Play 30-sec preview"}
      </button>
      <audio ref={audioRef} src={src} preload="none" title={title} />
    </>
  );
}
