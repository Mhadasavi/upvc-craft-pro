import React, { useState } from 'react';
import { RateSheetItem } from '../../types';
import { INITIAL_RATE_SHEET } from '../../data/initialData';
import { Tags, Save, Check, RotateCcw, AlertCircle } from 'lucide-react';

interface ProductsRatesViewProps {
  rateSheet: RateSheetItem[];
  onUpdateRateSheet: (rates: RateSheetItem[]) => void;
}

export const ProductsRatesView: React.FC<ProductsRatesViewProps> = ({
  rateSheet,
  onUpdateRateSheet,
}) => {
  const [rates, setRates] = useState<RateSheetItem[]>(rateSheet);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRateChange = (id: string, newRate: number) => {
    setRates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, baseRatePerSqFt: newRate } : item))
    );
  };

  const handleSave = () => {
    onUpdateRateSheet(rates);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setRates(INITIAL_RATE_SHEET);
    onUpdateRateSheet(INITIAL_RATE_SHEET);
  };

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products &amp; Master Rate Sheet</h2>
          <p className="text-xs text-slate-500 font-medium">
            Configure base fabrication rates per sq.ft for standard UPVC window &amp; door profiles in INR (₹)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs"
            type="button"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>

          <button
            onClick={handleSave}
            className="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
            type="button"
          >
            {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Rates Saved!' : 'Save & Apply Rates'}</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-center gap-3 text-xs text-blue-900">
        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0" />
        <div>
          <span className="font-bold">Tier 1 Workshop Pricing active: </span>
          Base rates include standard welded UPVC frame, 5mm Clear Toughened glass, and standard friction hardware.
          Add-ons like SS304 mesh (+₹35/sq.ft) and site silicone weather sealing (+₹40/sq.ft) are applied dynamically in quotations.
        </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">UPVC Typology Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Standard Rate / Sq.Ft (₹)</th>
              <th className="py-3 px-4 text-right">Your Configured Rate (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rates.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                  {item.name}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-[11px] uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">
                  ₹{INITIAL_RATE_SHEET.find((i) => i.id === item.id)?.baseRatePerSqFt || item.baseRatePerSqFt}.00
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1 justify-end">
                    <span className="text-slate-500 font-mono font-bold">₹</span>
                    <input
                      type="number"
                      min="100"
                      step="10"
                      className="w-24 h-8 px-2 rounded-lg border border-slate-300 font-mono text-xs font-bold text-right text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 focus:bg-white"
                      value={item.baseRatePerSqFt}
                      onChange={(e) => handleRateChange(item.id, parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-slate-500 text-[11px]">/sq.ft</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
