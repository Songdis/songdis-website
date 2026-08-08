export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://songdis.com"
).replace(/\/+$/, "");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


export function formatReleaseDate(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return value.trim();
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return value.trim();
  return `${month} ${Number(d)}, ${y}`;
}

export function releaseYear(value: string | null): string | null {
  if (!value) return null;
  const m = /(\d{4})/.exec(value);
  return m ? m[1] : null;
}

export function formatReleaseType(value: string | null): string | null {
  if (!value) return null;
  const t = value.trim();
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}


export function summarise(text: string | null, max = 180): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}


export function bookingMailto(email: string, artistName: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(`Booking enquiry — ${artistName}`)}`;
}
