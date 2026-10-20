import React, { useState, useEffect, useRef } from 'react';
import {
  BusinessProfile,
  Customer,
  ItemAccessories,
  MeasurementUnit,
  OpeningDirection,
  ProductTypologyId,
  ProductTypologyMeta,
  ProfileFoilColor,
  QuotationItem,
  QuotationStatus,
  RateSheetItem,
} from '../../types';
import { PRODUCT_TYPOLOGIES } from '../../data/initialData';
import {
  calculateAreaSqFt,
  calculateItemCost,
  fromInches,
  toInches,
  dateStringToIso,
  isoToDisplayDate,
  calculateValidUntilDate,
} from '../../utils/calculations';
import { ProductSelector } from '../quotation/ProductSelector';
import { ConfigurationForm } from '../quotation/ConfigurationForm';
import { ParametricElevation } from '../diagram/ParametricElevation';
import { LivePricingCard } from '../quotation/LivePricingCard';
import { QuotationTable } from '../quotation/QuotationTable';
import { SummaryBar } from '../quotation/SummaryBar';
import { CustomerModal } from '../modals/CustomerModal';
import { CutListModal } from '../modals/CutListModal';
import { PrintQuoteModal } from '../modals/PrintQuoteModal';
import {
  CheckCircle2,
  Send,
  RefreshCw,
  Save,
  Calendar,
  Clock,
  FileText,
  Users,
  UserPlus,
  UserCheck,
  Search,
  Building,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { lookupGstDetails, parseGstinStructure } from '../../utils/gstLookup';
import { formatINR } from '../../utils/calculations';

interface NewQuotationBuilderProps {
  quoteNumber: string;
  quoteDate?: string;
  validUntil?: string;
  customer: Customer;
  allCustomers: Customer[];
  items: QuotationItem[];
  profile: BusinessProfile;
  rateSheet: RateSheetItem[];
  initialStep?: 1 | 2 | 3;
  onUpdateCustomer: (customer: Customer) => void;
  onAddNewCustomer: (customer: Customer) => void;
  onUpdateItems: (items: QuotationItem[]) => void;
  onUpdateQuoteDate?: (date: string) => void;
  onUpdateValidUntil?: (validUntil: string) => void;
  onSaveQuotation?: (status?: QuotationStatus, customDate?: string, customValidUntil?: string) => void;
  onSendWhatsApp: () => void;
  onFinalizeInvoice: () => void;
}

export const NewQuotationBuilder: React.FC<NewQuotationBuilderProps> = ({
  quoteNumber,
  quoteDate,
  validUntil,
  customer,
  allCustomers,
  items,
  profile,
  rateSheet,
  initialStep = 1,
  onUpdateCustomer,
  onAddNewCustomer,
  onUpdateItems,
  onUpdateQuoteDate,
  onUpdateValidUntil,
  onSaveQuotation,
  onSendWhatsApp,
  onFinalizeInvoice,
}) => {
  // Workflow Step Management (Step 1: Customer Details, Step 2: Product & CAD Studio, Step 3: Review & Finalize)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep);

  useEffect(() => {
    if (initialStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  // Step 1: Customer Search & Quick Registration
  const [customerSearch, setCustomerSearch] = useState('');
  const [step1Mode, setStep1Mode] = useState<'existing' | 'new'>('existing');

  // New Customer Form States
  const [newName, setNewName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState(customer.city || 'Noida');
  const [newStateName, setNewStateName] = useState('Uttar Pradesh');
  const [newGstin, setNewGstin] = useState('');
  const [gstAutoFilled, setGstAutoFilled] = useState(false);

  const handleNewCustomerGstinChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setNewGstin(clean);
    if (clean.length >= 2) {
      const struct = parseGstinStructure(clean);
      if (struct) {
        setNewStateName(struct.stateName);
        if (!newCity || newCity === 'Noida') {
          setNewCity(struct.defaultCity);
        }
      }
    }
    const match = lookupGstDetails(clean);
    if (match) {
      setNewCompanyName(match.companyName);
      setNewName(match.name);
      setNewAddress(match.address);
      setNewCity(match.city);
      setNewStateName(match.state);
      setNewMobile(match.mobile);
      setGstAutoFilled(true);
    }
  };

  const handleCreateAndSelectCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim() || !newMobile.trim()) {
      alert('Please provide at least Customer Name and Mobile Number.');
      return;
    }
    const created: Customer = {
      id: `cust-${Date.now()}`,
      name: newName.trim(),
      companyName: newCompanyName.trim() || undefined,
      mobile: newMobile.trim(),
      address: newAddress.trim() || `${newCity}, ${newStateName}`,
      city: newCity.trim(),
      gstin: newGstin.trim().toUpperCase() || undefined,
    };
    onAddNewCustomer(created);
    onUpdateCustomer(created);
    setStep1Mode('existing');
    setNewName('');
    setNewCompanyName('');
    setNewMobile('');
    setNewAddress('');
    setNewGstin('');
    setGstAutoFilled(false);
  };

  // Financial aggregates across entire quotation
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalArea = items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);

  let materialBaseTotal = 0;
  let siteFittingTotal = 0;
  let subtotal = 0;

  items.forEach((item) => {
    subtotal += item.itemTotal;
    const itemFitting = item.accessories.siteFitting ? item.totalAreaSqFt * 40 : 0;
    siteFittingTotal += itemFitting;
    materialBaseTotal += item.itemTotal - itemFitting;
  });

  const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const grandTotal = subtotal + gstAmount;

  // Filter existing customers by search query
  const filteredCustomers = allCustomers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.mobile.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  });

  // Quotation Dates
  const [currentQuoteDate, setCurrentQuoteDate] = useState<string>(() => {
    return quoteDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });

  const [currentValidUntil, setCurrentValidUntil] = useState<string>(() => {
    return validUntil || calculateValidUntilDate(currentQuoteDate, 30);
  });

  const [validityDays, setValidityDays] = useState<number>(30);

  // Date input refs for opening calendar picker
  const topQuoteDateRef = useRef<HTMLInputElement>(null);
  const topValidUptoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quoteDate) setCurrentQuoteDate(quoteDate);
  }, [quoteDate]);

  useEffect(() => {
    if (validUntil) setCurrentValidUntil(validUntil);
  }, [validUntil]);

  // Modal states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCutListOpen, setIsCutListOpen] = useState(false);
  const [isPrintQuoteOpen, setIsPrintQuoteOpen] = useState(false);

  // Active Item Configuration States
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [typologyId, setTypologyId] = useState<ProductTypologyId>('2track-sliding-win');
  const [productName, setProductName] = useState('2-Track Sliding Window');
  const [locationTag, setLocationTag] = useState('Living Room Balcony (Front)');
  const [unit, setUnit] = useState<MeasurementUnit>('in');
  const [rawWidth, setRawWidth] = useState<number>(48);
  const [rawHeight, setRawHeight] = useState<number>(60);
  const [quantity, setQuantity] = useState<number>(2);

  const [glassPackage, setGlassPackage] = useState<string>('5mm Clear Float (Toughened)');
  const [profileBrand, setProfileBrand] = useState<string>('Kommerling White (High Gloss)');
  const [colorFoil, setColorFoil] = useState<ProfileFoilColor>('white');

  const [accessories, setAccessories] = useState<ItemAccessories>({
    heavyDutyRollers: true,
    crescentLock: true,
    mosquitoMesh: false,
    siteFitting: true,
    steelReinforcement: true,
    georgianBars: false,
    exhaustFanCutout: false,
  });

  const [trackCount, setTrackCount] = useState<number>(2);
  const [panelCount, setPanelCount] = useState<number>(2);
  const [openingDirection, setOpeningDirection] = useState<OpeningDirection>('slide-left');

  // Find base rate from active rate sheet
  const activeRateItem = rateSheet.find((r) => r.typologyId === typologyId);
  const baseRatePerSqFt = activeRateItem ? activeRateItem.baseRatePerSqFt : 420;

  // Real-time dimensional calculations
  const widthInInches = toInches(rawWidth, unit);
  const heightInInches = toInches(rawHeight, unit);
  const areaPerUnitSqFt = calculateAreaSqFt(widthInInches, heightInInches);
  const totalAreaSqFt = Math.round(areaPerUnitSqFt * quantity * 100) / 100;

  // Real-time pricing calculations
  const costBreakdown = calculateItemCost(
    areaPerUnitSqFt,
    quantity,
    baseRatePerSqFt,
    accessories.crescentLock ? 600 : 300,
    accessories
  );

  // Keyboard shortcut Ctrl+Enter to quickly add item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddOrUpdateItem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    editingItemId,
    typologyId,
    productName,
    locationTag,
    rawWidth,
    rawHeight,
    unit,
    quantity,
    glassPackage,
    profileBrand,
    colorFoil,
    accessories,
    trackCount,
    panelCount,
    openingDirection,
    costBreakdown,
  ]);

  const handleSelectTypology = (typ: ProductTypologyMeta) => {
    setTypologyId(typ.id);
    setProductName(typ.name);
    setTrackCount(typ.defaultTracks);
    setPanelCount(typ.defaultPanels);

    // Default opening direction based on typology
    if (typ.isOpenable) {
      setOpeningDirection('swing-right');
    } else if (typ.isSliding) {
      setOpeningDirection('slide-left');
    } else {
      setOpeningDirection('fixed');
    }

    // Default dimensions based on category
    if (typ.isDoor) {
      if (unit === 'in') {
        setRawWidth(60);
        setRawHeight(84);
      } else if (unit === 'mm') {
        setRawWidth(1524);
        setRawHeight(2134);
      } else {
        setRawWidth(5);
        setRawHeight(7);
      }
    } else if (typ.isVentilator) {
      if (unit === 'in') {
        setRawWidth(24);
        setRawHeight(24);
      } else if (unit === 'mm') {
        setRawWidth(610);
        setRawHeight(610);
      } else {
        setRawWidth(2);
        setRawHeight(2);
      }
    }
  };

  const handleToggleAccessory = (key: keyof ItemAccessories) => {
    setAccessories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddOrUpdateItem = () => {
    if (rawWidth <= 0 || rawHeight <= 0 || quantity <= 0) return;

    const currentTypology = PRODUCT_TYPOLOGIES.find((t) => t.id === typologyId);
    const category = currentTypology?.category || 'windows';

    const newItem: QuotationItem = {
      id: editingItemId || `item-${Date.now()}`,
      itemNumber: editingItemId
        ? items.find((i) => i.id === editingItemId)?.itemNumber || items.length + 1
        : items.length + 1,
      name: productName,
      locationTag: locationTag || `${productName} #${items.length + 1}`,
      typologyId,
      category,
      unit,
      rawWidth,
      rawHeight,
      widthInInches,
      heightInInches,
      quantity,
      areaPerUnitSqFt,
      totalAreaSqFt,
      glassPackage,
      profileBrand,
      colorFoil,
      accessories: { ...accessories },
      ratePerSqFt: baseRatePerSqFt,
      hardwareCostPerUnit: accessories.crescentLock ? 600 : 300,
      fittingCostPerSqFt: accessories.siteFitting ? 40 : 0,
      meshCostPerSqFt: accessories.mosquitoMesh ? 35 : 0,
      subtotal: costBreakdown.subtotal,
      gstAmount: costBreakdown.gstAmount,
      itemTotal: costBreakdown.subtotal,
      trackCount,
      panelCount,
      openingDirection,
      profileSeries: '60mm Multi-Chamber Class A',
      reinforcementThickness: '1.2mm GI Galvanized',
    };

    if (editingItemId) {
      onUpdateItems(items.map((i) => (i.id === editingItemId ? newItem : i)));
      setEditingItemId(null);
    } else {
      // Check if an item with exact matching specifications already exists in the quote list
      const existingMatchIndex = items.findIndex((existing) => {
        if (existing.typologyId !== typologyId) return false;
        if (Math.abs(existing.widthInInches - widthInInches) > 0.05) return false;
        if (Math.abs(existing.heightInInches - heightInInches) > 0.05) return false;
        if (existing.profileBrand !== profileBrand) return false;
        if (existing.colorFoil !== colorFoil) return false;
        if (existing.glassPackage !== glassPackage) return false;
        if (existing.trackCount !== trackCount) return false;
        if (existing.panelCount !== panelCount) return false;
        if (existing.openingDirection !== openingDirection) return false;

        // Compare location tags: equal or both are default generic tags
        const tagA = (existing.locationTag || '').trim().toLowerCase();
        const tagB = (locationTag || '').trim().toLowerCase();
        const isGenericA = tagA.startsWith('room window') || tagA.startsWith(existing.name.toLowerCase());
        const isGenericB = tagB.startsWith('room window') || tagB.startsWith(productName.toLowerCase());
        if (tagA !== tagB && !(isGenericA && isGenericB)) {
          return false;
        }

        // Compare accessories
        const a = existing.accessories;
        const b = accessories;
        return (
          a.mosquitoMesh === b.mosquitoMesh &&
          a.heavyDutyRollers === b.heavyDutyRollers &&
          a.crescentLock === b.crescentLock &&
          a.touchLock === b.touchLock &&
          a.frictionStay === b.frictionStay &&
          a.multipointLock === b.multipointLock &&
          a.doorHandleKey === b.doorHandleKey &&
          a.siteFitting === b.siteFitting &&
          a.steelReinforcement === b.steelReinforcement &&
          a.georgianBars === b.georgianBars &&
          a.exhaustFanCutout === b.exhaustFanCutout
        );
      });

      if (existingMatchIndex >= 0) {
        // Exact matching item found! Increase quantity instead of adding duplicate item
        const existing = items[existingMatchIndex];
        const combinedQty = existing.quantity + quantity;
        const combinedArea = Math.round(existing.areaPerUnitSqFt * combinedQty * 100) / 100;
        const combinedCost = calculateItemCost(
          existing.areaPerUnitSqFt,
          combinedQty,
          existing.ratePerSqFt,
          existing.hardwareCostPerUnit,
          existing.accessories
        );

        const updatedExisting: QuotationItem = {
          ...existing,
          quantity: combinedQty,
          totalAreaSqFt: combinedArea,
          subtotal: combinedCost.subtotal,
          gstAmount: combinedCost.gstAmount,
          itemTotal: combinedCost.subtotal,
        };

        const updatedList = items.map((it, idx) => (idx === existingMatchIndex ? updatedExisting : it));
        onUpdateItems(updatedList);
      } else {
        // No match found, add as a new item in the list
        onUpdateItems([...items, newItem]);
      }
    }

    // Reset location tag for next item
    setLocationTag(`Room Window #${items.length + 2}`);
  };

  const handleEditItem = (item: QuotationItem) => {
    setEditingItemId(item.id);
    setTypologyId(item.typologyId);
    setProductName(item.name);
    setLocationTag(item.locationTag);
    setUnit(item.unit);
    setRawWidth(item.rawWidth);
    setRawHeight(item.rawHeight);
    setQuantity(item.quantity);
    setGlassPackage(item.glassPackage);
    setProfileBrand(item.profileBrand);
    setColorFoil(item.colorFoil);
    setAccessories({ ...item.accessories });
    setTrackCount(item.trackCount || 2);
    setPanelCount(item.panelCount || 2);
    setOpeningDirection(item.openingDirection || 'slide-left');

    // Smooth scroll to builder top
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleDuplicateItem = (item: QuotationItem) => {
    const duplicated: QuotationItem = {
      ...item,
      id: `item-${Date.now()}`,
      itemNumber: items.length + 1,
      locationTag: `${item.locationTag} (Copy)`,
    };
    onUpdateItems([...items, duplicated]);
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateItems(items.filter((i) => i.id !== itemId));
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  return (
    <div className="flex flex-col w-full pb-10">
      {/* Top Action & Status Ribbon */}
      <div className="bg-slate-900 text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400 font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
              {quoteNumber}
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Client: <strong className="text-white">{customer.name}</strong>
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          {/* Interactive Calendar Date Picker in Ribbon */}
          <div
            onClick={() => {
              try {
                topQuoteDateRef.current?.showPicker();
              } catch {}
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Click calendar icon to select quotation date"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-400 text-[10px] uppercase font-bold">Date:</span>
            <input
              ref={topQuoteDateRef}
              type="date"
              value={dateStringToIso(currentQuoteDate)}
              onChange={(e) => {
                const newDisplay = isoToDisplayDate(e.target.value);
                setCurrentQuoteDate(newDisplay);
                if (onUpdateQuoteDate) onUpdateQuoteDate(newDisplay);
                const updatedValid = calculateValidUntilDate(newDisplay, validityDays);
                setCurrentValidUntil(updatedValid);
                if (onUpdateValidUntil) onUpdateValidUntil(updatedValid);
              }}
              onClick={(e) => {
                e.stopPropagation();
                try {
                  e.currentTarget.showPicker();
                } catch {}
              }}
              style={{ colorScheme: 'dark' }}
              className="bg-transparent text-white font-mono font-bold text-xs cursor-pointer focus:outline-none"
            />
          </div>

          {/* Valid Upto Calendar Date Picker in Ribbon */}
          <div className="flex items-center gap-1.5">
            <div
              onClick={() => {
                try {
                  topValidUptoRef.current?.showPicker();
                } catch {}
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Click calendar icon to select valid upto date"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 text-[10px] uppercase font-bold">Valid Upto:</span>
              <input
                ref={topValidUptoRef}
                type="date"
                value={dateStringToIso(currentValidUntil)}
                onChange={(e) => {
                  const newDisplay = isoToDisplayDate(e.target.value);
                  setCurrentValidUntil(newDisplay);
                  if (onUpdateValidUntil) onUpdateValidUntil(newDisplay);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                style={{ colorScheme: 'dark' }}
                className="bg-transparent text-emerald-300 font-mono font-bold text-xs cursor-pointer focus:outline-none"
              />
            </div>

            {/* Quick Validity Duration Selector */}
            <select
              value={validityDays}
              onChange={(e) => {
                const days = parseInt(e.target.value, 10);
                setValidityDays(days);
                const newValid = calculateValidUntilDate(currentQuoteDate, days);
                setCurrentValidUntil(newValid);
                if (onUpdateValidUntil) onUpdateValidUntil(newValid);
              }}
              className="h-7 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px] font-bold cursor-pointer focus:outline-none"
              title="Change validity duration"
            >
              <option value={15}>15d</option>
              <option value={30}>30d</option>
              <option value={45}>45d</option>
              <option value={60}>60d</option>
              <option value={90}>90d</option>
            </select>
          </div>

          <span className="text-slate-600 hidden lg:inline">•</span>
          <span className="text-slate-400 font-mono hidden lg:inline">
            {items.length} Items ({items.reduce((s, i) => s + i.quantity, 0)} Units)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSaveQuotation && (
            <button
              onClick={() => onSaveQuotation('draft', currentQuoteDate, currentValidUntil)}
              className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              type="button"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Quote</span>
            </button>
          )}
          <button
            onClick={() => setIsPrintQuoteOpen(true)}
            className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            type="button"
          >
            <span>Print Preview</span>
          </button>
        </div>
      </div>

      {/* Workflow Stepper Strip */}
      <div className="px-6 pt-5 pb-4 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-[1520px] mx-auto flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Customer Details */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`text-left relative p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentStep === 1
                  ? 'bg-blue-50/70 border-2 border-blue-600 shadow-md ring-2 ring-blue-100'
                  : 'bg-emerald-50/50 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs font-mono text-sm font-bold ${
                    currentStep === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : '1'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wide ${
                      currentStep === 1 ? 'text-blue-700' : 'text-emerald-800'
                    }`}
                  >
                    Step 1 {currentStep === 1 ? '(Active: Customer)' : '(Completed)'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {customer.companyName ? `${customer.companyName}, ${customer.name}` : customer.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 truncate">
                    {customer.mobile} • {customer.city}
                  </span>
                </div>
              </div>

              {currentStep > 1 ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  Change
                </span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0 mr-1" />
              )}
            </button>

            {/* Step 2: Product & Parametric Configuration */}
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`text-left relative p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentStep === 2
                  ? 'bg-white border-2 border-blue-600 shadow-md ring-2 ring-blue-100'
                  : currentStep > 2
                  ? 'bg-emerald-50/50 border border-emerald-300 hover:bg-emerald-50'
                  : 'bg-slate-50/80 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs font-mono text-sm font-bold ${
                    currentStep === 2
                      ? 'bg-blue-600 text-white'
                      : currentStep > 2
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : '2'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] uppercase font-bold tracking-wide ${
                      currentStep === 2
                        ? 'text-blue-700'
                        : currentStep > 2
                        ? 'text-emerald-800'
                        : 'text-slate-500'
                    }`}
                  >
                    Step 2 {currentStep === 2 ? '(Active Studio)' : ''}
                  </span>
                  <span className="text-sm font-bold text-slate-900 truncate">
                    Product &amp; Parametric Configuration
                  </span>
                  <span className="text-xs text-slate-500 truncate">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'} Configured • Vector CAD
                  </span>
                </div>
              </div>

              {currentStep === 2 && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0 mr-1" />
              )}
            </button>

            {/* Step 3: Review, GST & Milestones */}
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`text-left relative p-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                currentStep === 3
                  ? 'bg-white border-2 border-blue-600 shadow-md ring-2 ring-blue-100'
                  : 'bg-slate-50/70 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs font-mono text-sm font-bold ${
                    currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  3
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[11px] uppercase font-bold tracking-wide ${
                      currentStep === 3 ? 'text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    Step 3 {currentStep === 3 ? '(Active Review)' : ''}
                  </span>
                  <span className="text-sm font-bold text-slate-900 truncate">
                    Review, GST &amp; Milestones
                  </span>
                  <span className="text-xs text-slate-500 truncate">
                    18% GST • Delivery • PDF &amp; Invoice
                  </span>
                </div>
              </div>

              {currentStep === 3 ? (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0 mr-1" />
              ) : (
                <Send className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: CUSTOMER DETAILS (Opens automatically when creating new quote)     */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="max-w-[1520px] w-full mx-auto p-6 flex flex-col gap-6">
          {/* Step 1 Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                  {quoteNumber}
                </span>
                <h2 className="text-xl font-bold text-slate-900">Step 1: Customer Details &amp; Job Information</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Please assign this quotation to a client. Choose an existing client from your database or enter new customer details.
              </p>
            </div>

            {/* Quick Date Display */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500">Quotation Date</span>
                <span className="font-mono font-bold text-slate-800">{currentQuoteDate}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500">Valid Until</span>
                <span className="font-mono font-bold text-emerald-700">{currentValidUntil}</span>
              </div>
            </div>
          </div>

          {/* Mode Selector & Selection Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Customer Picker & Registration Form */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Sub-tab Switch */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep1Mode('existing')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    step1Mode === 'existing'
                      ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Choose Existing Customer ({allCustomers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep1Mode('new')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    step1Mode === 'new'
                      ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Register New Customer</span>
                </button>
              </div>

              {/* MODE A: Select Existing Customer */}
              {step1Mode === 'existing' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search by client name, mobile number, company, city, or GSTIN..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Customers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {filteredCustomers.map((c) => {
                      const isSelected = c.id === customer.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onUpdateCustomer(c)}
                          className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
                              {c.companyName && (
                                <div className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-1 mt-0.5">
                                  <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{c.companyName}</span>
                                </div>
                              )}
                            </div>
                            {isSelected ? (
                              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shrink-0">
                                Selected ✓
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                Click to select
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{c.mobile}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{c.city || 'Noida'}, {c.address}</span>
                            </div>
                            {c.gstin && (
                              <div className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-fit border border-indigo-200 font-bold">
                                GSTIN: {c.gstin}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE B: Register New Customer Form */}
              {step1Mode === 'new' && (
                <form
                  onSubmit={handleCreateAndSelectCustomer}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4"
                >
                  {/* GSTIN auto-lookup prompt */}
                  <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Instant GSTIN Auto-Fill (Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 15-digit GSTIN (e.g. 09AABCL1234F1Z5)"
                      value={newGstin}
                      onChange={(e) => handleNewCustomerGstinChange(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-indigo-300 font-mono text-xs uppercase font-bold text-indigo-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    {gstAutoFilled && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        ✓ Business verified! Company, address &amp; city auto-filled below.
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Customer / Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Company / Firm Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Builders Pvt Ltd"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Mobile / WhatsApp Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        City / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Noida / Greater Noida"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">
                        Site / Delivery Address
                      </label>
                      <input
                        type="text"
                        placeholder="Plot / Flat No, Sector, Landmark..."
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStep1Mode('existing')}
                      className="h-9 px-4 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Save &amp; Select Customer
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right 4 Cols: Selected Customer Spotlight Card & Proceed Button */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-md p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-[11px] uppercase font-bold text-blue-700 tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    Selected Client for Quote
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Confirmed
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{customer.name}</h3>
                  {customer.companyName && (
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer.companyName}</span>
                    </div>
                  )}
                  <div className="text-xs font-mono font-medium text-slate-800 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{customer.mobile}</span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{customer.address || customer.city}</span>
                  </div>
                  {customer.gstin && (
                    <div className="mt-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono text-xs font-bold w-fit">
                      GSTIN: {customer.gstin}
                    </div>
                  )}
                </div>

                {/* Primary Step 1 Action Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Proceed to Step 2: Configure Products</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">
                    Select typology, enter dimensions, and view real-time vector elevations in Step 2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PRODUCT & PARAMETRIC CONFIGURATION STUDIO                          */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="max-w-[1520px] w-full mx-auto p-6 flex flex-col gap-6">
          {/* Typology Visual Grid Selector */}
          <ProductSelector
            selectedTypologyId={typologyId}
            onSelectTypology={handleSelectTypology}
          />

          {/* Two-Column Primary Stage: Configuration & Live Parametric CAD Elevation */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Column: Dimensions, Specs & Hardware (5 cols) */}
            <div className="xl:col-span-5 flex flex-col gap-4">
              <ConfigurationForm
                typologyId={typologyId}
                rawWidth={rawWidth}
                rawHeight={rawHeight}
                unit={unit}
                quantity={quantity}
                locationTag={locationTag}
                glassPackage={glassPackage}
                profileBrand={profileBrand}
                colorFoil={colorFoil}
                accessories={accessories}
                trackCount={trackCount}
                panelCount={panelCount}
                openingDirection={openingDirection}
                isEditing={Boolean(editingItemId)}
                onUpdateWidth={setRawWidth}
                onUpdateHeight={setRawHeight}
                onUpdateUnit={setUnit}
                onUpdateQuantity={setQuantity}
                onUpdateLocationTag={setLocationTag}
                onUpdateGlassPackage={setGlassPackage}
                onUpdateProfileBrand={setProfileBrand}
                onUpdateColorFoil={setColorFoil}
                onToggleAccessory={handleToggleAccessory}
                onUpdateTrackCount={setTrackCount}
                onUpdatePanelCount={setPanelCount}
                onUpdateOpeningDirection={setOpeningDirection}
                onSubmitItem={handleAddOrUpdateItem}
              />
            </div>

            {/* Right Column: Dynamic Parametric Vector CAD Elevation & Live Calculation (7 cols) */}
            <div className="xl:col-span-7 flex flex-col gap-4">
              <ParametricElevation
                typologyId={typologyId}
                widthInInches={widthInInches}
                heightInInches={heightInInches}
                unit={unit}
                trackCount={trackCount}
                panelCount={panelCount}
                openingDirection={openingDirection}
                profileBrand={profileBrand}
                colorFoil={colorFoil}
                glassPackage={glassPackage}
                hasMesh={accessories.mosquitoMesh}
                hasRollers={accessories.heavyDutyRollers}
                hasLock={accessories.crescentLock}
                hasExhaustCutout={accessories.exhaustFanCutout}
              />

              {/* Live Pricing Breakdown Card */}
              <LivePricingCard
                totalAreaSqFt={totalAreaSqFt}
                quantity={quantity}
                ratePerSqFt={baseRatePerSqFt}
                materialBase={costBreakdown.materialBase}
                hardwareTotal={costBreakdown.hardwareTotal}
                fittingTotal={costBreakdown.fittingTotal}
                meshTotal={costBreakdown.meshTotal}
                subtotal={costBreakdown.subtotal}
                gstAmount={costBreakdown.gstAmount}
                totalWithGst={costBreakdown.totalWithGst}
              />
            </div>
          </div>

          {/* Configured Quotation Items Table */}
          <QuotationTable
            items={items}
            customer={customer}
            onEditItem={handleEditItem}
            onDuplicateItem={handleDuplicateItem}
            onDeleteItem={handleDeleteItem}
            onOpenCutList={() => setIsCutListOpen(true)}
            onOpenPrintPreview={() => setIsPrintQuoteOpen(true)}
          />

          {/* Step Navigation Bar between Step 2 and Step 3 */}
          <div className="flex items-center justify-between gap-4 py-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Step 1: Customer Details</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span>Proceed to Step 3: Review &amp; Finalize</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Fixed Quotation Summary & Action Card at the end of Quotation Table (like Invoice) */}
          <SummaryBar
            items={items}
            customerName={customer.name}
            validUntilDate={currentValidUntil}
            onSaveQuotation={() => onSaveQuotation && onSaveQuotation('draft', currentQuoteDate, currentValidUntil)}
            onSavePdf={() => setIsPrintQuoteOpen(true)}
            onSendWhatsApp={onSendWhatsApp}
            onFinalizeInvoice={onFinalizeInvoice}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW, GST, DELIVERY MILESTONES & FINALIZATION                    */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="max-w-[1520px] w-full mx-auto p-6 flex flex-col gap-6">
          {/* Step 3 Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-300">
                  {quoteNumber}
                </span>
                <h2 className="text-xl font-bold text-slate-900">Step 3: Review, GST &amp; Quotation Finalization</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verify customer scope, itemized configurations, 18% GST tax summary, and proceed to save, print or share.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio</span>
            </button>
          </div>

          {/* Two-Column Review Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Itemized Summary & Terms */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Customer Verification Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Client Details</span>
                  <div className="text-base font-bold text-slate-900">{customer.name}</div>
                  {customer.companyName && (
                    <div className="text-xs text-slate-600 font-medium">{customer.companyName}</div>
                  )}
                  <div className="text-xs text-slate-500 font-mono">{customer.mobile} • {customer.city}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change Client</span>
                </button>
              </div>

              {/* Configured Items Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Configured Products ({items.length} Items)</h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                  >
                    + Add / Edit Items
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
                        <div>
                          <div className="font-bold text-slate-800">{item.productName}</div>
                          <div className="text-[11px] text-slate-500">
                            {item.locationTag} • {item.widthInches}&quot;W × {item.heightInches}&quot;H ({item.areaPerUnitSqFt} sq.ft × {item.quantity} Qty)
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-right">
                        {formatINR(item.itemTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Full Financial Ledger */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-3.5">
                <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
                  Comprehensive Financial Summary
                </h3>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Units &amp; Area</span>
                  <span className="font-mono font-bold text-slate-800">{totalUnits} Units • {totalArea.toFixed(1)} Sq.Ft</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Material Fabrication Base</span>
                  <span className="font-mono font-semibold text-slate-800">{formatINR(materialBaseTotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Site Fitting &amp; Weather Seal</span>
                  <span className="font-mono font-semibold text-slate-800">{formatINR(siteFittingTotal)}</span>
                </div>

                <div className="h-px bg-slate-100 my-1" />

                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Taxable Subtotal</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>CGST (9%)</span>
                  <span className="font-mono">{formatINR(gstAmount / 2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>SGST (9%)</span>
                  <span className="font-mono">{formatINR(gstAmount / 2)}</span>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">Grand Total (Incl. 18% GST)</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Standard B2B / B2C Estimate</span>
                  </div>
                  <span className="font-mono text-xl font-extrabold text-emerald-700">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Quotation Summary & Action Card at the end of Quotation Table (like Invoice) */}
          <SummaryBar
            items={items}
            customerName={customer.name}
            validUntilDate={currentValidUntil}
            onSaveQuotation={() => onSaveQuotation && onSaveQuotation('draft', currentQuoteDate, currentValidUntil)}
            onSavePdf={() => setIsPrintQuoteOpen(true)}
            onSendWhatsApp={onSendWhatsApp}
            onFinalizeInvoice={onFinalizeInvoice}
          />
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={allCustomers}
        selectedCustomerId={customer.id}
        onSelectCustomer={onUpdateCustomer}
        onAddNewCustomer={onAddNewCustomer}
      />

      <CutListModal
        isOpen={isCutListOpen}
        onClose={() => setIsCutListOpen(false)}
        items={items}
        quoteNumber={quoteNumber}
      />

      <PrintQuoteModal
        isOpen={isPrintQuoteOpen}
        onClose={() => setIsPrintQuoteOpen(false)}
        quoteNumber={quoteNumber}
        date={currentQuoteDate}
        validUntil={currentValidUntil}
        customer={customer}
        items={items}
        profile={profile}
      />
    </div>
  );
};
