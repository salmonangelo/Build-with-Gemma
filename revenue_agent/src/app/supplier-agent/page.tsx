"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import CncInventory from '@/components/pricing/CncInventory';
import SupplyChainTracker from '@/components/pricing/SupplyChainTracker';
import { getSuppliers } from '@/app/pricing-agent/actions';
import { LuShieldAlert } from 'react-icons/lu';

export const dynamic = "force-dynamic";

export default function SupplierAgentPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = () => {
    setLoading(true);
    setError(null);
    getSuppliers()
      .then((data) => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error(err);
        setError("Unable to load — database connection error");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <DashboardLayout activeRoute="/supplier-agent">
      <div className="space-y-6 text-[var(--text-primary)]">
        <div>
          <h2 className="text-base font-black text-[var(--text-primary)] tracking-tight font-display">Supplier Management & Inventory Control</h2>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-sans">Tracks raw materials stock-on-hand, consumption rates, supplier lead times, and recommends reorder timing.</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <CncInventory />
          <SupplyChainTracker />
        </div>

        {/* Supplier Directory Section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-subtle)] mb-4">
            <div className="h-8 w-8 rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center font-bold font-display text-xs">
              SD
            </div>
            <div>
              <h3 className="font-display font-bold text-[var(--text-primary)] text-sm sm:text-base">
                Alternative Supplier Directory
              </h3>
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                Identify backup vendors, analyze average lead times, and review contract rates.
              </p>
            </div>
          </div>

          {error ? (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold space-y-3">
              <div className="flex items-center gap-2 font-bold">
                <LuShieldAlert size={16} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchSuppliers}
                className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-full font-bold shadow-xs transition-all cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : loading ? (
            <div className="text-xs text-[var(--text-muted)] font-bold animate-pulse py-4">Loading alternative suppliers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                    <th className="py-3 px-2">Supplier Name</th>
                    <th className="py-3 px-2">Core Catalog Materials</th>
                    <th className="py-3 px-2 text-center">Avg Lead Time</th>
                    <th className="py-3 px-2 text-right">Estimated Quote / Unit</th>
                    <th className="py-3 px-2 text-center">Reliability Rating</th>
                    <th className="py-3 px-2">Contact Channel</th>
                    <th className="py-3 px-2">Source Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="py-3 px-2 font-bold text-[var(--text-primary)]">{sup.name}</td>
                      <td className="py-3 px-2 text-[var(--text-muted)]">{sup.materials}</td>
                      <td className="py-3 px-2 text-center">{sup.avgLeadTime}</td>
                      <td className="py-3 px-2 text-right text-[var(--text-primary)]">{sup.estimatedQuote}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          sup.reliabilityRating.includes("Excellent") || sup.reliabilityRating.includes("High")
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}>
                          {sup.reliabilityRating}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-[var(--primary)] hover:underline">{sup.contactChannel}</td>
                      <td className="py-3 px-2">
                        <a 
                          href={sup.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[var(--primary)] hover:underline font-bold"
                        >
                          IndiaMart Listing ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
