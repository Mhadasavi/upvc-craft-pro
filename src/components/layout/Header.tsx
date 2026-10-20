import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronRight,
  Info,
  X,
  ExternalLink,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  CreditCard,
  User,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { Customer, Invoice, Quotation } from '../../types';
import { formatINR } from '../../utils/calculations';

interface HeaderProps {
  activeTab: NavTab;
  quoteNumber: string;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  ownerName: string;
  ownerRole: string;
  onSelectTab?: (tab: NavTab) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  quotations?: Quotation[];
  invoices?: Invoice[];
  customers?: Customer[];
  onOpenQuote?: (quote: Quotation) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
  onOpenCustomer?: (customer: Customer) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  quoteNumber,
  onSearchChange,
  searchQuery,
  ownerName,
  ownerRole,
  onSelectTab,
  isSidebarCollapsed = false,
  onToggleSidebar,
  quotations = [],
  invoices = [],
  customers = [],
  onOpenQuote,
  onOpenInvoice,
  onOpenCustomer,
}) => {
  const [showRateInfoModal, setShowRateInfoModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Dashboard',
    'new-quotation': 'New Quotation',
    'create-invoice': 'Create Tax Invoice',
    quotations: 'Quotations List',
    customers: 'Customers Management',
    'products-rates': 'Products & Fabrication Rates',
    invoices: 'Invoices & Payments',
    settings: 'Shop Settings',
  };

  // Close search popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter matching entities for the global quick search dropdown
  const query = searchQuery.toLowerCase().trim();
  const showDropdown = isSearchFocused && query.length > 0;

  const matchedQuotes = query
    ? quotations.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(query) ||
          q.customer.name.toLowerCase().includes(query) ||
          (q.customer.companyName && q.customer.companyName.toLowerCase().includes(query)) ||
          (q.customer.city && q.customer.city.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const matchedInvoices = query
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(query)) ||
          inv.customer.name.toLowerCase().includes(query) ||
          (inv.customer.companyName && inv.customer.companyName.toLowerCase().includes(query)) ||
          (inv.customer.gstin && inv.customer.gstin.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const matchedCustomers = query
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.companyName && c.companyName.toLowerCase().includes(query)) ||
          c.mobile.includes(query) ||
          c.city.toLowerCase().includes(query) ||
          (c.gstin && c.gstin.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const totalResultsCount = matchedQuotes.length + matchedInvoices.length + matchedCustomers.length;

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 shadow-2xs transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'left-16' : 'left-64'
        }`}
      >
        {/* Left: Sidebar Toggle Button & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
              type="button"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-blue-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-600" />
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
            <span
              onClick={() => onSelectTab && onSelectTab('dashboard')}
              className="hover:text-blue-700 transition-colors cursor-pointer hidden sm:inline"
            >
              Shop
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <span className="text-slate-900 font-bold">{tabTitles[activeTab]}</span>
            {activeTab === 'new-quotation' && (
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50 text-[11px]">
                {quoteNumber}
              </span>
            )}
          </div>
        </div>

        {/* Right: Global Search, Interactive Rate Sheet Status & User */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Interactive Global Search Input */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              className="w-48 sm:w-72 pl-9 pr-8 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/30 border border-transparent focus:border-blue-600 transition-all"
              placeholder="Search quotes, invoices, clients..."
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                }
              }}
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsSearchFocused(false);
                }}
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                title="Clear search"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Floating Global Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 sm:w-96 sm:right-0 sm:left-auto mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-slate-500 font-medium">
                  <span className="font-semibold text-slate-800">
                    Search Results ({totalResultsCount})
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-mono">Press Esc to close</span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                  {totalResultsCount === 0 ? (
                    <div className="py-6 text-center text-slate-500">
                      <p className="font-semibold">No records found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No quotes, invoices, or clients matched &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Quotations Matches */}
                      {matchedQuotes.length > 0 && (
                        <div className="py-1">
                          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                            Quotations ({matchedQuotes.length})
                          </span>
                          {matchedQuotes.map((q) => {
                            const subtotal = q.items.reduce((acc, i) => acc + i.itemTotal, 0);
                            const grand = subtotal * 1.18;
                            return (
                              <button
                                key={q.id}
                                onClick={() => {
                                  setIsSearchFocused(false);
                                  if (onOpenQuote) {
                                    onOpenQuote(q);
                                  } else if (onSelectTab) {
                                    onSelectTab('quotations');
                                  }
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50/80 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                                type="button"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-mono font-bold text-blue-700">
                                      {q.quoteNumber}
                                    </span>
                                    <span className="text-slate-600 ml-1.5 font-medium truncate">
                                      {q.customer.companyName || q.customer.name}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-slate-800 shrink-0">
                                  {formatINR(grand)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Invoices Matches */}
                      {matchedInvoices.length > 0 && (
                        <div className="py-1">
                          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                            Tax Invoices ({matchedInvoices.length})
                          </span>
                          {matchedInvoices.map((inv) => (
                            <button
                              key={inv.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                if (onOpenInvoice) {
                                  onOpenInvoice(inv);
                                } else if (onSelectTab) {
                                  onSelectTab('invoices');
                                }
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-emerald-50/80 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                              type="button"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-mono font-bold text-emerald-800">
                                    {inv.invoiceNumber}
                                  </span>
                                  <span className="text-slate-600 ml-1.5 font-medium truncate">
                                    {inv.customer.companyName || inv.customer.name}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-800 shrink-0">
                                {formatINR(inv.totalAmount)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Customers Matches */}
                      {matchedCustomers.length > 0 && (
                        <div className="py-1">
                          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                            Customers &amp; Builders ({matchedCustomers.length})
                          </span>
                          {matchedCustomers.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setIsSearchFocused(false);
                                if (onOpenCustomer) {
                                  onOpenCustomer(c);
                                } else if (onSelectTab) {
                                  onSelectTab('customers');
                                }
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-purple-50/80 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                              type="button"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <div className="truncate">
                                  <span className="font-bold text-slate-800">
                                    {c.companyName || c.name}
                                  </span>
                                  {c.companyName && (
                                    <span className="text-slate-500 ml-1">({c.name})</span>
                                  )}
                                </div>
                              </div>
                              <span className="font-mono text-slate-500 text-[11px] shrink-0">
                                {c.city}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Rate Sheet Pill */}
          <button
            onClick={() => setShowRateInfoModal(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-emerald-50 text-xs border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs group"
            type="button"
            title="Click to view details about the Active Standard Fab Rate Sheet"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-mono text-slate-600 text-[11px] group-hover:text-emerald-900">
              Standard Fab Rate Sheet:
            </span>
            <span className="text-[11px] font-bold text-emerald-800 uppercase font-mono group-hover:text-emerald-700">
              Active (INR ₹)
            </span>
            <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 ml-0.5" />
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            type="button"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {ownerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'SB'}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-800 leading-tight">{ownerName}</span>
              <span className="text-[10.5px] text-slate-500 font-medium leading-tight">{ownerRole}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Educational Explanation Popover Modal for Rate Sheet */}
      {showRateInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">Standard Fab Rate Sheet</h3>
                  <p className="text-[11px] text-blue-200 font-mono">Master Price Engine • Active Status (INR ₹)</p>
                </div>
              </div>
              <button
                onClick={() => setShowRateInfoModal(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[75vh]">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">What is this rate sheet?</h4>
                <p>
                  The <strong>Standard Fab Rate Sheet</strong> is your active pricing book. It defines the base fabrication cost per square foot for every UPVC window, door, and ventilator typology (e.g., 2-Track Sliding Window at ₹380/sq.ft, Casement Door at ₹480/sq.ft).
                </p>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Why does it show &quot;Active (INR ₹)&quot;?</span>
                </div>
                <p className="text-emerald-800 text-[11.5px]">
                  It confirms that all live price calculations in the <strong>New Quotation Builder</strong>, <strong>Invoice Generator</strong>, and <strong>Workshop Schedules</strong> are automatically calculated using Indian Rupees (₹) from this verified catalog.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">What factors does it calculate?</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Base Profile &amp; Sash Extrusions</strong>: Multi-chamber Kommerling / Deceuninck profiles.</li>
                  <li><strong>Glazing Options</strong>: 5mm Toughened Clear, 24mm DGU Soundproof, Frosted.</li>
                  <li><strong>Hardware &amp; Rollers</strong>: Heavy-duty brass tandem rollers, multi-point transmission gear locks.</li>
                  <li><strong>18% GST Compliance</strong>: Automatic CGST (9%) + SGST (9%) or IGST (18%) tax schedules.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowRateInfoModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs"
                type="button"
              >
                Close
              </button>

              {onSelectTab && (
                <button
                  onClick={() => {
                    setShowRateInfoModal(false);
                    onSelectTab('products-rates');
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-xs flex items-center gap-1.5 shadow-xs"
                  type="button"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Customize Rate Sheet</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
