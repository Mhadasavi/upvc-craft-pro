import React, { useState, useEffect } from 'react';
import {
  AppSettings,
  BusinessProfile,
  Customer,
  Invoice,
  PaymentRecord,
  Quotation,
  QuotationItem,
  QuotationStatus,
  RateSheetItem,
} from './types';
import {
  INITIAL_APP_SETTINGS,
  INITIAL_BUSINESS_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_ITEMS,
  INITIAL_QUOTATION,
  INITIAL_QUOTATIONS_LIST,
  INITIAL_RATE_SHEET,
} from './data/initialData';
import {
  generateWhatsAppMessage,
  getNextQuotationNumber,
  getNextInvoiceNumber,
  calculateValidUntilDate,
} from './utils/calculations';
import {
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from './utils/storage';
import { NavTab, Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NewQuotationBuilder } from './components/views/NewQuotationBuilder';
import { DashboardView } from './components/views/DashboardView';
import { QuotationsView } from './components/views/QuotationsView';
import { CustomersView } from './components/views/CustomersView';
import { ProductsRatesView } from './components/views/ProductsRatesView';
import { InvoicesView } from './components/views/InvoicesView';
import { SettingsView } from './components/views/SettingsView';
import { CreateInvoiceView } from './components/views/CreateInvoiceView';
import { PrintQuoteModal } from './components/modals/PrintQuoteModal';

export default function App() {
  // Navigation State (defaults to 'dashboard' as main landing view)
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Collapse state (persisted to localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('upvc_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('upvc_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Primary Database State (Offline-First Persistent Storage)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() =>
    loadFromStorage(STORAGE_KEYS.PROFILE, INITIAL_BUSINESS_PROFILE)
  );
  const [appSettings, setAppSettings] = useState<AppSettings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_APP_SETTINGS)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );
  const [currentCustomer, setCurrentCustomer] = useState<Customer>(() => {
    const list = loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    return list[0] || INITIAL_CUSTOMERS[0];
  });
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    loadFromStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS_LIST)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadFromStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES)
  );
  const [rateSheet, setRateSheet] = useState<RateSheetItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.RATE_SHEET, INITIAL_RATE_SHEET)
  );

  // Auto-sync collections to persistent database storage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.QUOTATIONS, quotations);
  }, [quotations]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
  }, [invoices]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROFILE, businessProfile);
  }, [businessProfile]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RATE_SHEET, rateSheet);
  }, [rateSheet]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, appSettings);
  }, [appSettings]);

  // Active Quote Reference Number and Dates
  const [activeQuoteNumber, setActiveQuoteNumber] = useState<string>(() => {
    const storedQuotes = loadFromStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS_LIST);
    const storedSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_APP_SETTINGS);
    return getNextQuotationNumber(storedQuotes, storedSettings.quotation);
  });

  const [activeQuoteDate, setActiveQuoteDate] = useState<string>(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );

  const [activeQuoteValidUntil, setActiveQuoteValidUntil] = useState<string>(() =>
    calculateValidUntilDate(
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      appSettings.quotation.defaultValidityDays || 30
    )
  );

  // Active step for quotation builder (Step 1: Customer Details, Step 2: Product CAD Studio, Step 3: Review)
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3>(1);

  const handleUpdateAppSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);

    // If active quote is not yet saved in database, update it to the new format immediately
    const alreadySaved = quotations.some((q) => q.quoteNumber === activeQuoteNumber);
    if (!alreadySaved) {
      const nextNumber = getNextQuotationNumber(quotations, newSettings.quotation);
      setActiveQuoteNumber(nextNumber);
    }
    showToast('Application Settings saved & database updated!');
  };

  // Print modal for any quotation in directory
  const [quoteToPrint, setQuoteToPrint] = useState<Quotation | null>(null);

  // Success notification banner state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // WhatsApp Share handler
  const handleSendWhatsAppForCurrent = () => {
    const subtotal = quotationItems.reduce((acc, i) => acc + i.itemTotal, 0);
    const grandTotal = Math.round(subtotal * 1.18 * 100) / 100;
    const msg = generateWhatsAppMessage(
      businessProfile.shopName,
      activeQuoteNumber,
      currentCustomer.companyName ? `${currentCustomer.companyName} (${currentCustomer.name})` : currentCustomer.name,
      quotationItems,
      grandTotal
    );
    const cleanPhone = currentCustomer.mobile.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
    showToast(`Quotation formatted and ready to send via WhatsApp!`);
  };

  const handleSendWhatsAppForQuote = (quote: Quotation) => {
    const subtotal = quote.items.reduce((acc, i) => acc + i.itemTotal, 0);
    const grandTotal = Math.round(subtotal * 1.18 * 100) / 100;
    const msg = generateWhatsAppMessage(
      businessProfile.shopName,
      quote.quoteNumber,
      quote.customer.companyName ? `${quote.customer.companyName} (${quote.customer.name})` : quote.customer.name,
      quote.items,
      grandTotal
    );
    const cleanPhone = quote.customer.mobile.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone.length >= 10 ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
    showToast(`Shared ${quote.quoteNumber} via WhatsApp!`);
  };

  // Finalize Quotation to Invoice
  const handleFinalizeInvoice = () => {
    const subtotal = quotationItems.reduce((acc, i) => acc + i.itemTotal, 0);
    const grandTotal = Math.round(subtotal * 1.18 * 100) / 100;
    const invNumber = getNextInvoiceNumber(invoices);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNumber,
      quotationId: activeQuoteNumber,
      quoteNumber: activeQuoteNumber,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      customer: currentCustomer,
      items: [...quotationItems],
      totalAmount: grandTotal,
      advanceReceived: 0,
      balanceDue: grandTotal,
      status: 'pending',
      payments: [],
    };

    setInvoices([newInvoice, ...invoices]);

    // Update status of current quote in quotes list
    setQuotations((prev) =>
      prev.map((q) => (q.quoteNumber === activeQuoteNumber ? { ...q, status: 'invoiced' } : q))
    );

    setActiveTab('invoices');
    showToast(`Invoice ${invNumber} generated successfully with 18% GST!`);
  };

  // Direct create invoice handler from CreateInvoiceView
  const handleCreateInvoice = (newInv: Invoice) => {
    setInvoices([newInv, ...invoices]);
    setActiveTab('invoices');
    showToast(`Tax Invoice ${newInv.invoiceNumber} generated successfully!`);
  };

  // Add payment to invoice
  const handleAddPayment = (invoiceId: string, payment: PaymentRecord) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newReceived = inv.advanceReceived + payment.amount;
          const newBalance = Math.max(0, inv.totalAmount - newReceived);
          const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid';
          return {
            ...inv,
            advanceReceived: newReceived,
            balanceDue: newBalance,
            status: newStatus,
            payments: [...inv.payments, payment],
          };
        }
        return inv;
      })
    );
    showToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} recorded successfully!`);
  };

  // Delete payment from invoice
  const handleDeletePayment = (invoiceId: string, paymentId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const updatedPayments = inv.payments.filter((p) => p.id !== paymentId);
          const newReceived = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
          const newBalance = Math.max(0, inv.totalAmount - newReceived);
          const newStatus = newBalance <= 0 ? 'paid' : newReceived > 0 ? 'partially_paid' : 'pending';
          return {
            ...inv,
            advanceReceived: newReceived,
            balanceDue: newBalance,
            status: newStatus,
            payments: updatedPayments,
          };
        }
        return inv;
      })
    );
    showToast('Payment record removed and balance adjusted.');
  };

  // Update existing invoice
  const handleUpdateInvoice = (updated: Invoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    showToast(`Invoice ${updated.invoiceNumber} updated successfully!`);
  };

  // Delete invoice
  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    showToast('Invoice deleted from ledger.');
  };

  // Duplicate invoice
  const handleDuplicateInvoice = (source: Invoice) => {
    const newNumber = getNextInvoiceNumber(invoices);
    const cloned: Invoice = {
      ...source,
      id: `inv-${Date.now()}`,
      invoiceNumber: newNumber,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'pending',
      advanceReceived: 0,
      balanceDue: source.totalAmount,
      payments: [],
      notes: source.notes ? `${source.notes} (Cloned)` : 'Cloned Invoice',
    };
    setInvoices([cloned, ...invoices]);
    showToast(`Duplicated as new invoice ${newNumber}!`);
  };

  // Switch to an existing quotation in the builder
  const handleEditQuoteInBuilder = (quote: Quotation) => {
    setActiveQuoteNumber(quote.quoteNumber);
    setActiveQuoteDate(quote.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    setActiveQuoteValidUntil(quote.validUntil || calculateValidUntilDate(quote.date || '', 30));
    setCurrentCustomer(quote.customer);
    setQuotationItems([...quote.items]);
    setBuilderStep(2); // Since customer is already attached to this quotation, open studio directly
    setActiveTab('new-quotation');
    showToast(`Loaded ${quote.quoteNumber} in Live CAD Estimator`);
  };

  // Start fresh quotation - always opens Step 1: Customer Details
  const handleStartFreshQuote = () => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nextNumber = getNextQuotationNumber(quotations, appSettings.quotation);
    setActiveQuoteNumber(nextNumber);
    setActiveQuoteDate(todayStr);
    setActiveQuoteValidUntil(calculateValidUntilDate(todayStr, appSettings.quotation.defaultValidityDays || 30));
    setQuotationItems([]); // Empty items list by default
    setBuilderStep(1); // Explicitly open Step 1: Ask for customer details!
    setActiveTab('new-quotation');
    showToast(`Started New Quotation #${nextNumber} (Step 1: Customer Details)`);
  };

  const handleDeleteQuote = (id: string) => {
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    showToast('Quotation deleted from registry');
  };

  const handleAddNewCustomer = (cust: Customer) => {
    setCustomers((prev) => [cust, ...prev]);
    showToast(`Customer ${cust.name} added to records!`);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    if (currentCustomer.id === updatedCustomer.id) {
      setCurrentCustomer(updatedCustomer);
    }
    // Sync customer updates across quotations and invoices
    setQuotations((prev) =>
      prev.map((q) => (q.customer.id === updatedCustomer.id ? { ...q, customer: updatedCustomer } : q))
    );
    setInvoices((prev) =>
      prev.map((inv) => (inv.customer.id === updatedCustomer.id ? { ...inv, customer: updatedCustomer } : inv))
    );
    showToast(`Customer ${updatedCustomer.name} updated successfully!`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    showToast('Customer record deleted.');
  };

  // Save active quotation to registry
  const handleSaveQuotation = (
    status: QuotationStatus = 'draft',
    customDate?: string,
    customValidUntil?: string
  ) => {
    const quoteDateToSave = customDate || activeQuoteDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const validUntilToSave =
      customValidUntil ||
      activeQuoteValidUntil ||
      calculateValidUntilDate(quoteDateToSave, appSettings.quotation.defaultValidityDays || 30);

    const existingIndex = quotations.findIndex((q) => q.quoteNumber === activeQuoteNumber);
    let updatedQuotes: Quotation[];
    if (existingIndex >= 0) {
      // Update existing quotation
      const updated: Quotation = {
        ...quotations[existingIndex],
        date: quoteDateToSave,
        validUntil: validUntilToSave,
        customer: currentCustomer,
        items: [...quotationItems],
        status: status || quotations[existingIndex].status,
      };
      updatedQuotes = quotations.map((q, idx) => (idx === existingIndex ? updated : q));
      setQuotations(updatedQuotes);
      showToast(`Quotation ${activeQuoteNumber} updated successfully!`);
    } else {
      // Create new quotation in registry
      const newQuote: Quotation = {
        id: `quo-${Date.now()}`,
        quoteNumber: activeQuoteNumber,
        date: quoteDateToSave,
        validUntil: validUntilToSave,
        customer: currentCustomer,
        items: [...quotationItems],
        status: status,
        notes: appSettings.quotation.defaultNotes || 'Standard fabrication quote with 18% GST.',
        deliveryTimeline: appSettings.quotation.defaultDeliveryTimeline || '10 to 14 Working Days',
        paymentTerms: appSettings.quotation.defaultPaymentTerms || '50% Advance, 40% Dispatch, 10% Handover',
        createdAt: new Date().toISOString(),
      };
      updatedQuotes = [newQuote, ...quotations];
      setQuotations(updatedQuotes);
      showToast(`Quotation ${activeQuoteNumber} saved to database!`);
    }

    // Advance to the NEXT sequential quotation number for subsequent quotes
    const nextSeqNumber = getNextQuotationNumber(updatedQuotes, appSettings.quotation);
    setActiveQuoteNumber(nextSeqNumber);
    setQuotationItems([]); // Reset to empty items list for subsequent quote

    // Automatically navigate to Quotations Directory so user sees their saved quote
    setActiveTab('quotations');
  };

  const handleUpdateQuoteStatus = (quoteId: string, status: QuotationStatus) => {
    setQuotations((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status } : q)));
    showToast(`Quotation status updated to ${status.toUpperCase()}`);
  };

  const handleDuplicateQuote = (quote: Quotation) => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const nextNumber = getNextQuotationNumber(quotations, appSettings.quotation);
    const duplicated: Quotation = {
      ...quote,
      id: `quo-${Date.now()}`,
      quoteNumber: nextNumber,
      status: 'draft',
      date: todayStr,
      validUntil: calculateValidUntilDate(todayStr, appSettings.quotation.defaultValidityDays || 30),
      createdAt: new Date().toISOString(),
    };
    setQuotations([duplicated, ...quotations]);
    showToast(`Duplicated as new quotation ${nextNumber}!`);
  };

  // Safe Navigation Handler that detects if active quote was already saved
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'new-quotation') {
      const alreadySaved = quotations.some((q) => q.quoteNumber === activeQuoteNumber);
      if (alreadySaved) {
        handleStartFreshQuote();
        return;
      }
      // If clicking New Quotation tab, start at Step 1: Customer Details
      setBuilderStep(1);
    }
    setActiveTab(tab);
  };

  // Global Search Navigation Handlers
  const handleOpenQuoteFromSearch = (quote: Quotation) => {
    handleEditQuoteInBuilder(quote);
    setSearchQuery('');
  };

  const handleOpenInvoiceFromSearch = (invoice: Invoice) => {
    setActiveTab('invoices');
    setSearchQuery('');
    showToast(`Navigated to Invoice ${invoice.invoiceNumber}`);
  };

  const handleOpenCustomerFromSearch = (customer: Customer) => {
    setCurrentCustomer(customer);
    setActiveTab('customers');
    setSearchQuery('');
    showToast(`Selected Customer ${customer.name}`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        shopName={businessProfile.shopName}
        shopCity={businessProfile.city}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Workspace Frame (offset dynamic for collapsed vs expanded sidebar) */}
      <div
        className={`${
          isSidebarCollapsed ? 'pl-16' : 'pl-64'
        } transition-all duration-300 ease-in-out flex flex-col min-h-screen`}
      >
        {/* Persistent Top Header */}
        <Header
          activeTab={activeTab}
          quoteNumber={activeQuoteNumber}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          ownerName={businessProfile.ownerName}
          ownerRole={businessProfile.role}
          onSelectTab={handleSelectTab}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          quotations={quotations}
          invoices={invoices}
          customers={customers}
          onOpenQuote={handleOpenQuoteFromSearch}
          onOpenInvoice={handleOpenInvoiceFromSearch}
          onOpenCustomer={handleOpenCustomerFromSearch}
        />

        {/* View Routing */}
        <main className="pt-16 flex-1 flex flex-col">
          {activeTab === 'new-quotation' && (
            <NewQuotationBuilder
              quoteNumber={activeQuoteNumber}
              quoteDate={activeQuoteDate}
              validUntil={activeQuoteValidUntil}
              customer={currentCustomer}
              allCustomers={customers}
              items={quotationItems}
              profile={businessProfile}
              rateSheet={rateSheet}
              initialStep={builderStep}
              onUpdateCustomer={setCurrentCustomer}
              onAddNewCustomer={handleAddNewCustomer}
              onUpdateItems={setQuotationItems}
              onUpdateQuoteDate={setActiveQuoteDate}
              onUpdateValidUntil={setActiveQuoteValidUntil}
              onSaveQuotation={handleSaveQuotation}
              onSendWhatsApp={handleSendWhatsAppForCurrent}
              onFinalizeInvoice={handleFinalizeInvoice}
            />
          )}

          {activeTab === 'create-invoice' && (
            <CreateInvoiceView
              customers={customers}
              quotations={quotations}
              invoices={invoices}
              businessProfile={businessProfile}
              onCreateInvoice={handleCreateInvoice}
              onNavigateToInvoices={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              quotations={quotations}
              customers={customers}
              searchQuery={searchQuery}
              onNavigateNewQuote={handleStartFreshQuote}
              onViewQuote={handleEditQuoteInBuilder}
              onSendWhatsApp={handleSendWhatsAppForQuote}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsView
              quotations={quotations}
              searchQuery={searchQuery}
              onOpenNewQuote={handleStartFreshQuote}
              onEditQuote={handleEditQuoteInBuilder}
              onPrintQuote={(q) => setQuoteToPrint(q)}
              onSendWhatsApp={handleSendWhatsAppForQuote}
              onDeleteQuote={handleDeleteQuote}
              onUpdateQuoteStatus={handleUpdateQuoteStatus}
              onDuplicateQuote={handleDuplicateQuote}
              onConvertToInvoice={(q) => {
                setActiveQuoteNumber(q.quoteNumber);
                setCurrentCustomer(q.customer);
                setQuotationItems([...q.items]);
                handleFinalizeInvoice();
              }}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              searchQuery={searchQuery}
              quotations={quotations}
              invoices={invoices}
              onAddNewCustomer={handleAddNewCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenQuote={handleOpenQuoteFromSearch}
              onOpenInvoice={handleOpenInvoiceFromSearch}
              onSelectCustomerForQuote={(c) => {
                setCurrentCustomer(c);
                setActiveTab('new-quotation');
                showToast(`Assigned ${c.name} to active quotation builder`);
              }}
            />
          )}

          {activeTab === 'products-rates' && (
            <ProductsRatesView
              rateSheet={rateSheet}
              onUpdateRateSheet={(newRates) => {
                setRateSheet(newRates);
                showToast('Master Fabrication Rates updated!');
              }}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              businessProfile={businessProfile}
              searchQuery={searchQuery}
              onAddPayment={handleAddPayment}
              onDeletePayment={handleDeletePayment}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onOpenCreateInvoice={() => setActiveTab('create-invoice')}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={businessProfile}
              appSettings={appSettings}
              quotations={quotations}
              invoices={invoices}
              customers={customers}
              onUpdateProfile={(p) => {
                setBusinessProfile(p);
                showToast('Shop Profile and Settings updated!');
              }}
              onUpdateAppSettings={handleUpdateAppSettings}
            />
          )}
        </main>
      </div>

      {/* Directory Print Modal */}
      {quoteToPrint && (
        <PrintQuoteModal
          isOpen={Boolean(quoteToPrint)}
          onClose={() => setQuoteToPrint(null)}
          quoteNumber={quoteToPrint.quoteNumber}
          date={quoteToPrint.date}
          validUntil={quoteToPrint.validUntil}
          customer={quoteToPrint.customer}
          items={quoteToPrint.items}
          profile={businessProfile}
        />
      )}
    </div>
  );
}
