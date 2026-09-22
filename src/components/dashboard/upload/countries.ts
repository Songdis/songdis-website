/**
 * ISO 3166-1 alpha-2 codes for Symphonic's RecordingCountry column.
 *
 * "Optional for import; Required for release" — so a release without it imports cleanly and
 * then cannot go out, which is the worst kind of missing field. Codes only; the labels are
 * for the artist choosing one.
 *
 * Ordered with the markets Songdis actually serves first, then the rest alphabetically, so
 * the common answer is one or two rows down rather than buried under Afghanistan.
 */
export const RECORDING_COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "KE", name: "Kenya" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "CM", name: "Cameroon" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Senegal" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "ZM", name: "Zambia" },
  { code: "RW", name: "Rwanda" },
  { code: "ET", name: "Ethiopia" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "BR", name: "Brazil" },
  { code: "JM", name: "Jamaica" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
];

export const RECORDING_COUNTRY_OPTIONS = RECORDING_COUNTRIES.map(
  (c) => `${c.code} — ${c.name}`
);

export function countryCodeFromOption(option: string): string {
  return (option.split("—")[0] ?? "").trim().toUpperCase();
}

export function optionFromCountryCode(code: string): string {
  const match = RECORDING_COUNTRIES.find((c) => c.code === code.toUpperCase());
  return match ? `${match.code} — ${match.name}` : "";
}
