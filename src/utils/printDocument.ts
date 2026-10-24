import {
  BusinessProfile,
  Customer,
  ExtraCharge,
  Invoice,
  InvoicePrintTemplate,
  PrintOptions,
  Quotation,
  QuotationItem,
  QuotationPrintTemplate,
  WorkshopCutItem,
} from '../types';
import { formatINR } from './calculations';
import { generateElevationSvgString } from './elevationSvg';

/**
 * Universal print handler that works in:
 * 1. Standard browser windows
 * 2. Sandboxed iframes (with graceful fallback to direct printable file download)
 * 3. Mobile browsers
 */
export function executePrint(printableElementId?: string): boolean {
  try {
    if (printableElementId) {
      const el = document.getElementById(printableElementId);
      if (el) {
        el.classList.add('printable-active');
      }
    }
    window.print();
    return true;
  } catch (err) {
    console.warn('Direct window.print() failed or was blocked by iframe environment', err);
    return false;
  }
}

/**
 * Download a standalone, self-contained printable HTML document
 * that can be opened in any browser and printed or saved as PDF cleanly.
 * Robust against argument order swapping.
 */
export function downloadPrintableHtml(param1: string, param2: string): void {
  try {
    let filename = param1;
    let htmlContent = param2;

    // Detect if param1 is HTML content and param2 is filename
    if (
      param1.includes('<html') ||
      param1.includes('<!DOCTYPE') ||
      param1.includes('<div') ||
      param1.includes('<table') ||
      param1.length > 250
    ) {
      htmlContent = param1;
      filename = param2;
    }

    const safeFilename =
      filename && filename.trim().length > 0
        ? filename.endsWith('.html')
          ? filename
          : `${filename}.html`
        : 'quotation-document.html';

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', safeFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to download printable HTML file', err);
  }
}

/**
 * Robust, bulletproof print dispatcher:
 * - Directly mounts into #applet-print-container and calls window.print() synchronously
 * - When printing is active, @media print hides the main app and renders only #applet-print-container
 * - If browser sandbox blocks window.print() (common in iframe environments without allow-modals),
 *   automatically downloads the clean, self-contained printable HTML file as a 100% reliable fallback!
 */
export function printDocument(
  htmlContent: string,
  filename: string = 'document.html'
): { success: boolean; fallbackDownloaded: boolean; message: string } {
  const safeFilename = filename.endsWith('.html') ? filename : `${filename}.html`;

  try {
    let printContainer = document.getElementById('applet-print-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'applet-print-container';
      document.body.appendChild(printContainer);
    }

    // Populate printable content into the container
    printContainer.innerHTML = htmlContent;
    document.body.classList.add('is-printing-active');

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.body.classList.remove('is-printing-active');
      if (printContainer) {
        printContainer.innerHTML = '';
      }
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });

    // Synchronously open native print dialog in direct user event context
    window.print();

    // Secondary cleanup after dialog returns in desktop browsers
    setTimeout(cleanup, 800);

    return {
      success: true,
      fallbackDownloaded: false,
      message: 'Print dialog opened.',
    };
  } catch (err: any) {
    console.warn('window.print() was blocked by browser sandbox/policy:', err);
    // Cleanup active print state if set
    document.body.classList.remove('is-printing-active');
    const printContainer = document.getElementById('applet-print-container');
    if (printContainer) {
      printContainer.innerHTML = '';
    }

    // Sandboxed iframes block window.print() with DOMException. Download the file as 100% reliable fallback!
    downloadPrintableHtml(safeFilename, htmlContent);
    return {
      success: true,
      fallbackDownloaded: true,
      message: 'Browser blocked popup print. Document was automatically downloaded for 1-click printing.',
    };
  }
}

/**
 * Print through a hidden iframe to bypass modal CSS (backward compatible wrapper)
 */
export function printViaHiddenIframe(htmlContent: string, filename?: string): boolean {
  const result = printDocument(htmlContent, filename || 'UPVC-Document.html');
  return result.success;
}

/**
 * Generates an official, beautiful standalone A4 printable HTML document for an Invoice
 */
export function generateInvoicePrintHtml(
  invoice: Invoice,
  profile: BusinessProfile,
  template: InvoicePrintTemplate = 'standard',
  options?: PrintOptions
): string {
  const isIntraState = !invoice.customer.gstin || invoice.customer.gstin.startsWith('27');
  const itemsSubtotal = invoice.items.reduce((acc, i) => acc + i.itemTotal, 0);
  const extraCharges = invoice.extraCharges || [];
  const extraChargesTotal = extraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const subtotal = itemsSubtotal + extraChargesTotal;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const grandTotal = subtotal + gst;

  const showBank = options?.showBankDetails !== false;
  const showPayments = options?.showPaymentHistory !== false && invoice.payments.length > 0;

  // --- ITEM ROWS FOR STANDARD & COMPACT ---
  const itemRows = invoice.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b;">Tag: <strong style="color: #1e40af;">${item.locationTag || 'General'}</strong> • ${item.profileBrand} • ${item.glassPackage}</div>
        </td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; white-space: nowrap;">${item.widthInInches}" × ${item.heightInInches}" <span style="font-size: 10px; color: #64748b;">(${Math.round(item.widthInInches * 25.4)}×${Math.round(item.heightInInches * 25.4)}mm)</span></td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${item.totalAreaSqFt.toFixed(1)}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${item.ratePerSqFt}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">₹${item.itemTotal.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const paymentRows = invoice.payments
    .map(
      (p) => `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${p.date}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${p.mode}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${p.refNo}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0;">${p.notes || '-'}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #047857; font-family: monospace;">₹${p.amount.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  // 1. ==================== COMPACT EXECUTIVE B2B INVOICE ====================
  if (template === 'compact') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoice.invoiceNumber}</title>
      <style>
        @page { size: A4; margin: 10mm 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11.5px; line-height: 1.35; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .font-mono { font-family: monospace; }
        .text-right { text-align: right; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 12px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; font-weight: 600; color: #1e40af;">
          📄 Executive B2B Commercial Invoice (${invoice.invoiceNumber})
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #2563eb; color: #ffffff; border: none; padding: 5px 12px; border-radius: 5px; font-size: 11px; font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          ${profile.companyLogoUrl ? `<img src="${profile.companyLogoUrl}" alt="${profile.shopName}" style="max-height: 38px; max-width: 140px; object-fit: contain; margin-bottom: 4px; display: block;" />` : ''}
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${profile.shopName}</div>
          <div style="font-size: 11px; color: #475569;">${profile.address}, ${profile.city} - ${profile.pinCode} | GSTIN: <strong style="color: #0f172a;">${profile.gstin}</strong></div>
          <div style="font-size: 11px; color: #475569;">Phone: ${profile.mobile} | Email: ${profile.email}</div>
        </div>
        <div style="text-align: right;">
          <div style="background: #0f172a; color: white; display: inline-block; padding: 3px 8px; font-weight: bold; font-size: 10px; border-radius: 4px; letter-spacing: 0.5px;">B2B TAX INVOICE</div>
          <div style="font-size: 17px; font-weight: 800; font-family: monospace; margin-top: 4px;">${invoice.invoiceNumber}</div>
          <div style="font-family: monospace; font-size: 10.5px; color: #475569; margin-top: 2px;">
            <div>Date: <strong>${invoice.date}</strong> | Due: <strong>${invoice.dueDate}</strong></div>
            ${invoice.quoteNumber ? `<div>Quote Ref: <strong>${invoice.quoteNumber}</strong></div>` : ''}
            <div>Status: <strong style="text-transform: uppercase; color: ${invoice.status === 'paid' ? '#047857' : '#b45309'};">${invoice.status}</strong></div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
        <div style="flex: 1;">
          <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Billed To / Buyer:</div>
          <div style="font-size: 13px; font-weight: bold;">${invoice.customer.companyName || invoice.customer.name}</div>
          <div style="font-size: 11px; color: #475569;">${invoice.customer.name} • ${invoice.customer.mobile}</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">Billing: ${invoice.customer.address}, ${invoice.customer.city}</div>
          <div style="font-family: monospace; font-weight: bold; color: #1e40af; font-size: 11px; margin-top: 2px;">GSTIN: ${invoice.customer.gstin || 'Unregistered'}</div>
        </div>
        <div style="flex: 1; border-left: 1px solid #e2e8f0; padding-left: 12px;">
          <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Shipped To / Consignee:</div>
          <div style="font-size: 11.5px; font-weight: 600; color: #0f172a;">${invoice.customer.shippingAddress || invoice.customer.address}</div>
          <div style="font-size: 11px; color: #475569;">City: ${invoice.customer.shippingCity || invoice.customer.city}</div>
          ${(invoice.customer.sameAsBilling !== false && (!invoice.customer.shippingAddress || invoice.customer.shippingAddress === invoice.customer.address)) ? '<div style="font-size: 9.5px; color: #2563eb; font-weight: 600; margin-top: 1px;">(Same as Billing Address)</div>' : ''}
          <div style="font-size: 10.5px; color: #047857; font-weight: bold; margin-top: 2px;">
            HSN: 76101000 • ${isIntraState ? 'Intra-State (CGST 9% + SGST 9%)' : 'Inter-State (IGST 18%)'}
          </div>
        </div>
      </div>

      <table style="margin-bottom: 12px;">
        <thead>
          <tr style="background: #0f172a; color: white; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 6px 8px; text-align: center; width: 28px;">#</th>
            <th style="padding: 6px 8px; text-align: left;">Item Description &amp; Tag</th>
            <th style="padding: 6px 8px; text-align: left;">Dimensions</th>
            <th style="padding: 6px 8px; text-align: center; width: 40px;">Qty</th>
            <th style="padding: 6px 8px; text-align: right;">Area (Sq.Ft)</th>
            <th style="padding: 6px 8px; text-align: right;">Rate (₹)</th>
            <th style="padding: 6px 8px; text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
          ${
            showBank
              ? `
            <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Bank Settlement Details:</div>
            <div style="font-size: 10.5px; line-height: 1.4;">
              <div>Bank: <strong>${profile.bankName}</strong></div>
              <div>A/C: <strong class="font-mono">${profile.accountNo}</strong> | IFSC: <strong class="font-mono">${profile.ifscCode}</strong></div>
              <div>UPI ID: <strong class="font-mono" style="color: #047857;">${profile.upiId}</strong></div>
            </div>
            `
              : ''
          }
          ${
            (invoice.notes || '').trim()
              ? `
          <div style="font-size: 10px; color: #1e293b; margin-top: 6px; border-top: 1px solid #cbd5e1; padding-top: 5px; white-space: pre-wrap;">
            <strong>Special Terms &amp; Notes:</strong> ${(invoice.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          `
              : `
          <div style="font-size: 10px; color: #64748b; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            10-Year UPVC Profile Warranty against discoloration. Class A DIN EN 12608.
          </div>
          `
          }
        </div>

        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
          <table style="font-size: 10.5px;">
            <tr>
              <td>Material Subtotal:</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${itemsSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${extraCharges
              .map(
                (c) => `<tr><td>${c.label || 'Extra'}:</td><td class="text-right font-mono" style="font-weight: 600;">₹${(Number(c.amount) || 0).toLocaleString('en-IN')}</td></tr>`
              )
              .join('')}
            <tr>
              <td style="border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Subtotal:</td>
              <td class="text-right font-mono" style="border-top: 1px solid #e2e8f0; font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>${isIntraState ? 'CGST (9%) + SGST (9%)' : 'IGST (18%)'}:</td>
              <td class="text-right font-mono">₹${gst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 1px solid #0f172a; font-weight: bold; font-size: 12px;">
              <td>Invoice Total:</td>
              <td class="text-right font-mono" style="color: #1e3a8a;">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="color: #047857; font-weight: 600;">
              <td>Payments Received:</td>
              <td class="text-right font-mono">-₹${invoice.advanceReceived.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 13px; color: #b45309;">
              <td>BALANCE DUE:</td>
              <td class="text-right font-mono">₹${invoice.balanceDue.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>

      ${
        showPayments
          ? `
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 800; font-size: 10px; text-transform: uppercase; color: #475569; margin-bottom: 3px;">Payment Receipts</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; font-size: 9.5px; text-transform: uppercase;">
              <th style="padding: 4px 8px; text-align: left;">Date</th>
              <th style="padding: 4px 8px; text-align: left;">Mode</th>
              <th style="padding: 4px 8px; text-align: left;">Ref / UTR</th>
              <th style="padding: 4px 8px; text-align: left;">Notes</th>
              <th style="padding: 4px 8px; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
      </div>
      `
          : ''
      }

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 10.5px;">
        <div>Customer Signature: __________________</div>
        <div class="text-right">For <strong>${profile.shopName}</strong>: Authorized Signatory</div>
      </div>
    </body>
    </html>
    `;
  }

  // 2. ==================== PREMIUM LUXURY BRANDED BILL ====================
  if (template === 'premium') {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tax Invoice - ${invoice.invoiceNumber}</title>
      <style>
        @page { size: A4; margin: 10mm 14mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 12px; line-height: 1.4; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .font-mono { font-family: monospace; }
        .text-right { text-align: right; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 14px; padding: 8px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 12px; font-weight: 600; color: #1e40af;">
          ✨ Luxury Branded Tax Bill (${invoice.invoiceNumber})
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #1e3a8a; color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <!-- Luxury Navy & Gold Header -->
      <div style="background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 100%); color: white; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; border-bottom: 3px solid #f59e0b; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; items-center; gap: 12px;">
            ${profile.companyLogoUrl ? `<img src="${profile.companyLogoUrl}" alt="${profile.shopName}" style="max-height: 46px; max-width: 140px; object-fit: contain; background: white; border-radius: 6px; padding: 3px; display: inline-block; vertical-align: middle; margin-right: 10px;" />` : ''}
            <div style="display: inline-block; vertical-align: middle;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; color: #ffffff;">${profile.shopName}</h1>
              <div style="color: #93c5fd; font-size: 12px; font-weight: 600;">${profile.tagline}</div>
            </div>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; margin-top: 6px;">
            ${profile.address}, ${profile.city}, ${profile.state} - ${profile.pinCode} | GSTIN: <strong style="color: #ffffff;">${profile.gstin}</strong>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; font-family: monospace;">
            Phone: ${profile.mobile} • Email: ${profile.email}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; background: #f59e0b; color: #0b1329; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            OFFICIAL TAX BILL
          </div>
          <div style="font-size: 20px; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 6px;">${invoice.invoiceNumber}</div>
          <div style="font-size: 11px; color: #93c5fd; font-family: monospace; margin-top: 3px;">
            <div>Invoice Date: <strong>${invoice.date}</strong></div>
            <div>Due Date: <strong>${invoice.dueDate}</strong></div>
            <div style="margin-top: 3px;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; background: ${
                invoice.status === 'paid' ? '#059669' : invoice.status === 'partially_paid' ? '#d97706' : '#dc2626'
              }; color: white;">${invoice.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 14px; margin-bottom: 16px;">
        <div class="card" style="flex: 1;">
          <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Billed To / Recipient:</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${invoice.customer.companyName || invoice.customer.name}</div>
          <div style="font-size: 11px; color: #475569;">Contact: ${invoice.customer.name} • ${invoice.customer.mobile}</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">Billing: ${invoice.customer.address}, ${invoice.customer.city}</div>
          <div style="font-family: monospace; font-weight: bold; color: #1e40af; margin-top: 4px; font-size: 11px;">GSTIN: ${invoice.customer.gstin || 'Unregistered Consumer'}</div>
        </div>

        <div class="card" style="flex: 1;">
          <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Shipped To / Consignee:</div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${invoice.customer.shippingAddress || invoice.customer.address}</div>
          <div style="font-size: 11px; color: #475569; font-weight: 600;">City: ${invoice.customer.shippingCity || invoice.customer.city}</div>
          ${(invoice.customer.sameAsBilling !== false && (!invoice.customer.shippingAddress || invoice.customer.shippingAddress === invoice.customer.address)) ? '<div style="font-size: 9.5px; color: #2563eb; font-weight: 600; margin-top: 1px;">(Same as Billing Address)</div>' : ''}
          <div style="font-size: 11px; color: #047857; font-weight: bold; margin-top: 3px;">
            ${isIntraState ? 'CGST 9% + SGST 9% (Intra-State)' : 'IGST 18% (Inter-State)'} • HSN 76101000
          </div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <table>
          <thead>
            <tr style="background: #1e3a8a; color: white; font-size: 10.5px; text-transform: uppercase;">
              <th style="padding: 8px 10px; text-align: center; border-radius: 6px 0 0 0;">#</th>
              <th style="padding: 8px 10px; text-align: left;">Product &amp; Specification</th>
              <th style="padding: 8px 10px; text-align: left;">Dimensions</th>
              <th style="padding: 8px 10px; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; text-align: right;">Area (Sq.Ft)</th>
              <th style="padding: 8px 10px; text-align: right;">Rate (₹)</th>
              <th style="padding: 8px 10px; text-align: right; border-radius: 0 6px 0 0;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div style="display: flex; gap: 14px; margin-bottom: 16px;">
        <div class="card" style="flex: 1;">
          ${
            showBank
              ? `
            <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">Bank Settlement Details:</div>
            <div style="font-size: 11px; line-height: 1.5;">
              <div>Bank: <strong>${profile.bankName}</strong></div>
              <div>A/C Number: <strong class="font-mono">${profile.accountNo}</strong></div>
              <div>IFSC Code: <strong class="font-mono">${profile.ifscCode}</strong></div>
              <div>UPI ID: <strong class="font-mono" style="color: #047857;">${profile.upiId}</strong></div>
            </div>
            `
              : ''
          }
          ${
            (invoice.notes || '').trim()
              ? `
          <div style="font-size: 10px; color: #1e293b; margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 6px; white-space: pre-wrap;">
            <strong>Special Terms &amp; Notes:</strong> ${(invoice.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          `
              : `
          <div style="font-size: 10px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            🎖️ <strong>10-Year Warranty Certificate:</strong> High-Gloss UV Stabilized DIN EN 12608 Class A UPVC Profile extrusions. 1-Year hardware warranty.
          </div>
          `
          }
        </div>

        <div class="card" style="flex: 1; border: 1.5px solid #cbd5e1;">
          <table style="font-size: 11px;">
            <tr>
              <td style="padding: 4px 0;">Material &amp; Fabrication:</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${itemsSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${extraCharges
              .map(
                (c) => `<tr><td style="padding: 4px 0;">${c.label || 'Additional Charge'}:</td><td class="text-right font-mono" style="font-weight: 600;">₹${(Number(c.amount) || 0).toLocaleString('en-IN')}</td></tr>`
              )
              .join('')}
            <tr>
              <td style="padding: 4px 0; border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Subtotal:</td>
              <td class="text-right font-mono" style="font-weight: 600; border-top: 1px solid #e2e8f0;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">${isIntraState ? 'CGST (9%) + SGST (9%)' : 'IGST (18%)'}:</td>
              <td class="text-right font-mono">₹${gst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1; font-weight: bold; font-size: 13px;">
              <td style="padding: 6px 0;">Grand Total Invoice:</td>
              <td class="text-right font-mono" style="color: #1e3a8a;">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="color: #047857; font-weight: 600;">
              <td style="padding: 4px 0;">Payments Received:</td>
              <td class="text-right font-mono">-₹${invoice.advanceReceived.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 15px; color: #b45309;">
              <td style="padding: 6px 0;">NET AMOUNT DUE:</td>
              <td class="text-right font-mono">₹${invoice.balanceDue.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>

      ${
        showPayments
          ? `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase; color: #475569; margin-bottom: 4px;">Verified Payment Ledger</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Date</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Mode</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Reference / UTR</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Remarks</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
      </div>
      `
          : ''
      }

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 11px;">
        <div>
          <div>Customer Signature</div>
          <div style="margin-top: 26px; font-weight: 600;">Authorized Signatory</div>
        </div>
        <div class="text-right">
          <div>For <strong>${profile.shopName}</strong></div>
          <div style="margin-top: 26px; font-weight: 600;">Proprietor / Authorized Partner</div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // 3. ==================== STANDARD GST TAX INVOICE (DEFAULT) ====================
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tax Invoice - ${invoice.invoiceNumber}</title>
      <style>
        @page { size: A4; margin: 12mm 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 4px 10px; font-weight: bold; border-radius: 4px; font-size: 11px; text-transform: uppercase; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${profile.companyLogoUrl ? `<img src="${profile.companyLogoUrl}" alt="${profile.shopName}" style="max-height: 48px; max-width: 160px; object-fit: contain; margin-bottom: 6px; display: block;" />` : ''}
          <h1 style="margin: 0; font-size: 20px; color: #0f172a;">${profile.shopName}</h1>
          <div style="font-weight: 600; color: #1d4ed8; font-size: 12px;">${profile.tagline}</div>
          <div style="color: #475569; font-size: 11px; margin-top: 4px;">${profile.address}, ${profile.city}, ${profile.state} - ${profile.pinCode}</div>
          <div style="color: #475569; font-size: 11px; font-family: monospace;">Phone: ${profile.mobile} | Email: ${profile.email}</div>
          <div style="margin-top: 4px;"><span class="badge" style="background: #e2e8f0; color: #0f172a;">GSTIN: ${profile.gstin}</span></div>
        </div>
        <div class="text-right">
          <div class="badge" style="background: #1e3a8a; color: white;">ORIGINAL TAX INVOICE</div>
          <div style="font-size: 18px; font-weight: bold; font-family: monospace; margin-top: 6px;">${invoice.invoiceNumber}</div>
          <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 4px;">
            <div>Date: <strong>${invoice.date}</strong></div>
            <div>Due Date: <strong>${invoice.dueDate}</strong></div>
            ${invoice.quoteNumber ? `<div>Quote Ref: <strong>${invoice.quoteNumber}</strong></div>` : ''}
            <div>Status: <strong style="text-transform: uppercase;">${invoice.status}</strong></div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div class="box" style="flex: 1;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Billed To / Buyer Details:</div>
          <div style="font-size: 14px; font-weight: bold;">${invoice.customer.companyName || invoice.customer.name}</div>
          ${invoice.customer.companyName ? `<div style="font-size: 11px;">Contact: ${invoice.customer.name}</div>` : ''}
          <div style="font-family: monospace; font-size: 11px;">Phone: ${invoice.customer.mobile}</div>
          <div style="font-size: 11.5px; color: #334155; margin-top: 3px;">Billing Address: ${invoice.customer.address}, ${invoice.customer.city}</div>
          <div style="font-family: monospace; font-weight: bold; color: #1e40af; margin-top: 4px;">GSTIN: ${invoice.customer.gstin || 'Unregistered Consumer'}</div>
        </div>

        <div class="box" style="flex: 1;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Shipped To / Consignee:</div>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${invoice.customer.shippingAddress || invoice.customer.address}</div>
          <div style="font-weight: 600; font-size: 11px; margin-top: 4px;">City / State: ${invoice.customer.shippingCity || invoice.customer.city}</div>
          ${(invoice.customer.sameAsBilling !== false && (!invoice.customer.shippingAddress || invoice.customer.shippingAddress === invoice.customer.address)) ? '<div style="font-size: 9.5px; color: #2563eb; font-weight: 600; margin-top: 2px;">(Same as Billing Address)</div>' : ''}
          <div style="font-size: 11px; color: #047857; font-weight: bold; margin-top: 4px;">
            ${isIntraState ? 'Tax Type: Intra-State (CGST 9% + SGST 9%)' : 'Tax Type: Inter-State (IGST 18%)'} • HSN: 76101000
          </div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #334155;">Fenestration Item Schedule</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 10.5px; text-transform: uppercase; color: #475569;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">#</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Product &amp; Specification</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Dimensions</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Area (Sq.Ft)</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Rate (₹)</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div class="box" style="flex: 1;">
          ${
            showBank
              ? `
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Bank Settlement Details:</div>
          <div style="font-size: 11px; line-height: 1.5;">
            <div>Bank: <strong>${profile.bankName}</strong></div>
            <div>A/C Number: <strong class="font-mono">${profile.accountNo}</strong></div>
            <div>IFSC Code: <strong class="font-mono">${profile.ifscCode}</strong></div>
            <div>UPI ID: <strong class="font-mono" style="color: #047857;">${profile.upiId}</strong></div>
          </div>
          `
              : ''
          }
          ${
            (invoice.notes || '').trim()
              ? `
          <div style="font-size: 10px; color: #1e293b; margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 6px; white-space: pre-wrap;">
            <strong>Special Terms &amp; Notes:</strong> ${(invoice.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          `
              : `
          <div style="font-size: 10px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            10-Year UPVC Profile Warranty against discoloration. 1-Year hardware warranty.
          </div>
          `
          }
        </div>

        <div class="box" style="flex: 1;">
          <table style="font-size: 11px;">
            <tr>
              <td style="padding: 4px 0;">Material &amp; Fabrication:</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${itemsSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${extraCharges
              .map(
                (c) => `
              <tr>
                <td style="padding: 4px 0; color: #334155;">${c.label || 'Additional Charge'}:</td>
                <td class="text-right font-mono" style="font-weight: 600;">₹${(Number(c.amount) || 0).toLocaleString('en-IN')}</td>
              </tr>
            `
              )
              .join('')}
            <tr>
              <td style="padding: 4px 0; border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Value (Subtotal):</td>
              <td class="text-right font-mono" style="font-weight: 600; border-top: 1px solid #e2e8f0;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${
              isIntraState
                ? `
            <tr>
              <td style="padding: 4px 0;">CGST (9.0%):</td>
              <td class="text-right font-mono">₹${(gst / 2).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">SGST (9.0%):</td>
              <td class="text-right font-mono">₹${(gst / 2).toLocaleString('en-IN')}</td>
            </tr>
            `
                : `
            <tr>
              <td style="padding: 4px 0;">IGST (18.0%):</td>
              <td class="text-right font-mono">₹${gst.toLocaleString('en-IN')}</td>
            </tr>
            `
            }
            <tr style="border-top: 1px solid #cbd5e1; font-weight: bold; font-size: 13px;">
              <td style="padding: 6px 0;">Total Invoice Amount:</td>
              <td class="text-right font-mono" style="color: #1e3a8a;">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="color: #047857; font-weight: 600;">
              <td style="padding: 4px 0;">Advance / Payments Received:</td>
              <td class="text-right font-mono">-₹${invoice.advanceReceived.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 14px; color: #b45309;">
              <td style="padding: 6px 0;">NET BALANCE DUE:</td>
              <td class="text-right font-mono">₹${invoice.balanceDue.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>

      ${
        showPayments
          ? `
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 10.5px; text-transform: uppercase; color: #475569; margin-bottom: 4px;">Payment History Ledger</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; font-size: 10px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Date</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Mode</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Ref / UTR</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: left;">Remarks</th>
              <th style="padding: 6px 10px; border-bottom: 1px solid #cbd5e1; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 11px;">
        <div>
          <div>Customer Signature</div>
          <div style="margin-top: 30px; font-weight: 600;">Authorized Signatory</div>
        </div>
        <div class="text-right">
          <div>For <strong>${profile.shopName}</strong></div>
          <div style="margin-top: 30px; font-weight: 600;">Proprietor / Authorized Partner</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates official printable HTML for a Quotation with multiple template choices
 */
export function generateQuotationPrintHtml(
  quoteNumber: string,
  date: string,
  validUntil: string,
  customer: Customer,
  items: QuotationItem[],
  profile: BusinessProfile,
  extraCharges: ExtraCharge[] = [],
  template: QuotationPrintTemplate = 'architectural',
  options?: PrintOptions
): string {
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalArea = items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);

  const anyFitting = items.some((i) => i.accessories.siteFitting);
  const siteFittingTotal = items.reduce(
    (sum, i) =>
      sum + (i.accessories.siteFitting ? i.totalAreaSqFt * (i.fittingCostPerSqFt ?? 40) : 0),
    0
  );
  const materialBaseTotal = items.reduce((sum, i) => {
    const fittingCost = i.accessories.siteFitting ? i.totalAreaSqFt * (i.fittingCostPerSqFt ?? 40) : 0;
    return sum + (i.itemTotal - fittingCost);
  }, 0);
  const extraChargesTotal = extraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const taxableSubtotal = materialBaseTotal + siteFittingTotal + extraChargesTotal;
  const gst = Math.round(taxableSubtotal * 0.18 * 100) / 100;
  const grandTotal = taxableSubtotal + gst;

  const showCad = options?.showCadDiagrams !== false;
  const showBank = options?.showBankDetails !== false;
  const showTerms = options?.showTerms !== false;

  const fittingScopeText = anyFitting
    ? siteFittingTotal === 0
      ? 'Site Installation & Weather Sealing (Included Free in Scope)'
      : `On-Site Fitting & Silicone Sealing Included (₹${siteFittingTotal.toLocaleString('en-IN')})`
    : 'Supply Only (No on-site fitting)';

  // =========================================================================
  // 1. WORKSHOP FABRICATION & SITE INSTALLATION SLIP (NO PRICES / FINANCES!)
  // =========================================================================
  if (template === 'workshop') {
    const workshopRows = items
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 8px 6px; border-bottom: 1.5px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 800; font-size: 13px; color: #1e3a8a;">
            #${idx + 1}
            <div style="font-size: 10px; font-weight: bold; background: #e0f2fe; color: #0369a1; border-radius: 4px; padding: 2px 4px; margin-top: 4px;">
              ${item.locationTag || 'General'}
            </div>
          </td>
          <td style="padding: 8px 6px; border-bottom: 1.5px solid #cbd5e1; text-align: center; width: 170px;">
            <div style="width: 160px; height: 115px; margin: 0 auto; background: #ffffff; border: 1.5px solid #94a3b8; border-radius: 6px; padding: 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
              ${generateElevationSvgString(item)}
            </div>
            <div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 3px;">
              ${item.widthInInches}" W × ${item.heightInInches}" H
            </div>
            <div style="font-family: monospace; font-size: 10px; color: #0284c7; font-weight: bold;">
              (${Math.round(item.widthInInches * 25.4)} mm × ${Math.round(item.heightInInches * 25.4)} mm)
            </div>
          </td>
          <td style="padding: 8px 10px; border-bottom: 1.5px solid #cbd5e1;">
            <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${item.name}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              <strong>Typology:</strong> ${item.typologyId} • <strong>Category:</strong> ${item.category}
            </div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              <strong>Profile:</strong> ${item.profileBrand} (Color: ${item.colorFoil || 'White'})
            </div>
            <div style="font-size: 11px; color: #0369a1; font-weight: 600; margin-top: 2px;">
              <strong>Glass:</strong> ${item.glassPackage}
            </div>
            <div style="font-size: 10.5px; color: #475569; margin-top: 2px;">
              ${item.accessories.mosquitoMesh ? '✓ SS304 Mesh Included' : '✕ No Mesh'} • 
              ${item.accessories.siteFitting ? '✓ Site Fitting Required' : '✕ Supply Only'} • 
              Weld Allowance: 6mm
            </div>
          </td>
          <td style="padding: 8px 8px; border-bottom: 1.5px solid #cbd5e1; text-align: center; font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a;">
            ${item.quantity}
          </td>
          <td style="padding: 8px 8px; border-bottom: 1.5px solid #cbd5e1; text-align: center; font-family: monospace; font-size: 12px; font-weight: 600;">
            ${item.totalAreaSqFt.toFixed(1)} sq.ft
          </td>
          <td style="padding: 8px 8px; border-bottom: 1.5px solid #cbd5e1; vertical-align: middle;">
            <div style="font-size: 10px; line-height: 1.8; color: #334155;">
              <div>[ ] Profiles Cut &amp; Welded</div>
              <div>[ ] Hardware Assembled</div>
              <div>[ ] Glazed &amp; Gasketed</div>
              <div>[ ] QC &amp; Label Attached</div>
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Workshop Slip - ${quoteNumber}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11.5px; line-height: 1.35; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .font-mono { font-family: monospace; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 12px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; font-weight: 700; color: #1e40af;">
          🔨 Workshop Fabrication &amp; Site Installation Slip (${quoteNumber}) — <span style="color: #047857;">Zero Pricing Protected</span>
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #0f172a; color: #ffffff; border: none; padding: 5px 14px; border-radius: 5px; font-size: 11px; font-weight: 700;">
          🖨️ Print Workshop Slip
        </button>
      </div>

      <!-- Workshop Header -->
      <div style="background: #0f172a; color: white; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 16px; font-weight: 800; letter-spacing: 0.5px;">WORKSHOP FABRICATION &amp; SITE INSTALLATION SLIP</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
            Shop: <strong>${profile.shopName}</strong> • Phone: ${profile.mobile}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #cbd5e1;">Order / Quote Ref:</div>
          <div style="font-size: 17px; font-weight: 800; font-family: monospace; color: #38bdf8;">${quoteNumber}</div>
          <div style="font-size: 10.5px; color: #94a3b8;">Job Date: ${date}</div>
        </div>
      </div>

      <!-- Client & Site Info Bar -->
      <div style="display: flex; gap: 12px; margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
        <div style="flex: 1;">
          <span style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Customer / Site Contact:</span>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${customer.companyName || customer.name} (${customer.name})</div>
          <div style="font-size: 11px; color: #334155; font-family: monospace;">Phone: <strong>${customer.mobile}</strong></div>
        </div>
        <div style="flex: 1.5; border-left: 1px solid #e2e8f0; padding-left: 12px;">
          <span style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Installation Site Address:</span>
          <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${customer.address}, ${customer.city}</div>
          <div style="font-size: 10.5px; color: #0369a1; font-weight: bold; margin-top: 2px;">
            Scope: ${fittingScopeText} • Total Units: ${totalUnits} Units (${totalArea.toFixed(1)} Sq.Ft)
          </div>
        </div>
      </div>

      <!-- Fabrication Schedule -->
      <table style="margin-bottom: 12px;">
        <thead>
          <tr style="background: #1e293b; color: white; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 6px 8px; text-align: center; width: 45px;">Tag / #</th>
            <th style="padding: 6px 8px; text-align: center; width: 170px;">Elevation CAD &amp; Dimensions</th>
            <th style="padding: 6px 10px; text-align: left;">Product Typology &amp; Extrusion Specifications</th>
            <th style="padding: 6px 8px; text-align: center; width: 35px;">Qty</th>
            <th style="padding: 6px 8px; text-align: center; width: 65px;">Total Area</th>
            <th style="padding: 6px 8px; text-align: left; width: 160px;">Workshop Production QC</th>
          </tr>
        </thead>
        <tbody>${workshopRows}</tbody>
      </table>

      <!-- Site Installation & QC Checklist -->
      <div style="display: flex; gap: 12px; margin-bottom: 14px;">
        <div style="flex: 2; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">
            On-Site Installation &amp; Inspection Quality Checklist:
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10.5px; color: #334155;">
            <div>[ ] Wall opening plumb &amp; diagonal verified (< 3mm)</div>
            <div>[ ] Fasteners anchored with nylon plugs at 300mm pitch</div>
            <div>[ ] EPDM weather gasket seated continuously</div>
            <div>[ ] External neutral-cure silicone weather seal applied</div>
            <div>[ ] Sash alignment &amp; multi-point locking verified</div>
            <div>[ ] Protective tape intact until client handover</div>
          </div>
        </div>

        <div style="flex: 1; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; display: flex; flex-col; justify-content: space-between;">
          <div>
            <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">Sign-Offs:</div>
            <div style="font-size: 10px; color: #475569; margin-top: 15px;">Workshop Fabricator: ___________________</div>
            <div style="font-size: 10px; color: #475569; margin-top: 15px;">Site Fitting Lead: ___________________</div>
          </div>
          <div style="font-size: 10px; color: #475569; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Client Site Sign-Off: ___________________
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // =========================================================================
  // 2. COMPACT EXECUTIVE B2B / CONTRACTOR SCHEDULE
  // =========================================================================
  if (template === 'compact') {
    const compactRows = items
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: bold;">${idx + 1}</td>
          ${
            showCad
              ? `
          <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; width: 85px;">
            <div style="width: 78px; height: 56px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
              ${generateElevationSvgString(item)}
            </div>
          </td>
          `
              : ''
          }
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
            <div style="font-size: 10.5px; color: #475569;">
              Tag: <strong style="color: #1e40af;">${item.locationTag || 'General'}</strong> • ${item.profileBrand} • ${item.glassPackage}
              ${item.accessories.mosquitoMesh ? ' • SS304 Mesh' : ''}
              ${item.accessories.siteFitting ? ' • Fitting Included' : ' • Supply Only'}
            </div>
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; white-space: nowrap;">
            ${item.widthInInches}" × ${item.heightInInches}"
            <div style="font-size: 9.5px; color: #64748b;">${Math.round(item.widthInInches * 25.4)}×${Math.round(item.heightInInches * 25.4)}mm</div>
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${item.totalAreaSqFt.toFixed(1)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${item.ratePerSqFt}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">₹${item.itemTotal.toLocaleString('en-IN')}</td>
        </tr>
      `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quotation - ${quoteNumber}</title>
      <style>
        @page { size: A4; margin: 10mm 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11.5px; line-height: 1.35; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .font-mono { font-family: monospace; }
        .text-right { text-align: right; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 12px; padding: 8px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; font-weight: 600; color: #1e40af;">
          📋 Executive B2B Quotation Schedule (${quoteNumber})
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #2563eb; color: #ffffff; border: none; padding: 5px 12px; border-radius: 5px; font-size: 11px; font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          ${profile.companyLogoUrl ? `<img src="${profile.companyLogoUrl}" alt="${profile.shopName}" style="max-height: 38px; max-width: 140px; object-fit: contain; margin-bottom: 4px; display: block;" />` : ''}
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${profile.shopName}</div>
          <div style="font-size: 11px; color: #475569;">${profile.address}, ${profile.city} - ${profile.pinCode} | GSTIN: <strong style="color: #0f172a;">${profile.gstin}</strong></div>
          <div style="font-size: 11px; color: #475569;">Phone: ${profile.mobile} | Email: ${profile.email}</div>
        </div>
        <div style="text-align: right;">
          <div style="background: #0f172a; color: white; display: inline-block; padding: 3px 8px; font-weight: bold; font-size: 10px; border-radius: 4px; letter-spacing: 0.5px;">ESTIMATE / QUOTATION</div>
          <div style="font-size: 17px; font-weight: 800; font-family: monospace; margin-top: 4px;">${quoteNumber}</div>
          <div style="font-family: monospace; font-size: 10.5px; color: #475569; margin-top: 2px;">
            <div>Date: <strong>${date}</strong> | Valid: <strong>${validUntil}</strong></div>
            <div>Tier: <strong>${profile.rateTier}</strong></div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
        <div style="flex: 1;">
          <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Quotation Issued To:</div>
          <div style="font-size: 13px; font-weight: bold;">${customer.companyName || customer.name}</div>
          <div style="font-size: 11px; color: #475569;">${customer.name} • ${customer.mobile}</div>
          <div style="font-family: monospace; font-weight: bold; color: #1e40af; font-size: 11px;">GSTIN: ${customer.gstin || 'None'}</div>
        </div>
        <div style="flex: 1; border-left: 1px solid #e2e8f0; padding-left: 12px;">
          <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Site Address &amp; Scope:</div>
          <div style="font-size: 11.5px;">${customer.address}, ${customer.city}</div>
          <div style="font-size: 10.5px; color: #047857; font-weight: bold; margin-top: 2px;">
            ${fittingScopeText} • Total: ${totalUnits} Units (${totalArea.toFixed(1)} Sq.Ft)
          </div>
        </div>
      </div>

      <table style="margin-bottom: 12px;">
        <thead>
          <tr style="background: #0f172a; color: white; font-size: 10px; text-transform: uppercase;">
            <th style="padding: 6px 8px; text-align: center; width: 28px;">#</th>
            ${showCad ? '<th style="padding: 6px 8px; text-align: center; width: 85px;">CAD View</th>' : ''}
            <th style="padding: 6px 8px; text-align: left;">Product Specification &amp; Tag</th>
            <th style="padding: 6px 8px; text-align: left;">Dimensions</th>
            <th style="padding: 6px 8px; text-align: center; width: 36px;">Qty</th>
            <th style="padding: 6px 8px; text-align: right;">Area (Sq.Ft)</th>
            <th style="padding: 6px 8px; text-align: right;">Rate (₹)</th>
            <th style="padding: 6px 8px; text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>${compactRows}</tbody>
      </table>

      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
          <div style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Milestones &amp; Terms:</div>
          <div style="font-size: 10.5px; line-height: 1.4;">
            <div>• <strong>50% Advance</strong> upon booking confirmation</div>
            <div>• <strong>40% Dispatch</strong> upon fabrication inspection</div>
            <div>• <strong>10% Handover</strong> on site installation completion</div>
          </div>
          ${
            showBank
              ? `
          <div style="font-size: 10px; color: #334155; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Bank: <strong>${profile.bankName}</strong> | A/C: <span class="font-mono">${profile.accountNo}</span> | IFSC: <span class="font-mono">${profile.ifscCode}</span> | UPI: <span class="font-mono" style="color: #047857;">${profile.upiId}</span>
          </div>
          `
              : ''
          }
          ${
            (quotation.notes || '').trim()
              ? `
          <div style="font-size: 10px; color: #1e293b; margin-top: 6px; border-top: 1px solid #cbd5e1; padding-top: 4px; white-space: pre-wrap;">
            <strong>Special Terms &amp; Remarks:</strong> ${(quotation.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          `
              : ''
          }
        </div>

        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px;">
          <table style="font-size: 10.5px;">
            <tr>
              <td>Material Base Total:</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${materialBaseTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Site Fitting &amp; Silicone:</td>
              <td class="text-right font-mono" style="font-weight: 600; color: ${siteFittingTotal === 0 ? '#047857' : '#0f172a'};">
                ${siteFittingTotal === 0 ? '₹0 (Free / Included)' : `₹${siteFittingTotal.toLocaleString('en-IN')}`}
              </td>
            </tr>
            ${extraCharges
              .map(
                (c) => `<tr><td>${c.label || 'Extra'}:</td><td class="text-right font-mono" style="font-weight: 600;">₹${(Number(c.amount) || 0).toLocaleString('en-IN')}</td></tr>`
              )
              .join('')}
            <tr>
              <td style="border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Subtotal:</td>
              <td class="text-right font-mono" style="border-top: 1px solid #e2e8f0; font-weight: 600;">₹${taxableSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>GST (18% Integrated / CGST+SGST):</td>
              <td class="text-right font-mono">₹${gst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 13px; color: #047857;">
              <td>GRAND TOTAL (INR ₹):</td>
              <td class="text-right font-mono">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 8px; border-top: 1px solid #cbd5e1; font-size: 10.5px;">
        <div>Customer Approval / Signature: __________________</div>
        <div class="text-right">For <strong>${profile.shopName}</strong>: Authorized Signatory</div>
      </div>
    </body>
    </html>
    `;
  }

  // =========================================================================
  // 3. LUXURY VILLA / CLIENT PRESENTATION PROPOSAL
  // =========================================================================
  if (template === 'premium') {
    const luxuryRows = items
      .map(
        (item, idx) => `
        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; display: flex; gap: 16px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="text-align: center; width: 160px; shrink: 0;">
            <div style="width: 155px; height: 115px; margin: 0 auto; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">
              ${generateElevationSvgString(item)}
            </div>
            <div style="font-family: monospace; font-size: 11px; font-weight: 800; color: #1e3a8a; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; margin: 4px auto 0 auto; display: inline-block;">
              ${item.widthInInches}" W × ${item.heightInInches}" H
            </div>
          </div>

          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span style="background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">Item #${idx + 1}</span>
                <span style="background: #e0f2fe; color: #0284c7; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Tag: ${item.locationTag || 'General Area'}</span>
                <h3 style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #0f172a;">${item.name}</h3>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 16px; font-weight: 800; font-family: monospace; color: #0f172a;">₹${item.itemTotal.toLocaleString('en-IN')}</div>
                <div style="font-size: 10.5px; color: #64748b; font-family: monospace;">₹${item.ratePerSqFt}/sq.ft • Qty: ${item.quantity}</div>
              </div>
            </div>

            <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px;">
              <span style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 5px; color: #334155;">
                <strong>Profile:</strong> ${item.profileBrand} (${item.colorFoil || 'White'})
              </span>
              <span style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 5px; color: #334155;">
                <strong>Glass:</strong> ${item.glassPackage}
              </span>
              ${item.accessories.mosquitoMesh ? '<span style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 5px; color: #065f46; font-weight: 600;">✓ SS304 Mosquito Mesh</span>' : ''}
              ${item.accessories.siteFitting ? '<span style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 5px; color: #1e40af; font-weight: 600;">✓ Weather Seal Fitting</span>' : ''}
            </div>

            <div style="margin-top: 6px; font-size: 10.5px; color: #64748b;">
              Total Area: <strong style="color: #0f172a;">${item.totalAreaSqFt.toFixed(1)} Sq.Ft</strong> • Dimensions in mm: <span style="font-family: monospace;">${Math.round(item.widthInInches * 25.4)} mm × ${Math.round(item.heightInInches * 25.4)} mm</span>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Luxury Proposal - ${quoteNumber}</title>
      <style>
        @page { size: A4; margin: 10mm 14mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 12px; line-height: 1.4; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .font-mono { font-family: monospace; }
        .text-right { text-align: right; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 14px; padding: 8px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 12px; font-weight: 600; color: #1e40af;">
          ✨ Luxury Villa / Client Presentation Proposal (${quoteNumber})
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #1e3a8a; color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <!-- Luxury Navy & Gold Header -->
      <div style="background: linear-gradient(135deg, #0b1329 0%, #1e3a8a 100%); color: white; border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; border-bottom: 3px solid #f59e0b; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="display: flex; items-center; gap: 12px;">
            ${profile.companyLogoUrl ? `<img src="${profile.companyLogoUrl}" alt="${profile.shopName}" style="max-height: 46px; max-width: 140px; object-fit: contain; background: white; border-radius: 6px; padding: 3px; display: inline-block; vertical-align: middle; margin-right: 10px;" />` : ''}
            <div style="display: inline-block; vertical-align: middle;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; color: #ffffff;">${profile.shopName}</h1>
              <div style="color: #93c5fd; font-size: 12px; font-weight: 600;">${profile.tagline}</div>
            </div>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; margin-top: 6px;">
            ${profile.address}, ${profile.city}, ${profile.state} - ${profile.pinCode} | GSTIN: <strong style="color: #ffffff;">${profile.gstin}</strong>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; font-family: monospace;">
            Phone: ${profile.mobile} • Email: ${profile.email}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; background: #f59e0b; color: #0b1329; font-weight: 800; font-size: 10.5px; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            PREMIUM PROPOSAL
          </div>
          <div style="font-size: 20px; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 6px;">${quoteNumber}</div>
          <div style="font-size: 11px; color: #93c5fd; font-family: monospace; margin-top: 3px;">
            <div>Date: <strong>${date}</strong></div>
            <div>Valid Until: <strong>${validUntil}</strong></div>
            <div style="color: #fde68a;">Tier: <strong>${profile.rateTier}</strong></div>
          </div>
        </div>
      </div>

      <!-- High-End Value Badges -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 14px;">🛡️</div>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Class A Profile</div>
          <div style="font-size: 9px; color: #64748b;">DIN EN 12608 Standard</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 14px;">🔇</div>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Acoustic Shield</div>
          <div style="font-size: 9px; color: #64748b;">Up to 38 dB Damping</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 14px;">☀️</div>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">10-Yr Guarantee</div>
          <div style="font-size: 9px; color: #64748b;">UV Anti-Discoloration</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; text-align: center;">
          <div style="font-size: 14px;">🔒</div>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Security Locking</div>
          <div style="font-size: 9px; color: #64748b;">Multi-Point Transmission</div>
        </div>
      </div>

      <!-- Client & Site Info Card -->
      <div style="display: flex; gap: 14px; margin-bottom: 14px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 2px;">Prepared Specially For:</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${customer.companyName || customer.name}</div>
          <div style="font-size: 11px; color: #475569;">Contact: ${customer.name} • ${customer.mobile}</div>
          <div style="font-family: monospace; font-size: 11px; color: #1e40af; margin-top: 2px;">GSTIN: ${customer.gstin || 'None'}</div>
        </div>

        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 2px;">Site Residence &amp; Scope:</div>
          <div style="font-size: 12px; color: #0f172a;">${customer.address}, ${customer.city}</div>
          <div style="font-size: 11px; color: #047857; font-weight: bold; margin-top: 2px;">
            ${fittingScopeText} • ${totalUnits} Units (${totalArea.toFixed(1)} Sq.Ft)
          </div>
        </div>
      </div>

      <!-- Item Cards -->
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; letter-spacing: 0.5px;">
          Architectural Window &amp; Door Engineering Schedule:
        </div>
        ${luxuryRows}
      </div>

      <!-- Milestones & Financials -->
      <div style="display: flex; gap: 14px; margin-bottom: 16px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 6px;">Payment Milestones:</div>
          <div style="font-size: 11px; line-height: 1.5;">
            <div>• <strong>50% Advance</strong> upon profile extrusion booking</div>
            <div>• <strong>40% Material Dispatch</strong> after factory inspection</div>
            <div>• <strong>10% Final Handover</strong> post site glazing &amp; sealant</div>
          </div>
          ${
            showBank
              ? `
          <div style="font-size: 10.5px; color: #334155; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            Bank: <strong>${profile.bankName}</strong><br/>
            A/C: <span class="font-mono font-bold">${profile.accountNo}</span> | IFSC: <span class="font-mono">${profile.ifscCode}</span><br/>
            UPI ID: <span class="font-mono" style="color: #047857; font-weight: bold;">${profile.upiId}</span>
          </div>
          `
              : ''
          }
          ${
            (quotation.notes || '').trim()
              ? `
          <div style="font-size: 10px; color: #1e293b; margin-top: 8px; border-top: 1px solid #cbd5e1; padding-top: 6px; white-space: pre-wrap;">
            <strong>Special Terms &amp; Remarks:</strong> ${(quotation.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          `
              : ''
          }
        </div>

        <div style="flex: 1; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px;">
          <table style="font-size: 11px;">
            <tr>
              <td style="padding: 4px 0;">Material &amp; Extrusions:</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${materialBaseTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Site Fitting &amp; Silicone Sealing:</td>
              <td class="text-right font-mono" style="font-weight: 600; color: ${siteFittingTotal === 0 ? '#047857' : '#0f172a'};">
                ${siteFittingTotal === 0 ? '₹0 (Included Free)' : `₹${siteFittingTotal.toLocaleString('en-IN')}`}
              </td>
            </tr>
            ${extraCharges
              .map(
                (c) => `<tr><td style="padding: 4px 0;">${c.label || 'Additional Charge'}:</td><td class="text-right font-mono" style="font-weight: 600;">₹${(Number(c.amount) || 0).toLocaleString('en-IN')}</td></tr>`
              )
              .join('')}
            <tr>
              <td style="padding: 4px 0; border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Subtotal:</td>
              <td class="text-right font-mono" style="font-weight: 600; border-top: 1px solid #e2e8f0;">₹${taxableSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">GST (18% Integrated / CGST+SGST):</td>
              <td class="text-right font-mono">₹${gst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 14px; color: #047857;">
              <td style="padding: 6px 0;">GRAND TOTAL (INR ₹):</td>
              <td class="text-right font-mono">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 11px;">
        <div>
          <div>Client Proposal Acceptance</div>
          <div style="margin-top: 26px; font-weight: 600;">Approval Signature / Date</div>
        </div>
        <div class="text-right">
          <div>For <strong>${profile.shopName}</strong></div>
          <div style="margin-top: 26px; font-weight: 600;">Authorized Partner</div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // =========================================================================
  // 4. ARCHITECTURAL CAD SPECIFICATION (DEFAULT / ENGINEERING BLUEPRINT)
  // =========================================================================
  const architecturalItemRows = items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${idx + 1}</td>
        ${
          showCad
            ? `
        <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; width: 160px; vertical-align: middle;">
          <div style="width: 155px; height: 112px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            ${generateElevationSvgString(item)}
          </div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-size: 11px; font-weight: 800; color: #1e3a8a; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; margin: 4px auto 0 auto; display: inline-block; letter-spacing: 0.3px;">
            ${item.widthInInches}" W × ${item.heightInInches}" H
          </div>
        </td>
        `
            : ''
        }
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
            Tag: <strong style="color: #1e40af;">${item.locationTag || 'General'}</strong> • ${item.profileBrand} • ${item.glassPackage}
            ${item.accessories.mosquitoMesh ? ' • SS304 Mesh' : ''}
            ${
              item.accessories.siteFitting
                ? (item.fittingCostPerSqFt ?? 40) === 0
                  ? ' • <strong style="color: #047857;">Fitting: Included Free</strong>'
                  : ` • <strong>Fitting: ₹${item.fittingCostPerSqFt ?? 40}/sq.ft</strong>`
                : ' • <em>Supply Only (No Fitting)</em>'
            }
          </div>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${item.widthInInches}" × ${item.heightInInches}"</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantity}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${item.totalAreaSqFt.toFixed(1)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">₹${item.ratePerSqFt}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-family: monospace;">₹${item.itemTotal.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quotation - ${quoteNumber}</title>
      <style>
        @page { size: A4; margin: 12mm 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; line-height: 1.4; background: #ffffff; }
        table { width: 100%; border-collapse: collapse; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px; }
        .badge { display: inline-block; padding: 4px 10px; font-weight: bold; border-radius: 4px; font-size: 11px; text-transform: uppercase; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 12px; font-weight: 600; color: #1e40af;">
          📄 <strong>uPVC Craft Pro</strong> — Architectural CAD Specification Sheet (${quoteNumber})
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #2563eb; color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="header">
        <div>
          ${profile.companyLogoUrl ? `<img src="${profile.companyLogoUrl}" alt="${profile.shopName}" style="max-height: 48px; max-width: 160px; object-fit: contain; margin-bottom: 6px; display: block;" />` : ''}
          <h1 style="margin: 0; font-size: 20px; color: #0f172a;">${profile.shopName}</h1>
          <div style="font-weight: 600; color: #1d4ed8; font-size: 12px;">${profile.tagline}</div>
          <div style="color: #475569; font-size: 11px; margin-top: 4px;">${profile.address}, ${profile.city}, ${profile.state} - ${profile.pinCode}</div>
          <div style="color: #475569; font-size: 11px; font-family: monospace;">Phone: ${profile.mobile} | Email: ${profile.email}</div>
          <div style="margin-top: 4px;"><span class="badge" style="background: #e2e8f0; color: #0f172a;">GSTIN: ${profile.gstin}</span></div>
        </div>
        <div class="text-right">
          <div class="badge" style="background: #1e3a8a; color: white;">ESTIMATE / QUOTATION</div>
          <div style="font-size: 18px; font-weight: bold; font-family: monospace; margin-top: 6px;">${quoteNumber}</div>
          <div style="font-family: monospace; font-size: 11px; color: #475569; margin-top: 4px;">
            <div>Date: <strong>${date}</strong></div>
            <div>Valid Until: <strong>${validUntil}</strong></div>
            <div>Tier: <strong>${profile.rateTier}</strong></div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div class="box" style="flex: 1;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Quotation Issued To:</div>
          <div style="font-size: 14px; font-weight: bold;">${customer.companyName || customer.name}</div>
          ${customer.companyName ? `<div style="font-size: 11px;">Contact: ${customer.name}</div>` : ''}
          <div style="font-family: monospace; font-size: 11px;">Phone: ${customer.mobile}</div>
          <div style="font-family: monospace; font-weight: bold; color: #1e40af; margin-top: 4px;">GSTIN: ${customer.gstin || 'None'}</div>
        </div>

        <div class="box" style="flex: 1;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Site / Installation Address:</div>
          <div style="font-size: 12px;">${customer.address}</div>
          <div style="font-weight: 600; font-size: 11px; margin-top: 4px;">City: ${customer.city}</div>
          <div style="font-size: 11px; color: #047857; font-weight: bold; margin-top: 2px;">
            Scope: ${fittingScopeText}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #334155;">Configured UPVC Products (${totalUnits} Units • ${totalArea.toFixed(1)} Sq.Ft)</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 10.5px; text-transform: uppercase; color: #475569;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: center; width: 36px;">#</th>
              ${showCad ? '<th style="padding: 8px 6px; border-bottom: 2px solid #cbd5e1; text-align: center; width: 160px;">Elevation (CAD)</th>' : ''}
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Product Specification</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Dimensions</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Area (Sq.Ft)</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Rate (₹)</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${architecturalItemRows}
          </tbody>
        </table>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div class="box" style="flex: 1;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Payment Milestones &amp; Terms:</div>
          <div style="font-size: 11px; line-height: 1.5;">
            <div>• <strong>50% Advance</strong> upon quotation confirmation and profile booking</div>
            <div>• <strong>40% Dispatch</strong> upon fabrication completion and pre-dispatch inspection</div>
            <div>• <strong>10% Handover</strong> upon on-site fitting, glazing, and silicone sealing</div>
          </div>
          ${
            showBank
              ? `
          <div style="font-size: 10.5px; color: #334155; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            Bank: <strong>${profile.bankName}</strong> | A/C: <span class="font-mono font-bold">${profile.accountNo}</span> | IFSC: <span class="font-mono">${profile.ifscCode}</span> | UPI: <span class="font-mono" style="color: #047857;">${profile.upiId}</span>
          </div>
          `
              : ''
          }
          ${
            (quotation.notes || '').trim()
              ? `
          <div style="font-size: 10px; color: #1e293b; margin-top: 6px; border-top: 1px solid #cbd5e1; padding-top: 4px; white-space: pre-wrap;">
            <strong>Special Terms &amp; Remarks:</strong> ${(quotation.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </div>
          `
              : `
          <div style="font-size: 10px; color: #64748b; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            10-Year UPVC Profile Warranty against discoloration. 1-Year hardware warranty.
          </div>
          `
          }
        </div>

        <div class="box" style="flex: 1;">
          <table style="font-size: 11px;">
            <tr>
              <td style="padding: 4px 0;">Material &amp; Fabrication Base:</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${materialBaseTotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Site Fitting &amp; Silicone Sealing:</td>
              <td class="text-right font-mono" style="font-weight: 600; color: ${siteFittingTotal === 0 ? '#047857' : '#0f172a'};">
                ${
                  anyFitting
                    ? siteFittingTotal === 0
                      ? '₹0 (Included Free in Scope)'
                      : `₹${siteFittingTotal.toLocaleString('en-IN')}`
                    : '₹0 (Supply Only)'
                }
              </td>
            </tr>
            ${extraCharges
              .map(
                (c) => `
              <tr>
                <td style="padding: 4px 0; color: #334155;">${c.label || 'Additional Charge'}:</td>
                <td class="text-right font-mono" style="font-weight: 600;">₹${(Number(c.amount) || 0).toLocaleString('en-IN')}</td>
              </tr>
            `
              )
              .join('')}
            <tr>
              <td style="padding: 4px 0; border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Subtotal:</td>
              <td class="text-right font-mono" style="font-weight: 600; border-top: 1px solid #e2e8f0;">₹${taxableSubtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">GST (18% Integrated / CGST+SGST):</td>
              <td class="text-right font-mono">₹${gst.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 14px; color: #047857;">
              <td style="padding: 6px 0;">GRAND TOTAL (INR ₹):</td>
              <td class="text-right font-mono">₹${grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
      </div>

      ${
        showTerms && profile.termsAndConditions && profile.termsAndConditions.length > 0
          ? `
      <div style="margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
        <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Terms &amp; Conditions / Quality Scope:</div>
        <ol style="margin: 0; padding-left: 18px; font-size: 10.5px; color: #475569; line-height: 1.45;">
          ${profile.termsAndConditions.map((t) => `<li>${t}</li>`).join('')}
        </ol>
      </div>
      `
          : ''
      }

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 11px;">
        <div>
          <div>Customer Acceptance Signature</div>
          <div style="margin-top: 26px; font-weight: 600;">Client Approval / Date</div>
        </div>
        <div class="text-right">
          <div>For <strong>${profile.shopName}</strong></div>
          <div style="margin-top: 26px; font-weight: 600;">Proprietor / Authorized Partner</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
