import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  highlight?: boolean;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  highlight = false,
  children
}) => {
  return (
    <div className={`group relative overflow-hidden rounded-[24px] border ${
      highlight ? 'border-primary/20 bg-primary/5' : 'border-border-subtle bg-surface'
    } p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full`}>
      {/* Decorative Blur Background */}
      <div className="absolute right-0 top-0 -translate-y-6 translate-x-6 h-32 w-32 bg-primary/5 rounded-full blur-3xl transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 pointer-events-none"></div>
      
      <div className="flex justify-between items-start z-10">
        {/* Icon Bucket */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background border border-border-subtle text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-white">
          <Icon size={20} />
        </div>
        
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/5 text-primary'
          }`}>
            <span>{trend.value}</span>
          </span>
        )}
      </div>

      <div className="mt-4 z-10">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider font-display">{label}</p>
        <h3 className="text-2xl font-black text-text-foreground tracking-tight mt-1 font-display">
          {value}
        </h3>
        <p className="text-[10px] text-text-muted mt-0.5">{subtext}</p>
        {children}
      </div>
    </div>
  );
};
