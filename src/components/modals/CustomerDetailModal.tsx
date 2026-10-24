import React, { useState, useEffect } from 'react';
import { Customer, Invoice, Quotation } from '../../types';
import { formatINR } from '../../utils/calculations';
import {
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  User,
  Truck,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  invoices: Invoice[];
  initialEditMode?: boolean;
  onUpdateCustomer: (updated: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onStartQuoteForCustomer: (customer: Customer) => void;
  onOpenQuote: (quote: Quotation) => void;
  onOpenInvoice: (invoice: Invoice) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  quotations,
  invoices,
  initialEditMode = false,
  onUpdateCustomer,
  onDeleteCustomer,
  onStartQuoteForCustomer,
  onOpenQuote,
  onOpenInvoice,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [activeTab, setActiveTab] = useState<'overview' | 'quotations' | 'invoices'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form states
  const [name, setName] = useState(customer.name);
  const [companyName, setCompanyName] = useState(customer.companyName || '');
  const [mobile, setMobile] = useState(customer.mobile);
  const [address, setAddress] = useState(customer.address);
  const [city, setCity] = useState(customer.city);
  const [gstin, setGstin] = useState(customer.gstin || '');
  const [email, setEmail] = useState(customer.email || '');
  const [shippingAddress, setShippingAddress] = useState(
    customer.shippingAddress || customer.address
  );
  const [shippingCity, setShippingCity] = useState(
    customer.shippingCity || customer.city
  );
  const [sameAsBilling, setSameAsBilling] = useState<boolean>(
    customer.sameAsBilling !== undefined
      ? customer.sameAsBilling
      : (!customer.shippingAddress || customer.shippingAddress === customer.address)
  );

  useEffect(() => {
    setName(customer.name);
    setCompanyName(customer.companyName || '');
    setMobile(customer.mobile);
    setAddress(customer.address);
    setCity(customer.city);
    setGstin(customer.gstin || '');
    setEmail(customer.email || '');
    setShippingAddress(customer.shippingAddress || customer.address);
    setShippingCity(customer.shippingCity || customer.city);
    setSameAsBilling(
      customer.sameAsBilling !== undefined
        ? customer.sameAsBilling
        : (!customer.shippingAddress || customer.shippingAddress === customer.address)
    );
  }, [customer]);

  if (!isOpen) return null;

  // Filter linked quotations and invoices
  const customerQuotes = quotations.filter(
    (q) => q.customer.id === customer.id || q.customer.mobile === customer.mobile
  );

  const customerInvoices = invoices.filter(
    (inv) => inv.customer.id === customer.id || inv.customer.mobile === customer.mobile
  );

  // Financial statistics
  const totalQuotedValue = customerQuotes.reduce((acc, q) => {
    const sub = q.items.reduce((s, i) => s + i.itemTotal, 0);
    return acc + sub * 1.18;
  }, 0);

  const totalInvoicedValue = customerInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalAdvanceReceived = customerInvoices.reduce((acc, inv) => acc + inv.advanceReceived, 0);
  const totalBalanceDue = customerInvoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  const cleanPhone = customer.mobile.replace(/[^0-9]/g, '');
  const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}` : `https://wa.me/`;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    onUpdateCustomer({
      ...customer,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      mobile: mobile.trim(),
      address: address.trim() || 'Site Address',
      city: city.trim() || 'Pune',
      gstin: gstin.trim() || undefined,
      email: email.trim() || undefined,
      shippingAddress: sameAsBilling ? address.trim() : (shippingAddress.trim() || address.trim()),
      shippingCity: sameAsBilling ? city.trim() : (shippingCity.trim() || city.trim()),
      sameAsBilling,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteCustomer(customer.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md">
              {getInitials(customer.name)}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold truncate">
                  {customer.companyName || customer.name}
                </h3>
                {customer.gstin ? (
                  <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-400/30">
                    GST REGISTERED
                  </span>
                ) : (
                  <span className="font-mono text-[10px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded font-bold">
                    UNREGISTERED
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200 font-medium truncate">
                {customer.companyName && `Contact: ${customer.name} • `}
                Customer ID: <span className="font-mono">{customer.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                type="button"
                title="Edit Customer Info"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Edit Form Mode */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="bg-blue-50/50 rounded-xl p-5 border border-blue-200 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-700" />
                  <h4 className="text-sm font-bold text-blue-900">Edit Customer Information</h4>
                </div>
                <span className="text-xs text-slate-500 font-mono">* Required fields</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Company / Project / Society</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Builders"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">City / Region</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AABCS1429B1Z"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs">Billing Address</label>
                  <input
                    type="text"
                    placeholder="Registered Billing Address"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAddress(val);
                      if (sameAsBilling) setShippingAddress(val);
                    }}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs">Billing City</label>
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={city}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCity(val);
                      if (sameAsBilling) setShippingCity(val);
                    }}
                  />
                </div>
              </div>

              {/* Shipping Address Option */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Shipping / Site Address</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200 select-none">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsBilling(checked);
                        if (checked) {
                          setShippingAddress(address);
                          setShippingCity(city);
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Same as billing address</span>
                  </label>
                </div>

                {!sameAsBilling ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                    <div>
                      <input
                        type="text"
                        placeholder="Site Delivery Address"
                        className="w-full h-8 px-2.5 rounded-lg border border-blue-300 bg-blue-50/20 text-xs text-slate-900"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Shipping City"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-600 text-[11px]">
                    Delivery: <strong className="text-slate-800">{address || 'Billing address'}, {city}</strong> (Same as billing)
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-200/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Quick Contact & Info Strip */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold">Phone</span>
                    <a
                      href={`tel:${customer.mobile}`}
                      className="font-mono font-bold text-slate-900 hover:text-blue-600 truncate"
                    >
                      {customer.mobile}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold">WhatsApp</span>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>Chat on WA</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold">Billing Location</span>
                    <span className="font-semibold text-slate-900 truncate" title={`${customer.address}, ${customer.city}`}>
                      {customer.city} • {customer.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold">GSTIN</span>
                    <span className="font-mono font-bold text-slate-900 truncate">
                      {customer.gstin || 'Unregistered'}
                    </span>
                  </div>
                </div>
              </div>

              {customer.shippingAddress && customer.shippingAddress !== customer.address && (
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">Site Delivery Address: </span>
                      <span className="text-slate-700">{customer.shippingAddress}, {customer.shippingCity || customer.city}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                    Separate Site
                  </span>
                </div>
              )}

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Quotations</span>
                  <span className="text-lg font-mono font-bold text-blue-700 mt-0.5">
                    {customerQuotes.length} Quotes
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {formatINR(totalQuotedValue)}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Invoiced</span>
                  <span className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                    {customerInvoices.length} Invoices
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {formatINR(totalInvoicedValue)}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                  <span className="text-[11px] text-emerald-800 font-semibold uppercase">Payments Collected</span>
                  <span className="text-lg font-mono font-bold text-emerald-700 mt-0.5">
                    {formatINR(totalAdvanceReceived)}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 mt-0.5">
                    Received to date
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
                  <span className="text-[11px] text-red-800 font-semibold uppercase">Outstanding Due</span>
                  <span className="text-lg font-mono font-bold text-red-600 mt-0.5">
                    {formatINR(totalBalanceDue)}
                  </span>
                  <span className="text-[11px] font-mono text-red-500 mt-0.5">
                    Pending balance
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  type="button"
                >
                  Overview &amp; Profile
                </button>
                <button
                  onClick={() => setActiveTab('quotations')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'quotations'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  type="button"
                >
                  <span>Quotations History</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    {customerQuotes.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'invoices'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  type="button"
                >
                  <span>Invoices &amp; Ledger</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    {customerInvoices.length}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Site Location Card */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-2">
                      <span className="text-xs font-bold text-slate-800">Primary Site Address</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {customer.address}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 font-mono">
                        <span>City: {customer.city}</span>
                        {customer.email && <span>Email: {customer.email}</span>}
                      </div>
                    </div>

                    {/* Quick Action Box */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-blue-900">Start New Project Estimate</span>
                        <p className="text-xs text-blue-700 mt-1">
                          Create a custom uPVC quotation pre-assigned to {customer.name}.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onStartQuoteForCustomer(customer);
                          onClose();
                        }}
                        className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs w-full sm:w-auto self-start"
                        type="button"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Quotation Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quotations' && (
                <div className="flex flex-col gap-3">
                  {customerQuotes.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No quotations recorded yet for this client account.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10.5px] border-b border-slate-200">
                            <th className="py-2.5 px-3">Quote #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3 text-center">Items</th>
                            <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {customerQuotes.map((q) => {
                            const sub = q.items.reduce((s, i) => s + i.itemTotal, 0);
                            const grand = sub * 1.18;
                            return (
                              <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{q.quoteNumber}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{q.date}</td>
                                <td className="py-2.5 px-3 text-center font-mono">{q.items.length}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {formatINR(grand)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-slate-100 text-slate-700">
                                    {q.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      onOpenQuote(q);
                                      onClose();
                                    }}
                                    className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors"
                                    type="button"
                                  >
                                    Open →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div className="flex flex-col gap-3">
                  {customerInvoices.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No invoices issued yet for this client account.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10.5px] border-b border-slate-200">
                            <th className="py-2.5 px-3">Invoice #</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3 text-right">Total (₹)</th>
                            <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                            <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {customerInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{inv.invoiceNumber}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{inv.date}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {formatINR(inv.totalAmount)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                                {formatINR(inv.advanceReceived)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                                {formatINR(inv.balanceDue)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-slate-100 text-slate-700">
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => {
                                    onOpenInvoice(inv);
                                    onClose();
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors"
                                  type="button"
                                >
                                  Open →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Delete Confirmation Alert Modal Overlay */}
          {showDeleteConfirm && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Confirm Permanent Deletion of Customer Account</span>
              </div>
              <p className="text-xs text-red-700">
                Are you sure you want to delete <strong>{customer.name}</strong> ({customer.companyName || 'Individual'})?
                {customerQuotes.length > 0 && ` There are ${customerQuotes.length} quotations attached to this client.`}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
                  type="button"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Customer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onStartQuoteForCustomer(customer);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>New Quotation for Customer</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
