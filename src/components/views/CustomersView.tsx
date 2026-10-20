import React, { useState, useEffect } from 'react';
import { Customer, Invoice, Quotation } from '../../types';
import { CustomerDetailModal } from '../modals/CustomerDetailModal';
import { formatINR } from '../../utils/calculations';
import {
  Search,
  UserPlus,
  Phone,
  MapPin,
  Building,
  Mail,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  FileText,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  searchQuery?: string;
  quotations?: Quotation[];
  invoices?: Invoice[];
  onAddNewCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onSelectCustomerForQuote: (customer: Customer) => void;
  onOpenQuote?: (quote: Quotation) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  searchQuery,
  quotations = [],
  invoices = [],
  onAddNewCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onSelectCustomerForQuote,
  onOpenQuote,
  onOpenInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [isAdding, setIsAdding] = useState(false);

  // Modals state
  const [modalCustomer, setModalCustomer] = useState<Customer | null>(null);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // Quick Add Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [gstin, setGstin] = useState('');
  const [email, setEmail] = useState('');

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.companyName && c.companyName.toLowerCase().includes(term)) ||
      c.mobile.includes(term) ||
      c.city.toLowerCase().includes(term) ||
      (c.gstin && c.gstin.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    onAddNewCustomer({
      id: `cust-${Date.now()}`,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      mobile: mobile.trim(),
      address: address.trim() || 'Site Address',
      city: city.trim() || 'Pune',
      gstin: gstin.trim() || undefined,
      email: email.trim() || undefined,
    });

    setName('');
    setCompanyName('');
    setMobile('');
    setAddress('');
    setGstin('');
    setEmail('');
    setIsAdding(false);
  };

  const handleOpenDetailModal = (customer: Customer, editMode: boolean = false) => {
    setModalCustomer(customer);
    setModalEditMode(editMode);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete && onDeleteCustomer) {
      onDeleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="max-w-[1520px] mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Accounts &amp; Sites</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage builders, architects, homeowners, full contact records, and quotation/invoice histories
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="h-10 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
          type="button"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? 'Close Form' : '+ New Customer'}</span>
        </button>
      </div>

      {/* Quick Add Form Drawer */}
      {isAdding && (
        <form onSubmit={handleSaveNew} className="bg-white rounded-xl p-5 border border-blue-200 shadow-md flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-blue-900">Add New Customer or Project Account</h3>
            <span className="text-xs text-slate-500 font-mono">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amit Sharma"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Company / Project / Society</label>
              <input
                type="text"
                placeholder="e.g. Sharma Residency"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98201 44521"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                placeholder="Pune"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Optional GSTIN</label>
              <input
                type="text"
                maxLength={15}
                placeholder="27AABCS1429B1Z"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">Email</label>
              <input
                type="email"
                placeholder="client@gmail.com"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1 text-xs">Installation / Site Address</label>
            <input
              type="text"
              placeholder="Full site location with building & street details"
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      )}

      {/* Search Bar & Counter */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, company, mobile, GSTIN or city..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="text-xs text-slate-500 font-mono font-semibold shrink-0">
          {filtered.length} Customer Accounts
        </span>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const quotesCount = quotations.filter(
            (q) => q.customer.id === customer.id || q.customer.mobile === customer.mobile
          ).length;

          const linkedInvoices = invoices.filter(
            (inv) => inv.customer.id === customer.id || inv.customer.mobile === customer.mobile
          );
          const balanceDue = linkedInvoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

          return (
            <div
              key={customer.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {customer.companyName || customer.name}
                    </h4>
                    {customer.companyName && (
                      <p className="text-xs text-slate-600 font-medium truncate">Contact: {customer.name}</p>
                    )}
                  </div>
                  {customer.gstin ? (
                    <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200 shrink-0">
                      GST REGISTERED
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold shrink-0">
                      UNREGISTERED
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono font-medium">{customer.mobile}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{customer.address}, {customer.city}</span>
                  </div>
                  {customer.gstin && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>GSTIN: {customer.gstin}</span>
                    </div>
                  )}
                </div>

                {/* Activity & Financial Status Pills */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                      {quotesCount} Quotes
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                      {linkedInvoices.length} Invoices
                    </span>
                  </div>
                  {balanceDue > 0 && (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Due: {formatINR(balanceDue)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {/* View Details / Profile */}
                  <button
                    onClick={() => handleOpenDetailModal(customer, false)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="View Profile & Financial History"
                    type="button"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit Customer */}
                  <button
                    onClick={() => handleOpenDetailModal(customer, true)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Customer Information"
                    type="button"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Customer */}
                  {onDeleteCustomer && (
                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Customer Account"
                      type="button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Create Quotation CTA */}
                <button
                  onClick={() => onSelectCustomerForQuote(customer)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  type="button"
                >
                  <span>New Quote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Profile / Edit Modal */}
      {modalCustomer && (
        <CustomerDetailModal
          customer={modalCustomer}
          isOpen={Boolean(modalCustomer)}
          onClose={() => setModalCustomer(null)}
          quotations={quotations}
          invoices={invoices}
          initialEditMode={modalEditMode}
          onUpdateCustomer={(updated) => {
            if (onUpdateCustomer) onUpdateCustomer(updated);
            setModalCustomer(updated);
          }}
          onDeleteCustomer={(id) => {
            if (onDeleteCustomer) onDeleteCustomer(id);
            setModalCustomer(null);
          }}
          onStartQuoteForCustomer={(cust) => {
            onSelectCustomerForQuote(cust);
            setModalCustomer(null);
          }}
          onOpenQuote={(q) => {
            if (onOpenQuote) onOpenQuote(q);
          }}
          onOpenInvoice={(inv) => {
            if (onOpenInvoice) onOpenInvoice(inv);
          }}
        />
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Customer Account?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong>{customerToDelete.name}</strong>
                {customerToDelete.companyName && ` (${customerToDelete.companyName})`}?
                This customer account will be permanently removed from your records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
                type="button"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
