import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
} from 'recharts';
import { 
  BookOpen,
  Newspaper,
} from 'lucide-react';
import { DashboardData } from '../services/api';

interface RevenueIntelligenceProps {
  data: DashboardData;
  onExplain: (section: string) => void;
}

export const RevenueIntelligence: React.FC<RevenueIntelligenceProps> = ({ data, onExplain }) => {
  const { forecast_data, shap_importance, shap_explanation, market_intelligence } = data;

  // Prepare line chart data by combining historical and forecasted periods
  const chartData: any[] = [];
  
  // Historical data points
  forecast_data.historical.forEach((item) => {
    chartData.push({
      name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Historical (Actual)': item.revenue,
      'ML Forecast (Data Only)': null,
      'AI Scenario Forecast (With External Intelligence)': null,
    });
  });

  const lastHistoricalVal = forecast_data.historical[forecast_data.historical.length - 1].revenue;
  const lastHistoricalName = chartData[chartData.length - 1].name;

  // Forecast data points (add connection point first)
  chartData.push({
    name: lastHistoricalName,
    'Historical (Actual)': lastHistoricalVal,
    'ML Forecast (Data Only)': lastHistoricalVal,
    'AI Scenario Forecast (With External Intelligence)': lastHistoricalVal,
  });

  forecast_data.weeks_labels.forEach((label, i) => {
    chartData.push({
      name: label,
      'Historical (Actual)': null,
      'ML Forecast (Data Only)': forecast_data.ml_prediction[i],
      'AI Scenario Forecast (With External Intelligence)': forecast_data.ai_scenario_prediction[i],
    });
  });

  // Calculate waterfall components for SHAP plot
  const baseValue = data.kpis.avg_monthly_revenue_lakh / 4.33; // weekly average
  const shapFactors = [
    { name: 'Base Value (Avg. Revenue)', value: baseValue, type: 'base' },
    { name: 'Customer Orders', value: shap_importance['Customer Orders'] || 0.42, type: 'positive' },
    { name: 'Steel Cost', value: shap_importance['Steel Cost'] || -0.52, type: 'negative' },
    { name: 'Machine Utilization', value: shap_importance['Machine Utilization'] || 0.32, type: 'positive' },
    { name: 'Seasonality', value: shap_importance['Seasonality'] || 0.16, type: 'positive' },
    { name: 'Payment Delays', value: shap_importance['Payment Delays'] || -0.25, type: 'negative' },
    { name: 'ML Forecast', value: data.kpis.ml_forecast_8_weeks_avg_lakh, type: 'total' }
  ];

  // Helper for formatting currency in impact list
  const formatAdjustmentImpact = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-IN');
    return value < 0 ? `-₹${formatted}` : `+₹${formatted}`;
  };

  return (
    <div id="forecast" className="flex flex-col gap-6 scroll-mt-6">
      {/* 1. Main Forecast & Why AI Adjusted */}
      <div className="bg-white rounded-[24px] border border-border-subtle shadow-soft p-6">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">1</span>
              Revenue Intelligence
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Revenue forecast based on your data vs AI scenario (with real-world intelligence)</p>
          </div>
          <button
            onClick={() => onExplain('forecast')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary hover:bg-primary/10 rounded-full text-xs font-bold transition-all border border-primary/10 duration-200"
          >
            <BookOpen size={14} />
            <span>Explain Forecast</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 font-display">
              Revenue Forecast: Historical vs ML vs AI Scenario
            </h4>
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ background: '#1f1f1f', color: '#FFF', borderRadius: '12px', border: 'none' }}
                    labelClassName="font-bold text-slate-300"
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  
                  {/* Historical Revenue (Solid Blue) */}
                  <Line 
                    type="monotone" 
                    dataKey="Historical (Actual)" 
                    stroke="#2563EB" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 0, fill: '#2563EB' }} 
                    activeDot={{ r: 6 }} 
                  />
                  
                  {/* ML Forecast (Dashed Grey) */}
                  <Line 
                    type="monotone" 
                    dataKey="ML Forecast (Data Only)" 
                    stroke="#94A3B8" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    dot={false}
                  />
                  
                  {/* AI Scenario Adjusted Forecast (Solid Red) */}
                  <Line 
                    type="monotone" 
                    dataKey="AI Scenario Forecast (With External Intelligence)" 
                    stroke="#ff383c" 
                    strokeWidth={2.5} 
                    dot={{ r: 4, strokeWidth: 0, fill: '#ff383c' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Impact Adjustments list */}
          <div className="bg-background-custom p-5 rounded-[20px] border border-border-subtle flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 font-display">
                AI Scenario Adjustments
              </h4>
              <div className="flex flex-col gap-2.5">
                {forecast_data.why_adjusted.map((adj, i) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-xs border-b border-border-subtle pb-2">
                    <div>
                      <p className="font-bold text-text-foreground leading-tight">{adj.factor}</p>
                      <span className="text-[10px] text-text-muted">Source: {adj.source}</span>
                    </div>
                    <span className={`font-bold flex-shrink-0 whitespace-nowrap ${
                      adj.impact < 0 ? 'text-primary' : 'text-emerald-600'
                    }`}>
                      {formatAdjustmentImpact(adj.impact)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-border-subtle pt-3 mt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-text-foreground font-display">Total Estimated Impact</span>
              <span className="text-sm font-black text-primary font-display">
                {formatAdjustmentImpact(forecast_data.why_adjusted.reduce((acc, curr) => acc + curr.impact, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SHAP & Latest Market News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SHAP Waterfall Plot */}
        <div className="bg-white rounded-[24px] border border-border-subtle shadow-soft p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm font-display">ML Model Explainability (SHAP)</h3>
                <p className="text-[11px] text-text-muted">Prediction contribution of key business features</p>
              </div>
              <button 
                onClick={() => onExplain('shap')}
                className="text-[10px] font-bold text-primary hover:underline font-display"
              >
                View Full SHAP
              </button>
            </div>

            {/* Visual Waterfall Layout */}
            <div className="flex flex-col gap-2 mt-4 text-xs">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-muted border-b border-border-subtle pb-1 uppercase font-display">
                <span>Feature / Driver</span>
                <span className="w-48 text-center">Impact waterfall</span>
                <span>Val (Lakh)</span>
              </div>
              {shapFactors.map((f, i) => {
                const isPositive = f.type === 'positive';
                const isBase = f.type === 'base';
                const isTotal = f.type === 'total';
                const isNegative = f.type === 'negative';
                
                return (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className={`truncate max-w-[150px] ${isTotal || isBase ? 'font-bold text-slate-900' : 'text-text-muted'}`}>
                      {f.name}
                    </span>
                    
                    {/* Visual Bar representation */}
                    <div className="w-48 h-4 bg-slate-100 rounded-[6px] relative overflow-hidden flex-shrink-0">
                      {isBase && (
                        <div className="h-full bg-slate-400" style={{ width: '60%' }}></div>
                      )}
                      {isTotal && (
                        <div className="h-full bg-primary" style={{ width: '58%' }}></div>
                      )}
                      {isPositive && (
                        <div className="h-full bg-emerald-500 absolute" style={{ left: '60%', width: '12%' }}></div>
                      )}
                      {isNegative && (
                        <div className="h-full bg-primary absolute opacity-45" style={{ left: '42%', width: '18%' }}></div>
                      )}
                    </div>

                    <span className={`font-bold text-right w-14 ${
                      isBase || isTotal ? 'text-slate-900 font-extrabold' : isPositive ? 'text-emerald-600' : 'text-primary'
                    }`}>
                      {isBase || isTotal ? `₹${f.value.toFixed(1)}` : `${isPositive ? '+' : ''}₹${f.value.toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-background-custom p-3 rounded-[16px] border border-border-subtle mt-4">
            <p className="text-[11px] text-text-muted font-medium italic">
              &ldquo;{shap_explanation}&rdquo;
            </p>
          </div>
        </div>

        {/* Latest Market & Industry News */}
        <div className="bg-white rounded-[24px] border border-border-subtle shadow-soft p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm font-display">Latest Market & Industry News</h3>
                <p className="text-[11px] text-text-muted">AI-screened real-time macroeconomic updates</p>
              </div>
              <button 
                onClick={() => onExplain('market_impact')}
                className="text-[10px] font-bold text-primary hover:underline font-display"
              >
                View All
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
              {market_intelligence.slice(0, 3).map((news, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0 group">
                  <div className="p-2 bg-background-custom rounded-[12px] text-text-muted flex-shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <Newspaper size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-snug group-hover:text-primary transition-colors" title={news.title}>
                        {news.title}
                      </h4>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-[6px] flex-shrink-0 ${
                        news.category === 'Raw Material' ? 'bg-amber-50 text-amber-655' :
                        news.category === 'Industry Trend' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'
                      }`}>
                        {news.category}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[9px] text-text-muted mt-1">
                      <span>{news.source}</span>
                      <span>&bull;</span>
                      <span>{news.pubDate}</span>
                    </div>
                    <div className="bg-background-custom rounded-[12px] p-2 mt-1.5 text-[10px] border border-border-subtle">
                      <p className="text-text-muted"><span className="font-bold text-text-foreground">Impact: </span>{news.business_impact}</p>
                      <p className="text-primary mt-0.5 font-bold"><span className="text-text-foreground">Suggested Action: </span>{news.suggested_action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-[10px] text-text-muted mt-3 flex justify-between items-center">
            <span>Showing top {Math.min(3, market_intelligence.length)} of {market_intelligence.length} relevant news</span>
            <span>All news are fetched in real-time &bull;</span>
          </div>
        </div>
      </div>
    </div>
  );
};
