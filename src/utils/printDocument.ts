import { BusinessProfile, Customer, ExtraCharge, Invoice, Quotation, QuotationItem, WorkshopCutItem } from '../types';
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
 * - Attempts to print using an offscreen iframe with standard page dimensions (avoiding Chrome's 0x0 frame block)
 * - Falls back to mounting into #applet-print-container and invoking window.print()
 * - If browser sandbox blocks the print dialog (common in iframes without allow-modals),
 *   automatically downloads the clean, self-contained printable HTML file so the user gets the document immediately!
 */
export function printDocument(
  htmlContent: string,
  filename: string = 'document.html'
): { success: boolean; fallbackDownloaded: boolean; message: string } {
  const safeFilename = filename.endsWith('.html') ? filename : `${filename}.html`;

  // Always ensure #applet-print-container is ready in the DOM
  let printContainer = document.getElementById('applet-print-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'applet-print-container';
    document.body.appendChild(printContainer);
  }

  // Populate printable content into the container
  printContainer.innerHTML = htmlContent;

  // Track if print was triggered
  let printTriggered = false;

  // Strategy 1: Try printing via offscreen styled iframe with dimensions
  try {
    const existing = document.getElementById('upvc-print-frame');
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'upvc-print-frame';
    // Chromium suppresses printing frames with 0x0 dimensions; provide offscreen A4 layout dimensions
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          printTriggered = true;
        } catch (iframeErr) {
          console.warn('Iframe print failed or was restricted by sandbox, trying in-DOM print:', iframeErr);
          triggerInDomPrint(safeFilename, htmlContent);
        }
      }, 350);

      return {
        success: true,
        fallbackDownloaded: false,
        message: 'Opening print dialog...',
      };
    }
  } catch (err) {
    console.warn('Offscreen iframe creation failed, falling back to in-DOM print:', err);
  }

  // Strategy 2: In-DOM print
  return triggerInDomPrint(safeFilename, htmlContent);
}

/**
 * Direct in-DOM print fallback with body class and @media print styling
 */
function triggerInDomPrint(
  filename: string,
  htmlContent: string
): { success: boolean; fallbackDownloaded: boolean; message: string } {
  try {
    let printContainer = document.getElementById('applet-print-container');
    if (!printContainer) {
      printContainer = document.createElement('div');
      printContainer.id = 'applet-print-container';
      document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = htmlContent;
    document.body.classList.add('is-printing-active');

    const cleanup = () => {
      document.body.classList.remove('is-printing-active');
      if (printContainer) {
        printContainer.innerHTML = '';
      }
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 3000);

    // Call window.print()
    window.print();

    return {
      success: true,
      fallbackDownloaded: false,
      message: 'Print dialog opened.',
    };
  } catch (err: any) {
    console.warn('window.print() was blocked by browser sandbox/policy:', err);
    // Sandboxed iframes block window.print() with DOMException. Download the file as 100% reliable fallback!
    downloadPrintableHtml(filename, htmlContent);
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
export function generateInvoicePrintHtml(invoice: Invoice, profile: BusinessProfile): string {
  const isIntraState = !invoice.customer.gstin || invoice.customer.gstin.startsWith('27');
  const itemsSubtotal = invoice.items.reduce((acc, i) => acc + i.itemTotal, 0);
  const extraCharges = invoice.extraCharges || [];
  const extraChargesTotal = extraCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const subtotal = itemsSubtotal + extraChargesTotal;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const grandTotal = subtotal + gst;

  const itemRows = invoice.items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b;">${item.locationTag || 'General'} • ${item.profileBrand} • ${item.glassPackage}</div>
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
          <div style="font-family: monospace; font-weight: bold; color: #1e40af; margin-top: 4px;">GSTIN: ${invoice.customer.gstin || 'Unregistered Consumer'}</div>
        </div>

        <div class="box" style="flex: 1;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Site / Installation Address:</div>
          <div style="font-size: 12px;">${invoice.customer.address}</div>
          <div style="font-weight: 600; font-size: 11px; margin-top: 4px;">City / State: ${invoice.customer.city}</div>
          <div style="font-size: 11px; color: #047857; font-weight: bold; margin-top: 2px;">
            ${isIntraState ? 'Tax Type: Intra-State (CGST 9% + SGST 9%)' : 'Tax Type: Inter-State (IGST 18%)'}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; color: #334155;">Fenestration Item Schedule</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 10.5px; text-transform: uppercase; color: #475569;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">#</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Product & Specification</th>
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
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Bank Settlement Details:</div>
          <div style="font-size: 11px; line-height: 1.5;">
            <div>Bank: <strong>${profile.bankName}</strong></div>
            <div>A/C Number: <strong class="font-mono">${profile.accountNo}</strong></div>
            <div>IFSC Code: <strong class="font-mono">${profile.ifscCode}</strong></div>
            <div>UPI ID: <strong class="font-mono" style="color: #047857;">${profile.upiId}</strong></div>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            10-Year UPVC Profile Warranty against discoloration. 1-Year hardware warranty.
          </div>
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
            ${
              extraCharges.length > 0
                ? `
            <tr>
              <td style="padding: 4px 0; border-top: 1px solid #e2e8f0; font-weight: 600;">Taxable Value (Subtotal):</td>
              <td class="text-right font-mono" style="font-weight: 600; border-top: 1px solid #e2e8f0;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            `
                : `
            <tr>
              <td style="padding: 4px 0;">Taxable Value (Subtotal):</td>
              <td class="text-right font-mono" style="font-weight: 600;">₹${subtotal.toLocaleString('en-IN')}</td>
            </tr>
            `
            }
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
        invoice.payments.length > 0
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
 * Generates official printable HTML for a Quotation
 */
export function generateQuotationPrintHtml(
  quoteNumber: string,
  date: string,
  validUntil: string,
  customer: Customer,
  items: QuotationItem[],
  profile: BusinessProfile,
  extraCharges: ExtraCharge[] = []
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

  const fittingScopeText = anyFitting
    ? siteFittingTotal === 0
      ? 'Site Installation & Weather Sealing (Included Free in Scope)'
      : `On-Site Fitting & Silicone Sealing Included (₹${siteFittingTotal.toLocaleString('en-IN')})`
    : 'Supply Only (No on-site fitting)';

  const itemRows = items
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: center; width: 160px; vertical-align: middle;">
          <div style="width: 155px; height: 112px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 2px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            ${generateElevationSvgString(item)}
          </div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-size: 11px; font-weight: 800; color: #1e3a8a; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; margin: 4px auto 0 auto; display: inline-block; letter-spacing: 0.3px;">
            ${item.widthInInches}" W × ${item.heightInInches}" H
          </div>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #0f172a;">${item.name}</div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
            ${item.locationTag || 'General'} • ${item.profileBrand} • ${item.glassPackage}
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
          📄 <strong>uPVC Craft Pro</strong> — Official Quotation Specification Sheet (${quoteNumber})
        </div>
        <button onclick="window.print()" style="cursor: pointer; background: #2563eb; color: #ffffff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="header">
        <div>
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
              <th style="padding: 8px 6px; border-bottom: 2px solid #cbd5e1; text-align: center; width: 160px;">Elevation (CAD)</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Product Specification</th>
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
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Payment Milestones & Terms:</div>
          <div style="font-size: 11px; line-height: 1.5;">
            <div>• <strong>50% Advance</strong> upon quotation confirmation and profile booking</div>
            <div>• <strong>40% Dispatch</strong> upon fabrication completion and pre-dispatch inspection</div>
            <div>• <strong>10% Handover</strong> upon on-site fitting, glazing, and silicone sealing</div>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            10-Year UPVC Profile Warranty against discoloration. 1-Year hardware warranty.
          </div>
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

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 11px;">
        <div>
          <div>Customer Acceptance Signature</div>
          <div style="margin-top: 30px; font-weight: 600;">Client Approval / Date</div>
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
