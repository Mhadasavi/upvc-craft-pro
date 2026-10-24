export type ProductCategory = 'windows' | 'doors' | 'ventilators' | 'custom';

export type ProductTypologyId =
  | '2track-sliding-win'
  | '3track-sliding-win'
  | '4track-sliding-win'
  | 'casement-openable-win'
  | 'tilt-turn-win'
  | 'fixed-glazed-win'
  | 'combination-win'
  | '2track-sliding-door'
  | '3track-sliding-door'
  | 'casement-door'
  | 'french-door'
  | 'fixed-sliding-door'
  | 'folding-bifold-door'
  | 'upvc-louver-vent'
  | 'top-hung-vent'
  | 'fixed-glass-partition'
  | 'custom-upvc-product';

export type MeasurementUnit = 'in' | 'mm' | 'ft';

export type OpeningDirection =
  | 'slide-left'
  | 'slide-right'
  | 'slide-bi'
  | 'swing-left'
  | 'swing-right'
  | 'tilt-turn'
  | 'bifold-left'
  | 'fixed';

export type ProfileFoilColor = 'white' | 'wooden' | 'grey';

export interface ProductTypologyMeta {
  id: ProductTypologyId;
  name: string;
  category: ProductCategory;
  badge: string;
  description: string;
  defaultTracks: number;
  defaultPanels: number;
  isDoor: boolean;
  isOpenable: boolean;
  isSliding: boolean;
  isVentilator: boolean;
  baseRatePerSqFt: number;
}

export interface ItemAccessories {
  heavyDutyRollers: boolean;
  crescentLock: boolean;
  mosquitoMesh: boolean;
  siteFitting: boolean;
  steelReinforcement: boolean;
  georgianBars: boolean;
  exhaustFanCutout: boolean;
}

export interface QuotationItem {
  id: string;
  itemNumber: number;
  name: string;
  locationTag: string;
  typologyId: ProductTypologyId;
  category: ProductCategory;
  unit: MeasurementUnit;
  rawWidth: number;
  rawHeight: number;
  widthInInches: number;
  heightInInches: number;
  quantity: number;
  areaPerUnitSqFt: number;
  totalAreaSqFt: number;
  glassPackage: string;
  profileBrand: string;
  colorFoil: ProfileFoilColor;
  accessories: ItemAccessories;
  ratePerSqFt: number;
  hardwareCostPerUnit: number;
  fittingCostPerSqFt: number;
  meshCostPerSqFt: number;
  subtotal: number;
  gstAmount: number;
  itemTotal: number;
  // Advanced configuration
  trackCount: number;
  panelCount: number;
  openingDirection: OpeningDirection;
  profileSeries: string;
  reinforcementThickness: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  mobile: string;
  address: string;
  city: string;
  gstin?: string;
  email?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  sameAsBilling?: boolean;
}

export type QuotationStatus = 'draft' | 'sent' | 'confirmed' | 'invoiced';

export interface ExtraCharge {
  id: string;
  label: string;
  amount: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  customer: Customer;
  items: QuotationItem[];
  status: QuotationStatus;
  notes: string;
  deliveryTimeline: string;
  paymentTerms: string;
  createdAt: string;
  extraCharges?: ExtraCharge[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  mode: 'UPI' | 'NEFT' | 'Cash' | 'Cheque';
  refNo: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  quoteNumber: string;
  date: string;
  dueDate: string;
  customer: Customer;
  items: QuotationItem[];
  totalAmount: number;
  advanceReceived: number;
  balanceDue: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  payments: PaymentRecord[];
  notes?: string;
  extraCharges?: ExtraCharge[];
}

export interface BusinessProfile {
  shopName: string;
  tagline: string;
  ownerName: string;
  role: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  gstin: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  upiId: string;
  rateTier: string;
  termsAndConditions: string[];
  logoUrl?: string;
  companyLogoUrl?: string; // Official company logo printed on quotations and invoices
  avatarUrl?: string; // User profile photo shown in app header only (never printed on documents)
}

export interface RateSheetItem {
  id: string;
  typologyId: ProductTypologyId;
  name: string;
  baseRatePerSqFt: number;
  category: ProductCategory;
}

export interface WorkshopCutItem {
  itemTag: string;
  profileName: string;
  cutPiece: string;
  quantity: number;
  cutLengthMm: number;
  cutLengthInches: number;
  cutAngle: string;
  reinforcementLengthMm: number;
  glassSize: string;
}

export type QuotationNumberFormat =
  | 'calendar-year' // QUO-2026-1049
  | 'short-fy'      // QUO-25-26-1049
  | 'full-fy'       // QUO-2025-26-1049
  | 'custom';       // User-defined template

export type QuotationPrintTemplate = 'architectural' | 'compact' | 'premium' | 'workshop';
export type InvoicePrintTemplate = 'standard' | 'compact' | 'premium';

export interface PrintOptions {
  template?: QuotationPrintTemplate | InvoicePrintTemplate;
  showCadDiagrams?: boolean;
  showBankDetails?: boolean;
  showTerms?: boolean;
  showPaymentHistory?: boolean;
}

export interface QuotationSettings {
  numberFormat: QuotationNumberFormat;
  prefix: string;
  customTemplate: string;
  startingSequence: number;
  defaultValidityDays: number;
  defaultDeliveryTimeline: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
  defaultTemplate?: QuotationPrintTemplate;
}

export interface InvoiceSettings {
  numberFormat: 'calendar-year' | 'short-fy' | 'full-fy' | 'custom';
  prefix: string;
  customTemplate: string;
  startingSequence: number;
  defaultDueDays: number;
  defaultGstRate: number;
  hsnCode: string;
  declaration: string;
  defaultTemplate?: InvoicePrintTemplate;
}

export interface ProductSettings {
  defaultUnit: MeasurementUnit;
  defaultProfileBrand: string;
  defaultGlassPackage: string;
  defaultColorFoil: ProfileFoilColor;
  reinforcementRatePerSqFt: number;
  georgianBarsRatePerSqFt: number;
  siteFittingRatePerSqFt: number;
  mosquitoMeshRatePerSqFt: number;
  weldAllowanceMm: number;
}

export interface CustomerSettings {
  defaultCity: string;
  defaultState: string;
  autoVerifyGst: boolean;
  whatsappTemplate: string;
}

export interface AppSettings {
  quotation: QuotationSettings;
  invoice: InvoiceSettings;
  product: ProductSettings;
  customer: CustomerSettings;
}
