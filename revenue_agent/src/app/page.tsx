"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PillarCard from "@/components/PillarCard";

const activePillars = [
  { title: "Pricing Agent", path: "/pricing-agent", icon: "Coins" as const, description: "Optimize margins with CNC quote calculators & material cost indexing." },
  { title: "Revenue Intelligence", path: "/revenue-intelligence", icon: "TrendingUp" as const, description: "XGBoost revenue predictions with SHAP explainable breakdown." },
  { title: "Customer Intelligence", path: "/customer-intelligence", icon: "Users" as const, description: "Predict payment delays, risk flags, and credit terms." },
  { title: "Supplier Agent", path: "/supplier-agent", icon: "Truck" as const, description: "Automate invoice verification and vendor penalty tracking." },
  { title: "Collections Agent", path: "/collections-agent", icon: "DollarSign" as const, description: "Dunnings automation and invoice follow-up workflows." },
  { title: "Market Intelligence", path: "/market-intelligence", icon: "Globe" as const, description: "Real-time raw material prices and macro industry trends." },
  { title: "Ask AI CFO", path: "/ask-ai-cfo", icon: "MessageSquare" as const, description: "Interactive conversational CFO assistant powered by Gemma." },
  { title: "What-If Simulator", path: "/what-if-simulator", icon: "Sliders" as const, description: "Simulate price hikes, demand shocks, and margin impacts." },
  { title: "Executive Advisor", path: "/executive-advisor", icon: "Sparkles" as const, description: "High-level strategic recommendations for MSME leadership." },
  { title: "Reports", path: "/reports", icon: "FileText" as const, description: "Generate comprehensive executive summaries and financial reports." }
];

export default function Home() {
  return (
    <DashboardLayout activeRoute="/">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Hero Banner */}
        <section className="bg-[var(--bg-card)] p-6 md:p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--primary-subtle)] text-[var(--primary)] rounded-full text-xs font-bold font-sans">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
              FinCent Copilot Active
            </div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-[var(--text-primary)] tracking-tight">
              Welcome back to Revenue Intelligence
            </h2>
            <p className="text-[var(--text-muted)] font-sans text-xs md:text-sm leading-relaxed">
              AI-Powered Financial Copilot for Manufacturing MSMEs. Select a module below to inspect real-time metrics, risk forecasts, and automated agent recommendations.
            </p>
          </div>
        </section>

        {/* Pillar Cards Grid Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {activePillars.map((pillar, idx) => (
            <PillarCard
              key={idx}
              title={pillar.title}
              path={pillar.path}
              icon={pillar.icon}
              description={pillar.description}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
