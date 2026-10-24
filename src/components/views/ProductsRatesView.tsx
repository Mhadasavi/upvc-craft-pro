import React, { useState, useEffect } from 'react';
import { ProductCategory, RateSheetItem } from '../../types';
import { INITIAL_RATE_SHEET } from '../../data/initialData';
import { MiniDiagramThumbnail } from '../diagram/MiniDiagramThumbnail';
import { Tags, Save, Check, RotateCcw, AlertCircle, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');

  useEffect(() => {
    setRates(rateSheet);
  }, [rateSheet]);

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
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const categories: { id: 'all' | ProductCategory; label: string }[] = [
    { id: 'all', label: 'All Products' },
    { id: 'windows', label: 'Windows' },
    { id: 'doors', label: 'Doors' },
    { id: 'ventilators', label: 'Ventilators' },
    { id: 'custom', label: 'Custom & Partitions' },
  ];

  const filteredRates = rates.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const avgRate = Math.round(
    rates.reduce((sum, r) => sum + r.baseRatePerSqFt, 0) / (rates.length || 1)
  );

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Products &amp; Master Rate Sheet</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure base fabrication rates per sq.ft for all {rates.length} standard UPVC window &amp; door profiles in INR (₹)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            type="button"
            title="Reset all rates to factory recommended baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>

          <button
            onClick={handleSave}
            className="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
            type="button"
          >
            {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Rates Saved!' : 'Save & Apply Rates'}</span>
          </button>
        </div>
      </div>

      {/* Info & Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-center gap-3 text-xs text-blue-900">
          <AlertCircle className="w-5 h-5 text-blue-700 shrink-0" />
          <div>
            <span className="font-bold">Active Master Rate Book: </span>
            Rates set here automatically feed into the quotation engine as default rates when configuring window and door schedules.
            Includes standard welded UPVC frame, 5mm Clear Toughened glass, and standard friction hardware.
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Catalog Overview</span>
            <span className="font-bold text-base text-slate-900">{rates.length} Typologies</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Avg Base Rate</span>
            <span className="font-mono font-bold text-base text-emerald-700">₹{avgRate}/sq.ft</span>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {categories.map((cat) => {
            const count =
              cat.id === 'all' ? rates.length : rates.filter((r) => r.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search typology name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 w-20 text-center">Preview</th>
              <th className="py-3 px-4">UPVC Typology Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Standard Benchmark (₹)</th>
              <th className="py-3 px-4 text-right">Your Shop Base Rate (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRates.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <p className="font-semibold text-sm">No typologies found</p>
                  <p className="text-xs mt-1">Try clearing your search query or selecting a different category filter.</p>
                </td>
              </tr>
            ) : (
              filteredRates.map((item, index) => {
                const benchmark = INITIAL_RATE_SHEET.find((i) => i.id === item.id)?.baseRatePerSqFt || item.baseRatePerSqFt;
                const isModified = item.baseRatePerSqFt !== benchmark;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <MiniDiagramThumbnail typologyId={item.typologyId} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.typologyId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10.5px] uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold border border-slate-200/60">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      ₹{benchmark}.00
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-slate-500 font-mono font-bold">₹</span>
                        <input
                          type="number"
                          min="100"
                          step="10"
                          className={`w-24 h-8 px-2 rounded-lg border font-mono text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                            isModified
                              ? 'border-blue-400 bg-blue-50/30 text-blue-700'
                              : 'border-slate-300 bg-slate-50 focus:bg-white text-slate-800'
                          }`}
                          value={item.baseRatePerSqFt}
                          onChange={(e) => handleRateChange(item.id, parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-slate-500 text-[11px]">/sq.ft</span>
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
