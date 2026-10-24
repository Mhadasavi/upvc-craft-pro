import React, { useState, useEffect } from 'react';
import {
  BusinessProfile,
  ExtraCharge,
  Invoice,
  InvoicePrintTemplate,
  PaymentRecord,
  PrintOptions,
  QuotationItem,
} from '../../types';
import {
  formatINR,
  generateInvoiceWhatsAppMessage,
  dateStringToIso,
  isoToDisplayDate,
} from '../../utils/calculations';
import { lookupGstDetails, parseGstinStructure } from '../../utils/gstLookup';
import {
  printDocument,
  downloadPrintableHtml,
  generateInvoicePrintHtml,
} from '../../utils/printDocument';
import {
  X,
  Printer,
  Download,
  MessageSquare,
  Edit2,
  Trash2,
  Plus,
  CreditCard,
  Check,
  Building,
  Phone,
  Calendar,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  RotateCcw,
  Copy,
  FileSpreadsheet,
  Crown,
  Truck,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  businessProfile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateInvoice: (updated: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onAddPayment: (invoiceId: string, payment: PaymentRecord) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  initialEditMode?: boolean;
}

const INVOICE_TEMPLATES: {
  id: InvoicePrintTemplate;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: 'standard',
    label: 'Standard GST',
    icon: <FileCheck className="w-3.5 h-3.5" />,
    desc: 'Official GST statutory invoice layout',
  },
  {
    id: 'compact',
    label: 'Executive B2B',
    icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
    desc: 'High-density commercial invoice',
  },
  {
    id: 'premium',
    label: 'Luxury Tax Bill',
    icon: <Crown className="w-3.5 h-3.5 text-amber-500" />,
    desc: 'Navy & Gold branded bill with warranty seal',
  },
];

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  businessProfile,
  isOpen,
  onClose,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddPayment,
  onDeletePayment,
  onDuplicateInvoice,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form states
  const [editDate, setEditDate] = useState(invoice.date);
  const [editDueDate, setEditDueDate] = useState(invoice.dueDate);
  const [editStatus, setEditStatus] = useState(invoice.status);
  const [editNotes, setEditNotes] = useState(invoice.notes || '');

  // Customer edit states
  const [custName, setCustName] = useState(invoice.customer.name);
  const [custCompany, setCustCompany] = useState(invoice.customer.companyName || '');
  const [custMobile, setCustMobile] = useState(invoice.customer.mobile);
  const [custAddress, setCustAddress] = useState(invoice.customer.address);
  const [custCity, setCustCity] = useState(invoice.customer.city);
  const [custGstin, setCustGstin] = useState(invoice.customer.gstin || '');

  // Shipping edit states
  const [custShippingAddress, setCustShippingAddress] = useState(
    invoice.customer.shippingAddress || invoice.customer.address
  );
  const [custShippingCity, setCustShippingCity] = useState(
    invoice.customer.shippingCity || invoice.customer.city
  );
  const [sameAsBilling, setSameAsBilling] = useState<boolean>(
    invoice.customer.sameAsBilling !== undefined
      ? invoice.customer.sameAsBilling
      : (!invoice.customer.shippingAddress || invoice.customer.shippingAddress === invoice.customer.address)
  );

  // Line items edit state
  const [editItems, setEditItems] = useState<QuotationItem[]>([...invoice.items]);

  // Transportation and Additional Charges edit state
  const [editExtraCharges, setEditExtraCharges] = useState<ExtraCharge[]>(
    () => (invoice.extraCharges ? [...invoice.extraCharges] : [])
  );
  const [customChargeLabel, setCustomChargeLabel] = useState('');
  const [customChargeAmount, setCustomChargeAmount] = useState<number>(0);
  const [showAddChargeForm, setShowAddChargeForm] = useState(false);

  // Reset form states when target invoice changes
  useEffect(() => {
    setEditDate(invoice.date);
    setEditDueDate(invoice.dueDate);
    setEditStatus(invoice.status);
    setEditNotes(invoice.notes || '');
    setCustName(invoice.customer.name);
    setCustCompany(invoice.customer.companyName || '');
    setCustMobile(invoice.customer.mobile);
    setCustAddress(invoice.customer.address);
    setCustCity(invoice.customer.city);
    setCustGstin(invoice.customer.gstin || '');
    setCustShippingAddress(invoice.customer.shippingAddress || invoice.customer.address);
    setCustShippingCity(invoice.customer.shippingCity || invoice.customer.city);
    setSameAsBilling(
      invoice.customer.sameAsBilling !== undefined
        ? invoice.customer.sameAsBilling
        : (!invoice.customer.shippingAddress || invoice.customer.shippingAddress === invoice.customer.address)
    );
    setEditItems([...invoice.items]);
    setEditExtraCharges(invoice.extraCharges ? [...invoice.extraCharges] : []);
    setIsEditing(initialEditMode);
  }, [invoice, initialEditMode]);

  // Transportation handlers
  const handleAddExtraCharge = (label: string, amount: number) => {
    if (!label.trim() || amount <= 0) return;
    const newCharge: ExtraCharge = {
      id: `charge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: label.trim(),
      amount: Math.round(amount),
    };
    setEditExtraCharges((prev) => [...prev, newCharge]);
    setCustomChargeLabel('');
    setCustomChargeAmount(0);
    setShowAddChargeForm(false);
  };

  const handleRemoveExtraCharge = (id: string) => {
    setEditExtraCharges((prev) => prev.filter((c) => c.id !== id));
  };

  if (!isOpen) return null;

  // Real-time calculations for edited state
  const currentItems = isEditing ? editItems : invoice.items;
  const currentItemsSubtotal = currentItems.reduce((acc, i) => acc + i.itemTotal, 0);
  const currentExtraCharges = isEditing ? editExtraCharges : (invoice.extraCharges || []);
  const currentExtraChargesTotal = currentExtraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const currentSubtotal = currentItemsSubtotal + currentExtraChargesTotal;
  const currentGst = Math.round(currentSubtotal * 0.18 * 100) / 100;
  const currentGrandTotal = currentSubtotal + currentGst;
  const currentReceived = invoice.advanceReceived;
  const currentBalanceDue = Math.max(0, currentGrandTotal - currentReceived);

  // Determine Inter-State or Intra-State GST
  const buyerState = custCity.toLowerCase().includes('noida') || (custGstin && custGstin.startsWith('09'))
    ? 'Uttar Pradesh (09)'
    : custCity.toLowerCase().includes('delhi') || (custGstin && custGstin.startsWith('07'))
    ? 'Delhi (07)'
    : 'Maharashtra (27)';

  const isIntraState = !custGstin || custGstin.startsWith('27');

  // Handle line item modifications in edit mode
  const handleUpdateItemField = (idx: number, field: keyof QuotationItem, val: any) => {
    setEditItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], [field]: val };

      if (field === 'quantity' || field === 'ratePerSqFt' || field === 'totalAreaSqFt') {
        const area = item.totalAreaSqFt || (item.areaPerUnitSqFt * item.quantity);
        item.itemTotal = Math.round(area * item.ratePerSqFt);
        item.subtotal = item.itemTotal;
        item.gstAmount = Math.round(item.itemTotal * 0.18);
      }
      copy[idx] = item;
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddNewCustomItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      itemNumber: editItems.length + 1,
      name: 'Custom UPVC Window / Door',
      locationTag: 'Additional Area',
      typologyId: '2track-sliding-win',
      category: 'windows',
      unit: 'in',
      rawWidth: 48,
      rawHeight: 60,
      widthInInches: 48,
      heightInInches: 60,
      quantity: 1,
      areaPerUnitSqFt: 20,
      totalAreaSqFt: 20,
      glassPackage: '5mm Toughened Clear',
      profileBrand: 'Kommerling White 60mm',
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
      ratePerSqFt: 420,
      hardwareCostPerUnit: 300,
      fittingCostPerSqFt: 40,
      meshCostPerSqFt: 0,
      subtotal: 8400,
      gstAmount: 1512,
      itemTotal: 8400,
      trackCount: 2,
      panelCount: 2,
      openingDirection: 'slide-left',
      profileSeries: '60mm Multi-Chamber',
      reinforcementThickness: '1.2mm GI',
    };
    setEditItems((prev) => [...prev, newItem]);
  };

  // Save changes
  const handleSaveInvoiceEdits = () => {
    const updated: Invoice = {
      ...invoice,
      date: editDate,
      dueDate: editDueDate,
      status: currentBalanceDue <= 0 ? 'paid' : currentReceived > 0 ? 'partially_paid' : editStatus,
      notes: editNotes.trim() || undefined,
      customer: {
        ...invoice.customer,
        name: custName.trim(),
        companyName: custCompany.trim() || undefined,
        mobile: custMobile.trim(),
        address: custAddress.trim(),
        city: custCity.trim(),
        gstin: custGstin.trim().toUpperCase() || undefined,
        shippingAddress: sameAsBilling ? custAddress.trim() : (custShippingAddress.trim() || custAddress.trim()),
        shippingCity: sameAsBilling ? custCity.trim() : (custShippingCity.trim() || custCity.trim()),
        sameAsBilling,
      },
      items: editItems,
      extraCharges: editExtraCharges.length > 0 ? editExtraCharges : undefined,
      totalAmount: currentGrandTotal,
      advanceReceived: currentReceived,
      balanceDue: currentBalanceDue,
    };

    onUpdateInvoice(updated);
    setIsEditing(false);
  };

  // Submit new payment
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: payAmount,
      mode: payMode,
      refNo: payRef.trim() || `REF-${Math.floor(Math.random() * 90000 + 10000)}`,
      notes: payNotes.trim() || 'Milestone payment received',
    };

    onAddPayment(invoice.id, newPayment);
    setIsRecordingPayment(false);
  };

  // WhatsApp share
  const handleSendWhatsApp = () => {
    const cleanPhone = invoice.customer.mobile.replace(/[^0-9]/g, '');
    const msg = generateInvoiceWhatsAppMessage(
      businessProfile.shopName,
      invoice.invoiceNumber,
      invoice.customer.companyName
        ? `${invoice.customer.companyName} (${invoice.customer.name})`
        : invoice.customer.name,
      invoice.totalAmount,
      invoice.advanceReceived,
      invoice.balanceDue,
      invoice.dueDate,
      businessProfile.upiId
    );
    const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const [selectedTemplate, setSelectedTemplate] = useState<InvoicePrintTemplate>('standard');
  const [showBankDetails, setShowBankDetails] = useState<boolean>(true);
  const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(true);

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const getPrintOpts = (): PrintOptions => ({
    template: selectedTemplate,
    showBankDetails,
    showPaymentHistory,
  });

  // Effective invoice incorporating live unsaved edits if in edit mode
  const getEffectiveInvoice = (): Invoice => {
    if (!isEditing) return invoice;
    return {
      ...invoice,
      date: editDate,
      dueDate: editDueDate,
      status: currentBalanceDue <= 0 ? 'paid' : currentReceived > 0 ? 'partially_paid' : editStatus,
      notes: editNotes.trim() || undefined,
      customer: {
        ...invoice.customer,
        name: custName.trim() || invoice.customer.name,
        companyName: custCompany.trim() || undefined,
        mobile: custMobile.trim() || invoice.customer.mobile,
        address: custAddress.trim() || invoice.customer.address,
        city: custCity.trim() || invoice.customer.city,
        gstin: custGstin.trim().toUpperCase() || undefined,
        shippingAddress: sameAsBilling ? custAddress.trim() : (custShippingAddress.trim() || custAddress.trim()),
        shippingCity: sameAsBilling ? custCity.trim() : (custShippingCity.trim() || custCity.trim()),
        sameAsBilling,
      },
      items: editItems,
      extraCharges: editExtraCharges.length > 0 ? editExtraCharges : undefined,
      totalAmount: currentGrandTotal,
      advanceReceived: currentReceived,
      balanceDue: currentBalanceDue,
    };
  };

  const handlePrint = () => {
    const targetInvoice = getEffectiveInvoice();
    const html = generateInvoicePrintHtml(targetInvoice, businessProfile, selectedTemplate, getPrintOpts());
    const res = printDocument(html, `${targetInvoice.invoiceNumber}-${selectedTemplate}.html`);
    if (res.fallbackDownloaded) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  const handleDownloadHtml = () => {
    const targetInvoice = getEffectiveInvoice();
    const html = generateInvoicePrintHtml(targetInvoice, businessProfile, selectedTemplate, getPrintOpts());
    downloadPrintableHtml(`${targetInvoice.invoiceNumber}-${selectedTemplate}.html`, html);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in printable-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh] printable-modal-container">
        {/* Top Control Header Bar */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white">{invoice.invoiceNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold uppercase ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : invoice.status === 'partially_paid'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {invoice.status.replace('_', ' ')}
                </span>
                {invoice.quoteNumber && (
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    Quote: {invoice.quoteNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">GST Tax Invoice &amp; Payment Ledger</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  type="button"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Invoice</span>
                </button>

                {invoice.balanceDue > 0 && (
                  <button
                    onClick={() => {
                      setPayAmount(invoice.balanceDue);
                      setIsRecordingPayment(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    type="button"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>+ Record Pay</span>
                  </button>
                )}

                <button
                  onClick={handleSendWhatsApp}
                  className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  type="button"
                  title="Send Invoice Summary via WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  type="button"
                  title="Download standalone printable HTML file (opens in browser & prints cleanly)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-300" />
                  <span>{downloadSuccess ? 'Downloaded!' : 'Download Doc'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  type="button"
                  title="Print Tax Invoice or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button
                  onClick={() => onDuplicateInvoice(invoice)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Duplicate Invoice"
                  type="button"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                  title="Delete Invoice"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-colors"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInvoiceEdits}
                  className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  type="button"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Changes</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Selector & Print Options Toolbar */}
        {!isEditing && (
          <div className="px-4 py-2 sm:px-6 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
            {/* Template Selector Pills */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
              {INVOICE_TEMPLATES.map((tmpl) => {
                const isActive = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                    type="button"
                    title={tmpl.desc}
                  >
                    {tmpl.icon}
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Print Options Toggles */}
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={showBankDetails}
                  onChange={(e) => setShowBankDetails(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Bank Details</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={showPaymentHistory}
                  onChange={(e) => setShowPaymentHistory(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Payment History</span>
              </label>
            </div>
          </div>
        )}

        {/* Delete Confirmation Alert Banner */}
        {showDeleteConfirm && (
          <div className="p-3 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-900 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Are you sure you want to permanently delete <strong>{invoice.invoiceNumber}</strong>? This cannot be undone.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                type="button"
              >
                No, Keep
              </button>
              <button
                onClick={() => {
                  onDeleteInvoice(invoice.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 shadow-xs"
                type="button"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Invoice Sheet Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {/* Official Tax Invoice Sheet Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col gap-6 printable-sheet">
            {/* Header: Seller Business Info & Invoice Meta */}
            <div className="flex flex-wrap items-start justify-between gap-6 pb-5 border-b border-slate-200">
              <div className="flex flex-col">
                {businessProfile.companyLogoUrl ? (
                  <img
                    src={businessProfile.companyLogoUrl}
                    alt={businessProfile.shopName}
                    className="max-h-12 max-w-40 object-contain mb-2 display-block"
                  />
                ) : null}
                <span className="font-bold text-lg text-slate-900 tracking-tight">{businessProfile.shopName}</span>
                <span className="text-xs text-blue-700 font-semibold">{businessProfile.tagline}</span>
                <span className="text-[11px] text-slate-600 mt-1">{businessProfile.address}, {businessProfile.city}, {businessProfile.state} - {businessProfile.pinCode}</span>
                <span className="text-[11px] font-mono text-slate-600">Mobile: {businessProfile.mobile} • Email: {businessProfile.email}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    GSTIN: {businessProfile.gstin}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end text-right">
                <span className="font-mono text-xs uppercase tracking-wider text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  ORIGINAL TAX INVOICE
                </span>
                <span className="font-mono text-lg font-bold text-slate-900 mt-2">{invoice.invoiceNumber}</span>

                {!isEditing ? (
                  <div className="flex flex-col text-right text-[11px] text-slate-600 font-mono mt-1 space-y-0.5">
                    <span>Invoice Date: <strong>{invoice.date}</strong></span>
                    <span>Due Date: <strong>{invoice.dueDate}</strong></span>
                    {invoice.quoteNumber && <span>Quote Ref: <strong>{invoice.quoteNumber}</strong></span>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2 text-left">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Invoice Date</label>
                      <input
                        type="date"
                        className="h-7 px-2 border border-slate-300 rounded font-mono text-[11px] w-32 bg-white"
                        value={dateStringToIso(editDate)}
                        onChange={(e) => setEditDate(isoToDisplayDate(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Due Date</label>
                      <input
                        type="date"
                        className="h-7 px-2 border border-slate-300 rounded font-mono text-[11px] w-32 bg-white"
                        value={dateStringToIso(editDueDate)}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bill To & Buyer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">
                  Billed To / Buyer Details
                </span>
                {!isEditing ? (
                  <>
                    <span className="font-bold text-sm text-slate-900">
                      {invoice.customer.companyName || invoice.customer.name}
                    </span>
                    {invoice.customer.companyName && (
                      <span className="text-xs text-slate-700 font-medium">Contact: {invoice.customer.name}</span>
                    )}
                    <span className="text-[11px] font-mono text-slate-600">Phone: {invoice.customer.mobile}</span>
                    {invoice.customer.gstin ? (
                      <span className="font-mono text-[11px] font-bold text-blue-800 bg-white inline-block w-fit px-2 py-0.5 rounded border border-blue-200 mt-0.5">
                        GSTIN: {invoice.customer.gstin}
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 italic">Unregistered Consumer</span>
                    )}
                    <div className="mt-1 pt-1 border-t border-slate-200 text-xs text-slate-800">
                      <span className="font-semibold text-slate-500 text-[10.5px] block uppercase">Billing Address:</span>
                      <span>{invoice.customer.address}, {invoice.customer.city}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Name</label>
                      <input
                        type="text"
                        placeholder="Company Name"
                        className="w-full h-7 px-2 border border-slate-300 rounded text-xs font-bold bg-white"
                        value={custCompany}
                        onChange={(e) => setCustCompany(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Contact Person</label>
                      <input
                        type="text"
                        placeholder="Contact Person"
                        className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">GSTIN</label>
                        <input
                          type="text"
                          placeholder="GSTIN"
                          className="w-full h-7 px-2 border border-slate-300 rounded text-xs font-mono font-bold uppercase bg-white"
                          value={custGstin}
                          onChange={(e) => setCustGstin(e.target.value.toUpperCase())}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Mobile Number</label>
                        <input
                          type="text"
                          placeholder="Mobile Number"
                          className="w-full h-7 px-2 border border-slate-300 rounded text-xs font-mono bg-white"
                          value={custMobile}
                          onChange={(e) => setCustMobile(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Billing Address</label>
                      <textarea
                        rows={2}
                        placeholder="Registered Billing Address"
                        className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                        value={custAddress}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustAddress(val);
                          if (sameAsBilling) {
                            setCustShippingAddress(val);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Billing City</label>
                      <input
                        type="text"
                        placeholder="City"
                        className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white"
                        value={custCity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustCity(val);
                          if (sameAsBilling) {
                            setCustShippingCity(val);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 border-t md:border-t-0 md:border-l md:pl-4 border-slate-200 pt-3 md:pt-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-700" />
                    <span>Shipped To / Consignee Address</span>
                  </span>
                  {isEditing && (
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-800 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsBilling(checked);
                          if (checked) {
                            setCustShippingAddress(custAddress);
                            setCustShippingCity(custCity);
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      <span>Same as billing address</span>
                    </label>
                  )}
                </div>

                {!isEditing ? (
                  <>
                    <div className="text-xs text-slate-800 leading-relaxed font-medium">
                      {invoice.customer.shippingAddress || invoice.customer.address}
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold">
                      City / State: {invoice.customer.shippingCity || invoice.customer.city} • State: {buyerState}
                    </div>
                    {(invoice.customer.sameAsBilling !== false &&
                      (!invoice.customer.shippingAddress || invoice.customer.shippingAddress === invoice.customer.address)) && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 rounded w-fit">
                        ✓ Same as Billing Address
                      </span>
                    )}
                    <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isIntraState ? 'Intra-State (CGST 9% + SGST 9%)' : 'Inter-State (IGST 18%)'}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {sameAsBilling ? (
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-dashed border-blue-200 text-xs text-slate-600">
                        <span className="font-semibold text-blue-900 block mb-1">
                          ✓ Shipping destination matches registered billing address:
                        </span>
                        <div className="text-slate-800 font-medium">
                          {custAddress || 'Billing address pending'}, {custCity}
                        </div>
                        <span className="text-[10.5px] text-slate-400 block mt-1">
                          Uncheck "Same as billing address" above if delivery site is different.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 animate-in fade-in">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Site / Delivery Address</label>
                          <textarea
                            rows={3}
                            placeholder="Site Delivery Address"
                            className="w-full p-2 border border-blue-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-600"
                            value={custShippingAddress}
                            onChange={(e) => setCustShippingAddress(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Shipping City</label>
                          <input
                            type="text"
                            placeholder="Delivery City"
                            className="w-full h-7 px-2 border border-slate-300 rounded text-xs bg-white"
                            value={custShippingCity}
                            onChange={(e) => setCustShippingCity(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Fenestration Schedule */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Itemized Fenestration Schedule ({currentItems.length} Products)
                </h4>
                {isEditing && (
                  <button
                    onClick={handleAddNewCustomItem}
                    className="h-7 px-2.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1"
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10.5px] border-b border-slate-200">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Description &amp; UPVC Typology</th>
                      <th className="py-2.5 px-3">Dimensions</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Area (Sq.Ft)</th>
                      <th className="py-2.5 px-3 text-right">Rate / Sq.Ft (₹)</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      {isEditing && <th className="py-2.5 px-3 w-10 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          {!isEditing ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {item.locationTag || 'General'} • {item.profileBrand} • {item.glassPackage}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                className="h-6 px-1.5 border border-slate-300 rounded font-bold text-xs w-full"
                                value={item.name}
                                onChange={(e) => handleUpdateItemField(idx, 'name', e.target.value)}
                              />
                              <input
                                type="text"
                                className="h-5 px-1.5 border border-slate-200 rounded text-[10.5px] text-slate-600 w-full"
                                value={item.locationTag}
                                onChange={(e) => handleUpdateItemField(idx, 'locationTag', e.target.value)}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {item.widthInInches}" × {item.heightInInches}"
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {!isEditing ? (
                            item.quantity
                          ) : (
                            <input
                              type="number"
                              min="1"
                              className="h-6 w-12 border border-slate-300 rounded text-center font-bold"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemField(idx, 'quantity', parseInt(e.target.value) || 1)
                              }
                            />
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {!isEditing ? (
                            item.totalAreaSqFt.toFixed(1)
                          ) : (
                            <input
                              type="number"
                              step="0.1"
                              className="h-6 w-16 border border-slate-300 rounded text-right font-mono"
                              value={item.totalAreaSqFt}
                              onChange={(e) =>
                                handleUpdateItemField(idx, 'totalAreaSqFt', parseFloat(e.target.value) || 0)
                              }
                            />
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                          {!isEditing ? (
                            `₹${item.ratePerSqFt}`
                          ) : (
                            <input
                              type="number"
                              className="h-6 w-16 border border-slate-300 rounded text-right font-mono"
                              value={item.ratePerSqFt}
                              onChange={(e) =>
                                handleUpdateItemField(idx, 'ratePerSqFt', parseFloat(e.target.value) || 0)
                              }
                            />
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(item.itemTotal)}
                        </td>
                        {isEditing && (
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              type="button"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Charges & Transportation Section in Edit Mode */}
            {isEditing && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wide">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>Additional Charges &amp; Transportation ({editExtraCharges.length})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddExtraCharge('Transportation / Freight', 1500)}
                      className="px-2 py-1 rounded bg-white hover:bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-300 transition-colors"
                    >
                      + Freight (₹1,500)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExtraCharge('Loading & Unloading', 800)}
                      className="px-2 py-1 rounded bg-white hover:bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-300 transition-colors"
                    >
                      + Loading (₹800)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddExtraCharge('Crane / Hoisting Lifting', 2500)}
                      className="px-2 py-1 rounded bg-white hover:bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-300 transition-colors"
                    >
                      + Crane (₹2,500)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddChargeForm(!showAddChargeForm)}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                    >
                      {showAddChargeForm ? 'Cancel' : '+ Custom Fee'}
                    </button>
                  </div>
                </div>

                {showAddChargeForm && (
                  <div className="p-3 bg-white rounded-lg border border-blue-200 flex flex-wrap items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Charge description (e.g. Scaffolding, Wall Chipping)..."
                      className="flex-1 min-w-[200px] h-8 px-2.5 rounded border border-slate-300 text-xs"
                      value={customChargeLabel}
                      onChange={(e) => setCustomChargeLabel(e.target.value)}
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="Amount"
                        className="w-24 h-8 px-2 rounded border border-slate-300 text-xs font-mono font-bold"
                        value={customChargeAmount || ''}
                        onChange={(e) => setCustomChargeAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddExtraCharge(customChargeLabel, customChargeAmount)}
                      className="h-8 px-3 rounded bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                    >
                      Add Charge
                    </button>
                  </div>
                )}

                {editExtraCharges.length > 0 ? (
                  <div className="space-y-1.5 divide-y divide-slate-200/60">
                    {editExtraCharges.map((charge) => (
                      <div key={charge.id} className="pt-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{charge.label}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            ₹{charge.amount.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraCharge(charge.id)}
                            className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                            title="Remove charge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    No transportation, freight, or extra charges added. Click preset buttons above if needed.
                  </p>
                )}
              </div>
            )}

            {/* Notes / Special Terms in Edit Mode */}
            {isEditing && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoice Notes &amp; Special Terms</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, instructions or warranty terms printed on this invoice..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
                <span className="text-[10px] text-slate-400 block">
                  These terms will appear under the Terms section and print directly on the GST invoice.
                </span>
              </div>
            )}

            {/* Notes / Special Terms in View Mode */}
            {!isEditing && (invoice.notes || '').trim() && (
              <div className="bg-blue-50/40 rounded-xl border border-blue-200/70 p-3.5 space-y-1">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Invoice Notes &amp; Special Terms</span>
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Financial & GST Summary Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {showBankDetails ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                  <div>
                    <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wide block mb-1">
                      Bank Details for Electronic Settlement
                    </span>
                    <div className="space-y-0.5 text-xs text-slate-700">
                      <div>Bank Name: <strong>{businessProfile.bankName}</strong></div>
                      <div>Account No: <strong className="font-mono">{businessProfile.accountNo}</strong></div>
                      <div>IFSC Code: <strong className="font-mono">{businessProfile.ifscCode}</strong></div>
                      <div>UPI ID: <strong className="font-mono text-emerald-800">{businessProfile.upiId}</strong></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {(isEditing ? editNotes : invoice.notes) ? 'Special Terms & Notes:' : 'Terms:'}
                    </span>
                    <p className="text-[10.5px] text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {(isEditing ? editNotes : invoice.notes) || '10-Year UPVC Profile Warranty against discoloration. 1-Year hardware warranty.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                  Bank Settlement Details Omitted in Print Preview
                </div>
              )}

              {/* Totals Table */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Material &amp; Fabrication:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(currentItemsSubtotal)}</span>
                  </div>

                  {currentExtraCharges.length > 0 && (
                    <div className="space-y-1 py-1 border-t border-dashed border-slate-200">
                      {currentExtraCharges.map((c) => (
                        <div key={c.id} className="flex justify-between items-center text-slate-600">
                          <span className="text-[11px] text-amber-800">+ {c.label}:</span>
                          <span className="font-mono font-bold text-amber-900">₹{(Number(c.amount) || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-slate-600 pt-0.5 border-t border-slate-200 font-medium">
                    <span>Taxable Value (Subtotal):</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(currentSubtotal)}</span>
                  </div>

                  {isIntraState ? (
                    <>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>CGST (9.0%):</span>
                        <span className="font-mono font-semibold text-slate-900">{formatINR(currentGst / 2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>SGST (9.0%):</span>
                        <span className="font-mono font-semibold text-slate-900">{formatINR(currentGst / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-slate-600">
                      <span>IGST (18.0% Integrated):</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(currentGst)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Total Invoice Amount:</span>
                    <span className="font-mono text-base text-blue-800">{formatINR(currentGrandTotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-800 font-semibold pt-1">
                    <span>Advance / Payments Received:</span>
                    <span className="font-mono font-bold text-emerald-700">-{formatINR(currentReceived)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Net Balance Due:
                  </span>
                  <span className="font-mono text-xl font-bold text-amber-800">
                    {formatINR(currentBalanceDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payments & Milestones Log */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Recorded Payment History ({invoice.payments.length})
                  </h4>
                </div>

                {invoice.balanceDue > 0 && !isRecordingPayment && (
                  <button
                    onClick={() => {
                      setPayAmount(invoice.balanceDue);
                      setIsRecordingPayment(true);
                    }}
                    className="h-7 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-colors"
                    type="button"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}
              </div>

              {showPaymentHistory ? (
                invoice.payments.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10.5px]">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3">Reference / UTR #</th>
                          <th className="py-2 px-3">Remarks / Milestone</th>
                          <th className="py-2 px-3 text-right">Amount Paid (₹)</th>
                          <th className="py-2 px-3 w-10 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-700">{p.date}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-[10.5px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                                {p.mode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{p.refNo}</td>
                            <td className="py-2.5 px-3 text-slate-600">{p.notes || 'Payment against invoice'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatINR(p.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => onDeletePayment(invoice.id, p.id)}
                                className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                                title="Delete payment entry"
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs">
                    No payment transactions recorded yet. Click "+ Record Payment" to log client advances.
                  </div>
                )
              ) : (
                <div className="p-2.5 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-xs">
                  Payment History Ledger Omitted in Print Preview
                </div>
              )}
            </div>

            {/* Quick Record Payment Drawer inside Invoice */}
            {isRecordingPayment && (
              <form
                onSubmit={handleRecordPaymentSubmit}
                className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Record New Client Payment Entry</span>
                  </span>
                  <button
                    onClick={() => setIsRecordingPayment(false)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={invoice.balanceDue}
                      className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono font-bold bg-white"
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Payment Mode</label>
                    <select
                      className="w-full h-8 px-2 rounded border border-slate-300 bg-white font-bold"
                      value={payMode}
                      onChange={(e: any) => setPayMode(e.target.value)}
                    >
                      <option value="UPI">UPI</option>
                      <option value="NEFT">NEFT / NetBanking</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">UTR / Cheque Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI8291039"
                      className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono bg-white"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Milestone / Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. 40% On Dispatch"
                      className="w-full h-8 px-2.5 rounded border border-slate-300 bg-white"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsRecordingPayment(false)}
                    className="h-7 px-3 rounded bg-white border border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-7 px-4 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Save Payment</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
