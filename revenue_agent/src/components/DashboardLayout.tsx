"use client";

import React, { useState } from 'react';
import { 
  Upload, 
  Loader2, 
  X,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AIAnalystChat } from '@/components/AIAnalystChat';
import { useBusinessData } from '@/context/BusinessDataContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeRoute }) => {
  const { 
    data, 
    loading, 
    error, 
    setError, 
    loadSample, 
    uploadFile,
    explainSection,
    setExplainSection,
    explainText,
    explainLoading
  } = useBusinessData();
  
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile(file);
    } catch (e: any) {
      // Error is caught and stored in context
    }
  };

  const triggerFileUpload = () => {
    const input = document.getElementById('file-upload-input');
    if (input) input.click();
  };

  return (
    <div className="flex bg-background-custom min-h-screen text-text-foreground font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar 
        data={data}
        activeSection={activeRoute}
        setActiveSection={() => {}} // Controlled via links instead of SPA state
        onOpenChat={() => setIsChatOpen(true)}
        onTriggerUpload={triggerFileUpload}
      />

      {/* Hidden file input */}
      <input 
        id="file-upload-input"
        type="file" 
        accept=".csv,.xlsx" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* 2. Main Scrollable Panel */}
      <div className="flex-1 p-6 overflow-y-auto max-h-screen space-y-6">
        
        {/* Header Block */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
              {data?.summary.business_name || "Meenakshi Precision Components"}
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">Gemma Orchestrated</span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              {data?.summary.industry || "CNC Precision Machining"} &mdash; {data?.summary.location || "Peenya, Bengaluru"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={loadSample}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-background border border-border-subtle hover:bg-background-custom text-text-foreground rounded-full text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Load Sample</span>
            </button>
            <button 
              onClick={triggerFileUpload}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-full text-xs font-bold transition-all shadow-soft disabled:opacity-50"
            >
              <Upload size={13} />
              <span>Upload CSV</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-primary/5 border border-primary/10 text-primary text-xs rounded-[20px] flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)}
              className="p-1 hover:bg-primary/10 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-xs font-bold text-text-muted font-display uppercase tracking-widest animate-pulse">Running reasoning orchestrator...</p>
          </div>
        ) : data ? (
          <div className="animate-fade-in pb-12">
            {children}
          </div>
        ) : (
          <div className="h-[70vh] flex flex-col items-center justify-center gap-6 border-2 border-dashed border-border-subtle rounded-[24px] bg-white p-6 animate-fade-in">
            <div className="p-4 bg-primary/5 text-primary rounded-full">
              <FileSpreadsheet size={40} />
            </div>
            <div className="text-center max-w-sm space-y-1">
              <h3 className="font-black text-slate-800 text-sm font-display">No Active Data Loaded</h3>
              <p className="text-xs text-text-muted">Upload a customer payment history CSV or load the pre-configured sample to see the advisor platform.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={loadSample}
                className="px-5 py-2.5 bg-background border border-border-subtle hover:bg-background-custom text-text-foreground text-xs font-bold rounded-full transition-all"
              >
                Load Pre-Configured Sample
              </button>
              <button 
                onClick={triggerFileUpload}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-full transition-all shadow-soft"
              >
                Upload Business History
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating AI Analyst chat drawer */}
      {data && (
        <AIAnalystChat 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          data={data}
        />
      )}

      {/* 4. Explain Modal */}
      {explainSection && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-border-subtle w-full max-w-2xl shadow-2xl p-6 relative overflow-hidden animate-scale-up max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  <h3 className="font-black text-sm text-text-foreground font-display capitalize">AI Analysis Insight &mdash; {explainSection.replace('_', ' ')}</h3>
                </div>
                <button 
                  onClick={() => setExplainSection(null)}
                  className="p-1 hover:bg-background-custom rounded-lg text-text-muted hover:text-text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin">
                {explainLoading ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="text-primary animate-spin" />
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider animate-pulse">Consulting Gemma Model...</p>
                  </div>
                ) : (
                  <div className="text-xs text-text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-background-custom p-4 rounded-[20px] border border-border-subtle">
                    {explainText}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-4 mt-4 flex justify-end">
              <button 
                onClick={() => setExplainSection(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-colors"
              >
                Close Insight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardLayout;
