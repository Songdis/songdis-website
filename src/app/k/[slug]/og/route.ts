import sharp from "sharp";
import { getPublicPressKit } from "@/lib/api/press-kit-public";

/**
 * The picture a shared kit link shows (WhatsApp, X, iMessage, Facebook): the artist's cover
 * photo cropped to 1200×630 and saved as a small JPEG.
 *
 * Linking the original upload did not work — artists' photos are often several megabytes,
 * and WhatsApp drops a preview image over roughly half a megabyte, so links shared with no
 * picture at all.
 */
export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);
  const source = kit?.artist.cover_image_url ?? kit?.artist.avatar_url ?? null;
  if (!source) return new Response("No image", { status: 404 });

  try {
    const res = await fetch(source, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return new Response("Image unavailable", { status: 502 });

    const image = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate() // respect the photo's own orientation
      .resize(1200, 630, { fit: "cover", position: sharp.strategy.attention })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Image unavailable", { status: 502 });
  }
}
