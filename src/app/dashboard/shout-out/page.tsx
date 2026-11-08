"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ShoutOutPage } from "@/components/dashboard/shout-out/ShoutOutPage";

export default function ShoutOut() {
  return (
    <DashboardLayout pageTitle="Shout Out">
      <ShoutOutPage />
    </DashboardLayout>
  );
}
