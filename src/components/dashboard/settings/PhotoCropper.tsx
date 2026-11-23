"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

/**
 * Crop a profile photo to a square before it is uploaded. Any size of photo goes in; drag
 * to position, pinch or slide to zoom. What comes out is a square JPEG, at most 1200px.
 */
export default function PhotoCropper({
  src,
  onCancel,
  onDone,
}: {
  src: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const save = async () => {
    if (!area) return;
    setBusy(true);
    try {
      onDone(await cropToFile(src, area));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#140C0C] p-5">
        <p className="font-heading text-white uppercase text-sm tracking-wide">Adjust your photo</p>
        <p className="font-body text-white/45 text-xs mt-1">Drag to position, zoom to fit.</p>

        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-2xl bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="mt-4 w-full accent-[#C30100]"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[46px] rounded-full border border-white/15 font-heading text-[11px] uppercase tracking-widest text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !area}
            className="flex-1 min-h-[46px] rounded-full bg-[#C30100] font-heading text-[11px] uppercase tracking-widest text-white hover:bg-[#a80000] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

const MAX = 1200;

async function cropToFile(src: string, area: Area): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

  const size = Math.min(MAX, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not crop"))), "image/jpeg", 0.9)
  );
  return new File([blob], "profile.jpg", { type: "image/jpeg" });
}
