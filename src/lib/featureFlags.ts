
function flag(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}


export const ANALYTICS_V2_ENABLED = flag(process.env.NEXT_PUBLIC_ANALYTICS_V2);
