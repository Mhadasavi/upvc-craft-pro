import {
  MeasurementUnit,
  QuotationItem,
  WorkshopCutItem,
  Quotation,
  Invoice,
  QuotationNumberFormat,
  QuotationSettings,
} from '../types';

/**
 * Convert any supported dimension unit to inches
 */
export function toInches(value: number, unit: MeasurementUnit): number {
  if (isNaN(value) || value <= 0) return 0;
  switch (unit) {
    case 'in':
      return value;
    case 'mm':
      return Math.round((value / 25.4) * 100) / 100;
    case 'ft':
      return Math.round(value * 12 * 100) / 100;
  }
}

/**
 * Convert inches to target unit
 */
export function fromInches(inches: number, targetUnit: MeasurementUnit): number {
  if (isNaN(inches) || inches <= 0) return 0;
  switch (targetUnit) {
    case 'in':
      return Math.round(inches * 10) / 10;
    case 'mm':
      return Math.round(inches * 25.4);
    case 'ft':
      return Math.round((inches / 12) * 100) / 100;
  }
}

/**
 * Format dimension display with mm equivalent
 */
export function formatDimension(widthInches: number, heightInches: number): {
  imperial: string;
  metric: string;
} {
  const wMm = Math.round(widthInches * 25.4);
  const hMm = Math.round(heightInches * 25.4);
  return {
    imperial: `${widthInches}" W × ${heightInches}" H`,
    metric: `${wMm} × ${hMm} mm`,
  };
}

/**
 * Calculate area in square feet
 */
export function calculateAreaSqFt(widthInches: number, heightInches: number): number {
  if (widthInches <= 0 || heightInches <= 0) return 0;
  const area = (widthInches * heightInches) / 144;
  return Math.round(area * 100) / 100;
}

/**
 * Calculate pricing for an item
 */
export function calculateItemCost(
  areaPerUnitSqFt: number,
  quantity: number,
  ratePerSqFt: number,
  hardwareCostPerUnit: number,
  accessories: {
    mosquitoMesh: boolean;
    siteFitting: boolean;
    steelReinforcement: boolean;
    georgianBars: boolean;
  }
): {
  materialBase: number;
  hardwareTotal: number;
  fittingTotal: number;
  meshTotal: number;
  subtotal: number;
  gstAmount: number;
  totalWithGst: number;
} {
  const totalArea = areaPerUnitSqFt * quantity;

  // Base profile + glass rate per sq.ft
  let effectiveRate = ratePerSqFt;
  if (accessories.steelReinforcement) {
    effectiveRate += 15; // Extra heavy GI reinforcement
  }
  if (accessories.georgianBars) {
    effectiveRate += 35; // Internal aesthetic bars
  }

  const materialBase = totalArea * effectiveRate;
  const hardwareTotal = quantity * hardwareCostPerUnit;
  const fittingTotal = accessories.siteFitting ? totalArea * 40 : 0;
  const meshTotal = accessories.mosquitoMesh ? totalArea * 35 : 0;

  const subtotal = Math.round((materialBase + hardwareTotal + fittingTotal + meshTotal) * 100) / 100;
  const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const totalWithGst = Math.round((subtotal + gstAmount) * 100) / 100;

  return {
    materialBase,
    hardwareTotal,
    fittingTotal,
    meshTotal,
    subtotal,
    gstAmount,
    totalWithGst,
  };
}

/**
 * Indian Rupee Formatter
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate Workshop Fabrication Cut-List for an item
 */
export function generateWorkshopCutList(item: QuotationItem): WorkshopCutItem[] {
  const wMm = Math.round(item.widthInInches * 25.4);
  const hMm = Math.round(item.heightInInches * 25.4);
  const weldAllowance = 6; // 3mm per side
  const outerFrameWidthCut = wMm + weldAllowance;
  const outerFrameHeightCut = hMm + weldAllowance;

  const cuts: WorkshopCutItem[] = [];

  // Outer frame cuts
  cuts.push({
    itemTag: item.locationTag || item.name,
    profileName: `${item.profileBrand} Outer Frame`,
    cutPiece: 'Outer Frame Top / Bottom',
    quantity: 2 * item.quantity,
    cutLengthMm: outerFrameWidthCut,
    cutLengthInches: Math.round((outerFrameWidthCut / 25.4) * 10) / 10,
    cutAngle: '45° / 45° Miter',
    reinforcementLengthMm: outerFrameWidthCut - 80,
    glassSize: 'N/A (Outer Frame)',
  });

  cuts.push({
    itemTag: item.locationTag || item.name,
    profileName: `${item.profileBrand} Outer Frame`,
    cutPiece: 'Outer Frame Left / Right Jamb',
    quantity: 2 * item.quantity,
    cutLengthMm: outerFrameHeightCut,
    cutLengthInches: Math.round((outerFrameHeightCut / 25.4) * 10) / 10,
    cutAngle: '45° / 45° Miter',
    reinforcementLengthMm: outerFrameHeightCut - 80,
    glassSize: 'N/A (Outer Frame)',
  });

  // Sash cuts based on typology
  const sashes = item.panelCount || 2;
  const sashWidthMm = Math.round(wMm / sashes + 20); // 20mm overlap for sliding
  const sashHeightMm = hMm - 65; // Frame rebate deduction

  cuts.push({
    itemTag: item.locationTag || item.name,
    profileName: `${item.profileBrand} Sash Profile`,
    cutPiece: `Sash Top & Bottom (${sashes} panels)`,
    quantity: sashes * 2 * item.quantity,
    cutLengthMm: sashWidthMm + weldAllowance,
    cutLengthInches: Math.round(((sashWidthMm + weldAllowance) / 25.4) * 10) / 10,
    cutAngle: '45° / 45° Miter',
    reinforcementLengthMm: sashWidthMm - 70,
    glassSize: `${sashWidthMm - 100} × ${sashHeightMm - 100} mm (${item.glassPackage})`,
  });

  cuts.push({
    itemTag: item.locationTag || item.name,
    profileName: `${item.profileBrand} Sash Profile`,
    cutPiece: `Sash Stile Verticals (${sashes} panels)`,
    quantity: sashes * 2 * item.quantity,
    cutLengthMm: sashHeightMm + weldAllowance,
    cutLengthInches: Math.round(((sashHeightMm + weldAllowance) / 25.4) * 10) / 10,
    cutAngle: '45° / 45° Miter',
    reinforcementLengthMm: sashHeightMm - 70,
    glassSize: `${sashWidthMm - 100} × ${sashHeightMm - 100} mm (${item.glassPackage})`,
  });

  return cuts;
}

/**
 * Format WhatsApp Message string
 */
export function generateWhatsAppMessage(
  shopName: string,
  quoteNumber: string,
  customerName: string,
  items: QuotationItem[],
  grandTotal: number
): string {
  const itemSummary = items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.name}* (${item.locationTag || 'General'})\n` +
        `   Size: ${item.widthInInches}" × ${item.heightInInches}" | Qty: ${item.quantity}\n` +
        `   Glass: ${item.glassPackage}\n` +
        `   Rate: ₹${item.ratePerSqFt}/sq.ft | Amt: ₹${item.itemTotal.toLocaleString('en-IN')}`
    )
    .join('\n\n');

  const totalArea = items.reduce((acc, i) => acc + i.totalAreaSqFt, 0).toFixed(1);
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);

  const text =
    `*ESTIMATE / QUOTATION - ${shopName}*\n` +
    `Quote Ref: *${quoteNumber}*\n` +
    `Customer: ${customerName}\n` +
    `--------------------------------------\n` +
    `*CONFIGURED UPVC ITEMS:*\n\n` +
    `${itemSummary}\n\n` +
    `--------------------------------------\n` +
    `*Total Units:* ${totalUnits} Units (${totalArea} Sq.Ft)\n` +
    `*Grand Total (incl. 18% GST): ₹${grandTotal.toLocaleString('en-IN')}*\n` +
    `--------------------------------------\n` +
    `✓ High Gloss Class-A UPVC Profiles\n` +
    `✓ 1.2mm GI Anti-Sag Reinforcement\n` +
    `✓ EPDM Weather Sealing & Installation\n` +
    `✓ 10-Year Extrusion Warranty\n\n` +
    `Please review and reply to confirm fabrication schedule. Thank you!`;

  return encodeURIComponent(text);
}

/**
 * Format WhatsApp Message for Invoices & Payments
 */
export function generateInvoiceWhatsAppMessage(
  shopName: string,
  invoiceNumber: string,
  customerName: string,
  totalAmount: number,
  advanceReceived: number,
  balanceDue: number,
  dueDate: string,
  upiId?: string
): string {
  const text =
    `*TAX INVOICE - ${shopName}*\n` +
    `Invoice No: *${invoiceNumber}*\n` +
    `Billed To: ${customerName}\n` +
    `--------------------------------------\n` +
    `*Invoice Amount (incl. 18% GST):* ₹${totalAmount.toLocaleString('en-IN')}\n` +
    `*Amount Received / Advance:* ₹${advanceReceived.toLocaleString('en-IN')}\n` +
    `*Outstanding Balance Due:* *₹${balanceDue.toLocaleString('en-IN')}*\n` +
    `*Due Date:* ${dueDate}\n` +
    `--------------------------------------\n` +
    (upiId ? `Pay online via UPI: *${upiId}*\n` : '') +
    `Thank you for your business!\n` +
    `Shree Balaji UPVC Works Pune`;

  return encodeURIComponent(text);
}

/**
 * Returns Indian Financial Year strings (e.g. { fullFY: "2025-26", shortFY: "25-26" })
 * In India, FY runs from April 1 to March 31.
 */
export function getFinancialYearString(refDate: Date | string = new Date()): { fullFY: string; shortFY: string } {
  const d = typeof refDate === 'string' ? new Date(refDate) : refDate;
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const month = validDate.getMonth(); // 0 = Jan, 3 = Apr
  const year = validDate.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  const shortStart = String(startYear).slice(-2);
  const shortEnd = String(endYear).slice(-2);
  return {
    fullFY: `${startYear}-${shortEnd}`,
    shortFY: `${shortStart}-${shortEnd}`,
  };
}

/**
 * Normalizes a custom template. If user typed a literal like "JS-26-27-100" without {SEQ},
 * it automatically detects the trailing numbers and turns it into "JS-26-27-{SEQ:3}".
 */
export function normalizeCustomTemplate(template: string): { normalizedTemplate: string; detectedStartSeq?: number } {
  if (!template || !template.trim()) {
    return { normalizedTemplate: '{PREFIX}-{FY}-{SEQ}' };
  }
  const trimmed = template.trim();
  // Already has {SEQ} or {SEQ:4}
  if (/{SEQ/i.test(trimmed)) {
    return { normalizedTemplate: trimmed };
  }
  // Check if it ends with digits, e.g. "JS-26-27-100"
  const trailingNum = trimmed.match(/^(.*?)(\d+)$/);
  if (trailingNum) {
    const base = trailingNum[1];
    const digits = trailingNum[2];
    const detected = parseInt(digits, 10);
    return {
      normalizedTemplate: `${base}{SEQ:${digits.length}}`,
      detectedStartSeq: detected,
    };
  }
  // If ends with a separator like "-" or "/"
  return {
    normalizedTemplate: `${trimmed.replace(/[-_/]+$/, '')}-{SEQ}`,
  };
}

/**
 * Formats a quotation sequence number according to the selected format template.
 */
export function formatQuotationNumber(
  seq: number,
  format: QuotationNumberFormat = 'calendar-year',
  prefix = 'QUO',
  customTemplate?: string,
  refDate: Date | string = new Date()
): string {
  const d = typeof refDate === 'string' ? new Date(refDate) : refDate;
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const currentYear = validDate.getFullYear();
  const { fullFY, shortFY } = getFinancialYearString(validDate);
  const seqStr = String(seq);

  switch (format) {
    case 'short-fy':
      return `${prefix}-${shortFY}-${seqStr}`; // e.g. QUO-25-26-1049
    case 'full-fy':
      return `${prefix}-${fullFY}-${seqStr}`; // e.g. QUO-2025-26-1049
    case 'custom': {
      const { normalizedTemplate } = normalizeCustomTemplate(customTemplate || '');
      return normalizedTemplate
        .replace(/{PREFIX}/gi, prefix)
        .replace(/{YYYY}/gi, String(currentYear))
        .replace(/{YY}/gi, String(currentYear).slice(-2))
        .replace(/{FY}/gi, fullFY)
        .replace(/{FY_FULL}/gi, fullFY)
        .replace(/{FY_SHORT}/gi, shortFY)
        .replace(/{SEQ:(\d+)}/gi, (_, pad) => seqStr.padStart(parseInt(pad, 10), '0'))
        .replace(/{SEQ}/gi, seqStr);
    }
    case 'calendar-year':
    default:
      return `${prefix}-${currentYear}-${seqStr}`; // e.g. QUO-2026-1049
  }
}

/**
 * Generates the next sequential quotation reference number.
 * Finds the highest sequence number in the list for the current series/prefix and increments by 1.
 * Supports calendar year, short FY, full FY, or custom user patterns.
 */
export function getNextQuotationNumber(
  quotations: Quotation[],
  settings?: QuotationSettings,
  refDate: Date | string = new Date()
): string {
  const format = settings?.numberFormat || 'calendar-year';
  const customTemplate = settings?.customTemplate || '';
  const { normalizedTemplate, detectedStartSeq } = normalizeCustomTemplate(customTemplate);

  // Determine series prefix to isolate number series
  let prefix = (settings?.prefix || 'QUO').trim();
  if (format === 'custom' && customTemplate) {
    const match = customTemplate.match(/^[A-Za-z0-9]+/);
    if (match) {
      prefix = match[0];
    }
  }

  // Determine starting base number
  let baseSeq = 1048;
  if (settings?.startingSequence !== undefined && settings.startingSequence !== null) {
    baseSeq = settings.startingSequence - 1;
  } else if (detectedStartSeq !== undefined) {
    baseSeq = detectedStartSeq - 1;
  }

  // Filter quotations belonging to this series/prefix
  const seriesQuotes = quotations.filter((q) => {
    if (!q || !q.quoteNumber) return false;
    const qNum = q.quoteNumber.trim().toUpperCase();
    if (prefix && qNum.startsWith(prefix.toUpperCase())) {
      return true;
    }
    // If format is custom and user didn't specify distinct prefix
    if (format === 'custom' && customTemplate) {
      const samplePrefix = customTemplate.split(/[-_/]/)[0]?.toUpperCase();
      if (samplePrefix && qNum.startsWith(samplePrefix)) return true;
    }
    return false;
  });

  // Extract trailing digits from matching series quotes
  const seqs = seriesQuotes
    .map((q) => {
      const match = q.quoteNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  if (seqs.length > 0) {
    // If quotes are default mock QUO quotes, ignore outliers > 1500 from old bug
    const normalSeqs = prefix.toUpperCase() === 'QUO' && seqs.length < 100
      ? seqs.filter((n) => n < 1500)
      : seqs;
    const maxSeq = Math.max(...normalSeqs);
    return formatQuotationNumber(maxSeq + 1, format, prefix, customTemplate, refDate);
  }

  // If no quotes exist yet in this series, start at baseSeq + 1 (the user's starting number)
  const firstSeq = baseSeq + 1;
  return formatQuotationNumber(firstSeq, format, prefix, customTemplate, refDate);
}

/**
 * Generates the next sequential invoice reference number.
 * Format: INV-YYYY-NNN (e.g. INV-2025-090).
 */
export function getNextInvoiceNumber(invoices: Invoice[], baseNumber = 89): string {
  const currentYear = new Date().getFullYear();
  const seqs = invoices
    .map((inv) => {
      const match = inv.invoiceNumber.match(/INV-(?:\d{4}-)?(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const normalSeqs = seqs.length < 100 ? seqs.filter((n) => n < 500) : seqs;
  const maxSeq = normalSeqs.length > 0 ? Math.max(...normalSeqs) : baseNumber;

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(3, '0');
  return `INV-${currentYear}-${padded}`;
}

/**
 * Converts any date representation (display format or ISO) into YYYY-MM-DD
 * for use with standard HTML5 <input type="date">.
 */
export function dateStringToIso(dateStr: string): string {
  if (!dateStr) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Converts a YYYY-MM-DD ISO date string to Indian business display format "17 Oct 2025".
 */
export function isoToDisplayDate(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  const date = new Date(isoStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return isoStr;
}

/**
 * Calculates a valid-until date given a start date and validity duration in days.
 */
export function calculateValidUntilDate(startDateStr: string, days = 30): string {
  const iso = dateStringToIso(startDateStr);
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
