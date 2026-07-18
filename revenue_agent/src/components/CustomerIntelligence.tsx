import React from 'react';
import { 
  ResponsiveContainer, 
  Tooltip, 
  Cell,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { DashboardData } from '../services/api';

interface CustomerIntelligenceProps {
  data: DashboardData;
  onExplain: (section: string) => void;
}

export const CustomerIntelligence: React.FC<CustomerIntelligenceProps> = ({ data, onExplain }) => {
  const { customer_intelligence } = data;
  const [selectedCustKey, setSelectedCustKey] = React.useState<string>('');

  React.useEffect(() => {
    if (customer_intelligence.customers.length > 0) {
      setSelectedCustKey(customer_intelligence.customers[0].key);
    }
  }, [customer_intelligence.customers]);

  const selectedCustomer = customer_intelligence.customers.find(c => c.key === selectedCustKey) 
    || customer_intelligence.customers[0]
    || {
      name: 'Key Customer',
      key: '',
      revenue_share: 0,
      avg_payment_delay: 0,
      delayed_invoices: 0,
      total_invoices: 0,
      risk_score: 'Low',
      trend: 'stable',
      history: [],
      ai_summary: 'No insights available.',
      ai_observed_behavior: '',
      ai_business_impact: '',
      ai_recommendation: '',
      ai_confidence: ''
    };

  // Pie chart data prep
  const pieData = customer_intelligence.customers.map(c => ({
    name: c.name,
    value: c.revenue_share
  }));

  const COLORS = ['#ff383c', '#2563EB', '#ffd400', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#EC4899'];

  const customerInvoiceValue = (data.kpis.avg_monthly_revenue_lakh * 2.77 * (selectedCustomer.revenue_share / 100)).toFixed(2);

  // Risk Score Badge styling helper
  const getRiskBadge = (score: string) => {
    switch (score) {
      case 'High':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Medium':
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    }
  };

  // Trend Arrow indicator helper
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-primary" />;
      case 'down':
        return <TrendingDown size={14} className="text-emerald-500" />;
      default:
        return <Minus size={14} className="text-text-muted" />;
    }
  };

  return (
    <div id="customers" className="flex flex-col gap-6 scroll-mt-6">
      {/* KPI Stats Panel */}
      <div className="bg-white rounded-[24px] border border-border-subtle shadow-soft p-6">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">2</span>
              Customer Intelligence
            </h2>
            <p className="text-xs text-text-muted mt-0.5 font-sans">Deep analysis of customer behaviour & payment patterns</p>
          </div>
        </div>

        {/* Small customer indicators */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-background-custom p-4 rounded-[16px] border border-border-subtle flex items-center gap-3">
            <div className="p-2 bg-primary/5 text-primary rounded-xl"><Users size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">Active Customers</p>
              <h4 className="text-base font-black text-text-foreground font-display">{customer_intelligence.active_customers}</h4>
            </div>
          </div>
          <div className="bg-background-custom p-4 rounded-[16px] border border-border-subtle flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><UserCheck size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">Healthy Accounts</p>
              <h4 className="text-base font-black text-emerald-600 font-display">
                {customer_intelligence.healthy_customers_count} ({customer_intelligence.healthy_customers_pct}%)
              </h4>
            </div>
          </div>
          <div className="bg-background-custom p-4 rounded-[16px] border border-border-subtle flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">Medium Risk</p>
              <h4 className="text-base font-black text-amber-600 font-display">
                {customer_intelligence.medium_risk_count} ({customer_intelligence.medium_risk_pct}%)
              </h4>
            </div>
          </div>
          <div className="bg-background-custom p-4 rounded-[16px] border border-border-subtle flex items-center gap-3 col-span-2">
            <div className="p-2 bg-primary/5 text-primary rounded-xl"><AlertTriangle size={16} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">High Risk Concentration</p>
              <h4 className="text-base font-black text-primary font-display">
                {customer_intelligence.revenue_concentration_pct}% <span className="text-[10px] text-text-muted font-normal">(Top 3)</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Customer selection table */}
        <div className="overflow-x-auto border border-border-subtle rounded-[20px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-background-custom text-text-muted border-b border-border-subtle font-display uppercase font-bold">
                <th className="p-3">Customer Account</th>
                <th className="p-3">Revenue Share</th>
                <th className="p-3">Avg Delay</th>
                <th className="p-3">Invoices Delayed</th>
                <th className="p-3">Trend</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customer_intelligence.customers.map((c) => (
                <tr 
                  key={c.key} 
                  className={`border-b border-border-subtle hover:bg-primary/5 cursor-pointer transition-colors ${
                    selectedCustKey === c.key ? 'bg-primary/5 font-semibold text-primary' : ''
                  }`}
                  onClick={() => setSelectedCustKey(c.key)}
                >
                  <td className="p-3 font-bold text-text-foreground">{c.name}</td>
                  <td className="p-3">{c.revenue_share}%</td>
                  <td className="p-3">{c.avg_payment_delay} days</td>
                  <td className="p-3">{c.delayed_invoices} of {c.total_invoices}</td>
                  <td className="p-3 flex items-center gap-1 mt-1">{getTrendIcon(c.trend)} <span className="capitalize text-[10px]">{c.trend}</span></td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getRiskBadge(c.risk_score)}`}>
                      {c.risk_score}
                    </span>
                  </td>
                  <td className="p-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustKey(c.key);
                      }}
                      className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-full hover:bg-primary-dark transition-colors"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Specific Trend and AI Insights Panel */}
      <div className="bg-white border border-border-subtle rounded-[24px] shadow-soft p-6">
        <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-4">
          <h3 className="text-sm font-black text-slate-900 font-display">
            AI Customer Insights &mdash; <span className="text-primary">{selectedCustomer.name}</span>
          </h3>
          <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold ${getRiskBadge(selectedCustomer.risk_score)}`}>
            {selectedCustomer.risk_score} Risk Account
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Customer stats summary */}
          <div className="bg-background-custom border border-border-subtle rounded-[20px] p-4 flex flex-col justify-between gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">Revenue Contribution</p>
              <h4 className="text-lg font-black text-text-foreground mt-0.5 font-display">{selectedCustomer.revenue_share}%</h4>
              <p className="text-[9px] text-text-muted">of total business revenue</p>
            </div>
            <div className="border-t border-border-subtle pt-2">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">Total Invoices (Last 12W)</p>
              <h4 className="text-sm font-bold text-text-foreground mt-0.5">₹{customerInvoiceValue} Lakh <span className="text-xs text-text-muted">({selectedCustomer.total_invoices} invoices)</span></h4>
            </div>
            <div className="border-t border-border-subtle pt-2">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-display">Avg Payment Delay</p>
              <h4 className="text-sm font-bold text-text-foreground mt-0.5">{selectedCustomer.avg_payment_delay} Days</h4>
            </div>
            <div className="border-t border-border-subtle pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase font-display">
                <span>On-time Payment Rate</span>
                <span className={`font-black ${
                  selectedCustomer.delayed_invoices === 0 ? 'text-emerald-600' : 'text-text-foreground'
                }`}>
                  {Math.round(((selectedCustomer.total_invoices - selectedCustomer.delayed_invoices) / selectedCustomer.total_invoices) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* AI Narrative insight block */}
          <div className="lg:col-span-2 bg-primary/5 border border-primary/10 rounded-[20px] p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full translate-x-4 -translate-y-4"></div>
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5 font-display">
                <ShieldCheck size={14} />
                AI Analysis
              </h4>
              <p className="text-xs text-text-foreground leading-relaxed font-bold">
                {selectedCustomer.ai_summary}
              </p>
              <p className="text-xs text-text-muted mt-2">
                <span className="font-bold text-text-foreground">Observed Behavior: </span>{selectedCustomer.ai_observed_behavior}
              </p>
              <p className="text-xs text-primary mt-2.5 font-medium bg-primary/5 p-2 rounded-[12px] border border-primary/10">
                <span className="font-bold">Business Cash Flow Impact: </span>{selectedCustomer.ai_business_impact}
              </p>
            </div>
            <div className="text-[10px] text-text-muted border-t border-border-subtle pt-2 mt-4 flex justify-between items-center">
              <span>Confidence: <strong className="text-text-foreground font-black">{selectedCustomer.ai_confidence}</strong></span>
              <span className="text-primary font-bold flex items-center gap-0.5 hover:underline cursor-pointer">
                View Customer Details <ArrowRight size={10} />
              </span>
            </div>
          </div>

          {/* Revenue Contribution by Customer Pie Chart */}
          <div className="bg-white border border-border-subtle rounded-[20px] p-4 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 font-display">
              Revenue Share
            </h4>
            <div className="h-36 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-slate-800 leading-none">₹{data.kpis.avg_monthly_revenue_lakh.toFixed(1)}L</span>
                <span className="text-[8px] text-text-muted">Total (Monthly)</span>
              </div>
            </div>
            
            {/* Tiny color indicators for legend */}
            <div className="grid grid-cols-2 gap-1 text-[8px] mt-1 border-t border-border-subtle pt-1.5 text-text-muted">
              {pieData.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx] }}></div>
                  <span className="truncate">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer specific Recommendations row */}
        <div className="mt-4 p-4 bg-background-custom border border-border-subtle rounded-[20px]">
          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 font-display">
            Top Recommendations for {selectedCustomer.name} (AI)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2 bg-white p-2.5 rounded-[12px] border border-border-subtle">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="font-bold text-text-foreground">Actionable Credit Strategy</p>
                <p className="text-[11px] text-text-muted mt-0.5">{selectedCustomer.ai_recommendation}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-white p-2.5 rounded-[12px] border border-border-subtle">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="font-bold text-text-foreground">Operational Capacity Alignment</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {selectedCustomer.risk_score === 'High' 
                    ? 'Tighten credit limits and request advance payment before machining operations.' 
                    : 'Maintain current relationship strength and plan capacity allocation for recurring parts.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
