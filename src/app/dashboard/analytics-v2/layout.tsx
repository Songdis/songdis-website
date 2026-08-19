import { notFound } from "next/navigation";
import { ANALYTICS_V2_ENABLED } from "@/lib/featureFlags";


export default function AnalyticsV2Layout({ children }: { children: React.ReactNode }) {
  if (!ANALYTICS_V2_ENABLED) notFound();
  return <>{children}</>;
}
