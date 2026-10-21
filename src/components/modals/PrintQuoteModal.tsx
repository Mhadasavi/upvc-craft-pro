import React, { useState } from 'react';
import { BusinessProfile, Customer, ExtraCharge, QuotationItem } from '../../types';
import { formatDimension, formatINR } from '../../utils/calculations';
import { MiniDiagramThumbnail } from '../diagram/MiniDiagramThumbnail';
import {
  printDocument,
  downloadPrintableHtml,
  generateQuotationPrintHtml,
} from '../../utils/printDocument';
import { X, Printer, Download, CheckCircle2, Loader2, Truck } from 'lucide-react';

interface PrintQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteNumber: string;
  date: string;
  validUntil: string;
  customer: Customer;
  items: QuotationItem[];
  profile: BusinessProfile;
  extraCharges?: ExtraCharge[];
}

export const PrintQuoteModal: React.FC<PrintQuoteModalProps> = ({
  isOpen,
  onClose,
  quoteNumber,
  date,
  validUntil,
  customer,
  items,
  profile,
  extraCharges = [],
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalArea = items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const itemsSubtotal = items.reduce((acc, i) => acc + i.itemTotal, 0);
  const extraChargesTotal = extraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const taxableSubtotal = itemsSubtotal + extraChargesTotal;
  const gst = Math.round(taxableSubtotal * 0.18 * 100) / 100;
  const grandTotal = taxableSubtotal + gst;

  const handlePrint = () => {
    const html = generateQuotationPrintHtml(
      quoteNumber,
      date,
      validUntil,
      customer,
      items,
      profile,
      extraCharges
    );
    setPrintStatus('Opening Print...');
    const res = printDocument(html, `${quoteNumber}.html`);
    if (res.fallbackDownloaded) {
      setPrintStatus('Document Downloaded!');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } else {
      setPrintStatus('Print Ready');
    }
    setTimeout(() => setPrintStatus(null), 3000);
  };

  const handleDownloadHtml = () => {
    const html = generateQuotationPrintHtml(
      quoteNumber,
      date,
      validUntil,
      customer,
      items,
      profile,
      extraCharges
    );
    downloadPrintableHtml(html, `${quoteNumber}.html`);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs printable-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col printable-modal-container">
        {/* Modal Controls Toolbar (Hidden on print) */}
        <div className="p-3 sm:p-4 flex items-center justify-between border-b border-slate-200 bg-slate-100 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Print / PDF Preview</span>
            <span className="text-xs text-slate-500 font-mono">({quoteNumber})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="h-8 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
              type="button"
              title="Download standalone printable HTML file (opens in browser & prints cleanly)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download Document'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-xs"
              type="button"
            >
              {printStatus?.includes('Opening') ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>{printStatus || 'Print / Save as PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Paper Viewport */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-10 bg-white text-slate-900 printable-sheet">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  B
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile.shopName}</h1>
                  <p className="text-xs text-blue-700 font-semibold">{profile.tagline}</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <p>{profile.address}</p>
                <p>{profile.city}, {profile.state} - {profile.pinCode}</p>
                <p className="font-mono">GSTIN: <span className="font-bold text-slate-900">{profile.gstin}</span></p>
                <p className="font-mono">Phone: {profile.mobile} • Email: {profile.email}</p>
              </div>
            </div>

            <div className="text-right sm:text-right flex flex-col items-start sm:items-end">
              <span className="text-xl font-bold text-blue-900 uppercase tracking-wider">
                ESTIMATE / QUOTATION
              </span>
              <span className="text-sm font-mono font-bold text-blue-700 mt-1">{quoteNumber}</span>
              <div className="text-xs text-slate-600 mt-2 font-mono space-y-0.5">
                <p>Date: <span className="font-semibold text-slate-900">{date}</span></p>
                <p>Valid Until: <span className="font-semibold text-slate-900">{validUntil}</span></p>
                <p className="text-emerald-700 font-semibold">Tier: {profile.rateTier}</p>
              </div>
            </div>
          </div>

          {/* Customer / Site Address Box */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase text-[11px] block mb-1">
                Quotation Issued To:
              </span>
              <h4 className="text-sm font-bold text-slate-900">{customer.companyName || customer.name}</h4>
              <p className="text-slate-700 font-medium mt-0.5">{customer.name}</p>
              <p className="text-slate-600 font-mono mt-0.5">{customer.mobile}</p>
              {customer.gstin && (
                <p className="font-mono text-slate-700 mt-0.5">GSTIN: {customer.gstin}</p>
              )}
            </div>

            <div className="sm:text-right max-w-xs">
              <span className="font-bold text-slate-500 uppercase text-[11px] block mb-1">
                Site / Installation Address:
              </span>
              <p className="text-slate-800 font-medium">{customer.address}</p>
              <p className="text-slate-800 font-semibold">{customer.city}, Maharashtra</p>
              <p className="text-emerald-800 font-semibold text-[11px] mt-1">✓ Complete Site Installation Included</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="my-6">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Configured UPVC Window &amp; Door Schedule ({totalUnits} Units, {totalArea.toFixed(1)} Sq.Ft)
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-y border-slate-300">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-14 text-center">Elevation</th>
                  <th className="py-2.5 px-3">Description &amp; Specifications</th>
                  <th className="py-2.5 px-3 text-right">Dimensions</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Area (Sq.Ft)</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, index) => (
                  <tr key={item.id} className="text-xs">
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="w-12 h-10 border border-slate-200 rounded p-0.5 bg-slate-50 inline-block">
                        <MiniDiagramThumbnail typologyId={item.typologyId} colorFoil={item.colorFoil} />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-blue-700 font-medium">Tag: {item.locationTag || 'General'}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.profileBrand} • {item.glassPackage}
                        {item.accessories.mosquitoMesh ? ' • SS304 Mesh' : ''}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium whitespace-nowrap">
                      {item.widthInInches}" × {item.heightInInches}"
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{item.totalAreaSqFt.toFixed(1)}</td>
                    <td className="py-3 px-3 text-right font-mono">₹{item.ratePerSqFt}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(item.itemTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300">
            {/* Payment Milestones & Warranty */}
            <div className="text-xs text-slate-600 space-y-2">
              <h5 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                Standard Terms &amp; Payment Milestones:
              </h5>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>50% Advance with Purchase Order confirmation &amp; profile booking</li>
                <li>40% Advance against inspection / dispatch from workshop</li>
                <li>10% Handover on final installation &amp; silicon sealing</li>
                <li>10-Year warranty on UPVC profile color stability against yellowing</li>
                <li>1-Year warranty on locks, rollers, and moving hardware</li>
              </ul>
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Material &amp; Fabrication:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(itemsSubtotal)}</span>
                </div>
                {extraCharges.map((c) => (
                  <div key={c.id} className="flex justify-between text-amber-900">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-amber-600" />
                      {c.label || 'Additional Charge'}:
                    </span>
                    <span className="font-mono font-bold">{formatINR(c.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-700 font-semibold">Taxable Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(taxableSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">GST (18% - CGST 9% + SGST 9%):</span>
                  <span className="font-mono text-slate-800">{formatINR(gst)}</span>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900">Estimated Total:</span>
                <span className="font-mono text-xl font-bold text-blue-900">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Prepared By:</p>
              <p className="font-bold text-slate-900 mt-8">{profile.ownerName} ({profile.role})</p>
              <p>{profile.shopName}</p>
            </div>
            <div className="text-right">
              <p>Customer Approval / Signature:</p>
              <p className="mt-8 border-b border-slate-400 w-44 inline-block"></p>
              <p className="mt-1">Date: ________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
