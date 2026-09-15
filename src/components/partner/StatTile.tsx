/**
 * The portal's stat tile. Padding and label size are tuned for a ~400px phone, where a
 * roomier tile pushes four of these into a tall column of mostly whitespace and wraps the
 * labels mid-phrase.
 */
export default function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-5">
      <p className="font-heading text-white/40 uppercase text-[11px] tracking-[0.18em]">
        {label}
      </p>
      <p className="font-heading text-white text-xl sm:text-2xl mt-1.5">{value}</p>
      {hint && <p className="font-body text-white/40 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
