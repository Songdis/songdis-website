/**
 * C line / P line: a year the artist picks, plus an owner they may type.
 *
 * Left blank, the owner defaults to "{primary artist}, Distributed by Songdis" — the right
 * call for most artists. Typed, it is used exactly as written: that text is what reaches
 * the admin CSV and Symphonic, with nothing appended.
 *
 * compose() and parse() are inverses so an edit round-trips cleanly. Before this, edit mode
 * loaded the whole stored string ("© 2026 Crownballer, Distributed by Songdis") into what is
 * a YEAR dropdown.
 */

export type CopyrightSymbol = "©" | "℗";

export function defaultOwner(primaryArtist: string): string {
  const artist = primaryArtist.trim();
  return artist ? `${artist}, Distributed by Songdis` : "Distributed by Songdis";
}

export function composeLine(
  symbol: CopyrightSymbol,
  year: string,
  owner: string,
  primaryArtist: string
): string {
  const who = owner.trim() || defaultOwner(primaryArtist);
  return `${symbol} ${year} ${who}`;
}

/**
 * Split a stored line back into year and owner. An owner equal to the default comes back
 * blank, so re-saving an untouched release keeps following the artist's name rather than
 * freezing an old one into a typed value.
 */
export function parseLine(
  line: string | null | undefined,
  primaryArtist: string,
  fallbackYear = String(new Date().getFullYear())
): { year: string; owner: string } {
  const raw = (line ?? "").trim();
  const match = raw.match(/^[©℗]?\s*((?:19|20)\d{2})\b\s*(.*)$/u);

  const year = match ? match[1] : fallbackYear;
  const owner = (match ? match[2] : raw.replace(/^[©℗]\s*/u, "")).trim();

  return { year, owner: owner === defaultOwner(primaryArtist) ? "" : owner };
}
