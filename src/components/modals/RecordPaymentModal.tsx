import React, { useState, useEffect } from 'react';
import { Invoice, PaymentRecord } from '../../types';
import { formatINR } from '../../utils/calculations';
import {
  X,
  CreditCard,
  Check,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Calendar,
  Tag,
  Building,
} from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onAddPayment: (invoiceId: string, payment: PaymentRecord) => void;
  defaultInvoiceId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onAddPayment,
  defaultInvoiceId,
}) => {
  // Filter for unpaid or partially paid invoices
  const pendingInvoices = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.balanceDue > 0
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [mode, setMode] = useState<'UPI' | 'NEFT' | 'Cash' | 'Cheque'>('UPI');
  const [date, setDate] = useState<string>(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [refNo, setRefNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset selected invoice when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (defaultInvoiceId && pendingInvoices.some((i) => i.id === defaultInvoiceId)) {
      setSelectedInvoiceId(defaultInvoiceId);
      const inv = pendingInvoices.find((i) => i.id === defaultInvoiceId);
      if (inv) setAmount(inv.balanceDue);
    } else if (pendingInvoices.length > 0) {
      setSelectedInvoiceId(pendingInvoices[0].id);
      setAmount(pendingInvoices[0].balanceDue);
    } else {
      setSelectedInvoiceId('');
      setAmount(0);
    }
    setError(null);
    setRefNo('');
    setNotes('');
  }, [isOpen, defaultInvoiceId, invoices]);

  // When selected invoice changes, update suggested amount
  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = pendingInvoices.find((i) => i.id === id);
    if (inv) {
      setAmount(inv.balanceDue);
    }
    setError(null);
  };

  if (!isOpen) return null;

  const currentInvoice = pendingInvoices.find((i) => i.id === selectedInvoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedInvoiceId || !currentInvoice) {
      setError('Please select an invoice with an outstanding balance.');
      return;
    }

    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (amount > currentInvoice.balanceDue) {
      setError(
        `Amount cannot exceed the remaining balance of ${formatINR(currentInvoice.balanceDue)}.`
      );
      return;
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date,
      amount: Number(amount),
      mode,
      refNo: refNo.trim() || `${mode}-${Date.now().toString().slice(-6)}`,
      notes: notes.trim() || undefined,
    };

    onAddPayment(selectedInvoiceId, newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Record Customer Payment</h2>
              <p className="text-xs text-slate-400 font-medium">
                Log advance or balance settlement against GST invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {pendingInvoices.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All Invoices Are Settled</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              There are currently no unpaid or partially paid invoices in the system. Create a new invoice to record incoming payments.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all"
              type="button"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Invoice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Select Target Invoice</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {pendingInvoices.length} pending
                </span>
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleSelectInvoice(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pendingInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.customer.companyName || inv.customer.name} (Due: {formatINR(inv.balanceDue)})
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Balance Snapshot Card */}
            {currentInvoice && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Bill</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {formatINR(currentInvoice.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Received</span>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {formatINR(currentInvoice.advanceReceived || 0)}
                  </span>
                </div>
                <div className="bg-amber-50 rounded-lg p-1 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Balance Due</span>
                  <span className="font-mono text-xs font-bold text-amber-900">
                    {formatINR(currentInvoice.balanceDue)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Amount & Preset Chips */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Payment Amount (₹)</span>
                {currentInvoice && (
                  <span className="text-[11px] text-slate-500">
                    Max: {formatINR(currentInvoice.balanceDue)}
                  </span>
                )}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter received amount"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {currentInvoice && currentInvoice.balanceDue > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setAmount(currentInvoice.balanceDue)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
                  >
                    Full Balance ({formatINR(currentInvoice.balanceDue)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(currentInvoice.balanceDue / 2))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                  >
                    50% Split ({formatINR(Math.round(currentInvoice.balanceDue / 2))})
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'NEFT', 'Cash', 'Cheque'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      mode === m
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference & Date in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  UTR / Reference No.
                </label>
                <input
                  type="text"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="e.g. UPI-9847291"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Date
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="DD MMM YYYY"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Remarks / Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received via GPay for glass delivery"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Record Payment</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
