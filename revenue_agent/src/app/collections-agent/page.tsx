"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  AlertTriangle,
  Copy,
  Check,
  Coins
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
export const dynamic = "force-dynamic";
import { useBusinessData } from '@/context/BusinessDataContext';

export default function CollectionsAgentPage() {
  const { data } = useBusinessData();
  const [selectedCust, setSelectedCust] = useState<string>('');
  const [channel, setChannel] = useState<'Email' | 'WhatsApp' | 'Phone'>('Email');
  const [tone, setTone] = useState<'Gentle' | 'Professional' | 'Firm'>('Professional');
  const [draft, setDraft] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logStatus, setLogStatus] = useState<string | null>(null);

  const customers = data?.customer_intelligence?.customers || [];

  // Set initial selected customer if empty
  if (!selectedCust && customers.length > 0) {
    setSelectedCust(customers[0].key);
  }

  const activeCust = customers.find(c => c.key === selectedCust) || customers[0];

  const handleGenerateDraft = async () => {
    if (!activeCust || !data) return;
    setGenerating(true);
    setDraft('');
    setLogStatus(null);
    
    try {
      const res = await fetch("/api/collections/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: activeCust.name,
          delayedInvoices: activeCust.delayed_invoices,
          averageDelay: activeCust.avg_payment_delay,
          outstandingBalance: activeCust.delayed_invoices * 85000, // compute based on metrics
          tone: tone.toLowerCase(),
          channel: channel.toLowerCase()
        })
      });

      if (!res.ok) throw new Error("Failed to contact outreach route");
      const result = await res.json();
      setDraft(result.content);
    } catch (e: any) {
      setDraft("Failed to generate outreach template: " + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogSent = async () => {
    if (!activeCust || !draft) return;
    try {
      const res = await fetch("/api/collections/log-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: activeCust.name,
          channel: channel.toLowerCase(),
          tone: tone.toLowerCase(),
          content: draft
        })
      });
      if (res.ok) {
        setLogStatus("Outreach reminder logged in PostgreSQL database successfully!");
        setTimeout(() => setLogStatus(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout activeRoute="/collections-agent">
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">Collections & Smart Accounts Receivable Agent</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Leverage payment ledger history to identify high-risk receivables and generate custom, behavior-grounded recovery communication templates.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Customer Selection & Ledger Risks */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-border-subtle rounded-[24px] p-5 shadow-soft">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 font-display">Receivables Aging & Risk Tiering</h3>
                
                <div className="flex flex-col gap-3">
                  {customers.map((cust) => (
                    <div 
                      key={cust.key}
                      onClick={() => setSelectedCust(cust.key)}
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-[16px] border transition-all cursor-pointer ${
                        selectedCust === cust.key 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border-subtle bg-white hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          cust.risk_score === 'High' ? 'bg-primary/10 text-primary' :
                          cust.risk_score === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-foreground">{cust.name}</h4>
                          <p className="text-[10px] text-text-muted mt-0.5">Share: {cust.revenue_share}% | Avg Delay: {cust.avg_payment_delay} Days</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-text-muted">Invoices Delayed</p>
                          <p className="text-xs font-bold text-text-foreground">{cust.delayed_invoices} / {cust.total_invoices}</p>
                        </div>
                        
                        <span className={`px-2 py-0.5 text-[8px] font-bold border rounded-[6px] uppercase tracking-wider ${
                          cust.risk_score === 'High' ? 'bg-primary/5 text-primary border-primary/25' :
                          cust.risk_score === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {cust.risk_score} Risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Follow-up Generation Panel */}
            <div className="lg:col-span-1 space-y-6">
              {activeCust && (
                <div className="bg-white border border-border-subtle rounded-[24px] p-5 shadow-soft flex flex-col justify-between h-full space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 font-display">Collections Copilot</h3>
                    
                    {/* Selected Customer Details */}
                    <div className="bg-background-custom p-3 rounded-[16px] border border-border-subtle mb-4">
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-display">Target Client</p>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">{activeCust.name}</h4>
                      
                      {activeCust.risk_score === 'High' && (
                        <div className="mt-2.5 p-2 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-2 text-[10px] text-primary">
                          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                          <span>High payment delay alert. Gemma recommends setting credit lock-out and requiring 30% advance on future tooling orders.</span>
                        </div>
                      )}
                    </div>

                    {/* Parameters selection */}
                    <div className="space-y-4">
                      {/* Channel */}
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display mb-1.5 block">Outreach Channel</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { name: 'Email', icon: Mail },
                            { name: 'WhatsApp', icon: MessageSquare },
                            { name: 'Phone', icon: PhoneCall }
                          ].map((ch) => (
                            <button
                              key={ch.name}
                              onClick={() => setChannel(ch.name as any)}
                              className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                channel === ch.name 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-border-subtle bg-white text-text-muted hover:border-primary/20'
                              }`}
                            >
                              <ch.icon size={14} />
                              <span>{ch.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tone */}
                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display mb-1.5 block">Outreach Tone</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Gentle', 'Professional', 'Firm'].map((t) => (
                            <button
                              key={t}
                              onClick={() => setTone(t as any)}
                              className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                tone === t 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-border-subtle bg-white text-text-muted hover:border-primary/20'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="space-y-4">
                    <button
                      onClick={handleGenerateDraft}
                      disabled={generating}
                      className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white disabled:text-text-muted rounded-full text-xs font-bold transition-all shadow-soft flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {generating ? 'Drafting outreach...' : 'Generate Outreach Draft'}
                    </button>

                    {/* Draft Output Block */}
                    {draft && (
                      <div className="bg-background-custom border border-border-subtle p-4 rounded-[16px] relative animate-fade-in space-y-3">
                        <p className="text-[9px] text-text-muted uppercase tracking-wider font-display">Generated Outreach Copy (Editable)</p>
                        
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="w-full h-44 text-[10px] leading-relaxed font-sans text-text-foreground bg-transparent border-0 focus:ring-0 p-0 resize-y focus:outline-none scrollbar-thin"
                        />
                        
                        <button 
                          onClick={handleCopy}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-white border border-border-subtle hover:border-primary/20 rounded-lg text-text-muted hover:text-text-foreground transition-colors cursor-pointer"
                          title="Copy outreach draft"
                        >
                          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>

                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/40">
                          <button
                            onClick={handleLogSent}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase rounded-full transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Send size={10} /> Mark as Sent
                          </button>
                        </div>
                      </div>
                    )}

                    {logStatus && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-xl animate-pulse">
                        {logStatus}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
