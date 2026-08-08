"use client";


import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PressKitEditor } from "@/components/dashboard/press-kit/PressKitEditor";

export default function PressKitPage() {
  return (
    <DashboardLayout pageTitle="Press Kit">
      <PressKitEditor />
    </DashboardLayout>
  );
}
