"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { ScenarioSimulator } from '@/components/ScenarioSimulator';
import { RevenueIntelligence } from '@/components/RevenueIntelligence';
import { useBusinessData } from '@/context/BusinessDataContext';

export default function WhatIfSimulatorPage() {
  const { data, setData, loadSample } = useBusinessData();

  return (
    <DashboardLayout activeRoute="/what-if-simulator">
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">What-If Scenario Simulator</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Simulate operational overrides to re-estimate XGBoost weekly forecast and evaluate business risk parameters.</p>
          </div>

          {/* Slider controls */}
          <ScenarioSimulator 
            data={data}
            onSimulationResult={(result) => setData(result)}
            onReset={loadSample}
          />

          {/* Results Visualizer */}
          <div className="border-t border-border-subtle pt-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 font-display">Simulation Forecast Output</h3>
            <RevenueIntelligence data={data} onExplain={() => {}} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
