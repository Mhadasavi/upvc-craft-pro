# Changelog

All notable changes to **uPVC Craft Pro** (UPVC Quotation, Live CAD & Billing Suite) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2026-10-21]

### Added
- **Flexible Site Fitting & Weather Sealing Fee**:
  - Added support for "Free / Waived (₹0)" site fitting while keeping installation and silicone weather sealing in the written scope of work.
  - Support for custom rates per sq.ft (e.g. ₹0, ₹40 standard rate, or custom numeric values).
  - Added "Supply Only" option to disable site fitting when client handles installation.
  - Added 1-click **"Waive Fee"** / **"Restore ₹40"** toggle button directly on the quotation financial summary bar.
  - Dynamic scope text in printed quotation: *"Site Installation & Weather Sealing (Included Free)"* vs *"On-Site Fitting & Silicone Sealing Included"* vs *"Supply Only"*.
- **Additional Charges & Custom Line Items**:
  - Created interactive **"Additional Charges & Transportation"** panel in both **New Quotation Builder** (Studio and Review steps) and **Create Tax Invoice View**.
  - One-click presets for common Indian fabrication logistics:
    - `+ Transportation / Freight` (₹1,500)
    - `+ Loading & Unloading` (₹800)
    - `+ Crane / Hoisting Lifting` (₹2,500)
    - `+ Custom Fee` (custom label and ₹ value)
  - Integrated additional charges into composite taxable subtotal attracting standard 18% GST (CGST 9% + SGST 9% or IGST 18%).
  - Added full itemization of extra charges in printed quotations, invoice tables, invoice detail modal, and downloaded HTML/PDF documents.
- **Fabrication Workflow Pipeline on Dashboard**:
  - Added interactive Kanban-style production tracking section showing active orders categorized into:
    - *Pending Confirmation*
    - *Ready for Fabrication*
    - *Ready for Installation*
  - Instant 1-click status transitions to advance orders through fabrication phases.
- **Actionable Dashboard Summary Cards**:
  - Upgraded dashboard overview with 4 prioritized, clickable metric cards:
    - *Quotations Awaiting Approval*
    - *Orders Ready for Fabrication*
    - *Outstanding Payments*
    - *Sales This Month*
  - Clicking any metric filters and navigates directly to the relevant records.
- **Quick Actions & Table Filters**:
  - Added dashboard shortcut buttons: *"Add Customer"*, *"Create Invoice"*, and *"Record Payment"*.
  - Added real-time search, date range filters, and status tabs above the dashboard quotations table.

### Changed
- **Compact Welcome Header**: Reduced oversized purple banner into a sleek, functional header with a primary "+ New Quotation" action button to maximize vertical screen space.
- **Invoice Conversion Integration**: Enhanced quotation-to-invoice finalization to carry over all extra charges, fitting specifications, and line items without race conditions.

### Fixed
- **Duplicate Plus Icon**: Removed the redundant duplicate `+` sign on the "+ New Quotation" primary CTA button.
- **Print Preview Modal Syntax**: Fixed leftover duplicate code in `PrintQuoteModal.tsx` download handler ensuring clean Vite compilation.

---

## [2026-10-20]

### Added
- **Repository & Workspace Standardization**:
  - Initialized official GitHub repository at `https://github.com/Mhadasavi/upvc-craft-pro.git`.
  - Configured PyCharm project configuration (`.idea/modules.xml`, `.idea/vcs.xml`) with standard naming:
    - Project Name: `uPVC-Craft-Pro`
    - Root Directory: `upvc-craft-pro`
    - Application Title: `uPVC Craft Pro`
- **Smart Sequential Quotation Numbering**:
  - Implemented automatic sequential quote numbering (`getNextQuotationNumber`) supporting custom formats (e.g., `JS-26-27-100`).
  - Saved quotation format preferences in app settings with persistence across browser sessions.
- **Three-Step Quotation Workflow**:
  - **Step 1: Customer Details**: Customer selection, GSTIN verification, and site address.
  - **Step 2: CAD Studio & Estimator**: Interactive window/door typologies, parametric elevation, profiles, hardware, and glass options.
  - **Step 3: Review & Finalize**: Itemized ledger, commercial terms, warranty milestones, and saving/printing.
- **GSTIN Auto-Fill & Indian Tax Intelligence**:
  - Integrated 15-digit GSTIN parser and verification with auto-fill for customer name, trade name, state code, PAN, and registered address.
  - Support for Intra-State (CGST 9% + SGST 9%) and Inter-State (IGST 18%) tax calculations.
- **Customer Directory**:
  - Full customer management with search, direct quotation assignment, and quick registration modal.
- **Official GST Tax Invoicing Suite**:
  - Standalone tax invoice generation with advance payment receipts (UPI, NEFT, Cash, Cheque) and milestone tracking (50% Advance, 40% Dispatch, 10% Handover).
  - Invoice payment history ledger, outstanding balance due calculations, and payment recording modal.
- **A4 Standalone Printable Documents**:
  - Standalone, high-fidelity printable HTML generator for Quotations and Tax Invoices.
  - Direct print preview modal and 1-click HTML document download.
- **WhatsApp Direct Dispatch**:
  - Generates pre-formatted quotation and invoice summary messages with direct `wa.me` sharing.

### Changed
- **Quotation Workflow Entry Point**: Configured "New Quotation" action to always start at Step 1 (Customer Details) instead of jumping directly into the CAD Studio.
- **Form Layout Organization**: Reorganized quotation header controls into structured left-aligned sequences and right-aligned action buttons (Save, Share, Print).
- **Default Quotation Item List**: Initialized new quotation item list as empty by default rather than pre-populating with a dummy item.
- **Item Deduplication Logic**: Adding an item with identical typologies, dimensions, brand, and specifications now increments the quantity of the existing line item instead of creating duplicates.

### Fixed
- **Quotation Date Input & Display**: Fixed date format mismatch (`DD/MM/YYYY` display vs `YYYY-MM-DD` HTML5 date picker input).
- **Duplicate Quotation Header Inputs**: Removed duplicate quote number and calendar inputs.
- **GST Badge Visibility**: Fixed 18% GST badge clipping by anchoring the financial summary at the footer of the quotation builder.

---

## [2026-10-19]

### Added
- **Core Domain Engine & Architecture**:
  - Architectural setup of React 19 + TypeScript + Vite 8 + Tailwind CSS.
  - Master UPVC Profile & Hardware Rate Sheet with brand presets (Kommerling, Fenesta, Aluplast, Deceuninck).
  - Profile foil color selections: White, Golden Oak, Dark Oak, Anthracite Grey, Walnut.
  - Glass package configurator: Single 5mm Toughened, Double Glazed Unit (DGU 5-12-5), Frosted/Opaque, Tinted.
- **Parametric SVG Elevation Drafter**:
  - Real-time CAD elevation renderer with dynamic scaling, frame profiles, sash divisions, glass reflections, and dimension lines.
  - Support for major window & door typologies:
    - 2-Track Sliding Window
    - 3-Track Sliding Window (with Mosquito Mesh provision)
    - Casement Openable Window
    - Fixed Architectural Glazing
    - Tilt & Turn Window
    - Louvered Ventilator with Exhaust Fan Cutout
    - 2-Track Sliding Balcony Door
    - Casement Door
- **Workshop Cut-List Engine**:
  - Automatic calculation of fabrication cutting lengths for outer frames, sash profiles, glazing beads, and galvanized steel reinforcements (1.2mm / 1.5mm GI).
- **Offline-First Storage Engine**:
  - LocalStorage database abstraction with automatic initialization from default mock data and fallback recovery.
