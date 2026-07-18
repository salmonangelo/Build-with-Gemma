"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { CustomerIntelligence } from '@/components/CustomerIntelligence';
import { useBusinessData } from '@/context/BusinessDataContext';

export default function CustomerIntelligencePage({ onExplain }: { onExplain?: (section: string) => void }) {
  const { data } = useBusinessData();

  return (
    <DashboardLayout activeRoute="/customer-intelligence">
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Customer Intelligence & Ledger Analysis</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Payment delay risk matrices, invoice aging trends, and accounts concentration diagnostics.</p>
          </div>
          
          <CustomerIntelligence data={data} onExplain={onExplain || (() => {})} />
        </div>
      )}
    </DashboardLayout>
  );
}
