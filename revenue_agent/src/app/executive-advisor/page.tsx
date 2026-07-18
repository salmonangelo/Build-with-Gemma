"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { ExecutiveRecommendation } from '@/components/ExecutiveRecommendation';
import { useBusinessData } from '@/context/BusinessDataContext';

export default function ExecutiveAdvisorPage() {
  const { data } = useBusinessData();

  return (
    <DashboardLayout activeRoute="/executive-advisor">
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Executive Advisory & Decision Board</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Strategic operational checklists correlated by Gemma reasoning across sales ledger, material margins, and market news.</p>
          </div>

          <ExecutiveRecommendation data={data} onExplain={() => {}} />
        </div>
      )}
    </DashboardLayout>
  );
}
