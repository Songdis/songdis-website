import { AnalyticsV2Provider } from "@/components/dashboard/analytics-v2/AnalyticsV2Provider";

export default function DashboardSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnalyticsV2Provider>{children}</AnalyticsV2Provider>;
}
