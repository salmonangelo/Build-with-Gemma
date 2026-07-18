"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { RevenueIntelligence } from '@/components/RevenueIntelligence';
import { useBusinessData } from '@/context/BusinessDataContext';

export default function RevenueIntelligencePage({ onExplain }: { onExplain?: (section: string) => void }) {
  const { data } = useBusinessData();

  return (
    <DashboardLayout activeRoute="/revenue-intelligence">
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Revenue Intelligence Forecasting</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Statistical weekly revenue predictions driven by XGBoost regressor models with SHAP feature explainability.</p>
          </div>
          
          <RevenueIntelligence data={data} onExplain={onExplain || (() => {})} />
        </div>
      )}
    </DashboardLayout>
  );
}
