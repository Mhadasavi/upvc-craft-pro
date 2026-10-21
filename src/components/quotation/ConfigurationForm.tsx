import React, { useState } from 'react';
import {
  ItemAccessories,
  MeasurementUnit,
  OpeningDirection,
  ProductTypologyId,
  ProfileFoilColor,
} from '../../types';
import { calculateAreaSqFt, fromInches, toInches } from '../../utils/calculations';
import {
  ChevronDown,
  Plus,
  Minus,
  Check,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  Settings2,
  HelpCircle,
} from 'lucide-react';

interface ConfigurationFormProps {
  typologyId: ProductTypologyId;
  rawWidth: number;
  rawHeight: number;
  unit: MeasurementUnit;
  quantity: number;
  locationTag: string;
  glassPackage: string;
  profileBrand: string;
  colorFoil: ProfileFoilColor;
  accessories: ItemAccessories;
  fittingRatePerSqFt?: number;
  trackCount: number;
  panelCount: number;
  openingDirection: OpeningDirection;
  isEditing: boolean;
  onUpdateWidth: (w: number) => void;
  onUpdateHeight: (h: number) => void;
  onUpdateUnit: (u: MeasurementUnit) => void;
  onUpdateQuantity: (q: number) => void;
  onUpdateLocationTag: (tag: string) => void;
  onUpdateGlassPackage: (pkg: string) => void;
  onUpdateProfileBrand: (brand: string) => void;
  onUpdateColorFoil: (color: ProfileFoilColor) => void;
  onToggleAccessory: (key: keyof ItemAccessories) => void;
  onUpdateFittingRate?: (rate: number) => void;
  onUpdateTrackCount: (count: number) => void;
  onUpdatePanelCount: (count: number) => void;
  onUpdateOpeningDirection: (dir: OpeningDirection) => void;
  onSubmitItem: () => void;
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  typologyId,
  rawWidth,
  rawHeight,
  unit,
  quantity,
  locationTag,
  glassPackage,
  profileBrand,
  colorFoil,
  accessories,
  fittingRatePerSqFt = 40,
  trackCount,
  panelCount,
  openingDirection,
  isEditing,
  onUpdateWidth,
  onUpdateHeight,
  onUpdateUnit,
  onUpdateQuantity,
  onUpdateLocationTag,
  onUpdateGlassPackage,
  onUpdateProfileBrand,
  onUpdateColorFoil,
  onToggleAccessory,
  onUpdateFittingRate,
  onUpdateTrackCount,
  onUpdatePanelCount,
  onUpdateOpeningDirection,
  onSubmitItem,
}) => {
  // Simple Mode is active by default as requested
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Width & height in inches for calculation
  const widthInInches = toInches(rawWidth, unit);
  const heightInInches = toInches(rawHeight, unit);
  const areaPerUnit = calculateAreaSqFt(widthInInches, heightInInches);
  const totalArea = Math.round(areaPerUnit * quantity * 100) / 100;

  // Metric representations for display
  const wMm = Math.round(widthInInches * 25.4);
  const hMm = Math.round(heightInInches * 25.4);

  // Typology properties to conditionally render standard options
  const isSliding = typologyId.includes('sliding');
  const isOpenable =
    typologyId.includes('casement') ||
    typologyId.includes('tilt') ||
    typologyId.includes('french') ||
    typologyId === 'top-hung-vent';
  const isVent = typologyId.includes('louver') || typologyId.includes('vent');
  const isDoor = typologyId.includes('door');

  const handleUnitChange = (newUnit: MeasurementUnit) => {
    if (newUnit === unit) return;
    const currentWInches = toInches(rawWidth, unit);
    const currentHInches = toInches(rawHeight, unit);
    onUpdateWidth(fromInches(currentWInches, newUnit));
    onUpdateHeight(fromInches(currentHInches, newUnit));
    onUpdateUnit(newUnit);
  };

  const handleProfileSelect = (val: string) => {
    onUpdateProfileBrand(val);
    if (val.includes('Wooden') || val.includes('Oak')) {
      onUpdateColorFoil('wooden');
    } else if (val.includes('Grey') || val.includes('Anthracite')) {
      onUpdateColorFoil('grey');
    } else {
      onUpdateColorFoil('white');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 flex flex-col gap-4">
      {/* Form Header with Simple vs Advanced Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Dimensions &amp; Configuration</h3>
            <span className="text-xs text-slate-500 font-medium">
              {locationTag || 'Item Specifications'}
            </span>
          </div>
        </div>

        {/* Mode Toggle Switch (Simple Mode vs Advanced Mode) */}
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsAdvancedMode(false)}
            className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
              !isAdvancedMode
                ? 'bg-white text-blue-700 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Simple Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(true)}
            className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
              isAdvancedMode
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Advanced Mode</span>
          </button>
        </div>
      </div>

      {/* Mode Notification / Context Banner */}
      {!isAdvancedMode ? (
        <div className="p-2.5 px-3 bg-emerald-50/70 rounded-lg border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Simple Mode:</strong> Core dimensions &amp; layout enabled. Standard 60mm series, 5mm toughened glass, and hardware pre-applied.
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(true)}
            className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 ml-2"
          >
            Customize More →
          </button>
        </div>
      ) : (
        <div className="p-2.5 px-3 bg-blue-50/70 rounded-lg border border-blue-200/60 flex items-center justify-between text-xs text-blue-900">
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Advanced Mode Active:</strong> Configure custom profile series, glass packages, mosquito mesh, hardware locks, and installation rates.
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(false)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 shrink-0 ml-2"
          >
            Back to Simple
          </button>
        </div>
      )}

      {/* CORE FIELDS (Always Visible in Simple & Advanced Modes) */}
      <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/70 flex flex-col gap-3">
        {/* Unit Toggle Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 tracking-wide flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 18h18M7 6v12M17 6v12" />
            </svg>
            Measurement Unit
          </span>
          <div className="inline-flex rounded-lg bg-white p-0.5 border border-slate-200 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => handleUnitChange('in')}
              className={`px-3 py-1 rounded transition-all ${
                unit === 'in' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              Inches (in)
            </button>
            <button
              onClick={() => handleUnitChange('mm')}
              className={`px-3 py-1 rounded transition-all ${
                unit === 'mm' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              Millimeters (mm)
            </button>
            <button
              onClick={() => handleUnitChange('ft')}
              className={`px-3 py-1 rounded transition-all ${
                unit === 'ft' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              type="button"
            >
              Feet (ft)
            </button>
          </div>
        </div>

        {/* Width, Height & Quantity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {/* Width Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800">Width (W)</label>
              <span className="font-mono text-[11px] text-slate-500 font-medium">{wMm} mm</span>
            </div>
            <div className="relative flex items-center">
              <input
                className="w-full h-10 pl-3 pr-10 rounded-lg bg-white border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                type="number"
                step={unit === 'mm' ? '1' : '0.5'}
                min="6"
                value={rawWidth || ''}
                onChange={(e) => onUpdateWidth(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-slate-100 border-l border-slate-200 rounded-r-lg flex items-center font-mono text-xs text-slate-600 font-semibold select-none">
                {unit}
              </span>
            </div>
          </div>

          {/* Height Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800">Height (H)</label>
              <span className="font-mono text-[11px] text-slate-500 font-medium">{hMm} mm</span>
            </div>
            <div className="relative flex items-center">
              <input
                className="w-full h-10 pl-3 pr-10 rounded-lg bg-white border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                type="number"
                step={unit === 'mm' ? '1' : '0.5'}
                min="6"
                value={rawHeight || ''}
                onChange={(e) => onUpdateHeight(parseFloat(e.target.value) || 0)}
              />
              <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-slate-100 border-l border-slate-200 rounded-r-lg flex items-center font-mono text-xs text-slate-600 font-semibold select-none">
                {unit}
              </span>
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-800">Quantity</label>
            <div className="flex items-center h-10 bg-white rounded-lg border border-slate-300 shadow-2xs overflow-hidden">
              <button
                onClick={() => onUpdateQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                type="button"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                className="w-full text-center font-mono text-sm font-bold text-slate-900 bg-transparent focus:outline-none"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => onUpdateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button
                onClick={() => onUpdateQuantity(quantity + 1)}
                className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                type="button"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Calculated Area Ledger */}
        <div className="p-2 px-3 bg-blue-100/60 rounded-lg flex items-center justify-between text-xs text-blue-900 border border-blue-200/50">
          <span className="font-semibold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Area: {areaPerUnit.toFixed(1)} sq.ft / unit
          </span>
          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-slate-900 shadow-2xs border border-blue-200/40">
            Batch Total: {totalArea.toFixed(1)} sq.ft
          </span>
        </div>
      </div>

      {/* STANDARD CONFIGURATION OPTIONS (RELEVANT TO SELECTED PRODUCT ONLY) */}
      <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60 flex flex-col gap-2.5">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Standard Configuration (Product Specific)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* If Sliding: Track & Panel counts and Sliding Direction */}
          {isSliding && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Track &amp; Panel Configuration</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={trackCount}
                    onChange={(e) => onUpdateTrackCount(parseInt(e.target.value) || 2)}
                    className="h-9 px-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={2}>2 Tracks</option>
                    <option value={3}>3 Tracks</option>
                    <option value={4}>4 Tracks</option>
                  </select>
                  <select
                    value={panelCount}
                    onChange={(e) => onUpdatePanelCount(parseInt(e.target.value) || 2)}
                    className="h-9 px-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value={2}>2 Sashes</option>
                    <option value={3}>3 Sashes</option>
                    <option value={4}>4 Sashes</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Sliding Movement Direction</label>
                <select
                  value={openingDirection}
                  onChange={(e) => onUpdateOpeningDirection(e.target.value as OpeningDirection)}
                  className="h-9 px-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="slide-left">Slide Left (Active Right)</option>
                  <option value="slide-right">Slide Right (Active Left)</option>
                  <option value="slide-bi">Bi-Parting (Center Split)</option>
                </select>
              </div>
            </>
          )}

          {/* If Openable / Casement: Opening Direction / Swing */}
          {isOpenable && (
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-bold text-slate-700">Opening Direction &amp; Swing Action</label>
              <select
                value={openingDirection}
                onChange={(e) => onUpdateOpeningDirection(e.target.value as OpeningDirection)}
                className="h-9 px-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="swing-right">Side Hung (Hinges Left, Opens Right Outward)</option>
                <option value="swing-left">Side Hung (Hinges Right, Opens Left Outward)</option>
                {typologyId === 'tilt-turn-win' && <option value="tilt-turn">Dual Axis Tilt &amp; Turn (Inward)</option>}
                {typologyId === 'french-door' && <option value="french-door">French Double Swing (Dual Leaves)</option>}
              </select>
            </div>
          )}

          {/* If Ventilator: Louver Blades & Exhaust Cutout */}
          {isVent && (
            <div className="flex items-center justify-between sm:col-span-2 p-2 bg-white rounded-lg border border-slate-200">
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">Circular Exhaust Fan Cutout</span>
                <span className="text-[11px] text-slate-500">Provide integrated circular ring for exhaust fan</span>
              </div>
              <input
                type="checkbox"
                checked={accessories.exhaustFanCutout}
                onChange={() => onToggleAccessory('exhaustFanCutout')}
                className="w-5 h-5 rounded text-blue-600 accent-blue-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* ADVANCED MODE SECTION (Hidden by default, revealed only when isAdvancedMode is true) */}
      {isAdvancedMode && (
        <div className="p-4 bg-slate-50 rounded-xl border border-blue-200 flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-blue-700" />
              Advanced Engineering &amp; Material Options
            </span>
            <span className="font-mono text-[11px] text-slate-500">Shop Customization</span>
          </div>

          {/* 1. Frame Profile Series & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Profile Brand &amp; Foil Series</span>
                <span className="font-mono text-[11px] text-slate-500 font-medium">60mm Series</span>
              </label>
              <div className="relative">
                <select
                  value={profileBrand}
                  onChange={(e) => handleProfileSelect(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer"
                >
                  <option value="Kommerling White (High Gloss)">Kommerling White (High Gloss 60mm)</option>
                  <option value="Deceuninck White (Class A)">Deceuninck White (Class A DIN EN)</option>
                  <option value="Royal Golden Oak Wooden Foil">Royal Golden Oak Wooden Foil</option>
                  <option value="Anthracite Matt Grey (RAL 7016)">Anthracite Matt Grey (RAL 7016)</option>
                  <option value="Simta Eco Series White">Simta Eco Series White</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* 2. Glass Package */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Glass Package / Glazing Type</span>
                <span className="font-mono text-[11px] text-emerald-700 font-bold">Toughened</span>
              </label>
              <div className="relative">
                <select
                  value={glassPackage}
                  onChange={(e) => onUpdateGlassPackage(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none cursor-pointer"
                >
                  <option value="5mm Clear Float (Toughened)">5mm Clear Float (Toughened Safety)</option>
                  <option value="Double Glazed (5+12A+5) DGU 22mm">Double Glazed (5+12A+5) DGU 22mm</option>
                  <option value="5mm Frosted / Pinhead Glass">5mm Frosted / Pinhead Obscure Glass</option>
                  <option value="6mm Tinted Glass (Reflective Grey)">6mm Tinted Glass (Reflective Grey)</option>
                  <option value="8mm Toughened Clear Glass">8mm Heavy Toughened Clear Glass</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 3. Hardware, Mesh & Installation Charges */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Hardware, Mesh &amp; Installation Charges
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Rollers */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200">
                <input
                  type="checkbox"
                  checked={accessories.heavyDutyRollers}
                  onChange={() => onToggleAccessory('heavyDutyRollers')}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">Heavy Duty Rollers</span>
                  <span className="text-[11px] text-slate-500">Brass Bearing tandem wheels</span>
                </div>
              </label>

              {/* Crescent Lock */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200">
                <input
                  type="checkbox"
                  checked={accessories.crescentLock}
                  onChange={() => onToggleAccessory('crescentLock')}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">Crescent Sash Lock</span>
                  <span className="text-[11px] text-slate-500">Zinc die-cast with key</span>
                </div>
              </label>

              {/* SS304 Mosquito Mesh */}
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200">
                <input
                  type="checkbox"
                  checked={accessories.mosquitoMesh}
                  onChange={() => onToggleAccessory('mosquitoMesh')}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">SS 304 Mosquito Mesh</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">+₹35/sq.ft (Insect screen)</span>
                </div>
              </label>

              {/* Site Fitting & Silicone Weather Seal */}
              <div
                className={`p-2.5 rounded-lg border transition-all col-span-1 sm:col-span-2 ${
                  accessories.siteFitting ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={accessories.siteFitting}
                      onChange={() => onToggleAccessory('siteFitting')}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-xs">Site Fitting &amp; Silicone</span>
                        {accessories.siteFitting && fittingRatePerSqFt === 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Free / Waived
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {accessories.siteFitting
                          ? fittingRatePerSqFt === 0
                            ? 'Included in scope (₹0 installation fee)'
                            : `+₹${fittingRatePerSqFt}/sq.ft weather sealing & installation`
                          : 'Supply Only (No installation)'}
                      </span>
                    </div>
                  </label>

                  {/* Free / Standard / Custom Rate Controls */}
                  {accessories.siteFitting && onUpdateFittingRate && (
                    <div className="flex items-center gap-1.5 pl-6 sm:pl-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onUpdateFittingRate(0);
                        }}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-bold transition-all ${
                          fittingRatePerSqFt === 0
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Waive installation fee (Include free in order scope)"
                      >
                        Free (₹0)
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onUpdateFittingRate(40);
                        }}
                        className={`px-2 py-1 rounded-md text-[10.5px] font-bold transition-all ${
                          fittingRatePerSqFt === 40
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Standard rate (₹40/sq.ft)"
                      >
                        ₹40/sq.ft
                      </button>
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-md px-1.5 h-6 text-xs">
                        <span className="text-[10px] font-mono text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={fittingRatePerSqFt}
                          onChange={(e) => onUpdateFittingRate(Math.max(0, Number(e.target.value)))}
                          className="w-10 text-center font-mono text-[11px] font-bold text-slate-800 bg-transparent focus:outline-none"
                          title="Custom Rate per Sq.Ft"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Structural Steel Core & Grill Options */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200 text-xs">
            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={accessories.steelReinforcement}
                onChange={() => onToggleAccessory('steelReinforcement')}
                className="rounded text-blue-600 accent-blue-600"
              />
              <span>1.2mm Galvanized Steel Core (+₹15/sq.ft)</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={accessories.georgianBars}
                onChange={() => onToggleAccessory('georgianBars')}
                className="rounded text-blue-600 accent-blue-600"
              />
              <span>Internal Georgian Grill Bars (+₹35/sq.ft)</span>
            </label>
          </div>
        </div>
      )}

      {/* Item Location Tag & Add Button */}
      <div className="pt-1 flex flex-col gap-3">
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <input
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
            placeholder="Location Tag (e.g. Living Room Balcony, Master Bed, Kitchen)"
            type="text"
            value={locationTag}
            onChange={(e) => onUpdateLocationTag(e.target.value)}
          />
        </div>

        <button
          onClick={onSubmitItem}
          className="h-11 px-5 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20"
          type="button"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isEditing ? 'Update Quotation Item' : '+ Add Item to Current Quotation'}</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[11px] font-mono bg-white/20 text-white rounded">
            Ctrl + Enter
          </kbd>
        </button>
      </div>
    </div>
  );
};
