export type AppLanguage = 'en' | 'hi';

export const LANGUAGE_STORAGE_KEY = 'upvc_app_language';

/**
 * Reads initial language preference from localStorage, falling back to 'en'.
 */
export function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'hi' || saved === 'en') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read language preference from storage', e);
  }
  return 'en';
}

/**
 * Persists language preference to localStorage.
 */
export function applyLanguage(lang: AppLanguage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (document.documentElement) {
      document.documentElement.lang = lang;
    }
  } catch (e) {
    console.warn('Failed to save language preference to storage', e);
  }
}

/**
 * Toggles between English ('en') and Hindi ('hi').
 */
export function toggleLanguage(current: AppLanguage): AppLanguage {
  const next: AppLanguage = current === 'hi' ? 'en' : 'hi';
  applyLanguage(next);
  return next;
}

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.newQuotation': 'New Quotation',
    'nav.createInvoice': 'Create Invoice',
    'nav.quotations': 'Quotations',
    'nav.invoices': 'Invoices & Payments',
    'nav.customers': 'Customers',
    'nav.productsRates': 'Products & Rates',
    'nav.settings': 'Settings',

    // Header
    'header.searchPlaceholder': 'Search quotes, invoices, customers, mobile...',
    'header.rateSheetActive': 'Standard Fab Rate Sheet: Active (INR ₹)',
    'header.toggleThemeLight': 'Switch to Light Mode',
    'header.toggleThemeDark': 'Switch to Dark Mode',
    'header.toggleLanguage': 'हिंदी भाषा में बदलें (Switch to Hindi)',
    'header.notifications': 'Notifications & Shop Alerts',
    'header.unread': 'Unread',
    'header.allNotifications': 'All Notifications',
    'header.markAllRead': 'Mark all as read',
    'header.noNotifications': 'No new notifications right now',

    // Common Actions
    'common.save': 'Save',
    'common.saveChanges': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.print': 'Print',
    'common.printSavePdf': 'Print / Save as PDF',
    'common.download': 'Download',
    'common.open': 'Open',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.view': 'View',
    'common.filter': 'Filter',
    'common.search': 'Search',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.total': 'Total',
    'common.subtotal': 'Subtotal',
    'common.amount': 'Amount',
    'common.date': 'Date',
    'common.dueDate': 'Due Date',
    'common.phone': 'Phone',
    'common.mobile': 'Mobile Number',
    'common.email': 'Email',
    'common.address': 'Address',
    'common.city': 'City',
    'common.state': 'State',
    'common.gstin': 'GSTIN',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.qty': 'Qty',
    'common.area': 'Area',
    'common.sqft': 'Sq.Ft',
    'common.rate': 'Rate',

    // Dashboard
    'dashboard.welcome': 'Workshop Overview & Operations',
    'dashboard.subtitle': "Here's what's happening in your fabrication shop today.",
    'dashboard.newQuoteBtn': 'New Quotation',
    'dashboard.pendingQuotes': 'Pending Quotations',
    'dashboard.awaitingResponse': 'Awaiting customer response',
    'dashboard.fabricationOrders': 'Fabrication Orders',
    'dashboard.inWorkshopQueue': 'In workshop queue',
    'dashboard.totalInvoiced': 'Total Invoiced',
    'dashboard.balanceDue': 'Net Balance Due',
    'dashboard.uncollectedPayments': 'Outstanding payments due',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newQuoteAction': 'Create Quotation',
    'dashboard.newQuoteActionDesc': 'New live CAD elevation quote',
    'dashboard.createInvoiceAction': 'Generate Tax Invoice',
    'dashboard.createInvoiceActionDesc': 'GST invoice with advance receipt',
    'dashboard.addCustomerAction': 'Add Customer',
    'dashboard.addCustomerActionDesc': 'Register customer or company',
    'dashboard.viewRatesAction': 'Master Rate Sheet',
    'dashboard.viewRatesActionDesc': 'Standard UPVC rates & typologies',
    'dashboard.pipelineTitle': 'Workshop Fabrication & Dispatch Pipeline',
    'dashboard.stageReadyCut': 'Ready to Cut (Stage 1)',
    'dashboard.stageInFab': 'In Fabrication (Stage 2)',
    'dashboard.stageReadyDispatch': 'Ready to Dispatch (Stage 3)',
    'dashboard.recentQuotesTitle': 'Recent Quotations & Orders',
    'dashboard.viewAll': 'View All',
    'dashboard.noQuotes': 'No quotations found',

    // Quotation Builder & Views
    'quote.title': 'Quotation Builder & Estimator',
    'quote.quoteNumber': 'Quotation Number',
    'quote.validUntil': 'Valid Until',
    'quote.customerInfo': 'Customer Information',
    'quote.addItem': '+ Add UPVC Window / Door',
    'quote.profileBrand': 'Profile Brand',
    'quote.glassPackage': 'Glass Specification',
    'quote.hardware': 'Hardware & Locks',
    'quote.summary': 'Quotation Summary',
    'quote.saveDraft': 'Save Draft',
    'quote.finalize': 'Finalize & Send',
    'quote.whatsapp': 'Share on WhatsApp',
    'quote.statusDraft': 'Draft',
    'quote.statusSent': 'Sent',
    'quote.statusConfirmed': 'Confirmed',
    'quote.statusInvoiced': 'Invoiced',

    // Invoices & Billing
    'invoice.title': 'Tax Invoices & Billing',
    'invoice.createTitle': 'Create Tax Invoice & Billing',
    'invoice.invoiceNumber': 'Invoice Number',
    'invoice.invoiceDate': 'Invoice Date',
    'invoice.dueDate': 'Payment Due Date',
    'invoice.billedTo': 'Billed To / Buyer Details',
    'invoice.shippedTo': 'Shipped To / Consignee Address',
    'invoice.sameAsBilling': 'Same as billing address',
    'invoice.transportation': 'Additional Charges & Transportation',
    'invoice.freight': 'Transportation / Freight',
    'invoice.loading': 'Loading & Unloading',
    'invoice.crane': 'Crane / Hoisting Lifting',
    'invoice.customFee': 'Custom Fee',
    'invoice.advanceReceived': 'Advance / Payments Received',
    'invoice.balanceDue': 'Net Balance Due',
    'invoice.recordPayment': 'Record Payment',
    'invoice.paymentHistory': 'Payment History',
    'invoice.statusPaid': 'Paid',
    'invoice.statusPartial': 'Partially Paid',
    'invoice.statusPending': 'Pending',
    'invoice.statusCancelled': 'Cancelled',

    // Customers
    'customer.title': 'Customer Directory',
    'customer.addNew': 'Add New Customer',
    'customer.search': 'Search customers by name, company, mobile or GSTIN...',
    'customer.billingAddress': 'Billing / Registered Address',
    'customer.shippingAddress': 'Shipping / Delivery Address',
    'customer.noCustomers': 'No customers registered yet',

    // Settings
    'settings.title': 'Shop Settings & Preferences',
    'settings.shopIdentity': 'Shop Identity & Tax Registration',
    'settings.appearance': 'Application Theme & Visual Appearance',
    'settings.languageTitle': 'Application Language / भाषा',
    'settings.languageDesc': 'Choose your preferred language for the application workspace.',
    'settings.langEn': 'English',
    'settings.langEnDesc': 'Standard English terms for fenestration CAD, quotation estimating, and billing.',
    'settings.langHi': 'हिंदी (Hindi)',
    'settings.langHiDesc': 'Hindi for Main Dashboard, pipeline, navigation & settings; quotation and billing forms remain in English.',
  },
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.newQuotation': 'नया कोटेशन',
    'nav.createInvoice': 'इनवॉइस बनाएँ',
    'nav.quotations': 'कोटेशन सूची',
    'nav.invoices': 'इनवॉइस एवं भुगतान',
    'nav.customers': 'ग्राहक',
    'nav.productsRates': 'उत्पाद एवं दरें',
    'nav.settings': 'दुकान सेटिंग्स',

    // Header
    'header.searchPlaceholder': 'कोटेशन, इनवॉइस, ग्राहक, मोबाइल नंबर खोजें...',
    'header.rateSheetActive': 'मानक दर सूची: सक्रिय (INR ₹)',
    'header.toggleThemeLight': 'लाइट मोड में बदलें',
    'header.toggleThemeDark': 'डार्क मोड में बदलें',
    'header.toggleLanguage': 'Switch to English (अंग्रेज़ी में बदलें)',
    'header.notifications': 'सूचनाएं एवं शॉप अलर्ट',
    'header.unread': 'अपठित',
    'header.allNotifications': 'सभी सूचनाएं',
    'header.markAllRead': 'सभी को पढ़ा हुआ चिह्नित करें',
    'header.noNotifications': 'वर्तमान में कोई नई सूचना नहीं है',

    // Common Actions
    'common.save': 'सहेजें',
    'common.saveChanges': 'बदलाव सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.print': 'प्रिंट करें',
    'common.printSavePdf': 'प्रिंट / PDF सहेजें',
    'common.download': 'डाउनलोड',
    'common.open': 'खोलें',
    'common.close': 'बंद करें',
    'common.back': 'वापस',
    'common.view': 'देखें',
    'common.filter': 'फ़िल्टर',
    'common.search': 'खोजें',
    'common.status': 'स्थिति',
    'common.actions': 'कार्रवाई',
    'common.total': 'कुल',
    'common.subtotal': 'उप-कुल',
    'common.amount': 'राशि',
    'common.date': 'तारीख',
    'common.dueDate': 'अंतिम तिथि',
    'common.phone': 'फ़ोन',
    'common.mobile': 'मोबाइल नंबर',
    'common.email': 'ईमेल',
    'common.address': 'पता',
    'common.city': 'शहर',
    'common.state': 'राज्य',
    'common.gstin': 'जीएसटी नंबर (GSTIN)',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',
    'common.qty': 'मात्रा',
    'common.area': 'क्षेत्रफल',
    'common.sqft': 'वर्ग फ़ीट',
    'common.rate': 'दर (₹)',

    // Dashboard
    'dashboard.welcome': 'वर्कशॉप अवलोकन एवं संचालन',
    'dashboard.subtitle': 'आज आपकी यूपीवीसी वर्कशॉप में क्या चल रहा है, इसका पूरा विवरण।',
    'dashboard.newQuoteBtn': 'नया कोटेशन बनाएँ',
    'dashboard.pendingQuotes': 'लंबित कोटेशन',
    'dashboard.awaitingResponse': 'ग्राहक से प्रतिक्रिया प्रतीक्षित',
    'dashboard.fabricationOrders': 'सक्रिय निर्माण ऑर्डर',
    'dashboard.inWorkshopQueue': 'वर्कशॉप निर्माण कतार में',
    'dashboard.totalInvoiced': 'कुल बिलिंग राशि',
    'dashboard.balanceDue': 'कुल बकाया राशि',
    'dashboard.uncollectedPayments': 'ग्राहकों से प्राप्त होने वाली बकाया राशि',
    'dashboard.quickActions': 'त्वरित क्रियाएं',
    'dashboard.newQuoteAction': 'कोटेशन तैयार करें',
    'dashboard.newQuoteActionDesc': 'लाइव सीएडी एलिवेशन के साथ नया कोटेशन',
    'dashboard.createInvoiceAction': 'टैक्स इनवॉइस बनाएँ',
    'dashboard.createInvoiceActionDesc': 'जीएसटी इनवॉइस एवं अग्रिम रसीद',
    'dashboard.addCustomerAction': 'ग्राहक जोड़ें',
    'dashboard.addCustomerActionDesc': 'नया ग्राहक या कंपनी पंजीकृत करें',
    'dashboard.viewRatesAction': 'मास्टर दर सूची',
    'dashboard.viewRatesActionDesc': 'मानक यूपीवीसी दरें एवं उत्पाद प्रकार',
    'dashboard.pipelineTitle': 'वर्कशॉप निर्माण एवं डिस्पैच पाइपलाइन',
    'dashboard.stageReadyCut': 'कटिंग हेतु तैयार (चरण 1)',
    'dashboard.stageInFab': 'निर्माण कार्य चालू (चरण 2)',
    'dashboard.stageReadyDispatch': 'डिस्पैच हेतु तैयार (चरण 3)',
    'dashboard.recentQuotesTitle': 'हाल के कोटेशन एवं ऑर्डर',
    'dashboard.viewAll': 'सभी देखें',
    'dashboard.noQuotes': 'कोई कोटेशन उपलब्ध नहीं है',

    // Quotation Builder & Views
    'quote.title': 'कोटेशन निर्माता एवं एस्टीमेटर',
    'quote.quoteNumber': 'कोटेशन संख्या',
    'quote.validUntil': 'वैधता तिथि',
    'quote.customerInfo': 'ग्राहक विवरण',
    'quote.addItem': '+ नया यूपीवीसी आइटम जोड़ें',
    'quote.profileBrand': 'प्रोफ़ाइल ब्रांड',
    'quote.glassPackage': 'कांच का विनिर्देश',
    'quote.hardware': 'हार्डवेयर और लॉक्स',
    'quote.summary': 'कोटेशन सारांश',
    'quote.saveDraft': 'ड्राफ्ट सहेजें',
    'quote.finalize': 'अंतिम रूप दें और भेजें',
    'quote.whatsapp': 'व्हाट्सएप पर भेजें',
    'quote.statusDraft': 'ड्राफ्ट',
    'quote.statusSent': 'भेजा गया',
    'quote.statusConfirmed': 'कन्फ़र्म',
    'quote.statusInvoiced': 'बिल बनाया गया',

    // Invoices & Billing
    'invoice.title': 'टैक्स इनवॉइस एवं बिलिंग',
    'invoice.createTitle': 'जीएसटी टैक्स इनवॉइस एवं बिलिंग बनाएँ',
    'invoice.invoiceNumber': 'इनवॉइस संख्या',
    'invoice.invoiceDate': 'इनवॉइस तारीख',
    'invoice.dueDate': 'भुगतान की अंतिम तिथि',
    'invoice.billedTo': 'खरीदार का विवरण (बिल टू)',
    'invoice.shippedTo': 'माल भेजने का पता (शिप टू)',
    'invoice.sameAsBilling': 'बिलिंग पते के समान',
    'invoice.transportation': 'अतिरिक्त शुल्क एवं परिवहन',
    'invoice.freight': 'परिवहन / भाड़ा',
    'invoice.loading': 'लोडिंग एवं अनलोडिंग',
    'invoice.crane': 'क्रेन / लिफ्टिंग शुल्क',
    'invoice.customFee': 'अन्य शुल्क',
    'invoice.advanceReceived': 'प्राप्त अग्रिम राशि',
    'invoice.balanceDue': 'कुल बकाया राशि',
    'invoice.recordPayment': 'भुगतान दर्ज करें',
    'invoice.paymentHistory': 'भुगतान इतिहास',
    'invoice.statusPaid': 'पूर्ण भुगतान',
    'invoice.statusPartial': 'आंशिक भुगतान',
    'invoice.statusPending': 'लंबित',
    'invoice.statusCancelled': 'रद्द',

    // Customers
    'customer.title': 'ग्राहक सूची एवं डायरेक्टरी',
    'customer.addNew': 'नया ग्राहक जोड़ें',
    'customer.search': 'नाम, कंपनी, मोबाइल नंबर या जीएसटी द्वारा खोजें...',
    'customer.billingAddress': 'पंजीकृत बिलिंग पता',
    'customer.shippingAddress': 'डिलीवरी / साइट का पता',
    'customer.noCustomers': 'कोई ग्राहक पंजीकृत नहीं है',

    // Settings
    'settings.title': 'दुकान सेटिंग्स एवं प्राथमिकताएं',
    'settings.shopIdentity': 'दुकान की पहचान एवं जीएसटी विवरण',
    'settings.appearance': 'थीम एवं दृश्य उपस्थिति',
    'settings.languageTitle': 'एप्लिकेशन भाषा / Language',
    'settings.languageDesc': 'कार्यक्षेत्र इंटरफ़ेस के लिए अपनी पसंदीदा भाषा चुनें।',
    'settings.langEn': 'English',
    'settings.langEnDesc': 'फेनेस्ट्रेशन, एस्टीमेशन और जीएसटी बिलिंग के मानक अंग्रेज़ी शब्द।',
    'settings.langHi': 'हिंदी (Hindi)',
    'settings.langHiDesc': 'मुख्य डैशबोर्ड, त्वरित क्रियाएं एवं सेटिंग्स हिंदी में; कोटेशन और बिलिंग मानक अंग्रेज़ी में।',
  },
};

/**
 * Translates a key for the given or current language with English fallback.
 */
export function translate(key: string, lang: AppLanguage = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  if (dictionary && dictionary[key]) {
    return dictionary[key];
  }
  return TRANSLATIONS.en[key] || key;
}
