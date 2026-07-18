"use client";

import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import CncInventory from '@/components/pricing/CncInventory';
import SupplyChainTracker from '@/components/pricing/SupplyChainTracker';

export const dynamic = "force-dynamic";

export default function SupplierAgentPage() {
  return (
    <DashboardLayout activeRoute="/supplier-agent">
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Supplier Management & Inventory Control</h2>
          <p className="text-[11px] text-text-muted mt-0.5 font-sans">Tracks raw materials stock-on-hand, consumption rates, supplier lead times, and recommends reorder timing.</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <CncInventory />
          <SupplyChainTracker />
        </div>

        {/* Supplier Directory Section */}
        <div className="app-card border border-border-subtle bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="font-display font-bold text-xs">SD</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-sm sm:text-base">
                Alternative Supplier Directory
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                Identify backup vendors, analyze average lead times, and review contract rates.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-2">Supplier Name</th>
                  <th className="py-3 px-2">Core Catalog Materials</th>
                  <th className="py-3 px-2 text-center">Avg Lead Time</th>
                  <th className="py-3 px-2 text-right">Estimated Quote / Unit</th>
                  <th className="py-3 px-2 text-center">Reliability Rating</th>
                  <th className="py-3 px-2">Contact Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">Bommasandra Metal Casting</td>
                  <td className="py-3 px-2 text-slate-500">Aluminium Alloy (6061, 7075)</td>
                  <td className="py-3 px-2 text-center">4 Days</td>
                  <td className="py-3 px-2 text-right text-slate-800">₹380 / kg</td>
                  <td className="py-3 px-2 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      98% Excellent
                    </span>
                  </td>
                  <td className="py-3 px-2 text-primary hover:underline">sales@bommasandrametal.in</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">Jigani Tooling Labs Ltd</td>
                  <td className="py-3 px-2 text-slate-500">Carbide bits, coolant, drill rods</td>
                  <td className="py-3 px-2 text-center">3 Days</td>
                  <td className="py-3 px-2 text-right text-slate-800">₹340 / pc</td>
                  <td className="py-3 px-2 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      95% High
                    </span>
                  </td>
                  <td className="py-3 px-2 text-primary hover:underline">procurement@jiganitooling.co.in</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">Peenya Steel Distributors</td>
                  <td className="py-3 px-2 text-slate-500">Mild Steel, Carbon billets</td>
                  <td className="py-3 px-2 text-center">6 Days</td>
                  <td className="py-3 px-2 text-right text-slate-800">₹58,000 / ton</td>
                  <td className="py-3 px-2 text-center">
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      89% Stable
                    </span>
                  </td>
                  <td className="py-3 px-2 text-primary hover:underline">orders@peenyasteels.com</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-slate-800">Karnataka Tooling Co.</td>
                  <td className="py-3 px-2 text-slate-500">Drill inserts, grinding wheels</td>
                  <td className="py-3 px-2 text-center">7 Days</td>
                  <td className="py-3 px-2 text-right text-slate-800">₹410 / pc</td>
                  <td className="py-3 px-2 text-center">
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      85% Stable
                    </span>
                  </td>
                  <td className="py-3 px-2 text-primary hover:underline">contact@kartool.in</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
