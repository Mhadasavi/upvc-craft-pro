import React, { useState, useMemo, useRef } from 'react';
import { Customer, Invoice, PaymentRecord, Quotation, QuotationStatus } from '../../types';
import { formatINR } from '../../utils/calculations';
import { CutListModal } from '../modals/CutListModal';
import { CustomerModal } from '../modals/CustomerModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileText,
  CheckCircle,
  TrendingUp,
  Boxes,
  PlusCircle,
  ArrowRight,
  Eye,
  MessageSquare,
  Search,
  Filter,
  X,
  CreditCard,
  UserPlus,
  Receipt,
  Scissors,
  Wrench,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardViewProps {
  quotations: Quotation[];
  customers: Customer[];
  invoices?: Invoice[];
  searchQuery?: string;
  onNavigateNewQuote: () => void;
  onViewQuote: (quote: Quotation) => void;
  onSendWhatsApp: (quote: Quotation) => void;
  onNavigateTab?: (tab: 'dashboard' | 'new-quotation' | 'create-invoice' | 'quotations' | 'invoices' | 'customers' | 'products-rates' | 'settings') => void;
  onAddNewCustomer?: (customer: Customer) => void;
  onAddPayment?: (invoiceId: string, payment: PaymentRecord) => void;
  onUpdateQuoteStatus?: (quoteId: string, status: QuotationStatus) => void;
  onConvertToInvoice?: (quote: Quotation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  customers,
  invoices = [],
  searchQuery: externalSearchQuery,
  onNavigateNewQuote,
  onViewQuote,
  onSendWhatsApp,
  onNavigateTab,
  onAddNewCustomer,
  onAddPayment,
  onUpdateQuoteStatus,
  onConvertToInvoice,
}) => {
  // Modal states for direct quick actions
  const [cutListQuote, setCutListQuote] = useState<Quotation | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  // Table filters
  const [searchTerm, setSearchTerm] = useState(externalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | QuotationStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'thisMonth'>('all');
  const { t, language } = useLanguage();

  // Ref to scroll to sections
  const recentQuotesRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);

  // Dynamic greeting based on time of day and active language
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (language === 'hi') {
      if (hour < 12) return 'शुभ प्रभात! आपका स्वागत है';
      if (hour < 17) return 'शुभ दोपहर! आपका स्वागत है';
      return 'शुभ संध्या! आपका स्वागत है';
    }
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  }, [language]);

  // 1. Pending Quotations (draft or sent)
  const pendingQuotes = useMemo(
    () => quotations.filter((q) => q.status === 'sent' || q.status === 'draft'),
    [quotations]
  );

  // 2. Fabrication Orders (confirmed quotes ready for production)
  const fabricationOrders = useMemo(
    () => quotations.filter((q) => q.status === 'confirmed'),
    [quotations]
  );

  // 3. Orders ready for installation / completed
  const installationOrders = useMemo(
    () => quotations.filter((q) => q.status === 'invoiced' || (q.status === 'confirmed' && q.items.some(i => i.accessories.siteFitting))),
    [quotations]
  );

  // 4. Payments Due across all invoices
  const totalBalanceDue = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.status !== 'paid' ? (inv.balanceDue || 0) : 0), 0),
    [invoices]
  );

  // 5. Sales This Month
  const salesThisMonth = useMemo(() => {
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();

    // From invoices
    const invoiceTotal = invoices
      .filter((inv) => {
        const d = new Date(inv.date);
        return !isNaN(d.getTime()) && d.getMonth() === currMonth && d.getFullYear() === currYear;
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    if (invoiceTotal > 0) return invoiceTotal;

    // Fallback from confirmed/invoiced quotations this month
    return quotations
      .filter((q) => q.status === 'confirmed' || q.status === 'invoiced')
      .reduce((sum, q) => {
        const sub = q.items.reduce((s, i) => s + i.itemTotal, 0);
        return sum + sub * 1.18;
      }, 0);
  }, [invoices, quotations]);

  // Format currency shorthand (e.g. ₹1.85L if >= 100k, or full format)
  const formatShorthandINR = (amount: number): string => {
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(2);
      return `₹${lakhs.replace(/\.00$/, '')}L`;
    }
    return formatINR(amount);
  };

  // Helper date checker
  const matchesDateFilter = (dateStr: string): boolean => {
    if (dateFilter === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);

    if (dateFilter === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (dateFilter === '7days') return diffDays >= -1 && diffDays <= 7;
    if (dateFilter === '30days') return diffDays >= -1 && diffDays <= 30;
    if (dateFilter === 'thisMonth') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filtered quotations for recent table
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      // Search term filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        q.quoteNumber.toLowerCase().includes(term) ||
        q.customer.name.toLowerCase().includes(term) ||
        (q.customer.companyName && q.customer.companyName.toLowerCase().includes(term)) ||
        (q.customer.city && q.customer.city.toLowerCase().includes(term)) ||
        q.customer.mobile.includes(term);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = q.status === 'draft' || q.status === 'sent';
      } else if (statusFilter !== 'all') {
        matchesStatus = q.status === statusFilter;
      }

      // Date filter
      const matchesDate = matchesDateFilter(q.date);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [quotations, searchTerm, statusFilter, dateFilter]);

  // Card click actions
  const handleCardClick = (type: 'pending' | 'fabrication' | 'payments' | 'sales') => {
    if (type === 'pending') {
      setStatusFilter('pending');
      recentQuotesRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'fabrication') {
      workflowRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'payments') {
      if (invoices.some((i) => i.status !== 'paid' && i.balanceDue > 0)) {
        setIsRecordPaymentOpen(true);
      } else if (onNavigateTab) {
        onNavigateTab('invoices');
      }
    } else if (type === 'sales') {
      if (onNavigateTab) {
        onNavigateTab('quotations');
      }
    }
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || statusFilter !== 'all' || dateFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* 1. Compact Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{greeting}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <button
          onClick={onNavigateNewQuote}
          className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0"
          type="button"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{t('dashboard.newQuoteBtn')}</span>
        </button>
      </div>

      {/* 2. Four Actionable Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Quotations */}
        <div
          onClick={() => handleCardClick('pending')}
          className="bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          title="Click to filter pending quotations"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('dashboard.pendingQuotes')}
              </span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 dark:border dark:border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
              {pendingQuotes.length}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('dashboard.awaitingResponse')}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 2: Fabrication Orders */}
        <div
          onClick={() => handleCardClick('fabrication')}
          className="bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          title="Click to jump to Fabrication Workflow"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t('dashboard.fabricationOrders')}
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 dark:border dark:border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-3xl font-bold text-indigo-700 dark:text-indigo-400">
              {fabricationOrders.length}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{language === 'hi' ? 'पुष्टि किए गए ऑर्डर' : 'Confirmed orders'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Card 3: Payments Due */}
        <div
          onClick={() => handleCardClick('payments')}
          className="bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          title="Click to view or record payment"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('dashboard.balanceDue')}
              </span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 dark:border dark:border-amber-500/30 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
              {formatINR(totalBalanceDue)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('dashboard.uncollectedPayments')}</span>
            <span className="font-semibold text-amber-700 dark:text-amber-400 group-hover:underline">
              {totalBalanceDue > 0 ? (language === 'hi' ? '+ भुगतान दर्ज करें' : '+ Record Pay') : (language === 'hi' ? 'निपटा हुआ' : 'Settled')}
            </span>
          </div>
        </div>

        {/* Card 4: Sales This Month */}
        <div
          onClick={() => handleCardClick('sales')}
          className="bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          title="Click to view sales and quotations"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {language === 'hi' ? 'इस महीने की बिक्री' : 'Sales This Month'}
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 dark:border dark:border-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatShorthandINR(salesThisMonth)}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{language === 'hi' ? 'मासिक बिक्री कुल' : 'Monthly sales total'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Panel */}
      <div className="bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('dashboard.quickActions')}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{language === 'hi' ? 'सामान्य कार्य' : 'Common tasks'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Action 1: New Quotation */}
          <button
            onClick={onNavigateNewQuote}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all flex items-center gap-3 text-left group"
            type="button"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-blue-300 dark:group-hover:border-blue-500/50 text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">
                {t('dashboard.newQuoteAction')}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block truncate">{t('dashboard.newQuoteActionDesc')}</span>
            </div>
          </button>

          {/* Action 2: Add Customer */}
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all flex items-center gap-3 text-left group"
            type="button"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                {t('dashboard.addCustomerAction')}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block truncate">{t('dashboard.addCustomerActionDesc')}</span>
            </div>
          </button>

          {/* Action 3: Create Invoice */}
          <button
            onClick={() => onNavigateTab ? onNavigateTab('create-invoice') : null}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-300 dark:hover:border-purple-500/40 transition-all flex items-center gap-3 text-left group"
            type="button"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-purple-300 dark:group-hover:border-purple-500/50 text-purple-600 dark:text-purple-400 shrink-0 shadow-2xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-purple-700 dark:group-hover:text-purple-400">
                {t('dashboard.createInvoiceAction')}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block truncate">{t('dashboard.createInvoiceActionDesc')}</span>
            </div>
          </button>

          {/* Action 4: Record Payment */}
          <button
            onClick={() => setIsRecordPaymentOpen(true)}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all flex items-center gap-3 text-left group"
            type="button"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 group-hover:border-amber-300 dark:group-hover:border-amber-500/50 text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-amber-700 dark:group-hover:text-amber-400">
                {t('invoice.recordPayment')}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block truncate">{language === 'hi' ? 'यूपीआई / एनईएफटी दर्ज करें' : 'Log UPI / NEFT'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. UPVC Fabrication Workflow Section */}
      <div ref={workflowRef} className="bg-white dark:bg-slate-900/90 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {t('dashboard.pipelineTitle')}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                UPVC Workshop
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {language === 'hi'
                ? 'लाइव ऑर्डर चक्र: ग्राहक स्वीकृति, 45° प्रोफ़ाइल कटिंग, वेल्डिंग एवं साइट इंस्टॉलेशन।'
                : 'Live lifecycle: customer approval, 45° profile cutting, welding burn-off & on-site installation.'}
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{quotations.length} {language === 'hi' ? 'कुल ऑर्डर' : 'Total Orders'}</span>
          </div>
        </div>

        {/* 3 Pipeline Stage Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stage 1: Awaiting Confirmation */}
          <div className="bg-slate-50/70 dark:bg-slate-950/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {language === 'hi' ? '1. स्वीकृति प्रतीक्षित' : '1. Awaiting Approval'}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 dark:border dark:border-blue-500/30">
                  {pendingQuotes.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                {language === 'hi'
                  ? 'ड्राफ्ट एवं भेजे गए कोटेशन ग्राहक की पुष्टि की प्रतीक्षा में।'
                  : 'Draft & sent quotes waiting for customer confirmation.'}
              </p>

              {/* Items in Stage 1 */}
              <div className="flex flex-col gap-2">
                {pendingQuotes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    No quotations pending response.
                  </div>
                ) : (
                  pendingQuotes.slice(0, 3).map((q) => {
                    const sub = q.items.reduce((s, i) => s + i.itemTotal, 0);
                    const grand = sub * 1.18;
                    return (
                      <div
                        key={q.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs dark:shadow-md flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {q.customer.companyName || q.customer.name}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {formatINR(grand)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>{q.quoteNumber}</span>
                          <span>{q.items.length} items</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => onSendWhatsApp(q)}
                            className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 dark:border dark:border-emerald-500/30 transition-colors"
                            title="Follow up on WhatsApp"
                          >
                            WhatsApp
                          </button>
                          {onUpdateQuoteStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateQuoteStatus(q.id, 'confirmed')}
                              className="px-2 py-0.5 rounded text-[10.5px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs"
                              title="Confirm order and send to workshop"
                            >
                              Confirm Order →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {pendingQuotes.length > 3 && (
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 text-center mt-2 block">
                +{pendingQuotes.length - 3} more awaiting response
              </span>
            )}
          </div>

          {/* Stage 2: Ready for Fabrication */}
          <div className="bg-indigo-50/40 dark:bg-indigo-950/25 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                  <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                    {language === 'hi' ? '2. निर्माण हेतु तैयार' : '2. Ready for Fabrication'}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 dark:border dark:border-indigo-500/30">
                  {fabricationOrders.length}
                </span>
              </div>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mb-3">
                {language === 'hi'
                  ? 'कटिंग, वेल्डिंग एवं ग्लेज़िंग हेतु स्वीकृत ऑर्डर।'
                  : 'Approved orders ready for saw cutting, welding & glazing.'}
              </p>

              {/* Items in Stage 2 */}
              <div className="flex flex-col gap-2">
                {fabricationOrders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-indigo-400 dark:text-indigo-400/80 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-900/50">
                    {language === 'hi' ? 'निर्माण कतार में कोई ऑर्डर प्रतीक्षारत नहीं है।' : 'No orders waiting in fabrication queue.'}
                  </div>
                ) : (
                  fabricationOrders.slice(0, 3).map((q) => {
                    const totalArea = q.items.reduce((s, i) => s + i.totalAreaSqFt, 0);
                    const unitsCount = q.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <div
                        key={q.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-900/60 shadow-2xs dark:shadow-md flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {q.customer.companyName || q.customer.name}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/20 dark:border dark:border-indigo-500/30 px-1.5 py-0.5 rounded">
                            {unitsCount} units ({totalArea.toFixed(0)} sq.ft)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>{q.quoteNumber}</span>
                          <span className="truncate max-w-[130px]">{q.customer.city}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setCutListQuote(q)}
                            className="px-2 py-1 rounded text-[11px] font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 dark:border dark:border-indigo-500/30 transition-colors flex items-center gap-1"
                            title="Open Cut-List Sheet"
                          >
                            <Scissors className="w-3 h-3" />
                            <span>Cut-List</span>
                          </button>
                          {onConvertToInvoice && (
                            <button
                              type="button"
                              onClick={() => onConvertToInvoice(q)}
                              className="px-2 py-1 rounded text-[11px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 dark:border dark:border-emerald-500/30 transition-colors"
                              title="Create Invoice"
                            >
                              {language === 'hi' ? 'बिल बनाएँ →' : 'Bill →'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {fabricationOrders.length > 3 && (
              <span className="text-[10.5px] text-indigo-600/70 dark:text-indigo-400/70 text-center mt-2 block">
                {language === 'hi' ? `+${fabricationOrders.length - 3} और ऑर्डर तैयार` : `+${fabricationOrders.length - 3} more ready in shop`}
              </span>
            )}
          </div>

          {/* Stage 3: Ready for Installation */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/25 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                    {language === 'hi' ? '3. इंस्टॉलेशन / डिस्पैच तैयार' : '3. Ready for Installation'}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
                  {installationOrders.length}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mb-3">
                {language === 'hi'
                  ? 'साइट डिलीवरी एवं इंस्टॉलेशन के लिए तैयार यूनिट्स।'
                  : 'Fabricated units ready for site delivery & installation.'}
              </p>

              {/* Items in Stage 3 */}
              <div className="flex flex-col gap-2">
                {installationOrders.length === 0 ? (
                  <div className="p-4 text-center text-xs text-emerald-500 dark:text-emerald-400/80 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-900/50">
                    {language === 'hi' ? 'साइट इंस्टॉलेशन हेतु कोई ऑर्डर निर्धारित नहीं है।' : 'No orders scheduled for site installation.'}
                  </div>
                ) : (
                  installationOrders.slice(0, 3).map((q) => {
                    const hasFitting = q.items.some((i) => i.accessories.siteFitting);
                    return (
                      <div
                        key={q.id}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900/60 shadow-2xs dark:shadow-md flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {q.customer.companyName || q.customer.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              hasFitting
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 dark:border dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:border dark:border-slate-700'
                            }`}
                          >
                            {hasFitting ? (language === 'hi' ? 'साइट फिटिंग' : 'Site Fitting') : (language === 'hi' ? 'केवल सप्लाई' : 'Supply Only')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{q.quoteNumber}</span>
                          <span className="flex items-center gap-1 text-[10.5px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {q.customer.city}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => onViewQuote(q)}
                            className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 dark:border dark:border-slate-700 transition-colors"
                          >
                            {language === 'hi' ? 'विवरण' : 'Details'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSendWhatsApp(q)}
                            className="px-2 py-0.5 rounded text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 dark:border dark:border-emerald-500/30 transition-colors"
                          >
                            {language === 'hi' ? 'डिस्पैच अपडेट' : 'Dispatch Update'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {installationOrders.length > 3 && (
              <span className="text-[10.5px] text-emerald-600/70 dark:text-emerald-400/70 text-center mt-2 block">
                {language === 'hi' ? `+${installationOrders.length - 3} और ऑर्डर डिस्पैच में` : `+${installationOrders.length - 3} more in dispatch`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Quotations Table with Search & Filters */}
      <div ref={recentQuotesRef} className="bg-white dark:bg-slate-900/90 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Table Header and View all Link */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('dashboard.recentQuotesTitle')}</h2>
              {hasActiveFilters && (
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 dark:border dark:border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  {filteredQuotations.length} of {quotations.length}
                </span>
              )}
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('quotations')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                type="button"
              >
                <span>{t('dashboard.viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Bar: Search + Status Filter + Date Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'hi' ? 'कोटेशन #, ग्राहक, मोबाइल, शहर खोजें...' : 'Search quote #, customer, mobile, city...'}
                className="w-full h-9 pl-9 pr-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  type="button"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 h-9">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{language === 'hi' ? 'स्थिति:' : 'Status:'}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-900">{language === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses'}</option>
                  <option value="pending" className="dark:bg-slate-900">{language === 'hi' ? 'लंबित (ड्राफ्ट + भेजा)' : 'Pending (Draft + Sent)'}</option>
                  <option value="draft" className="dark:bg-slate-900">{language === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                  <option value="sent" className="dark:bg-slate-900">{language === 'hi' ? 'भेजा गया' : 'Sent'}</option>
                  <option value="confirmed" className="dark:bg-slate-900">{language === 'hi' ? 'कन्फ़र्म' : 'Confirmed'}</option>
                  <option value="invoiced" className="dark:bg-slate-900">{language === 'hi' ? 'बिल बनाया गया' : 'Invoiced'}</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 h-9">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-900">{language === 'hi' ? 'सभी तिथियाँ' : 'All Dates'}</option>
                  <option value="today" className="dark:bg-slate-900">{language === 'hi' ? 'आज' : 'Today'}</option>
                  <option value="7days" className="dark:bg-slate-900">{language === 'hi' ? 'पिछले 7 दिन' : 'Last 7 Days'}</option>
                  <option value="thisMonth" className="dark:bg-slate-900">{language === 'hi' ? 'इस महीने' : 'This Month'}</option>
                  <option value="30days" className="dark:bg-slate-900">{language === 'hi' ? 'पिछले 30 दिन' : 'Last 30 Days'}</option>
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  type="button"
                  title="Reset all filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'रीसेट' : 'Clear'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Quote Ref</th>
                <th className="py-3 px-4">Customer &amp; Project</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Items (Qty)</th>
                <th className="py-3 px-4 text-right">Area (Sq.Ft)</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <span>No quotations found matching active filters.</span>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                          type="button"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => {
                  const totalUnits = q.items.reduce((acc, i) => acc + i.quantity, 0);
                  const totalArea = q.items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);
                  const sub = q.items.reduce((acc, i) => acc + i.itemTotal, 0);
                  const grand = sub * 1.18;

                  const statusStyles: Record<string, string> = {
                    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:border dark:border-slate-700',
                    sent: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 dark:border dark:border-blue-500/30',
                    confirmed: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold dark:border dark:border-emerald-500/30',
                    invoiced: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold dark:border dark:border-purple-500/30',
                  };

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                        {q.quoteNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {q.customer.companyName || q.customer.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {q.customer.mobile} • {q.customer.city}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{q.date}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {q.items.length} ({totalUnits})
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {totalArea.toFixed(1)} sq.ft
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {formatINR(grand)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase font-mono ${
                            statusStyles[q.status] || ''
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onViewQuote(q)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Open in Builder"
                            type="button"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSendWhatsApp(q)}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Share on WhatsApp"
                            type="button"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {q.status === 'confirmed' && (
                            <button
                              onClick={() => setCutListQuote(q)}
                              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                              title="Workshop Cut-List"
                              type="button"
                            >
                              <Scissors className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cut-List Modal */}
      {cutListQuote && (
        <CutListModal
          isOpen={Boolean(cutListQuote)}
          onClose={() => setCutListQuote(null)}
          items={cutListQuote.items}
          quoteNumber={cutListQuote.quoteNumber}
        />
      )}

      {/* Add Customer Modal */}
      {isCustomerModalOpen && onAddNewCustomer && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          customers={customers}
          selectedCustomerId=""
          onSelectCustomer={(c) => {
            setIsCustomerModalOpen(false);
          }}
          onAddNewCustomer={(c) => {
            onAddNewCustomer(c);
            setIsCustomerModalOpen(false);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && onAddPayment && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          invoices={invoices}
          onAddPayment={onAddPayment}
        />
      )}
    </div>
  );
};
