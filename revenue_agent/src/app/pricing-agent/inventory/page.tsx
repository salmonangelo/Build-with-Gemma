"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import CncInventory from '@/components/pricing/CncInventory';

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <DashboardLayout activeRoute="/pricing-agent/inventory">
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight font-display">CNC Inventory Tracker</h2>
          <p className="text-[11px] text-text-muted mt-0.5 font-sans">Monitor tooling stock status, carbide drills, mills, and raw metal bars.</p>
        </div>
        
        <CncInventory />
      </div>
    </DashboardLayout>
  );
}
