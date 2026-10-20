import React, { useState } from 'react';
import { QuotationItem, WorkshopCutItem } from '../../types';
import { generateWorkshopCutList } from '../../utils/calculations';
import { printDocument, downloadPrintableHtml } from '../../utils/printDocument';
import { X, Printer, Copy, Check, Scissors, AlertCircle, Download, Loader2 } from 'lucide-react';

interface CutListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuotationItem[];
  quoteNumber: string;
}

export const CutListModal: React.FC<CutListModalProps> = ({
  isOpen,
  onClose,
  items,
  quoteNumber,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const allCuts: WorkshopCutItem[] = items.flatMap((item) => generateWorkshopCutList(item));

  // Compute total linear meters for 6m extrusion sticks estimation
  const totalProfileMm = allCuts.reduce((acc, cut) => acc + cut.cutLengthMm * cut.quantity, 0);
  const totalSticksEstimate = Math.ceil(totalProfileMm / 5800); // 5.8m usable stick length after saw kerf

  const generateCutListHtml = () => {
    const rows = allCuts
      .map(
        (c, i) => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${i + 1}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${c.itemTag}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${c.cutPiece}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${c.quantity}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #1e40af;">${c.cutLengthMm} mm (${c.cutLengthInches}")</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${c.cutAngle}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${c.reinforcementLengthMm > 0 ? `${c.reinforcementLengthMm} mm` : '-'}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${c.glassSize}</td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cut-List - ${quoteNumber}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 11px; margin: 0; padding: 15px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; padding: 6px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #475569; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
          <div>
            <h2 style="margin: 0; font-size: 16px;">Workshop Fabrication Cut-List & Saw Matrix</h2>
            <div style="font-family: monospace; font-size: 12px; color: #1e40af;">Quote Ref: <strong>${quoteNumber}</strong></div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div>Total Linear Profile: <strong>${(totalProfileMm / 1000).toFixed(1)} Meters</strong></div>
            <div>Estimated Extrusion Sticks: <strong>~${totalSticksEstimate} sticks (6m)</strong></div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="text-align: center;">#</th>
              <th>Item Tag</th>
              <th>Profile Section / Component</th>
              <th style="text-align: center;">Qty</th>
              <th>Cut Length</th>
              <th>Miter Angle</th>
              <th>Steel Reinforcement</th>
              <th>Glass Daylight Size</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const html = generateCutListHtml();
    setPrintStatus('Opening Print...');
    const res = printDocument(html, `CutList-${quoteNumber}.html`);
    if (res.fallbackDownloaded) {
      setPrintStatus('Downloaded Cut-List!');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } else {
      setPrintStatus('Print Ready');
    }
    setTimeout(() => setPrintStatus(null), 3000);
  };

  const handleDownload = () => {
    const html = generateCutListHtml();
    downloadPrintableHtml(`CutList-${quoteNumber}.html`, html);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleCopyText = () => {
    const textRows = allCuts
      .map(
        (c) =>
          `${c.itemTag} | ${c.cutPiece} | Qty: ${c.quantity} | Cut: ${c.cutLengthMm} mm (${c.cutLengthInches}") | Angle: ${c.cutAngle} | Steel: ${c.reinforcementLengthMm} mm | Glass: ${c.glassSize}`
      )
      .join('\n');
    navigator.clipboard.writeText(
      `WORKSHOP FABRICATION CUT-LIST - QUOTE REF: ${quoteNumber}\n======================================================\n${textRows}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs printable-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col printable-modal-container">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Workshop Fabrication Cut-List</h3>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {quoteNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Saw cutting lengths with 45° miter + 6mm welding burn-off allowance &amp; glass daylight sizes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="h-8 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
              type="button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Cut-List'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="h-8 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
              type="button"
              title="Download standalone printable HTML file"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download Doc'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-xs"
              type="button"
            >
              {printStatus?.includes('Opening') ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Printer className="w-3.5 h-3.5" />
              )}
              <span>{printStatus || 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors ml-1"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Estimation Metric Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/60 border-b border-emerald-100 text-xs no-print">
          <div className="flex flex-col">
            <span className="text-slate-500 font-semibold text-[11px]">Total Profile Cuts:</span>
            <span className="font-mono text-base font-bold text-slate-900">{allCuts.length} Pieces</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 font-semibold text-[11px]">Total Linear Meterage:</span>
            <span className="font-mono text-base font-bold text-slate-900">
              {(totalProfileMm / 1000).toFixed(1)} Meters
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-emerald-800 font-semibold text-[11px]">Estimated 6-Meter Stock Sticks:</span>
            <span className="font-mono text-base font-bold text-emerald-700">~{totalSticksEstimate} Sticks (6m)</span>
          </div>
        </div>

        {/* Workshop Table */}
        <div className="overflow-y-auto flex-1 p-4 printable-sheet">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px] border-y border-slate-300">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Item Tag</th>
                <th className="py-2.5 px-3">Profile Section</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3">Cut Length (mm)</th>
                <th className="py-2.5 px-3">Cut Length (Inches)</th>
                <th className="py-2.5 px-3">Miter Angle</th>
                <th className="py-2.5 px-3">Steel Reinforcement</th>
                <th className="py-2.5 px-3">Glass Daylight Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allCuts.map((cut, index) => (
                <tr key={index} className="hover:bg-slate-50 font-mono text-xs">
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 font-sans">{index + 1}</td>
                  <td className="py-2.5 px-3 font-bold font-sans text-slate-900">{cut.itemTag}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700">{cut.cutPiece}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">{cut.quantity}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-800">{cut.cutLengthMm} mm</td>
                  <td className="py-2.5 px-3 text-slate-600">{cut.cutLengthInches}"</td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans font-medium">{cut.cutAngle}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {cut.reinforcementLengthMm > 0 ? `${cut.reinforcementLengthMm} mm` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">{cut.glassSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Tolerance rule: ±0.5mm saw cutting limit. Verify sash clearances prior to corner welding.</span>
          </div>
          <span className="font-mono text-[10px]">UPVC Profile Fabrication Matrix v2.4</span>
        </div>
      </div>
    </div>
  );
};
