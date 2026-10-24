import React, { useState } from 'react';
import {
  BusinessProfile,
  Customer,
  ExtraCharge,
  QuotationItem,
  QuotationPrintTemplate,
  PrintOptions,
} from '../../types';
import { formatINR } from '../../utils/calculations';
import { ElevationDiagram } from '../../utils/elevationSvg';
import {
  printDocument,
  downloadPrintableHtml,
  generateQuotationPrintHtml,
} from '../../utils/printDocument';
import {
  X,
  Printer,
  Download,
  Receipt,
  Truck,
  Package,
  ArrowUpCircle,
  Tag,
  Compass,
  FileSpreadsheet,
  Crown,
  Hammer,
} from 'lucide-react';

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
  defaultTemplate?: QuotationPrintTemplate;
  onConvertToInvoice?: () => void;
}

const TEMPLATES: {
  id: QuotationPrintTemplate;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: 'architectural',
    label: 'Architectural CAD',
    icon: <Compass className="w-3.5 h-3.5" />,
    desc: 'CAD elevations & engineering specs',
  },
  {
    id: 'compact',
    label: 'Executive B2B',
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    desc: 'Dense contractor BOQ schedule',
  },
  {
    id: 'premium',
    label: 'Luxury Proposal',
    icon: <Crown className="w-3.5 h-3.5 text-amber-500" />,
    desc: 'Gold & navy client presentation',
  },
  {
    id: 'workshop',
    label: 'Workshop Slip',
    icon: <Hammer className="w-3.5 h-3.5 text-blue-500" />,
    desc: 'Production & site slip (no pricing)',
  },
];

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
  defaultTemplate = 'architectural',
  onConvertToInvoice,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationPrintTemplate>(defaultTemplate);
  const [showCadDiagrams, setShowCadDiagrams] = useState<boolean>(true);
  const [showBankDetails, setShowBankDetails] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(true);

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const totalArea = items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const anyFitting = items.some((i) => i.accessories.siteFitting);
  const siteFittingTotal = items.reduce(
    (sum, i) =>
      sum + (i.accessories.siteFitting ? i.totalAreaSqFt * (i.fittingCostPerSqFt ?? 40) : 0),
    0
  );
  const materialBaseTotal = items.reduce((sum, i) => {
    const fittingCost = i.accessories.siteFitting ? i.totalAreaSqFt * (i.fittingCostPerSqFt ?? 40) : 0;
    return sum + (i.itemTotal - fittingCost);
  }, 0);
  const extraChargesTotal = extraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const taxableSubtotal = materialBaseTotal + siteFittingTotal + extraChargesTotal;
  const gst = Math.round(taxableSubtotal * 0.18 * 100) / 100;
  const grandTotal = taxableSubtotal + gst;

  const getPrintOpts = (): PrintOptions => ({
    template: selectedTemplate,
    showCadDiagrams,
    showBankDetails,
    showTerms,
  });

  const handlePrint = () => {
    const html = generateQuotationPrintHtml(
      quoteNumber,
      date,
      validUntil,
      customer,
      items,
      profile,
      extraCharges,
      selectedTemplate,
      getPrintOpts()
    );
    const res = printDocument(html, `${quoteNumber}-${selectedTemplate}.html`);
    if (res.fallbackDownloaded) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleDownloadHtml = () => {
    const html = generateQuotationPrintHtml(
      quoteNumber,
      date,
      validUntil,
      customer,
      items,
      profile,
      extraCharges,
      selectedTemplate,
      getPrintOpts()
    );
    downloadPrintableHtml(`${quoteNumber}-${selectedTemplate}.html`, html);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs printable-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[96vh] overflow-hidden flex flex-col printable-modal-container">
        {/* Top Controls Bar (Hidden on print) */}
        <div className="p-3 sm:px-5 sm:py-3.5 border-b border-slate-200 bg-slate-100 flex flex-col gap-2.5 shrink-0 no-print">
          {/* Main Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Print / PDF Preview</span>
              <span className="text-xs text-blue-700 font-mono font-bold">({quoteNumber})</span>
            </div>

            <div className="flex items-center gap-2">
              {onConvertToInvoice && (
                <button
                  onClick={() => {
                    onClose();
                    onConvertToInvoice();
                  }}
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  type="button"
                  title="Generate official GST Tax Invoice from this quotation"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Create GST Invoice</span>
                </button>
              )}

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
                className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                type="button"
                title="Print quotation or save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
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

          {/* Template Selector & Options Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            {/* Template Selector Pills */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
              {TEMPLATES.map((tmpl) => {
                const isActive = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                    type="button"
                    title={tmpl.desc}
                  >
                    {tmpl.icon}
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Print Options Toggles */}
            <div className="flex items-center gap-3 text-xs text-slate-600">
              {selectedTemplate !== 'workshop' && (
                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={showCadDiagrams}
                    onChange={(e) => setShowCadDiagrams(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>CAD Elevations</span>
                </label>
              )}
              {selectedTemplate !== 'workshop' && (
                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={showBankDetails}
                    onChange={(e) => setShowBankDetails(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Bank Details</span>
                </label>
              )}
              {selectedTemplate !== 'workshop' && (
                <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={showTerms}
                    onChange={(e) => setShowTerms(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Terms &amp; Scope</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Printable Paper Viewport */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-10 bg-white text-slate-900 printable-sheet">
          {/* ==================== 1. WORKSHOP FABRICATION SLIP VIEW ==================== */}
          {selectedTemplate === 'workshop' && (
            <div className="space-y-6">
              {/* Slip Header */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                      Workshop Production Slip
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Zero Financials Visible</span>
                  </div>
                  <h2 className="text-lg font-bold mt-1 tracking-tight">WORKSHOP FABRICATION &amp; SITE INSTALLATION SLIP</h2>
                  <p className="text-xs text-slate-400">Shop: {profile.shopName} • Phone: {profile.mobile}</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Order Ref:</div>
                  <div className="font-mono text-base font-bold text-sky-400">{quoteNumber}</div>
                  <div className="text-xs text-slate-300 font-mono">Date: {date}</div>
                </div>
              </div>

              {/* Customer & Site Location Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Customer &amp; Site Contact:</span>
                  <p className="font-bold text-sm text-slate-900">{customer.companyName || customer.name}</p>
                  <p className="text-slate-700 font-medium">{customer.name}</p>
                  <p className="font-mono text-slate-600">Phone: {customer.mobile}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Installation Site Address:</span>
                  <p className="font-medium text-slate-900">{customer.shippingAddress || customer.address}, {customer.shippingCity || customer.city}</p>
                  <p className="text-sky-700 font-semibold mt-1">
                    Total Units: {totalUnits} Units • Total Area: {totalArea.toFixed(1)} Sq.Ft
                  </p>
                </div>
              </div>

              {/* Items Table with mm and inches */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Window &amp; Door Cutting and Fabrication Schedule
                </h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-y border-slate-300">
                      <th className="py-2 px-3 text-center w-12">Tag</th>
                      <th className="py-2 px-3 text-center w-44">Elevation Diagram</th>
                      <th className="py-2 px-3">System &amp; Specifications</th>
                      <th className="py-2 px-3 text-right">Dimensions (In &amp; mm)</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-center">Area</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="text-xs">
                        <td className="py-3 px-3 text-center font-mono font-bold text-blue-900 align-top">
                          #{idx + 1}
                          <div className="text-[10px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded mt-1 font-sans">
                            {item.locationTag || 'General'}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center w-44 align-middle">
                          <ElevationDiagram item={item} className="w-[145px] h-[105px] mx-auto" />
                          <div className="font-mono text-[10.5px] font-bold text-blue-900 mt-1 bg-blue-50 rounded px-1.5 py-0.5 inline-block">
                            {item.widthInInches}" W × {item.heightInInches}" H
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top space-y-1">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-600"><strong>Profile:</strong> {item.profileBrand} ({item.colorFoil || 'White'})</p>
                          <p className="text-[11px] text-blue-700 font-medium"><strong>Glass:</strong> {item.glassPackage}</p>
                          <p className="text-[10.5px] text-slate-500">
                            {item.accessories.mosquitoMesh ? '✓ SS304 Mesh' : '✕ No Mesh'} • {item.accessories.siteFitting ? '✓ Fitting Required' : '✕ Supply Only'}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono align-top whitespace-nowrap">
                          <div className="font-bold">{item.widthInInches}" × {item.heightInInches}"</div>
                          <div className="text-[10.5px] text-slate-500">
                            {Math.round(item.widthInInches * 25.4)} × {Math.round(item.heightInInches * 25.4)} mm
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-base align-top">{item.quantity}</td>
                        <td className="py-3 px-3 text-center font-mono align-top">{item.totalAreaSqFt.toFixed(1)} sq.ft</td>
                        <td className="py-3 px-3 align-top text-[10.5px] text-slate-600 space-y-0.5">
                          <div>☐ Cut &amp; Welded</div>
                          <div>☐ Hardware Fitted</div>
                          <div>☐ Glazed</div>
                          <div>☐ QC Passed</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quality & Installation Checklist */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold uppercase text-[11px] text-slate-800 mb-2">On-Site Installation &amp; Inspection Checklist:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div>☐ Wall opening plumb, level &amp; diagonal checked (&lt; 3mm)</div>
                  <div>☐ Fasteners anchored with nylon plugs at 300mm pitch</div>
                  <div>☐ Double EPDM weather gasket seated continuously</div>
                  <div>☐ Neutral-cure silicone weather sealant bead applied externally</div>
                  <div>☐ Sash alignment &amp; smooth multi-point lock operation tested</div>
                  <div>☐ Protective foil intact until client handover</div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. EXECUTIVE B2B SCHEDULE VIEW ==================== */}
          {selectedTemplate === 'compact' && (
            <div className="space-y-5">
              {/* Compact Header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{profile.shopName}</h1>
                  <p className="text-xs text-slate-600">{profile.address}, {profile.city} - {profile.pinCode}</p>
                  <p className="text-xs text-slate-600 font-mono">GSTIN: {profile.gstin} • Mobile: {profile.mobile}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider">
                    B2B Quotation Schedule
                  </span>
                  <div className="font-mono text-base font-bold text-blue-900 mt-1">{quoteNumber}</div>
                  <div className="text-xs text-slate-600 font-mono">Date: {date} | Valid: {validUntil}</div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Quotation Issued To:</span>
                  <p className="font-bold text-sm text-slate-900">{customer.companyName || customer.name}</p>
                  <p className="text-slate-600 font-mono">Contact: {customer.name} • {customer.mobile}</p>
                  {customer.gstin && <p className="font-mono text-blue-700 font-semibold">GSTIN: {customer.gstin}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Site Location &amp; Scope:</span>
                  <p className="font-medium text-slate-900">{customer.shippingAddress || customer.address}, {customer.shippingCity || customer.city}</p>
                  <p className="text-emerald-700 font-semibold">{totalUnits} Units • {totalArea.toFixed(1)} Sq.Ft</p>
                </div>
              </div>

              {/* Compact Schedule Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    {showCadDiagrams && <th className="py-2 px-2 text-center w-28">CAD View</th>}
                    <th className="py-2 px-3">Description &amp; Specification</th>
                    <th className="py-2 px-3 text-right">Dimensions</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Area (Sq.Ft)</th>
                    <th className="py-2 px-3 text-right">Rate (₹)</th>
                    <th className="py-2 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="text-xs">
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                      {showCadDiagrams && (
                        <td className="py-2 px-2 text-center w-28 align-middle">
                          <ElevationDiagram item={item} className="w-[85px] h-[60px] mx-auto" />
                        </td>
                      )}
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Tag: <strong className="text-blue-700">{item.locationTag || 'General'}</strong> • {item.profileBrand} • {item.glassPackage}
                          {item.accessories.mosquitoMesh ? ' • Mesh' : ''}
                          {item.accessories.siteFitting ? ' • Fitting Inc.' : ' • Supply Only'}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                        {item.widthInInches}" × {item.heightInInches}"
                        <div className="text-[10px] text-slate-400">{Math.round(item.widthInInches * 25.4)}×{Math.round(item.heightInInches * 25.4)}mm</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{item.totalAreaSqFt.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.ratePerSqFt}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(item.itemTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t-2 border-slate-300">
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 uppercase text-[10px]">Payment Terms &amp; Bank:</p>
                  <p>• 50% Advance with PO • 40% on material dispatch • 10% on handover</p>
                  {showBankDetails && (
                    <div className="text-[11px] font-mono text-slate-700 pt-1">
                      Bank: {profile.bankName} | A/C: {profile.accountNo} | IFSC: {profile.ifscCode} | UPI: {profile.upiId}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold">{formatINR(taxableSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% Integrated / CGST+SGST):</span>
                    <span className="font-mono">{formatINR(gst)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-sm text-blue-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. LUXURY PROPOSAL VIEW ==================== */}
          {selectedTemplate === 'premium' && (
            <div className="space-y-6">
              {/* Luxury Navy & Gold Header */}
              <div className="bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-6 border-b-4 border-amber-500 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-xl overflow-hidden shadow-xs shrink-0">
                      {profile.companyLogoUrl ? (
                        <img src={profile.companyLogoUrl} alt={profile.shopName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{profile.shopName[0] || 'B'}</span>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black tracking-tight">{profile.shopName}</h1>
                      <p className="text-xs text-amber-400 font-semibold">{profile.tagline}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 font-mono">
                    {profile.address}, {profile.city} • GSTIN: {profile.gstin}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950">
                    Luxury Fenestration Proposal
                  </span>
                  <div className="font-mono text-xl font-bold text-white mt-1.5">{quoteNumber}</div>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">Valid Until: {validUntil}</div>
                </div>
              </div>

              {/* Value Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-base">🛡️</div>
                  <div className="text-xs font-bold text-slate-900 uppercase">DIN EN 12608</div>
                  <div className="text-[10px] text-slate-500">German Class A Profile</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-base">🔇</div>
                  <div className="text-xs font-bold text-slate-900 uppercase">Acoustic Shield</div>
                  <div className="text-[10px] text-slate-500">Up to 38 dB Damping</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-base">☀️</div>
                  <div className="text-xs font-bold text-slate-900 uppercase">10-Year Guarantee</div>
                  <div className="text-[10px] text-slate-500">Anti-UV &amp; Warping</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-base">🔒</div>
                  <div className="text-xs font-bold text-slate-900 uppercase">Multi-Point Lock</div>
                  <div className="text-[10px] text-slate-500">High Security Transmission</div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-blue-900 uppercase text-[10px] block mb-1">Prepared Exclusively For:</span>
                  <h4 className="text-base font-bold text-slate-900">{customer.companyName || customer.name}</h4>
                  <p className="text-slate-600 font-medium">Contact: {customer.name} • {customer.mobile}</p>
                </div>
                <div>
                  <span className="font-bold text-blue-900 uppercase text-[10px] block mb-1">Residence &amp; Installation Site:</span>
                  <p className="font-medium text-slate-900">{customer.shippingAddress || customer.address}, {customer.shippingCity || customer.city}</p>
                  <p className="text-emerald-700 font-semibold mt-1">✓ Complete On-Site Fitting &amp; Weather Sealing Scope</p>
                </div>
              </div>

              {/* Items Card List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bespoke Window &amp; Door Engineering Schedule ({totalUnits} Units, {totalArea.toFixed(1)} Sq.Ft)
                </h3>
                {items.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-center w-40 shrink-0">
                      <ElevationDiagram item={item} className="w-[145px] h-[105px] mx-auto" />
                      <div className="font-mono text-xs font-bold text-blue-900 mt-1 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 inline-block">
                        {item.widthInInches}" W × {item.heightInInches}" H
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">Item #{idx + 1}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 ml-2">Tag: {item.locationTag || 'General Area'}</span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">{item.name}</h4>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-base font-extrabold text-slate-900">{formatINR(item.itemTotal)}</div>
                          <div className="font-mono text-[11px] text-slate-500">₹{item.ratePerSqFt}/sq.ft</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Profile: {item.profileBrand}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Glass: {item.glassPackage}</span>
                        {item.accessories.mosquitoMesh && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">✓ SS304 Mesh</span>}
                        {item.accessories.siteFitting && <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium">✓ Site Weather Seal</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Area: {item.totalAreaSqFt.toFixed(1)} Sq.Ft • Qty: {item.quantity} Unit(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Luxury Summary Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-900 uppercase text-[11px]">Payment Milestones &amp; Warranty:</h5>
                  <p>• <strong>50% Advance</strong> upon profile booking</p>
                  <p>• <strong>40% Dispatch</strong> upon pre-dispatch inspection</p>
                  <p>• <strong>10% Handover</strong> post site glazing &amp; sealant</p>
                  {showBankDetails && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-700">
                      Bank: {profile.bankName} | A/C: {profile.accountNo} | IFSC: {profile.ifscCode} | UPI: {profile.upiId}
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Material &amp; Extrusions:</span>
                    <span className="font-mono font-bold text-slate-900">{formatINR(materialBaseTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Site Fitting &amp; Silicone:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {siteFittingTotal === 0 ? '₹0 (Included Free)' : formatINR(siteFittingTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">GST (18% Integrated / CGST+SGST):</span>
                    <span className="font-mono text-slate-800">{formatINR(gst)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t-2 border-slate-900 font-bold text-base text-blue-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-lg">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. ARCHITECTURAL CAD VIEW (DEFAULT) ==================== */}
          {selectedTemplate === 'architectural' && (
            <div>
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border border-slate-200">
                      {profile.companyLogoUrl ? (
                        <img src={profile.companyLogoUrl} alt={profile.shopName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{profile.shopName[0] || 'B'}</span>
                      )}
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
                  <p className="text-slate-800 font-medium">{customer.shippingAddress || customer.address}</p>
                  <p className="text-slate-800 font-semibold">{customer.shippingCity || customer.city}, Maharashtra</p>
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
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      {showCadDiagrams && <th className="py-2.5 px-3 w-44 text-center">Elevation (CAD)</th>}
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
                        {showCadDiagrams && (
                          <td className="py-3 px-2 text-center w-44 align-middle">
                            <div className="flex flex-col items-center justify-center">
                              <ElevationDiagram item={item} className="w-[155px] h-[112px] mx-auto" />
                              <div className="font-mono text-[11px] font-extrabold text-blue-900 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 mt-1.5 shadow-2xs">
                                {item.widthInInches}" W × {item.heightInInches}" H
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-blue-700 font-medium">Tag: {item.locationTag || 'General'}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.profileBrand} • {item.glassPackage}
                            {item.accessories.mosquitoMesh ? ' • SS304 Mesh' : ''}
                            {item.accessories.siteFitting
                              ? (item.fittingCostPerSqFt ?? 40) === 0
                                ? ' • Fitting: Free / Waived'
                                : ` • Fitting: ₹${item.fittingCostPerSqFt ?? 40}/sq.ft`
                              : ' • Supply Only (No Fitting)'}
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
                  {showBankDetails && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-700">
                      Bank: {profile.bankName} | A/C: {profile.accountNo} | IFSC: {profile.ifscCode} | UPI: {profile.upiId}
                    </div>
                  )}
                </div>

                {/* Calculations Box */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Material &amp; Fabrication Base:</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(materialBaseTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Site Fitting &amp; Weather Seal:</span>
                      <span className={`font-mono font-bold ${siteFittingTotal === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {anyFitting
                          ? siteFittingTotal === 0
                            ? '₹0 (Included Free in Scope)'
                            : formatINR(siteFittingTotal)
                          : '₹0 (Supply Only)'}
                      </span>
                    </div>
                    {extraCharges.map((c) => {
                      const labelLower = (c.label || '').toLowerCase();
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
                        <div key={c.id} className="flex justify-between text-amber-900">
                          <span className="flex items-center gap-1">
                            {isTransport ? (
                              <Truck className="w-3 h-3 text-amber-600" />
                            ) : isLoading ? (
                              <Package className="w-3 h-3 text-blue-600" />
                            ) : isCrane ? (
                              <ArrowUpCircle className="w-3 h-3 text-purple-600" />
                            ) : (
                              <Tag className="w-3 h-3 text-slate-500" />
                            )}
                            {c.label || 'Additional Charge'}:
                          </span>
                          <span className="font-mono font-bold">{formatINR(c.amount)}</span>
                        </div>
                      );
                    })}
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
          )}
        </div>
      </div>
    </div>
  );
};
