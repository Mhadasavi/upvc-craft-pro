import React, { useState, useEffect } from 'react';
import { Quotation, QuotationStatus } from '../../types';
import { formatINR } from '../../utils/calculations';
import {
  Search,
  Plus,
  Eye,
  Printer,
  MessageSquare,
  Trash2,
  ArrowRight,
  Receipt,
  Copy,
  AlertCircle,
} from 'lucide-react';

interface QuotationsViewProps {
  quotations: Quotation[];
  searchQuery?: string;
  onOpenNewQuote: () => void;
  onEditQuote: (quote: Quotation) => void;
  onPrintQuote: (quote: Quotation) => void;
  onSendWhatsApp: (quote: Quotation) => void;
  onDeleteQuote: (id: string) => void;
  onConvertToInvoice: (quote: Quotation) => void;
  onUpdateQuoteStatus?: (quoteId: string, status: QuotationStatus) => void;
  onDuplicateQuote?: (quote: Quotation) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  quotations,
  searchQuery,
  onOpenNewQuote,
  onEditQuote,
  onPrintQuote,
  onSendWhatsApp,
  onDeleteQuote,
  onConvertToInvoice,
  onUpdateQuoteStatus,
  onDuplicateQuote,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | QuotationStatus>('all');
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [quoteToDelete, setQuoteToDelete] = useState<Quotation | null>(null);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const filtered = quotations.filter((q) => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      q.quoteNumber.toLowerCase().includes(term) ||
      q.customer.name.toLowerCase().includes(term) ||
      (q.customer.companyName && q.customer.companyName.toLowerCase().includes(term)) ||
      (q.customer.city && q.customer.city.toLowerCase().includes(term)) ||
      (q.customer.mobile && q.customer.mobile.includes(term));
    return matchesStatus && matchesSearch;
  });

  const statusStyles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-300',
    sent: 'bg-blue-100 text-blue-800 border-blue-300',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    invoiced: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
  };

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quotations Directory</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage estimates, track status, generate printable PDF quotes and WhatsApp shares
          </p>
        </div>

        <button
          onClick={onOpenNewQuote}
          className="h-10 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
          type="button"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['all', 'draft', 'sent', 'confirmed', 'invoiced'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search quote ref, client name, city..."
            className="w-72 h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
              <th className="py-3 px-4">Quote Number</th>
              <th className="py-3 px-4">Customer / Site</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-center">Items</th>
              <th className="py-3 px-4 text-right">Total Area</th>
              <th className="py-3 px-4 text-right">Grand Total (₹)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                  No quotations found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((quote) => {
                const totalUnits = quote.items.reduce((acc, i) => acc + i.quantity, 0);
                const totalArea = quote.items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);
                const sub = quote.items.reduce((acc, i) => acc + i.itemTotal, 0);
                const grand = sub * 1.18;

                return (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{quote.quoteNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{quote.customer.companyName || quote.customer.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{quote.customer.mobile} • {quote.customer.city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-slate-800 font-medium">{quote.date}</span>
                        {quote.validUntil && (
                          <span className="text-[10px] text-slate-400 font-mono">Valid till {quote.validUntil}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-800">
                      {quote.items.length} items ({totalUnits} units)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">{totalArea.toFixed(1)} sq.ft</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(grand)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {onUpdateQuoteStatus ? (
                        <select
                          value={quote.status}
                          onChange={(e) => onUpdateQuoteStatus(quote.id, e.target.value as QuotationStatus)}
                          className={`px-2 py-0.5 rounded-full text-[10.5px] uppercase font-mono border font-semibold cursor-pointer focus:outline-none transition-colors ${
                            statusStyles[quote.status] || ''
                          }`}
                        >
                          <option value="draft">DRAFT</option>
                          <option value="sent">SENT</option>
                          <option value="confirmed">CONFIRMED</option>
                          <option value="invoiced">INVOICED</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] uppercase font-mono ${statusStyles[quote.status] || ''}`}>
                          {quote.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        {/* Open in Builder */}
                        <button
                          onClick={() => onEditQuote(quote)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Open in Builder"
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Duplicate Quote */}
                        {onDuplicateQuote && (
                          <button
                            onClick={() => onDuplicateQuote(quote)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Duplicate Quotation"
                            type="button"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}

                        {/* Print / Save PDF */}
                        <button
                          onClick={() => onPrintQuote(quote)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Print / Save PDF"
                          type="button"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Share WhatsApp */}
                        <button
                          onClick={() => onSendWhatsApp(quote)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Share via WhatsApp"
                          type="button"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Convert to Invoice */}
                        {quote.status !== 'invoiced' && (
                          <button
                            onClick={() => onConvertToInvoice(quote)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Create GST Invoice"
                            type="button"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Quote */}
                        <button
                          onClick={() => setQuoteToDelete(quote)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Quotation Confirmation Modal */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Quotation?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete quotation <strong>{quoteToDelete.quoteNumber}</strong> for client{' '}
                <strong>{quoteToDelete.customer.name}</strong>? This estimate and all its configured items will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setQuoteToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteQuote(quoteToDelete.id);
                  setQuoteToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
                type="button"
              >
                Delete Quotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
