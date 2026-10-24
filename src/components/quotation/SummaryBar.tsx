import React from 'react';
import { ExtraCharge, QuotationItem } from '../../types';
import { formatINR } from '../../utils/calculations';
import {
  FileText,
  MessageSquare,
  ArrowRight,
  Save,
  Receipt,
  CheckCircle2,
  Truck,
  Sparkles,
  Tag,
  Package,
  ArrowUpCircle,
} from 'lucide-react';

interface SummaryBarProps {
  items: QuotationItem[];
  customerName?: string;
  validUntilDate?: string;
  extraCharges?: ExtraCharge[];
  onToggleWaiveFitting?: (waive: boolean) => void;
  onSaveQuotation?: () => void;
  onSavePdf: () => void;
  onSendWhatsApp: () => void;
  onFinalizeInvoice: () => void;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({
  items,
  customerName,
  validUntilDate,
  extraCharges = [],
  onToggleWaiveFitting,
  onSaveQuotation,
  onSavePdf,
  onSendWhatsApp,
  onFinalizeInvoice,
}) => {
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalArea = items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);

  // Aggregates
  let materialBaseTotal = 0;
  let siteFittingTotal = 0;
  let baseItemsSubtotal = 0;

  const anyItemHasFitting = items.some((i) => i.accessories.siteFitting);

  items.forEach((item) => {
    baseItemsSubtotal += item.itemTotal;
    const fittingRate =
      item.fittingCostPerSqFt !== undefined
        ? item.fittingCostPerSqFt
        : item.accessories.siteFitting
        ? 40
        : 0;
    const itemFitting = item.accessories.siteFitting ? item.totalAreaSqFt * fittingRate : 0;
    siteFittingTotal += itemFitting;
    materialBaseTotal += item.itemTotal - itemFitting;
  });

  // Extra charges total (Transportation, Crane, Scaffolding, Custom)
  const extraChargesTotal = extraCharges.reduce(
    (acc, c) => acc + (Number(c.amount) || 0),
    0
  );

  const taxableSubtotal = Math.round((materialBaseTotal + siteFittingTotal + extraChargesTotal) * 100) / 100;
  const gstAmount = Math.round(taxableSubtotal * 0.18 * 100) / 100;
  const grandTotal = Math.round((taxableSubtotal + gstAmount) * 100) / 100;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 flex flex-col gap-5 mt-3">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Quotation Summary &amp; Tax Calculations</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Standard fabrication breakdown with itemized 18% GST (CGST + SGST)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {totalUnits} Units • {totalArea.toFixed(1)} Sq.Ft Total Area
          </span>
          {customerName && (
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Client: <strong className="text-slate-800">{customerName}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 2-Column Ledger: Left has Scope Summary & Terms, Right has Exact Invoice-Style Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Scope & Site Info */}
        <div className="flex flex-col gap-3 text-xs bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Total Configured Items:</span>
            <span className="font-mono font-bold text-slate-900">
              {items.length} {items.length === 1 ? 'Typology' : 'Typologies'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Total Fabrication Area:</span>
            <span className="font-mono font-bold text-slate-900">
              {totalArea.toFixed(1)} Sq.Ft ({totalUnits} Windows &amp; Doors)
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Installation &amp; Weather Seal:</span>
            <span className="font-bold text-slate-800">
              {anyItemHasFitting
                ? siteFittingTotal === 0
                  ? 'Included Free in Scope (Waived ₹0)'
                  : 'Site Fitting Included'
                : 'Supply Only (No fitting)'}
            </span>
          </div>
          {extraCharges.length > 0 && (
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Additional Charges:</span>
              <span className="font-bold text-slate-800">
                {extraCharges.length} {extraCharges.length === 1 ? 'charge' : 'charges'} ({formatINR(extraChargesTotal)})
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">Standard Delivery Timeline:</span>
            <span className="font-bold text-slate-800">10 to 14 Working Days</span>
          </div>
          {validUntilDate && (
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Quotation Validity:</span>
              <span className="font-mono font-bold text-emerald-700">Valid until {validUntilDate}</span>
            </div>
          )}
        </div>

        {/* Right Column: GST Calculation & Grand Total Ledger (IDENTICAL TO INVOICE) */}
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-sans font-medium text-slate-600">Material &amp; Fabrication Base:</span>
            <span className="font-semibold text-slate-900">{formatINR(materialBaseTotal)}</span>
          </div>

          {/* Site Fitting & Weather Seal with Waive/Restore Toggle (Placed with label) */}
          <div className="flex justify-between items-center text-slate-700">
            <div className="flex items-center gap-2 font-sans flex-wrap">
              <span className="font-medium text-slate-600">Site Fitting &amp; Weather Seal:</span>
              {onToggleWaiveFitting && anyItemHasFitting && (
                siteFittingTotal > 0 ? (
                  <button
                    type="button"
                    onClick={() => onToggleWaiveFitting(true)}
                    className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer"
                    title="Waive installation fee for this entire quote"
                  >
                    Waive Off
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Waived Off (₹0)
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleWaiveFitting(false)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer"
                      title="Charge standard ₹40/sq.ft fitting fee"
                    >
                      Restore ₹40
                    </button>
                  </div>
                )
              )}
            </div>
            <span className="font-semibold text-slate-900">
              {formatINR(siteFittingTotal)}
            </span>
          </div>

          {/* Itemized Extra Charges (Transportation, Crane, Custom, etc.) */}
          {extraCharges.map((charge) => {
            const labelLower = (charge.label || '').toLowerCase();
            const isTransport =
              labelLower.includes('transport') ||
              labelLower.includes('freight') ||
              labelLower.includes('tempo') ||
              labelLower.includes('delivery') ||
              labelLower.includes('vehicle');
            const isLoading =
              labelLower.includes('loading') ||
              labelLower.includes('unloading') ||
              labelLower.includes('handling') ||
              labelLower.includes('labor') ||
              labelLower.includes('labour');
            const isCrane =
              labelLower.includes('crane') ||
              labelLower.includes('hoist') ||
              labelLower.includes('lifting');

            return (
              <div key={charge.id} className="flex justify-between items-center text-slate-700 bg-amber-50/60 -mx-1 px-1 py-0.5 rounded">
                <span className="font-sans text-slate-700 flex items-center gap-1">
                  {isTransport ? (
                    <Truck className="w-3 h-3 text-amber-600 shrink-0" />
                  ) : isLoading ? (
                    <Package className="w-3 h-3 text-blue-600 shrink-0" />
                  ) : isCrane ? (
                    <ArrowUpCircle className="w-3 h-3 text-purple-600 shrink-0" />
                  ) : (
                    <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate max-w-[200px]">{charge.label || 'Additional Charge'}:</span>
                </span>
                <span className="font-semibold text-slate-900">{formatINR(charge.amount || 0)}</span>
              </div>
            );
          })}

          {/* Subtotal */}
          <div className="flex justify-between items-center text-slate-800 pt-1.5 border-t border-slate-200">
            <span className="font-sans font-semibold text-slate-900">Taxable Subtotal:</span>
            <span className="font-bold text-slate-900">{formatINR(taxableSubtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="font-sans">CGST (9.0% Central Tax):</span>
            <span className="font-semibold text-slate-800">{formatINR(gstAmount / 2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="font-sans">SGST (9.0% State Tax):</span>
            <span className="font-semibold text-slate-800">{formatINR(gstAmount / 2)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span className="font-sans font-semibold text-slate-700">Total 18% GST (CGST + SGST):</span>
            <span className="font-bold text-slate-900">{formatINR(gstAmount)}</span>
          </div>

          {/* Grand Total Banner */}
          <div className="flex justify-between items-center py-2.5 px-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xs mt-1">
            <span className="font-sans text-xs tracking-wide uppercase text-slate-300">
              GRAND TOTAL (INCL. 18% GST):
            </span>
            <span className="text-emerald-400 font-mono text-base font-extrabold">{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row at the End of Quotation */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onSaveQuotation && (
          <button
            onClick={onSaveQuotation}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
            type="button"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Quotation</span>
          </button>
        )}

        <button
          onClick={onSavePdf}
          className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          type="button"
        >
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Save PDF</span>
        </button>

        <button
          onClick={onSendWhatsApp}
          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          type="button"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Share WhatsApp</span>
        </button>

        <button
          onClick={() => onFinalizeInvoice()}
          className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          type="button"
        >
          <span>Create GST Invoice</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
