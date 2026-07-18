"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import MarketSignals from '@/components/pricing/MarketSignals';

export const dynamic = "force-dynamic";

export default function MarketSignalsPage() {
  return (
    <DashboardLayout activeRoute="/pricing-agent/market-signals">
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Pricing Market Signals</h2>
          <p className="text-[11px] text-text-muted mt-0.5 font-sans">Watch steel indices, EV market adoption trends, and local policy announcements.</p>
        </div>
        
        <MarketSignals />
      </div>
    </DashboardLayout>
  );
}
