import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  Coins, 
  Bookmark,
  Info
} from 'lucide-react';
import { DashboardData } from '../services/api';

interface ExecutiveRecommendationProps {
  data: DashboardData;
  onExplain: (section: string) => void;
}

export const ExecutiveRecommendation: React.FC<ExecutiveRecommendationProps> = ({ data, onExplain }) => {
  const { executive_recommendation } = data;
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});

  const toggleAction = (idx: number) => {
    setCheckedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div id="executive" className="bg-primary/5 border border-primary/10 rounded-[24px] shadow-soft p-6 scroll-mt-6 relative overflow-hidden">
      {/* Decorative background flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-8 -translate-y-8"></div>
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-primary/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight font-display">AI Executive Recommendation</h2>
            <p className="text-[11px] text-text-muted mt-0.5 font-sans">Synthesized operational strategy from internal metrics & external market signals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation Narrative */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <p className="text-sm text-text-foreground font-semibold leading-relaxed">
              {executive_recommendation.summary}
            </p>
            
            {/* Recommended Action Checklist */}
            <div className="mt-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 font-display">
                Recommended Actions
              </h4>
              <div className="flex flex-col gap-3">
                {executive_recommendation.recommended_actions.map((act, idx) => {
                  const isChecked = checkedActions[idx] || false;
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      className={`flex items-start gap-3 p-3 rounded-[16px] border transition-all duration-200 cursor-pointer ${
                        isChecked 
                          ? 'bg-primary/5 border-primary/20 text-text-muted' 
                          : 'bg-white border-border-subtle hover:border-primary/20 text-text-foreground'
                      }`}
                    >
                      <button className="mt-0.5 text-primary flex-shrink-0">
                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-tight ${isChecked ? 'line-through' : ''}`}>
                            {act.action}
                          </p>
                          <span className={`px-1.5 py-0.5 rounded-[6px] text-[8px] font-bold border uppercase tracking-wider flex-shrink-0 ${
                            idx === 0 ? 'bg-primary/5 text-primary border-primary/10' :
                            idx === 1 ? 'bg-amber-50 text-amber-705 border-amber-200' :
                            idx === 2 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-text-muted border-slate-200'
                          }`}>
                            {idx === 0 ? 'Immediate' :
                             idx === 1 ? 'This Week' :
                             idx === 2 ? 'This Month' : 'Next Quarter'}
                          </span>
                        </div>
                        
                        {/* Evidence indicators */}
                        {!isChecked && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {act.internal_evidence && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-[6px] border border-blue-100">
                                <Bookmark size={8} />
                                <span>Internal: {act.internal_evidence}</span>
                              </span>
                            )}
                            {act.external_evidence && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 text-primary text-[9px] font-bold rounded-[6px] border border-primary/10">
                                <Info size={8} />
                                <span>External: {act.external_evidence}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Potential Impact summary */}
        <div className="bg-text-foreground text-slate-100 rounded-[24px] p-5 border border-border-subtle flex flex-col justify-between shadow-soft">
          <div>
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 font-display">
              Potential Impact
            </h4>
            
            <div className="flex flex-col gap-4">
              {/* Cash Flow Improvement */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Coins size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-display">Cash Flow Improvement</p>
                  <h5 className="text-lg font-black text-white mt-0.5 font-display">
                    {executive_recommendation.potential_impact.cash_flow_improvement}
                  </h5>
                </div>
              </div>

              {/* Revenue Protection */}
              <div className="flex items-center gap-3 border-t border-slate-700 pt-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-display">Revenue Protection</p>
                  <h5 className="text-lg font-black text-white mt-0.5 font-display">
                    {executive_recommendation.potential_impact.revenue_protection}
                  </h5>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="border-t border-slate-700 pt-4 mt-6">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-text-muted font-bold font-display">Recommendation Confidence</span>
              <span className="font-black text-white font-display">{executive_recommendation.confidence_score}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${executive_recommendation.confidence_score}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
