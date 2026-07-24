"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";

export interface SidebarProps {
  data?: any;
  activeSection?: string;
  setActiveSection?: (section: string) => void;
  onOpenChat?: () => void;
  onTriggerUpload?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: keyof typeof Icons;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Overview / Home", href: "/", icon: "LayoutDashboard" },
  { id: "pricing-agent", label: "Pricing Agent / Pricing Advice", href: "/pricing-agent", icon: "Coins" },
  { id: "revenue-intelligence", label: "Revenue Intelligence", href: "/revenue-intelligence", icon: "TrendingUp" },
  { id: "customer-intelligence", label: "Customer Intelligence", href: "/customer-intelligence", icon: "Users" },
  { id: "supplier-agent", label: "Supplier Agent", href: "/supplier-agent", icon: "Truck" },
  { id: "collections-agent", label: "Collections Agent", href: "/collections-agent", icon: "DollarSign" },
  { id: "market-intelligence", label: "Market Intelligence", href: "/market-intelligence", icon: "Globe" },
  { id: "ask-ai-cfo", label: "Ask AI CFO / Ask Gemma", href: "/ask-ai-cfo", icon: "MessageSquare" },
  { id: "what-if-simulator", label: "What-If Simulator", href: "/what-if-simulator", icon: "Sliders" },
  { id: "executive-advisor", label: "Executive Advisor", href: "/executive-advisor", icon: "Sparkles" },
  { id: "reports", label: "Reports", href: "/reports", icon: "FileText" }
];

export default function Sidebar({
  data,
  activeSection,
  onOpenChat,
  onTriggerUpload,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const SparklesIcon = Icons.Sparkles;
  const XIcon = Icons.X;

  const content = (
    <div className="h-full flex flex-col justify-between p-4">
      <div>
        {/* Brand Section */}
        <div className="flex items-center justify-between h-12 px-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--primary)] text-white p-2 rounded-2xl flex-shrink-0 shadow-sm">
              <SparklesIcon className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 text-[var(--text-primary)] whitespace-nowrap">
              FinCent
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
              aria-label="Close sidebar"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
          {navItems.map((item) => {
            const IconComponent = (Icons[item.icon] as React.ComponentType<{ className?: string }>) || Icons.HelpCircle;
            const isActive = pathname === item.href || activeSection === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`relative flex items-center gap-4 px-3 py-3 h-[48px] rounded-2xl text-sm font-medium sidebar-transition whitespace-nowrap group/item ${
                  isActive 
                    ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold" 
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-[var(--primary)]" />
                )}
                
                <div className="flex-shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
        <button 
          onClick={() => {
            if (onTriggerUpload) onTriggerUpload();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] text-xs font-medium whitespace-nowrap cursor-pointer transition-colors"
        >
          <Icons.Upload className="w-4 h-4 flex-shrink-0" />
          <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">Upload New Data</span>
        </button>
        
        <button 
          onClick={() => {
            if (onOpenChat) onOpenChat();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[20px] text-xs font-medium whitespace-nowrap cursor-pointer transition-colors shadow-sm"
        >
          <Icons.MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">Ask AI Analyst</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="group hidden md:flex fixed top-0 left-0 h-screen w-[80px] hover:w-[260px] bg-[var(--bg-card)] flex-col justify-between border-r border-[var(--border-subtle)] z-30 sidebar-transition shadow-[var(--shadow-soft)] overflow-hidden">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="fixed top-0 left-0 h-full w-[280px] bg-[var(--bg-card)] border-r border-[var(--border-subtle)] z-50 shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

export { Sidebar };
