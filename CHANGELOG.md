# Changelog

All notable changes to **uPVC Craft Pro** (UPVC Quotation, Live CAD & Billing Suite) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2026-10-24]

### Changed
- **Quotation Builder Step 1 Header Streamlined**:
  - Removed the redundant quotation number badge prefix and the duplicate right-hand side `Quotation Date` and `Valid Until` cards from the "Step 1: Customer Details & Job Information" card in [`NewQuotationBuilder.tsx`](file:///C:/Users/uchau/antigravity/uPVC-Craft-Pro---UPVC-Quotation-&-Billing/src/components/views/NewQuotationBuilder.tsx), since all of these fields are already prominently featured and interactively editable directly in the top persistent action ribbon.

### Added
- **Invoice Notes & Special Terms Persistence, View-Mode Rendering & Full Print Integration**:
  - **Full Lifecycle Notes Support**: Enabled entering and editing custom notes and special terms across both initial invoice creation (`CreateInvoiceView.tsx`) and the detailed invoice editor (`InvoiceDetailModal.tsx`).
  - **Auto-Inheritance from Quotation**: When generating a GST invoice from a quotation or selecting a quote in `CreateInvoiceView.tsx`, custom quotation notes are automatically carried over into the invoice's special terms.
  - **Dedicated View-Mode Presentation**: Resolved the issue where notes appeared "not saved" by adding a dedicated view card in `InvoiceDetailModal.tsx` and dynamically binding the modal's Terms section to `invoice.notes` with a clean fallback to default 10-Year warranty terms.
  - **Universal Statutory Print Integration**: Enhanced all 3 invoice print templates (`standard`, `compact`, `premium`) and quotation templates in `src/utils/printDocument.ts` to cleanly format and print `Special Terms & Notes` with preserved whitespace and HTML safety.
  - **Instant Modal State Synchronization**: Enhanced `InvoicesView.tsx` to immediately sync `selectedInvoice` state upon saving edits, guaranteeing real-time UI updates without latency.
  - **Live Unsaved Edits Printing**: Implemented `getEffectiveInvoice()` in `InvoiceDetailModal.tsx` so clicking Print or Download Standalone HTML immediately incorporates any in-flight edits even prior to pressing Save Changes.
- **Tailored Hindi Localization Scope (Dashboard, Navigation & Settings Focus)**:
  - Scoped Hindi language support specifically to the **Main Dashboard** (`DashboardView.tsx`), top **Header** navigation & search, **Sidebar** navigation tabs, and **Shop Settings** (`SettingsView.tsx`).
  - Restored clean, standard English industry terms across the **Quotation Builder** (`SummaryBar.tsx`, CAD elevation canvas, profile brands, hardware, glass specifications) and **Invoice Billing & Calculation** workflows, keeping technical fenestration terminology unambiguous and standard.
- **Hindi Language Support (हिंदी भाषा विकल्प)**:
  - Implemented an internationalization (i18n) engine (`src/utils/language.ts` and `src/context/LanguageContext.tsx`) supporting seamless switching between **English (`en`)** and **Hindi (`hi`)**.
  - **1-Click Header Language Toggle**: Added an accessible language toggle button (`[🌐 English / हिंदी]` with `EN`/`हिं` indicator badge) in the top persistent header navigation (`Header.tsx`) for instant 1-click toggling from any screen.
  - **Language Preferences in Shop Settings**: Added a dedicated **Application Language / भाषा** management section in `SettingsView.tsx` with interactive selection cards for English and हिंदी (Hindi).
  - **Full Workspace Localization**: Localized primary navigation tabs (Sidebar), Header search placeholders & live tab titles, Dashboard metrics, greeting banners, quick action buttons, workshop fabrication & dispatch pipeline stages, and Recent Quotations table filters.
  - **Persistent Storage & HTML Lang Synchronization**: Language preference is automatically persisted to `localStorage` (`upvc_app_language`) and synchronizes with `document.documentElement.lang` for accessible browser and screen reader rendering.
- **Shipping Address Option with "Same as Billing Address" Checkmark**:
  - Integrated dedicated Shipping / Consignee Address configuration alongside Registered Billing Address across **Create Invoice** (`CreateInvoiceView.tsx`), **Invoice Detail / Edit Modal** (`InvoiceDetailModal.tsx`), **Customer Directory Modal** (`CustomerModal.tsx`), and **Customer Detail Modal** (`CustomerDetailModal.tsx`).
  - Added interactive **"Same as billing address"** checkmark toggle: when checked, automatically populates and synchronizes shipping address, city, and state with the billing address in real-time; when unchecked, enables full customization of a separate physical site delivery / installation destination.
  - Enhanced all 3 statutory invoice print layouts (`standard`, `compact`, `premium`) in `printDocument.ts` to prominently itemize both **Billed To / Buyer** and **Shipped To / Consignee** (with a `(Same as Billing Address)` indicator when unified) matching official GST statutory tax requirements.
  - Updated `PrintQuoteModal.tsx` across all 4 quotation templates to reflect customer shipping / site installation addresses when specified.
- **Invoice Editing Parity with Create Invoice**:
  - **Native Calendar View for Invoice Date & Due Date**: Replaced manual text typing for invoice date in `InvoiceDetailModal.tsx` and `CreateInvoiceView.tsx` with native HTML5 `<input type="date">` calendar pickers, offering instant visual date selection while retaining formatted Indian business display dates (`DD MMM YYYY`).
  - **Transportation & Additional Freight Editor**: Brought full feature parity to Edit Invoice by implementing the interactive "Additional Charges & Transportation" editor with one-click presets (*Transportation / Freight ₹1,500*, *Loading & Unloading ₹800*, *Crane / Hoisting Lifting ₹2,500*, and expandable *+ Custom Fee* form) directly within `InvoiceDetailModal.tsx`.
  - **Dynamic Real-Time Recalculations**: Live recalculation of taxable subtotal (items + freight), statutory GST (intra-state CGST+SGST 9%+9% or inter-state IGST 18%), and net balance due when editing transportation charges or fenestration quantities.
  - **Invoice Notes & Special Terms Editor**: Added invoice notes / special warranty terms textarea to `InvoiceDetailModal.tsx` edit mode with automatic persistence.
  - **1-Click Edit Action from Invoices Table**: Added an instant **Edit Invoice** action button (`Edit2` icon) directly in the invoice list table within `InvoicesView.tsx` to launch the modal directly in edit mode.
- **Multiple Document Print Templates & Configurable Print Options**:
  - **4 Distinct Professional Quotation Templates**:
    - `Architectural CAD Specification` (`architectural`): Full engineering blueprint with vector elevation diagrams, dimension badges, DIN EN 12608 Class A notes, 10-Year profile warranty, milestones, and dual signatures.
    - `Executive B2B / Contractor Schedule` (`compact`): High-density tabular layout optimized for builders, civil contractors, and commercial BOQs with dual dimensions (inches + mm) and condensed financial summary.
    - `Luxury Villa / Client Presentation Proposal` (`premium`): Deep navy & gold gradient header banner, prestige value proposition badges (German Engineering, Acoustic Shielding, Anti-UV Guarantee, Multi-Point Security), elegant item cards with elevation diagrams, and gold-accented totals.
    - `Workshop Fabrication & Site Installation Slip` (`workshop`): Dedicated production and installation slip displaying window tags, CAD diagrams, cutting dimensions in both inches and exact mm, profile brand and glass packages, a 6-point on-site installation quality checklist, and **zero pricing/financial data** to keep workshop operations clean and protected.
  - **3 Distinct Statutory & Commercial Invoice Templates**:
    - `Standard Official GST Tax Invoice` (`standard`): Official statutory tax invoice layout with CGST/SGST/IGST breakdown, HSN 76101000, bank settlement, and payment ledger.
    - `Executive B2B Commercial Invoice` (`compact`): High-density corporate invoice layout with concise metadata, PO reference, and tax computation.
    - `Luxury Branded Tax Bill` (`premium`): Styled navy and gold header banner, gilded status badges (Paid/Due), official company emblem, and 10-Year Warranty certification seal.
  - **Interactive Template Selector & Print Options Toolbar**:
    - Integrated segmented template selectors and live option checkboxes into both `PrintQuoteModal` and `InvoiceDetailModal`: `CAD Elevations`, `Bank / UPI Details`, and `Terms & Scope` for quotes; `Bank Details` and `Payment History` for invoices.
    - Both the live on-screen modal viewport (`.printable-sheet`), the direct browser print / PDF output (`window.print()`), and downloaded standalone HTML files (`downloadPrintableHtml`) dynamically mirror the active template and option toggles.
  - **Default Print Template Preferences in Shop Settings**:
    - Added "Default Print Template" dropdown selectors in `SettingsView` under both Quotation Settings and Invoice Settings, persisting user template defaults across sessions.
- **Interactive Notification Center & Activity Dropdown**:
  - Activated the header notification bell (`Bell` icon) with a full-featured dropdown panel.
  - Dynamically calculates live shop activity: pending quotations awaiting customer follow-up, confirmed orders ready for 45° profile cutting in workshop, and invoices with outstanding balance due.
  - Includes real-time unread counter badge, "Mark read" button, filter tabs (`All`, `Unread`, `Orders`, `Payments`), outside click auto-dismissal, and 1-click direct navigation to the target quotation or invoice.
- **Distinct Company Brand Emblem vs User Profile Picture**:
  - Added dedicated **Company Logo / Brand Emblem** (`companyLogoUrl` in `BusinessProfile`) in Shop Settings: strictly printed on official Quotation Preview sheets (`PrintQuoteModal`), tax invoices, and downloaded PDF documents (`printDocument.ts`).
  - Separated the **User Profile Picture** (`avatarUrl`): displayed exclusively within the app (in the top header navigation blue circle) with a fallback to user initials (`RP`), and explicitly prevented from printing on any customer documents.
  - Added independent upload and removal controls for both the official company emblem and user profile photo in `SettingsView` (under *Shop Identity*).
- **Complete Product Catalog & Master Rate Sheet Synchronization**:
  - Synchronized `INITIAL_RATE_SHEET` with `PRODUCT_TYPOLOGIES` to include all 17 standard UPVC product typologies (7 Windows, 6 Doors, 2 Ventilators, 2 Custom/Partitions), adding the missing `custom-upvc-product` rate entry.
  - Implemented automatic backward-compatibility migration in `App.tsx` ensuring stored browser profiles automatically merge any missing typologies from the master rate book.
  - Upgraded **Products & Master Rate Sheet** view (`ProductsRatesView.tsx`) with category filter tabs (`All`, `Windows`, `Doors`, `Ventilators`, `Custom`), real-time search, visual CAD preview thumbnails for each typology, and benchmark comparison indicators.
- **Light Mode & Dark Mode Theme Engine**:
  - Implemented persistent theme management (`src/utils/theme.ts`) with automatic detection of system preference (`prefers-color-scheme`) and persistence across browser sessions via `localStorage`.
  - Added dedicated **Light Mode / Dark Mode toggle button** in the top persistent `Header` (Sun/Moon icon with animated transitions and tooltips).
  - Added accessible quick toggle button in the bottom section of `Sidebar` (supporting both expanded and collapsed icon-only states).
  - Added **Theme & Visual Appearance** management section in `SettingsView` (under Shop Identity) with interactive preview cards for Light Mode and Dark Mode.
  - Comprehensive dark mode CSS styling in `src/index.css` supporting dark navy backgrounds (`#0b1120`, `#0f172a`), refined slate borders, high-contrast typography, custom dark scrollbars, and dark form controls.
  - Protected printable documents and A4 print simulation sheets (`.printable-sheet`) to preserve crisp white paper fidelity for accurate quotation and invoice printing.

### Fixed
- **Create GST Invoice from Quotation & Summary Bar**:
  - Fixed an uncaught runtime exception (`TypeError: Cannot read properties of undefined (reading 'reduce')`) triggered when clicking the "Create GST Invoice" button in `SummaryBar.tsx`, caused by passing the React synthetic mouse event object directly as the quotation parameter to `handleFinalizeInvoice`.
  - Added strict object signature validation (`isRealQuote`) in `handleFinalizeInvoice` in `App.tsx` and wrapped the click handler `() => onFinalizeInvoice()` in `SummaryBar.tsx`.
  - Added `handleFinalizeFromSummary` in `NewQuotationBuilder.tsx` to construct and pass the complete quotation snapshot (with line items, dimensions, extra charges, and customer details).
  - Ensured quotations finalized into invoices are automatically added to/updated in the quotations registry (`quotations`) with `status: 'invoiced'`.
  - Added empty quotation item validation with user-friendly alerts preventing creation of zero-item invoices.
  - Implemented automatic focus and opening (`initialSelectedInvoiceId`) in `InvoicesView.tsx` so the newly generated GST Invoice immediately opens in `InvoiceDetailModal` for instant inspection, payment recording, and printing.
  - Added a 1-click "Create GST Invoice" action directly in `PrintQuoteModal.tsx` top action bar for rapid quotation-to-invoice conversion during print preview.
- **Print Button Action & Native Print Dialog Activation**:
  - Eliminated the confusing "Print Ready" button state toggle loop in `PrintQuoteModal`, `InvoiceDetailModal`, and `CutListModal`.
  - Replaced the failing offscreen iframe mechanism (`top: -9999px; opacity: 0;` which Chromium silently blocked) with direct, synchronous in-DOM printing via `#applet-print-container` and `window.print()`.
  - Clicking "Print / Save as PDF" immediately and reliably triggers the browser's native print / save dialog on the first click and subsequent clicks without getting stuck in a toggling state.

### Changed
- **Sidebar Bottom Bar Cleanup**:
  - Removed the Appearance/Theme switch toggle row from the bottom of `Sidebar.tsx` (both expanded and collapsed states), keeping the sidebar uncluttered and focused on core navigation, while preserving primary theme toggling via the top `Header` button and `SettingsView` preferences.
- **Dark Mode UI Overhaul & Contrast Optimization (Dashboard & Center Panels)**:
  - **4 Top Summary Metric Cards**: Restored high-contrast legibility for Fabrication and Monthly Sales values with bright vibrant accents (`dark:text-indigo-400`, `dark:text-emerald-400`); replaced blinding pastel sticker badges with subtle translucent pills (`dark:bg-*-500/15`, `dark:border-*-500/30`, `dark:text-*-400`); enhanced borders and hover elevation states (`dark:bg-slate-900/90`, `dark:border-slate-800`).
  - **Quick Actions Panel**: Enhanced action buttons with dark surface depth (`dark:bg-slate-800/60`, `dark:border-slate-800`), refined icon wrappers (`dark:bg-slate-900`, `dark:border-slate-700`), crisp typography (`dark:text-slate-200`), and smooth accent hover halos.
  - **Fabrication & Order Pipeline (Stages 1, 2 & 3)**: Fixed unreadable dark-on-dark headings (`text-indigo-950` -> `dark:text-indigo-200`, `text-emerald-950` -> `dark:text-emerald-200`) and subtext (`dark:text-indigo-300/80`, `dark:text-emerald-300/80`); elevated column backings (`dark:bg-slate-950/60`, `dark:bg-indigo-950/25`, `dark:bg-emerald-950/25`); styled inner order cards (`dark:bg-slate-900`, `dark:border-slate-800`, `dark:shadow-md`); updated action buttons (WhatsApp, Cut-List, Bill, Dispatch Update) to dark-mode translucent buttons with crisp borders.
  - **Recent Quotations Table & Filters**: Transformed table container, search bar, and status/date dropdown selectors with dark slate inputs and subtle focus rings; updated table head (`dark:bg-slate-950/70`, `dark:text-slate-400`); restyled quotation rows with subtle hover transitions (`dark:hover:bg-slate-800/40`), vibrant quote reference numbers (`dark:text-blue-400`), and balanced status badges (`draft`, `sent`, `confirmed`, `invoiced`).
  - **Global Dark Mode CSS Rules (`src/index.css`)**: Switched blunt card overrides to 0-specificity `:where()` selectors so Tailwind `dark:` classes take proper precedence; added comprehensive dark-mode adaptations for all pastel badges, borders, opacity tints, and colored headings across the entire application.

---

## [2026-10-21]

### Added
- **High-Legibility Enlarged Elevation CAD & Measurement Badges**:
  - Enlarged CAD elevation diagrams to 155px × 112px (2.4x display area) in both the Print Preview modal and downloaded documents.
  - Increased dimension typography with bold 10.5px white font inside high-contrast navy pills, with clear boundary ticks and dimension lines.
  - Added dedicated high-contrast measurement badges (e.g., `48" W × 60" H`) directly underneath the CAD diagrams in table schedules for crystal-clear legibility.
- **Vector Elevation CAD Diagrams with Dimension Annotations**:
  - Built standalone SVG elevation generator (`generateElevationSvgString` & `ElevationDiagram`) featuring proportional aspect ratio scaling, UPVC profile foils (White, Wooden, Grey), sash overlaps, sliding directional arrows, casement swing triangles, and louver ventilator blades.
  - Real-time engineering dimension annotations on both axes: horizontal width dimension line with boundary ticks and width pill (`W"`), and vertical height dimension line with boundary ticks and height pill (`H"`).
  - Integrated live elevation diagrams into the **Print & PDF Preview Modal** (`PrintQuoteModal`), replacing static thumbnails.
  - Added the **"Elevation (CAD)"** column into downloaded standalone quotation documents (`generateQuotationPrintHtml`), embedding crisp vector diagrams directly into offline HTML/PDF quotation schedules.
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
- **Unified Review Step Ledger**: Removed duplicate "Comprehensive Financial Summary" card and duplicate Additional Charges block from Step 3, anchoring single authoritative `SummaryBar` and dedicated commercial warranty panel.
- **Detailed Print Breakdown**: Itemized Material Fabrication Base and Site Fitting & Weather Sealing (with Free / Waived and Supply Only indicators) separately instead of lumping into a single figure.
- **Invoice Conversion Integration**: Enhanced quotation-to-invoice finalization to carry over all extra charges, fitting specifications, and line items without race conditions.

### Fixed
- **Persistent Quick Presets Bar**: Quick preset buttons (`+ Transportation`, `+ Loading & Unloading`, `+ Crane / Hoisting`, `+ Custom Fee`) now remain permanently visible after selecting a preset, allowing users to add multiple presets consecutively without the preset buttons disappearing.
- **Duplicate Plus Icon**: Removed the redundant duplicate `+` sign on "+ New Quotation" and "+ Add Charge" buttons.
- **Context-Aware Extra Charge Icons**: Custom charges no longer default to the transportation truck icon; icons dynamically resolve based on charge label (Transportation, Loading/Handling, Crane/Hoisting, or generic Tag).
- **Waive Off Button Alignment**: Positioned the "Waive Off" toggle directly alongside the "Site Fitting & Weather Seal:" label on the left, keeping the monetary value cleanly aligned on the right.
- **Download Document Handler**: Fixed inverted argument bug in `downloadPrintableHtml` where HTML content was passed as the filename, causing downloads to break or save corrupted files.
- **Interactive Browser Print Header**: Added top toolbar button in downloaded standalone HTML files allowing direct 1-click printing and saving as PDF.

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

### Fixed
- **Create GST Invoice from Quotation & Summary Bar**:
  - Fixed an uncaught runtime exception (`TypeError: Cannot read properties of undefined (reading 'reduce')`) triggered when clicking the "Create GST Invoice" button in `SummaryBar.tsx`, caused by passing the React synthetic mouse event object directly as the quotation parameter to `handleFinalizeInvoice`.
  - Added strict object signature validation (`isRealQuote`) in `handleFinalizeInvoice` in `App.tsx` and wrapped the click handler `() => onFinalizeInvoice()` in `SummaryBar.tsx`.
  - Added `handleFinalizeFromSummary` in `NewQuotationBuilder.tsx` to construct and pass the complete quotation snapshot (with line items, dimensions, extra charges, and customer details).
  - Ensured quotations finalized into invoices are automatically added to/updated in the quotations registry (`quotations`) with `status: 'invoiced'`.
  - Added empty quotation item validation with user-friendly alerts preventing creation of zero-item invoices.
  - Implemented automatic focus and opening (`initialSelectedInvoiceId`) in `InvoicesView.tsx` so the newly generated GST Invoice immediately opens in `InvoiceDetailModal` for instant inspection, payment recording, and printing.
  - Added a 1-click "Create GST Invoice" action directly in `PrintQuoteModal.tsx` top action bar for rapid quotation-to-invoice conversion during print preview.
- **Print Button Action & Native Print Dialog Activation**:
  - Eliminated the confusing "Print Ready" button state toggle loop in `PrintQuoteModal`, `InvoiceDetailModal`, and `CutListModal`.
  - Replaced the failing offscreen iframe mechanism (`top: -9999px; opacity: 0;` which Chromium silently blocked) with direct, synchronous in-DOM printing via `#applet-print-container` and `window.print()`.
  - Clicking "Print / Save as PDF" immediately and reliably triggers the browser's native print / save dialog on the first click and subsequent clicks without getting stuck in a toggling state.

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
