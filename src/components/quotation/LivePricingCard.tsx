import React from 'react';
import { formatINR } from '../../utils/calculations';
import { Receipt } from 'lucide-react';

interface LivePricingCardProps {
  totalAreaSqFt: number;
  quantity: number;
  ratePerSqFt: number;
  materialBase: number;
  hardwareTotal: number;
  fittingTotal: number;
  meshTotal: number;
  subtotal: number;
  gstAmount: number;
  totalWithGst: number;
}

export const LivePricingCard: React.FC<LivePricingCardProps> = ({
  totalAreaSqFt,
  quantity,
  ratePerSqFt,
  materialBase,
  hardwareTotal,
  fittingTotal,
  meshTotal,
  subtotal,
  gstAmount,
  totalWithGst,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-emerald-700" />
          Item Cost Calculation ({totalAreaSqFt.toFixed(1)} Sq.Ft • {quantity} {quantity === 1 ? 'Unit' : 'Units'})
        </span>
        <span className="font-mono text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          Rate: ₹{ratePerSqFt}/sq.ft
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Profile + Glass */}
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px] font-medium">Profile + Glass Base</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{formatINR(materialBase)}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {totalAreaSqFt.toFixed(1)} sq.ft @ ₹{ratePerSqFt}
          </span>
        </div>

        {/* Hardware & Locks */}
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px] font-medium">Hardware &amp; Rollers</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{formatINR(hardwareTotal)}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {quantity} {quantity === 1 ? 'set' : 'sets'} included
          </span>
        </div>

        {/* Fitting & Mesh */}
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px] font-medium">Site Fitting &amp; Mesh</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatINR(fittingTotal + meshTotal)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Weather seal &amp; fix</span>
        </div>

        {/* Item Total Box */}
        <div className="flex flex-col items-end justify-center bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 rounded-lg">
          <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wide">Item Subtotal</span>
          <span className="font-mono text-base font-bold text-emerald-800">{formatINR(subtotal)}</span>
          <span className="text-[10px] text-emerald-700 font-mono font-medium">
            +18% GST: {formatINR(gstAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
