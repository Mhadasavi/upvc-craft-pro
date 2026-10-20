import React, { useState } from 'react';
import { ProductCategory, ProductTypologyId, ProductTypologyMeta } from '../../types';
import { PRODUCT_TYPOLOGIES } from '../../data/initialData';
import { MiniDiagramThumbnail } from '../diagram/MiniDiagramThumbnail';
import { Check } from 'lucide-react';

interface ProductSelectorProps {
  selectedTypologyId: ProductTypologyId;
  onSelectTypology: (typology: ProductTypologyMeta) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedTypologyId,
  onSelectTypology,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('windows');

  const categories: { id: ProductCategory; label: string }[] = [
    { id: 'windows', label: 'Windows' },
    { id: 'doors', label: 'Doors' },
    { id: 'ventilators', label: 'Ventilators & Louvers' },
    { id: 'custom', label: 'Custom Fixed Frames' },
  ];

  const filteredTypologies = PRODUCT_TYPOLOGIES.filter(
    (item) => item.category === activeCategory
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Select UPVC Window / Door Typology</h2>
            <p className="text-xs text-slate-500 font-medium">Standard Indian extrusion profiles with multi-track and sash variations</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Typology Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {filteredTypologies.map((typology) => {
          const isSelected = selectedTypologyId === typology.id;
          return (
            <div
              key={typology.id}
              onClick={() => onSelectTypology(typology)}
              className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col items-center text-center relative ${
                isSelected
                  ? 'bg-blue-50/70 border-2 border-blue-600 shadow-xs'
                  : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}

              <div className="mb-2">
                <MiniDiagramThumbnail typologyId={typology.id} />
              </div>

              <span
                className={`text-xs font-bold leading-tight ${
                  isSelected ? 'text-blue-700' : 'text-slate-800'
                }`}
              >
                {typology.name}
              </span>

              <span
                className={`text-[10.5px] mt-1 font-mono leading-tight ${
                  isSelected ? 'text-blue-600 font-semibold' : 'text-slate-500'
                }`}
              >
                {typology.badge}
              </span>

              <span className="text-[10px] text-emerald-700 font-mono mt-1 font-semibold">
                ₹{typology.baseRatePerSqFt}/sq.ft
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
