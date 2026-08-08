import { notFound } from "next/navigation";
import { ANALYTICS_V2_ENABLED } from "@/lib/featureFlags";

/**
 * The label surface rides the same gate as the rest of v2 — it reads the same
 * endpoints and the same grants, so shipping it while v2 is dark would expose a
 * half-wired product. With the flag off this segment 404s exactly as if the route
 * did not exist.
 */
export default function LabelLayout({ children }: { children: React.ReactNode }) {
  if (!ANALYTICS_V2_ENABLED) notFound();
  return <>{children}</>;
}
