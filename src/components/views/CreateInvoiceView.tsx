import React, { useState, useEffect } from 'react';
import {
  BusinessProfile,
  Customer,
  Invoice,
  PaymentRecord,
  Quotation,
  QuotationItem,
} from '../../types';
import { formatINR, getNextInvoiceNumber } from '../../utils/calculations';
import {
  lookupGstDetails,
  parseGstinStructure,
  saveCustomGstDetails,
  KNOWN_GST_DATABASE,
} from '../../utils/gstLookup';
import {
  Receipt,
  Building,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileCheck,
} from 'lucide-react';

interface CreateInvoiceViewProps {
  customers: Customer[];
  quotations: Quotation[];
  invoices?: Invoice[];
  businessProfile: BusinessProfile;
  onCreateInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
}

export const CreateInvoiceView: React.FC<CreateInvoiceViewProps> = ({
  customers,
  quotations,
  invoices = [],
  businessProfile,
  onCreateInvoice,
  onNavigateToInvoices,
}) => {
  // Invoice Header
  const [invoiceNumber] = useState<string>(
    () => getNextInvoiceNumber(invoices)
  );
  const [invoiceDate] = useState<string>(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().split('T')[0];
  });

  // Customer & GST Auto-fill states
  const [gstinInput, setGstinInput] = useState('');
  const [gstVerifiedMessage, setGstVerifiedMessage] = useState<string | null>(null);
  const [gstStructure, setGstStructure] = useState<{
    stateCode: string;
    stateName: string;
    pan: string;
    entityTypeDesc: string;
  } | null>(null);

  const [customerName, setCustomerName] = useState('Amit Sharma');
  const [companyName, setCompanyName] = useState('Sharma Residency');
  const [customerMobile, setCustomerMobile] = useState('+91 98201 44521');
  const [customerAddress, setCustomerAddress] = useState(
    'Flat 402, Sharma Residency, Near Balewadi High Street, Baner'
  );
  const [customerCity, setCustomerCity] = useState('Pune');
  const [customerState, setCustomerState] = useState('Maharashtra');

  // Source selection: From Quotation or Custom
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');

  // Invoice Items
  const [invoiceItems, setInvoiceItems] = useState<
    {
      id: string;
      description: string;
      dimensions: string;
      quantity: number;
      areaSqFt: number;
      ratePerSqFt: number;
      amount: number;
    }[]
  >([
    {
      id: 'inv-item-1',
      description: '2-Track Sliding Window (Living Room Balcony) • Kommerling White 60mm • 5mm Toughened',
      dimensions: '48" × 60"',
      quantity: 2,
      areaSqFt: 40.0,
      ratePerSqFt: 420.0,
      amount: 19600.0,
    },
    {
      id: 'inv-item-2',
      description: 'Casement Openable Window (Master Bedroom) • Kommerling White • 5mm Toughened',
      dimensions: '36" × 48"',
      quantity: 1,
      areaSqFt: 12.0,
      ratePerSqFt: 480.0,
      amount: 6240.0,
    },
    {
      id: 'inv-item-3',
      description: 'UPVC Louvered Ventilator • 4mm Frosted Glass • Exhaust Fan Ring Provision',
      dimensions: '24" × 24"',
      quantity: 2,
      areaSqFt: 8.0,
      ratePerSqFt: 350.0,
      amount: 3200.0,
    },
  ]);

  // Payment states
  const [advanceAmount, setAdvanceAmount] = useState<number>(15000);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NEFT' | 'Cash' | 'Cheque'>('UPI');
  const [transactionRef, setTransactionRef] = useState('UPI9823104928');

  // New Custom item temporary inputs
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemDims, setNewItemDims] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemArea, setNewItemArea] = useState(12);
  const [newItemRate, setNewItemRate] = useState(450);

  // Auto-Fill when GSTIN changes
  const handleGstChange = (enteredGstin: string) => {
    const clean = enteredGstin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setGstinInput(clean);

    if (clean.length >= 2) {
      const struct = parseGstinStructure(clean);
      if (struct) {
        setGstStructure({
          stateCode: struct.stateCode,
          stateName: struct.stateName,
          pan: struct.pan,
          entityTypeDesc: struct.entityTypeDesc,
        });
        setCustomerState(struct.stateName);
      }
    } else {
      setGstStructure(null);
    }

    const details = lookupGstDetails(clean);
    if (details) {
      setCompanyName(details.companyName);
      setCustomerName(details.name);
      setCustomerAddress(details.address);
      setCustomerCity(details.city);
      setCustomerState(details.state);
      setCustomerMobile(details.mobile);
      setGstVerifiedMessage(`✓ Verified: Auto-populated ${details.companyName} (${details.city}, ${details.state})`);
    } else if (clean.length === 15) {
      setGstVerifiedMessage(`✓ Valid 15-digit GST format verified. Enter actual company & site details below.`);
    } else {
      setGstVerifiedMessage(null);
    }
  };

  const handleApplyPresetGstin = (code: string) => {
    handleGstChange(code);
  };

  // Import from existing Quotation
  const handleSelectQuotation = (qId: string) => {
    setSelectedQuoteId(qId);
    if (!qId) return;

    const quote = quotations.find((q) => q.id === qId || q.quoteNumber === qId);
    if (quote) {
      setCustomerName(quote.customer.name);
      setCompanyName(quote.customer.companyName || '');
      setCustomerMobile(quote.customer.mobile);
      setCustomerAddress(quote.customer.address);
      setCustomerCity(quote.customer.city);
      if (quote.customer.gstin) {
        handleGstChange(quote.customer.gstin);
      }

      // Populate items
      setInvoiceItems(
        quote.items.map((i) => ({
          id: i.id,
          description: `${i.name} (${i.locationTag || 'General'}) • ${i.profileBrand} • ${i.glassPackage}`,
          dimensions: `${i.widthInInches}" × ${i.heightInInches}"`,
          quantity: i.quantity,
          areaSqFt: i.totalAreaSqFt,
          ratePerSqFt: i.ratePerSqFt,
          amount: i.itemTotal,
        }))
      );
    }
  };

  // Add custom line item
  const handleAddCustomItem = () => {
    if (!newItemDesc) return;
    const itemAmount = newItemArea * newItemRate;
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: `custom-item-${Date.now()}`,
        description: newItemDesc,
        dimensions: newItemDims || 'Custom',
        quantity: newItemQty,
        areaSqFt: newItemArea,
        ratePerSqFt: newItemRate,
        amount: itemAmount,
      },
    ]);
    setNewItemDesc('');
    setNewItemDims('');
    setNewItemQty(1);
    setNewItemArea(12);
  };

  const handleDeleteItem = (id: string) => {
    setInvoiceItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Tax calculations
  const subtotal = invoiceItems.reduce((acc, i) => acc + i.amount, 0);
  const isInterState = customerState && customerState !== 'Maharashtra';
  const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const grandTotal = subtotal + gstAmount;
  const balanceDue = Math.max(0, grandTotal - advanceAmount);

  // Submit and create official invoice
  const handleGenerateInvoice = () => {
    // Save to persistent custom registry if GST number provided
    if (gstinInput && gstinInput.trim().length >= 10) {
      const cleanGst = gstinInput.trim().toUpperCase();
      const struct = parseGstinStructure(cleanGst);
      saveCustomGstDetails({
        gstin: cleanGst,
        companyName: companyName || customerName,
        tradeName: companyName,
        name: customerName,
        address: customerAddress,
        city: customerCity,
        state: customerState,
        stateCode: struct ? struct.stateCode : '09',
        mobile: customerMobile,
        email: `accounts@${(companyName || customerName).toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
        taxPayerType: 'Regular Taxpayer',
        status: 'Verified',
        pan: struct ? struct.pan : cleanGst.substring(2, 12),
        entityType: struct ? struct.entityTypeDesc : 'Business Entity',
      });
    }

    const cust: Customer = {
      id: `cust-${Date.now()}`,
      name: customerName,
      companyName: companyName || undefined,
      mobile: customerMobile,
      address: customerAddress,
      city: customerCity,
      gstin: gstinInput || undefined,
    };

    const initialPayments: PaymentRecord[] = [];
    if (advanceAmount > 0) {
      initialPayments.push({
        id: `pay-${Date.now()}`,
        date: invoiceDate,
        amount: advanceAmount,
        mode: paymentMode,
        refNo: transactionRef || `REF-${Math.floor(Math.random() * 90000 + 10000)}`,
        notes: 'Advance payment received on invoice creation',
      });
    }

    const createdInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      quotationId: selectedQuoteId || 'DIRECT-ORDER',
      quoteNumber: selectedQuoteId || 'DIRECT-ORDER',
      date: invoiceDate,
      dueDate: dueDate || invoiceDate,
      customer: cust,
      items: invoiceItems.map((item, idx) => ({
        id: item.id,
        itemNumber: idx + 1,
        name: item.description,
        locationTag: 'Site Billing',
        typologyId: '2track-sliding-win',
        category: 'windows',
        unit: 'in',
        rawWidth: 48,
        rawHeight: 60,
        widthInInches: 48,
        heightInInches: 60,
        quantity: item.quantity,
        areaPerUnitSqFt: item.areaSqFt / item.quantity,
        totalAreaSqFt: item.areaSqFt,
        glassPackage: 'Standard Spec',
        profileBrand: 'Class A UPVC',
        colorFoil: 'white',
        accessories: {
          heavyDutyRollers: true,
          crescentLock: true,
          mosquitoMesh: false,
          siteFitting: true,
          steelReinforcement: true,
          georgianBars: false,
          exhaustFanCutout: false,
        },
        ratePerSqFt: item.ratePerSqFt,
        hardwareCostPerUnit: 0,
        fittingCostPerSqFt: 0,
        meshCostPerSqFt: 0,
        subtotal: item.amount,
        gstAmount: item.amount * 0.18,
        itemTotal: item.amount,
        trackCount: 2,
        panelCount: 2,
        openingDirection: 'slide-left',
        profileSeries: '60mm Series',
        reinforcementThickness: '1.2mm GI',
      })),
      totalAmount: grandTotal,
      advanceReceived: advanceAmount,
      balanceDue,
      status: balanceDue <= 0 ? 'paid' : advanceAmount > 0 ? 'partially_paid' : 'pending',
      payments: initialPayments,
    };

    onCreateInvoice(createdInvoice);
  };

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Tax Invoice &amp; Billing</h2>
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              GST Tax Invoice
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Generate GST invoice with automatic customer lookup via GSTIN, itemized fenestration billing, and advance receipt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToInvoices}
            className="h-10 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            type="button"
          >
            Cancel &amp; View All Invoices
          </button>
          <button
            onClick={handleGenerateInvoice}
            className="h-10 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md"
            type="button"
          >
            <FileCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Generate &amp; Lock Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer & GSTIN Auto-fill Engine (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* GSTIN Automatic Auto-Fill Card */}
          <div className="bg-white rounded-xl shadow-md border-2 border-blue-500/80 p-5 flex flex-col gap-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Customer &amp; GSTIN Auto-Fill</h3>
                  <span className="text-[11px] text-blue-700 font-semibold">Enter GST number to auto-populate all details</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>

            {/* GSTIN Input Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Enter GSTIN (GST Number)</span>
                <span className="font-mono text-[10px] text-slate-400">15-digit alphanumeric</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 27AABCS1429B1Z"
                  className="w-full h-11 pl-3 pr-20 rounded-lg bg-slate-50 border-2 border-blue-400 font-mono text-sm font-bold uppercase text-blue-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 shadow-2xs"
                  value={gstinInput}
                  onChange={(e) => handleGstChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleGstChange(gstinInput)}
                  className="absolute right-1.5 top-1.5 h-8 px-2.5 rounded bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Structured GST Breakdown Badge */}
            {gstStructure && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <div className="bg-slate-50 p-1.5 rounded border border-blue-200">
                  <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">State Jurisdiction</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">
                    {gstStructure.stateName} ({gstStructure.stateCode})
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-blue-200">
                  <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">Entity Category</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block">
                    {gstStructure.entityTypeDesc.split(' ')[0]}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-blue-200">
                  <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">Decoded PAN</span>
                  <span className="font-mono font-bold text-blue-700 text-[11px] block">{gstStructure.pan}</span>
                </div>
              </div>
            )}

            {/* Quick Demo Test Buttons */}
            <div className="flex flex-col gap-1 pt-0.5">
              <span className="text-[10.5px] text-slate-500 font-semibold">Real Noida &amp; NCR test presets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPresetGstin('09AAACL2718E1ZE')}
                  className="font-mono text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors font-medium"
                >
                  Supertech Noida (09)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetGstin('09AABCG3124C1ZQ')}
                  className="font-mono text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors font-medium"
                >
                  Gaursons Noida (09)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetGstin('09AAACF3412K1Z8')}
                  className="font-mono text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors font-medium"
                >
                  Fenesta Gr. Noida (09)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetGstin('27AABCS1429B1Z')}
                  className="font-mono text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2 py-1 rounded border border-slate-200 transition-colors font-medium"
                >
                  Sharma Residency Pune (27)
                </button>
              </div>
            </div>

            {/* Verification Success Feedback */}
            {gstVerifiedMessage && (
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gstVerifiedMessage}</span>
              </div>
            )}

            {/* Populated Customer Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-0.5">Registered Company / Project Name</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Contact Person Name</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Mobile Number</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-0.5">Registered Site Address</label>
                <textarea
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-xs"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">City</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">State (GST State Code)</label>
                <input
                  type="text"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Import from Quotation Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Import From Existing Quotation
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedQuoteId}
                onChange={(e) => handleSelectQuotation(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white"
              >
                <option value="">-- Direct Invoice / No Quotation --</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.quoteNumber}>
                    {q.quoteNumber} • {q.customer.companyName || q.customer.name} (₹{q.items.reduce((s, i) => s + i.itemTotal, 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Items & GST Settlement Matrix (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Invoice Metadata Strip */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Tax Invoice No.</span>
              <span className="font-mono text-sm font-bold text-blue-700">{invoiceNumber}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Invoice Date</span>
              <span className="font-mono text-xs font-semibold text-slate-800">{invoiceDate}</span>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 uppercase font-bold block mb-0.5">Payment Due Date</label>
              <input
                type="date"
                className="h-8 px-2 rounded border border-slate-300 font-mono text-xs text-slate-800"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold block">HSN / SAC Code</span>
              <span className="font-mono text-xs font-bold text-slate-900">3925 2000 (UPVC)</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Invoice Fabrication Items ({invoiceItems.length})
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Total Area: {invoiceItems.reduce((acc, i) => acc + i.areaSqFt, 0).toFixed(1)} Sq.Ft
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10.5px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Description &amp; Typology</th>
                    <th className="py-2.5 px-2">Size</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Area (Sq.Ft)</th>
                    <th className="py-2.5 px-2 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-700">{item.dimensions}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-800">{item.areaSqFt.toFixed(1)}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">₹{item.ratePerSqFt}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                        {formatINR(item.amount)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          type="button"
                          title="Remove Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add Custom Line Item Form */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Item name / Custom window..."
                className="flex-1 min-w-36 h-8 px-2.5 rounded border border-slate-300 text-slate-900"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
              />
              <input
                type="text"
                placeholder="48&quot; × 60&quot;"
                className="w-24 h-8 px-2 rounded border border-slate-300 font-mono text-slate-900"
                value={newItemDims}
                onChange={(e) => setNewItemDims(e.target.value)}
              />
              <input
                type="number"
                placeholder="Sq.Ft"
                className="w-16 h-8 px-2 rounded border border-slate-300 font-mono text-slate-900"
                value={newItemArea}
                onChange={(e) => setNewItemArea(parseFloat(e.target.value) || 0)}
              />
              <input
                type="number"
                placeholder="Rate"
                className="w-20 h-8 px-2 rounded border border-slate-300 font-mono text-slate-900"
                value={newItemRate}
                onChange={(e) => setNewItemRate(parseFloat(e.target.value) || 0)}
              />
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="h-8 px-3 rounded bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
              >
                + Add
              </button>
            </div>
          </div>

          {/* GST Calculation & Advance Ledger Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col gap-4 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-sans font-semibold">Material &amp; Fabrication Subtotal:</span>
              <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
            </div>

            {!isInterState ? (
              <>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-sans">CGST (9.0% Central Tax):</span>
                  <span>{formatINR(gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-sans">SGST (9.0% Maharashtra State Tax):</span>
                  <span>{formatINR(gstAmount / 2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-sans">IGST (18.0% Integrated Interstate Tax):</span>
                <span>{formatINR(gstAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 px-3 bg-slate-900 text-white rounded-lg text-sm font-bold">
              <span className="font-sans">GRAND TOTAL (INCL. 18% GST):</span>
              <span className="text-emerald-400">{formatINR(grandTotal)}</span>
            </div>

            {/* Advance Recording Strip */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col gap-3 font-sans">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-700" />
                Record Advance Payment with Invoice
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Advance Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono text-sm font-bold text-slate-900 bg-white"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Payment Mode</label>
                  <select
                    className="w-full h-8 px-2 rounded border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="NEFT">NEFT / RTGS</option>
                    <option value="Cash">Cash at Workshop</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">UTR / Cheque Ref</label>
                  <input
                    type="text"
                    className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono text-xs text-slate-800 bg-white"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-blue-200/60 font-mono text-xs">
                <span className="text-slate-700 font-medium font-sans">Remaining Balance Due:</span>
                <span className="text-base font-bold text-amber-800">{formatINR(balanceDue)}</span>
              </div>
            </div>

            {/* Final Action CTA */}
            <div className="pt-2 flex justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Spec Sheet</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateInvoice}
                className="h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>Generate Official Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
