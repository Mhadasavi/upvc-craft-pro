import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  Files,
  Users,
  Tags,
  CreditCard,
  Settings,
  Receipt,
  Command,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ThemeMode } from '../../utils/theme';
import { useLanguage } from '../../context/LanguageContext';

export type NavTab =
  | 'dashboard'
  | 'new-quotation'
  | 'create-invoice'
  | 'quotations'
  | 'invoices'
  | 'customers'
  | 'products-rates'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  shopName: string;
  shopCity: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  shopName,
  shopCity,
  isCollapsed = false,
  onToggleCollapse,
  theme = 'light',
  onToggleTheme,
}) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard' as NavTab, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'new-quotation' as NavTab, label: t('nav.newQuotation'), icon: FilePlus },
    { id: 'create-invoice' as NavTab, label: t('nav.createInvoice'), icon: Receipt },
    { id: 'quotations' as NavTab, label: t('nav.quotations'), icon: Files },
    { id: 'invoices' as NavTab, label: t('nav.invoices'), icon: CreditCard },
    { id: 'customers' as NavTab, label: t('nav.customers'), icon: Users },
    { id: 'products-rates' as NavTab, label: t('nav.productsRates'), icon: Tags },
    { id: 'settings' as NavTab, label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#213145] text-white z-50 flex flex-col justify-between shadow-xl select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Lockup */}
        <div
          className={`h-16 flex items-center border-b border-white/10 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0 cursor-pointer"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Click to expand sidebar' : 'uPVC Craft Pro'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M12 4v16" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white tracking-tight leading-tight truncate">
                  uPVC Craft Pro
                </span>
                <span className="font-mono text-[10.5px] text-emerald-400 font-medium truncate">
                  Billing &amp; Estimation
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Collapse sidebar (Ctrl+B)"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Label */}
        <div className={`pt-3 pb-1 ${isCollapsed ? 'px-2 text-center' : 'px-4'}`}>
          {!isCollapsed ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
              Shop Operations
            </span>
          ) : (
            <div className="w-6 h-px bg-white/10 mx-auto" />
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all text-left group relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                type="button"
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />

                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Badge for Create Invoice */}
                {item.id === 'create-invoice' && (
                  <>
                    {!isCollapsed ? (
                      <span className="ml-auto font-mono text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold shrink-0">
                        TAX
                      </span>
                    ) : (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </>
                )}

                {/* Floating tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Badge & Collapse Switcher */}
      <div className={`bg-black/20 border-t border-white/10 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {!isCollapsed ? (
          <>
            <div className="p-2.5 rounded-lg bg-white/5 mb-2 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{shopName}</span>
                <span className="font-mono text-[10px] text-emerald-300 bg-emerald-900/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                  {shopCity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Quick Fab Rate Tier 1 • Active</p>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px] px-1">
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" /> Shortcuts
              </span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                Ctrl + B
              </kbd>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Expand sidebar (Ctrl+B)"
              type="button"
            >
              <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
