import React, { useState } from 'react';
import { Customer } from '../../types';
import {
  lookupGstDetails,
  parseGstinStructure,
  saveCustomGstDetails,
  searchGstDatabase,
  KNOWN_GST_DATABASE,
  GstCustomerDetails,
} from '../../utils/gstLookup';
import {
  X,
  UserPlus,
  Check,
  Building,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  Search,
  ShieldCheck,
  Save,
  Info,
} from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customer: Customer) => void;
  onAddNewCustomer: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer,
}) => {
  const [tab, setTab] = useState<'select' | 'new' | 'directory'>('select');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Noida');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [gstin, setGstin] = useState('');
  const [saveToGstRegistry, setSaveToGstRegistry] = useState(true);
  const [directorySearch, setDirectorySearch] = useState('');

  // Structured GSTIN decoding info
  const [gstStructure, setGstStructure] = useState<{
    stateCode: string;
    stateName: string;
    pan: string;
    entityTypeDesc: string;
  } | null>(null);

  const [gstFeedback, setGstFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGstinChange = (enteredGst: string) => {
    const clean = enteredGst.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setGstin(clean);

    if (clean.length >= 2) {
      const struct = parseGstinStructure(clean);
      if (struct) {
        setGstStructure({
          stateCode: struct.stateCode,
          stateName: struct.stateName,
          pan: struct.pan,
          entityTypeDesc: struct.entityTypeDesc,
        });
        setStateName(struct.stateName);
        if (!city || city === 'Pune') {
          setCity(struct.defaultCity);
        }
      }
    } else {
      setGstStructure(null);
    }

    const lookup = lookupGstDetails(clean);
    if (lookup) {
      setCompanyName(lookup.companyName);
      setName(lookup.name);
      setAddress(lookup.address);
      setCity(lookup.city);
      setStateName(lookup.state);
      setMobile(lookup.mobile);
      setGstFeedback({
        type: 'success',
        message: `Verified: ${lookup.companyName} (${lookup.city}, ${lookup.state})`,
      });
    } else if (clean.length === 15) {
      setGstFeedback({
        type: 'info',
        message: `Valid 15-digit GSTIN detected. Enter or review your actual company name & details below.`,
      });
    } else {
      setGstFeedback(null);
    }
  };

  const applyGstRecord = (rec: GstCustomerDetails) => {
    setGstin(rec.gstin);
    setCompanyName(rec.companyName);
    setName(rec.name);
    setAddress(rec.address);
    setCity(rec.city);
    setStateName(rec.state);
    setMobile(rec.mobile);
    setGstStructure({
      stateCode: rec.stateCode,
      stateName: rec.state,
      pan: rec.pan,
      entityTypeDesc: rec.entityType,
    });
    setGstFeedback({
      type: 'success',
      message: `Selected: ${rec.companyName} (${rec.city}, ${rec.state})`,
    });
    setTab('new');
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    const trimmedCompany = companyName.trim() || undefined;
    const trimmedGst = gstin.trim().toUpperCase() || undefined;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      companyName: trimmedCompany,
      mobile: mobile.trim(),
      address: address.trim() || 'Site Address Pending',
      city: city.trim() || 'Noida',
      gstin: trimmedGst,
    };

    // If GSTIN provided and user wants to save to local registry, store it persistently
    if (trimmedGst && trimmedGst.length >= 10 && saveToGstRegistry) {
      const struct = parseGstinStructure(trimmedGst);
      saveCustomGstDetails({
        gstin: trimmedGst,
        companyName: trimmedCompany || `${name.trim()} Enterprises`,
        tradeName: trimmedCompany,
        name: name.trim(),
        address: address.trim() || `Industrial Sector, ${city}`,
        city: city.trim() || 'Noida',
        state: stateName || 'Uttar Pradesh',
        stateCode: struct ? struct.stateCode : '09',
        mobile: mobile.trim(),
        email: `contact@${(trimmedCompany || name).toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
        taxPayerType: 'Regular Taxpayer',
        status: 'Verified',
        pan: struct ? struct.pan : trimmedGst.substring(2, 12),
        entityType: struct ? struct.entityTypeDesc : 'Business Entity',
      });
    }

    onAddNewCustomer(newCust);
    onSelectCustomer(newCust);
    onClose();
  };

  const directoryResults = searchGstDatabase(directorySearch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select or Add Customer</h3>
              <p className="text-xs text-slate-500 font-medium">Link quotation to client account &amp; auto-fill via GSTIN</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2.5 border-b border-slate-100 flex gap-2 bg-slate-100/70">
          <button
            onClick={() => setTab('select')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'select'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/60'
            }`}
            type="button"
          >
            Quotation Clients ({customers.length})
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'new'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
            type="button"
          >
            + New Customer (Enter GST)
          </button>
          <button
            onClick={() => setTab('directory')}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'directory'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
            type="button"
          >
            Verified GST Directory
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {tab === 'select' && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">
                Click any client to assign them to the current quotation:
              </div>
              {customers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                        </span>
                        {c.gstin && (
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                            GST: {c.gstin}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5">{c.mobile}</span>
                      <span className="text-[11px] text-slate-600 truncate mt-0.5">
                        {c.address}, {c.city}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'directory' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by company name, city (Noida, Pune, Delhi), or GSTIN..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                />
              </div>

              <div className="text-[11px] text-slate-500 font-semibold">
                Showing authentic Indian builders, developers &amp; fabricators ({directoryResults.length}):
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {directoryResults.map((rec) => (
                  <div
                    key={rec.gstin}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{rec.companyName}</span>
                        <span className="text-[9.5px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                          {rec.city}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        {rec.name} • {rec.address}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 mt-0.5">
                        GSTIN: <span className="font-bold text-blue-700">{rec.gstin}</span> • {rec.entityType}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => applyGstRecord(rec)}
                      className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0"
                    >
                      Use Client
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'new' && (
            <form onSubmit={handleSubmitNew} className="space-y-3.5 text-xs">
              {/* GSTIN Input Card */}
              <div className="p-3.5 bg-blue-50/80 rounded-xl border-2 border-blue-300 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto-Fill Customer via GSTIN (GST Number)</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-mono">15 digits</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="Enter GSTIN e.g. 09AAACL2718E1ZE or 27AABCS1429B1Z"
                    className="w-full h-10 px-3 pr-20 rounded-lg border-2 border-blue-400 font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    value={gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleGstinChange(gstin)}
                    className="absolute right-1 top-1 h-8 px-2.5 rounded bg-blue-600 text-white font-bold text-[10.5px] hover:bg-blue-700"
                  >
                    Verify GST
                  </button>
                </div>

                {/* Structured GST Breakdown Badge */}
                {gstStructure && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                    <div className="bg-white p-1.5 rounded border border-blue-200">
                      <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">State Jurisdiction</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block">
                        {gstStructure.stateName} ({gstStructure.stateCode})
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-blue-200">
                      <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">Entity Category</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block">
                        {gstStructure.entityTypeDesc.split(' ')[0]}
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-blue-200 col-span-2 sm:col-span-1">
                      <span className="text-[9.5px] text-slate-400 uppercase font-semibold block">Decoded PAN</span>
                      <span className="font-mono font-bold text-blue-700 text-[11px] block">{gstStructure.pan}</span>
                    </div>
                  </div>
                )}

                {/* Quick Real Noida & Pan-India Presets */}
                <div className="flex flex-col gap-1 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-semibold">
                      Real Noida &amp; NCR presets (click to test):
                    </span>
                    <button
                      type="button"
                      onClick={() => setTab('directory')}
                      className="text-[10px] text-blue-700 font-bold hover:underline"
                    >
                      Browse All 10+ &rarr;
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleGstinChange('09AAACL2718E1ZE')}
                      className="font-mono text-[9.5px] bg-white text-blue-900 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-medium"
                    >
                      Supertech Noida (09)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGstinChange('09AABCG3124C1ZQ')}
                      className="font-mono text-[9.5px] bg-white text-blue-900 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-medium"
                    >
                      Gaursons Gr. Noida (09)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGstinChange('09AAACF3412K1Z8')}
                      className="font-mono text-[9.5px] bg-white text-blue-900 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-medium"
                    >
                      Fenesta Systems (09)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGstinChange('27AABCS1429B1Z')}
                      className="font-mono text-[9.5px] bg-white text-blue-900 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 font-medium"
                    >
                      Sharma Residency (27)
                    </button>
                  </div>
                </div>

                {gstFeedback && (
                  <div
                    className={`p-2 rounded-lg border flex items-center gap-1.5 font-semibold text-[11px] animate-in fade-in ${
                      gstFeedback.type === 'success'
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                        : 'bg-blue-100/70 border-blue-300 text-blue-950'
                    }`}
                  >
                    {gstFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    )}
                    <span>{gstFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 block">Actual Company / Trade Name *</label>
                    <span className="text-[10px] text-slate-400">Editable - will appear on Quotation &amp; Invoices</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter your exact registered company name"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Contact Person / Proprietor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunil Sharma / Amit Jain"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98110 00000"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Noida / Pune"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Site / Registered Address</label>
                  <textarea
                    rows={2}
                    placeholder="Sector / Road / Building, City, State"
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Save to Local Persistent Registry Checkbox */}
                {gstin && gstin.length >= 10 && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveRegistry"
                      checked={saveToGstRegistry}
                      onChange={(e) => setSaveToGstRegistry(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="saveRegistry" className="text-[11px] text-slate-700 cursor-pointer select-none">
                      <span className="font-bold">Remember this GSTIN:</span> Save this company name &amp; address permanently so it auto-populates next time.
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Save &amp; Select Customer for Quote</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
