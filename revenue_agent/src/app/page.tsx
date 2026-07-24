"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ExecutiveBriefing } from "@/components/briefing/ExecutiveBriefing";

export default function Home() {
  return (
    <DashboardLayout activeRoute="/">
      <ExecutiveBriefing />
    </DashboardLayout>
  );
}
