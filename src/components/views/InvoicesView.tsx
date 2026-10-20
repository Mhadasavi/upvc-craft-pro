import React, { useState, useEffect } from 'react';
import { BusinessProfile, Invoice, PaymentRecord } from '../../types';
import { formatINR } from '../../utils/calculations';
import { InvoiceDetailModal } from '../modals/InvoiceDetailModal';
import {
  printDocument,
  downloadPrintableHtml,
  generateInvoicePrintHtml,
} from '../../utils/printDocument';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  Printer,
  Download,
  X,
  Check,
  Search,
  Eye,
  Edit2,
  Trash2,
  Copy,
  MessageSquare,
  FileText,
  Filter,
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  businessProfile: BusinessProfile;
  searchQuery?: string;
  onAddPayment: (invoiceId: string, payment: PaymentRecord) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onOpenCreateInvoice?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  businessProfile,
  searchQuery: externalSearchQuery,
  onAddPayment,
  onDeletePayment,
  onUpdateInvoice,
  onDeleteInvoice,
  onDuplicateInvoice,
  onOpenCreateInvoice,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'pending'>('all');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Quick payment recording state from table
  const [quickPayInvoice, setQuickPayInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'UPI' | 'NEFT' | 'Cash' | 'Cheque'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Keep selected invoice synced if it gets updated in parent state
  const activeModalInvoice = selectedInvoice
    ? invoices.find((inv) => inv.id === selectedInvoice.id) || selectedInvoice
    : null;

  // Filter & Search logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.quoteNumber && inv.quoteNumber.toLowerCase().includes(q)) ||
      inv.customer.name.toLowerCase().includes(q) ||
      (inv.customer.companyName && inv.customer.companyName.toLowerCase().includes(q)) ||
      (inv.customer.gstin && inv.customer.gstin.toLowerCase().includes(q)) ||
      inv.customer.mobile.includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalReceived = invoices.reduce((acc, inv) => acc + inv.advanceReceived, 0);
  const totalBalanceDue = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  const handleOpenRecordPayment = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuickPayInvoice(inv);
    setPayAmount(inv.balanceDue);
    setPayRef('');
    setPayNotes('');
  };

  const handleSubmitQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayInvoice || payAmount <= 0) return;

    const newPay: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: payAmount,
      mode: payMode,
      refNo: payRef || `REF-${Math.floor(Math.random() * 90000 + 10000)}`,
      notes: payNotes || 'Payment received against invoice',
    };

    onAddPayment(quickPayInvoice.id, newPay);
    setQuickPayInvoice(null);
  };

  const handleQuickPrint = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const html = generateInvoicePrintHtml(inv, businessProfile);
    printDocument(html, `${inv.invoiceNumber}.html`);
  };

  const handleRowClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
  };

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoices &amp; Payment Ledger</h2>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {invoices.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage tax invoices, record milestone payments, view GST schedules, and track client balance receivables
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateInvoice && (
            <button
              onClick={onOpenCreateInvoice}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
              type="button"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Tax Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed Invoices</span>
          <span className="font-mono text-2xl font-bold text-slate-900 mt-1">{formatINR(totalInvoiced)}</span>
          <span className="text-[11px] text-slate-500 mt-1">{invoices.length} official tax invoices generated</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Payments Collected</span>
          <span className="font-mono text-2xl font-bold text-emerald-700 mt-1">{formatINR(totalReceived)}</span>
          <span className="text-[11px] text-emerald-800 font-semibold mt-1">
            {((totalReceived / (totalInvoiced || 1)) * 100).toFixed(0)}% overall collection rate
          </span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Outstanding Balance Due</span>
          <span className="font-mono text-2xl font-bold text-amber-700 mt-1">{formatINR(totalBalanceDue)}</span>
          <span className="text-[11px] text-slate-500 mt-1">Pending milestone dispatch/installation</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, company, GSTIN, or phone..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1.5 hidden sm:inline">
            Status:
          </span>
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'pending', label: 'Pending' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'paid', label: 'Paid' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Master Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer &amp; Project</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4 text-right">Invoice Total (₹)</th>
                <th className="py-3 px-4 text-right">Advance Received (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const statusColors: Record<string, string> = {
                  paid: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200',
                  partially_paid: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
                  pending: 'bg-red-100 text-red-800 font-bold border border-red-200',
                  cancelled: 'bg-slate-100 text-slate-600 font-bold border border-slate-300',
                };

                return (
                  <tr
                    key={inv.id}
                    onClick={() => handleRowClick(inv)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        <span>{inv.invoiceNumber}</span>
                        <Eye className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {inv.quoteNumber && (
                        <span className="text-[10px] text-slate-400 font-normal block">
                          Ref: {inv.quoteNumber}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {inv.customer.companyName || inv.customer.name}
                        </span>
                        {inv.customer.companyName && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {inv.customer.name}
                          </span>
                        )}
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {inv.customer.mobile} {inv.customer.gstin ? `• GST: ${inv.customer.gstin}` : ''}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <div>{inv.date}</div>
                      <span className="text-[10.5px] text-slate-400 font-normal">
                        Due: {inv.dueDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(inv.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatINR(inv.advanceReceived)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                      {formatINR(inv.balanceDue)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] uppercase font-mono ${
                          statusColors[inv.status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {/* Open Button */}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors flex items-center gap-1"
                          type="button"
                          title="Open Invoice in detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>

                        {/* Record Payment quick action */}
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={(e) => handleOpenRecordPayment(inv, e)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors"
                            type="button"
                            title="Record Payment"
                          >
                            + Pay
                          </button>
                        )}

                        {/* Duplicate */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateInvoice(inv);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Duplicate Invoice"
                          type="button"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Print */}
                        <button
                          onClick={(e) => handleQuickPrint(inv, e)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Print / Save Tax Invoice"
                          type="button"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInvoiceToDelete(inv);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                          type="button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <FileText className="w-10 h-10 text-slate-300" />
            <span className="text-sm font-bold text-slate-700">No Invoices Found</span>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery
                ? `No invoices match "${searchQuery}". Try searching with a different term.`
                : 'No invoices have been generated yet. Create an invoice or finalize any quotation.'}
            </p>
            {onOpenCreateInvoice && (
              <button
                onClick={onOpenCreateInvoice}
                className="mt-2 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                type="button"
              >
                + Create Tax Invoice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full Detail & Management Modal when an invoice is opened */}
      {activeModalInvoice && (
        <InvoiceDetailModal
          isOpen={true}
          invoice={activeModalInvoice}
          businessProfile={businessProfile}
          onClose={() => setSelectedInvoice(null)}
          onUpdateInvoice={onUpdateInvoice}
          onDeleteInvoice={onDeleteInvoice}
          onAddPayment={onAddPayment}
          onDeletePayment={onDeletePayment}
          onDuplicateInvoice={onDuplicateInvoice}
        />
      )}

      {/* Delete Confirmation Modal from Table */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Invoice</h3>
                <span className="text-xs text-slate-500 font-mono">{invoiceToDelete.invoiceNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete tax invoice <strong>{invoiceToDelete.invoiceNumber}</strong> for{' '}
              <strong>{invoiceToDelete.customer.companyName || invoiceToDelete.customer.name}</strong>? All recorded payments ({invoiceToDelete.payments.length}) will also be removed.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="h-9 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteInvoice(invoiceToDelete.id);
                  setInvoiceToDelete(null);
                }}
                className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs"
              >
                Yes, Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Record Payment Modal from Table */}
      {quickPayInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Record Client Payment</h3>
                  <span className="font-mono text-xs text-blue-700 font-semibold">{quickPayInvoice.invoiceNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setQuickPayInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuickPayment} className="p-5 flex flex-col gap-4 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 flex justify-between items-center">
                <span className="text-slate-700 font-medium">Outstanding Balance Due:</span>
                <span className="font-mono text-base font-bold text-amber-800">
                  {formatINR(quickPayInvoice.balanceDue)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Payment Amount Received (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={quickPayInvoice.balanceDue}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Payment Mode *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['UPI', 'NEFT', 'Cash', 'Cheque'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        payMode === mode
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Transaction Ref / UTR / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI893710283 or HDFC2910"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Notes / Receipt Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. 50% Advance received for living room windows"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm &amp; Issue Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
