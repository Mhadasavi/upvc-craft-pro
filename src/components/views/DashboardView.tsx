import React from 'react';
import { Customer, Quotation } from '../../types';
import { formatINR } from '../../utils/calculations';
import {
  FileText,
  CheckCircle,
  TrendingUp,
  Boxes,
  PlusCircle,
  ArrowRight,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface DashboardViewProps {
  quotations: Quotation[];
  customers: Customer[];
  searchQuery?: string;
  onNavigateNewQuote: () => void;
  onViewQuote: (quote: Quotation) => void;
  onSendWhatsApp: (quote: Quotation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  customers,
  searchQuery,
  onNavigateNewQuote,
  onViewQuote,
  onSendWhatsApp,
}) => {
  const displayedQuotations = quotations.filter((q) => {
    if (!searchQuery || !searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    return (
      q.quoteNumber.toLowerCase().includes(term) ||
      q.customer.name.toLowerCase().includes(term) ||
      (q.customer.companyName && q.customer.companyName.toLowerCase().includes(term)) ||
      (q.customer.city && q.customer.city.toLowerCase().includes(term)) ||
      q.customer.mobile.includes(term)
    );
  });

  const activeQuotesCount = quotations.filter((q) => q.status === 'sent' || q.status === 'draft').length;
  const confirmedQuotesCount = quotations.filter((q) => q.status === 'confirmed' || q.status === 'invoiced').length;

  const totalPipelineValue = quotations.reduce((acc, q) => {
    const subtotal = q.items.reduce((s, i) => s + i.itemTotal, 0);
    return acc + subtotal * 1.18;
  }, 0);

  const totalAreaGlazed = quotations.reduce((acc, q) => {
    return acc + q.items.reduce((s, i) => s + i.totalAreaSqFt, 0);
  }, 0);

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-blue-200 uppercase tracking-wider font-semibold">
            Fabrication Operations Center
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Shree Balaji UPVC Works, Pune</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xl">
            Live estimation pipeline, multi-track parametric CAD elevations, and automated Indian GST billing.
          </p>
        </div>

        <button
          onClick={onNavigateNewQuote}
          className="h-11 px-5 rounded-xl bg-white text-blue-900 font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-all shadow-md active:scale-95 shrink-0"
          type="button"
        >
          <PlusCircle className="w-4 h-4 text-blue-600 stroke-[2.5]" />
          <span>Create New Quotation</span>
        </button>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Quotations</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-slate-900">{activeQuotesCount}</span>
          <span className="text-[11px] text-slate-500 mt-1">Pending client confirmation</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Orders</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-emerald-700">{confirmedQuotesCount}</span>
          <span className="text-[11px] text-emerald-800 font-semibold mt-1">Ready for fabrication cut-list</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Value</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-slate-900">
            {formatINR(totalPipelineValue)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">Including 18% GST estimate</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Glass / Profiles Area</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <span className="font-mono text-2xl font-bold text-slate-900">{totalAreaGlazed.toFixed(1)} Sq.Ft</span>
          <span className="text-[11px] text-slate-500 mt-1">Rough aperture glass sizing</span>
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Recent Quotations &amp; Estimations</h3>
              {searchQuery && searchQuery.trim() && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Filtered: {displayedQuotations.length} of {quotations.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Track quotes, export PDF spec sheets, or message on WhatsApp</p>
          </div>

          <button
            onClick={onNavigateNewQuote}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            type="button"
          >
            <span>+ New Estimate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {displayedQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                    No quotations match &quot;{searchQuery}&quot;
                  </td>
                </tr>
              ) : (
                displayedQuotations.map((q) => {
                const totalUnits = q.items.reduce((acc, i) => acc + i.quantity, 0);
                const totalArea = q.items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);
                const sub = q.items.reduce((acc, i) => acc + i.itemTotal, 0);
                const grand = sub * 1.18;

                const statusStyles: Record<string, string> = {
                  draft: 'bg-slate-100 text-slate-700',
                  sent: 'bg-blue-100 text-blue-800',
                  confirmed: 'bg-emerald-100 text-emerald-800 font-bold',
                  invoiced: 'bg-purple-100 text-purple-800 font-bold',
                };

                return (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{q.quoteNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{q.customer.companyName || q.customer.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{q.customer.mobile} • {q.customer.city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{q.date}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {q.items.length} ({totalUnits})
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">{totalArea.toFixed(1)} sq.ft</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(grand)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase font-mono ${statusStyles[q.status] || ''}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onViewQuote(q)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Open in Builder"
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSendWhatsApp(q)}
                          className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                          title="Share on WhatsApp"
                          type="button"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
