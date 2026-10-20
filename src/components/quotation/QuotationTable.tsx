import React from 'react';
import { Customer, QuotationItem } from '../../types';
import { MiniDiagramThumbnail } from '../diagram/MiniDiagramThumbnail';
import { formatDimension, formatINR } from '../../utils/calculations';
import { Edit2, Copy, Trash2, Download, Printer, Table } from 'lucide-react';

interface QuotationTableProps {
  items: QuotationItem[];
  customer: Customer;
  onEditItem: (item: QuotationItem) => void;
  onDuplicateItem: (item: QuotationItem) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenCutList: () => void;
  onOpenPrintPreview: () => void;
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  items,
  customer,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
  onOpenCutList,
  onOpenPrintPreview,
}) => {
  const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalArea = items.reduce((acc, item) => acc + item.totalAreaSqFt, 0);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Quotation Items List</h3>
              <span className="font-mono text-xs bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'Item' : 'Items'} Configured ({totalUnits} Units)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Combined Area: {totalArea.toFixed(1)} Sq.Ft • Prepared for {customer.companyName || customer.name}, {customer.city}
            </p>
          </div>
        </div>

        {/* Workshop Cut-List & Print Spec Sheet Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCutList}
            className="h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
            type="button"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Workshop Cut-List</span>
          </button>

          <button
            onClick={onOpenPrintPreview}
            className="h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
            type="button"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Spec Sheet</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4 w-20 text-center">Preview</th>
              <th className="py-3 px-4">Item Typology &amp; Details</th>
              <th className="py-3 px-4">Dimensions (W × H)</th>
              <th className="py-3 px-4 text-center">Qty</th>
              <th className="py-3 px-4 text-right">Area (Sq.Ft)</th>
              <th className="py-3 px-4 text-right">Rate (₹)</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-900 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Table className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">Quotation Item List is Empty</span>
                    <span className="text-xs text-slate-400 leading-relaxed">
                      Select window/door typology and dimensions in the studio above, then click <strong>&quot;+ Add Item&quot;</strong> to add your first product.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const dims = formatDimension(item.widthInInches, item.heightInInches);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* Preview Thumbnail */}
                    <td className="py-3.5 px-4 text-center">
                      <MiniDiagramThumbnail typologyId={item.typologyId} colorFoil={item.colorFoil} />
                    </td>

                    {/* Typology & Specs */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs">
                          {item.name} {item.locationTag && `(${item.locationTag})`}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10.5px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                            {item.profileBrand}
                          </span>
                          <span className="font-mono text-[10.5px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-200/50">
                            {item.glassPackage}
                          </span>
                          <span className="text-[10.5px] text-slate-500">
                            {item.accessories.crescentLock && 'Crescent Lock • '}
                            {item.accessories.heavyDutyRollers && 'Brass Rollers • '}
                            {item.accessories.siteFitting && 'Site Fitting'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Dimensions */}
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{dims.imperial}</span>
                        <span className="text-[11px] text-slate-500">{dims.metric}</span>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-800">
                        {item.quantity}
                      </span>
                    </td>

                    {/* Area */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                      {item.totalAreaSqFt.toFixed(2)} sq.ft
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      ₹{item.ratePerSqFt.toFixed(2)}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700 text-sm">
                      {formatINR(item.itemTotal)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Configuration"
                          type="button"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateItem(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Duplicate Item"
                          type="button"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Item"
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
    </div>
  );
};
