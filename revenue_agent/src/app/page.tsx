"use client";

import React from 'react';
import { 
  ArrowRight, 
  Coins, 
  TrendingUp, 
  Truck, 
  DollarSign 
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { KPISection } from '@/components/KPISection';
import { ExecutiveRecommendation } from '@/components/ExecutiveRecommendation';
import { useBusinessData } from '@/context/BusinessDataContext';

export default function OverviewPage() {
  const { data } = useBusinessData();

  return (
    <DashboardLayout activeRoute="dashboard">
      {data && (
        <div className="space-y-6">
          {/* Main summary KPI row */}
          <KPISection data={data} />

          {/* Quick Pillars Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pricing Agent Card */}
            <Link 
              href="/pricing-agent"
              className="bg-white border border-border-subtle hover:border-primary/20 p-5 rounded-[24px] shadow-soft hover:shadow-md transition-all group flex flex-col justify-between h-40"
            >
              <div>
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-3">
                  <Coins size={20} />
                </div>
                <h3 className="font-black text-xs text-text-foreground font-display tracking-tight group-hover:text-primary transition-colors">Pricing Agent</h3>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">Watch BOM margins, steel inflation and negotiate customer contracts.</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-primary font-black mt-2 self-end">
                <span>Open Agent</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Revenue Forecasting Card */}
            <Link 
              href="/revenue-intelligence"
              className="bg-white border border-border-subtle hover:border-primary/20 p-5 rounded-[24px] shadow-soft hover:shadow-md transition-all group flex flex-col justify-between h-40"
            >
              <div>
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-3">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-black text-xs text-text-foreground font-display tracking-tight group-hover:text-primary transition-colors">Revenue Intelligence</h3>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">XGBoost weekly predictions and SHAP explainability variables.</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-primary font-black mt-2 self-end">
                <span>Open Agent</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Supplier Management Card */}
            <Link 
              href="/supplier-agent"
              className="bg-white border border-border-subtle hover:border-primary/20 p-5 rounded-[24px] shadow-soft hover:shadow-md transition-all group flex flex-col justify-between h-40"
            >
              <div>
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-3">
                  <Truck size={20} />
                </div>
                <h3 className="font-black text-xs text-text-foreground font-display tracking-tight group-hover:text-primary transition-colors">Supplier Agent</h3>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">Track machine components, lead times, and alternative vendor sources.</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-primary font-black mt-2 self-end">
                <span>Open Agent</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Collections Agent Card */}
            <Link 
              href="/collections-agent"
              className="bg-white border border-border-subtle hover:border-primary/20 p-5 rounded-[24px] shadow-soft hover:shadow-md transition-all group flex flex-col justify-between h-40"
            >
              <div>
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-3">
                  <DollarSign size={20} />
                </div>
                <h3 className="font-black text-xs text-text-foreground font-display tracking-tight group-hover:text-primary transition-colors">Collections Agent</h3>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">Flag customer late billing risks and generate follow-up outlines.</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-primary font-black mt-2 self-end">
                <span>Open Agent</span>
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* AI Executive advisor checklist */}
          <ExecutiveRecommendation data={data} onExplain={() => {}} />
        </div>
      )}
    </DashboardLayout>
  );
}
