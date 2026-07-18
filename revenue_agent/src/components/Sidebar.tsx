import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Upload, 
  TrendingUp, 
  Users, 
  Globe, 
  FileText, 
  Settings, 
  Briefcase,
  MessageSquare,
  Sparkles,
  Truck,
  DollarSign,
  Sliders,
  Coins
} from 'lucide-react';
import { DashboardData } from '../services/api';

interface SidebarProps {
  data: DashboardData | null;
  activeSection: string;
  setActiveSection?: (section: string) => void;
  onOpenChat: () => void;
  onTriggerUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  data,
  activeSection,
  onOpenChat,
  onTriggerUpload
}) => {
  const menuItems = [
    { id: 'dashboard', href: '/', label: 'Overview', icon: LayoutDashboard },
    { id: 'pricing-agent', href: '/pricing-agent', label: 'Pricing Agent', icon: Coins },
    { id: 'revenue-intelligence', href: '/revenue-intelligence', label: 'Revenue Intelligence', icon: TrendingUp },
    { id: 'customer-intelligence', href: '/customer-intelligence', label: 'Customer Intelligence', icon: Users },
    { id: 'supplier-agent', href: '/supplier-agent', label: 'Supplier Agent', icon: Truck },
    { id: 'collections-agent', href: '/collections-agent', label: 'Collections Agent', icon: DollarSign },
    { id: 'market-intelligence', href: '/market-intelligence', label: 'Market Intelligence', icon: Globe },
    { id: 'ask-ai-cfo', href: '/ask-ai-cfo', label: 'Ask AI CFO', icon: MessageSquare },
    { id: 'what-if-simulator', href: '/what-if-simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'executive-advisor', href: '/executive-advisor', label: 'Executive Advisor', icon: Sparkles },
    { id: 'reports', href: '/reports', label: 'Reports', icon: FileText },
  ];

  const business = data?.summary || {
    business_name: "CNC Machining Enterprise",
    industry: "Precision Engineering",
    location: "Industrial Hub",
    employees: 18,
    machines: 8,
    last_upload_filename: "history_data.csv",
    last_upload_date: "16 Jul 2026, 10:22 PM",
    total_records_months: 36
  };

  const monthlyRevenue = data 
    ? `${data.kpis.avg_monthly_revenue_lakh} Lakh ₹` 
    : "—";
  const businessRisk = data 
    ? `${data.kpis.business_risk_category} (${data.kpis.business_risk_score})`
    : "—";
  const topCustomer = data?.customer_intelligence?.customers?.[0]?.name || "—";
  const forecastStatus = data ? "Active / Sync" : "Ready";
  const lastAnalysisTime = data ? data.summary.last_upload_date : "16 Jul 2026, 10:22 PM";

  return (
    <div className="w-[80px] hover:w-[260px] bg-white text-text-foreground min-h-screen p-4 flex flex-col justify-between border-r border-border-subtle flex-shrink-0 no-print transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group z-30 font-sans shadow-soft">
      <div className="flex flex-col gap-6 overflow-hidden">
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-3 px-2 py-2 flex-shrink-0 cursor-pointer">
          <div className="p-2.5 bg-primary rounded-2xl text-white flex items-center justify-center">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <h1 className="font-black text-slate-900 tracking-tight text-sm font-display leading-none">FinCent</h1>
            <span className="text-[10px] text-text-muted font-bold font-sans">REVENUE INTEL</span>
          </div>
        </Link>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-[50vh]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || activeSection === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-4 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 text-left ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-muted hover:bg-background-custom hover:text-text-foreground'
                }`}
              >
                {/* Left Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-primary" />
                )}
                
                <Icon size={18} className="flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={onTriggerUpload}
            className="flex items-center gap-4 px-3 py-2.5 rounded-2xl text-xs font-bold text-text-muted hover:bg-background-custom hover:text-text-foreground text-left"
          >
            <Upload size={18} className="flex-shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Upload New Data
            </span>
          </button>
        </nav>

        {/* Business Profile (Visible when sidebar is expanded) */}
        <div className="bg-background-custom border border-border-subtle rounded-[24px] p-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted tracking-wider uppercase mb-3">
            <Briefcase size={12} className="text-text-muted" />
            <span>Business Profile</span>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-slate-950 font-black text-xs tracking-tight font-display">{business.business_name}</h3>
            
            <div className="text-[10px] text-text-muted flex flex-col gap-1.5 mt-1 border-t border-border-subtle pt-2">
              <div className="flex justify-between">
                <span>Industry:</span>
                <span className="text-text-foreground font-bold truncate max-w-[100px] text-right" title={business.industry}>{business.industry}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="text-text-foreground font-bold truncate max-w-[100px] text-right" title={business.location}>{business.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Scale:</span>
                <span className="text-text-foreground font-bold">{business.employees} Empl | {business.machines} CNC</span>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-1.5">
                <span>Monthly Rev:</span>
                <span className="text-text-foreground font-black">{monthlyRevenue}</span>
              </div>
              <div className="flex justify-between">
                <span>Top Customer:</span>
                <span className="text-text-foreground font-bold truncate max-w-[100px]" title={topCustomer}>{topCustomer}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk:</span>
                <span className={`font-black ${
                  data && data.kpis.business_risk_category === 'High' ? 'text-primary' :
                  data && data.kpis.business_risk_category === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                }`}>{businessRisk}</span>
              </div>
              <div className="flex justify-between">
                <span>Forecast:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  {forecastStatus}
                </span>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-1.5 text-[9px]">
                <span>Last Analysis:</span>
                <span>{lastAnalysisTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-6">
        {/* AI Analyst Support CTA */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-4 bg-primary hover:bg-primary-dark text-white p-3 rounded-[20px] transition-all duration-200 text-left border border-primary/20 shadow-soft"
        >
          <div className="p-2 bg-white/15 rounded-lg flex-shrink-0 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <p className="text-xs font-bold leading-tight">Need help?</p>
            <p className="text-[10px] text-white/80 mt-0.5">Ask our AI Analyst</p>
          </div>
        </button>

        {/* CNC Owner Profile Widget */}
        <div className="flex items-center gap-3 border-t border-border-subtle pt-4 mt-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-soft flex-shrink-0">
            N
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <p className="text-xs font-bold text-text-foreground leading-none">CNC Owner</p>
            <span className="text-[10px] text-text-muted font-medium">Bengaluru Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
