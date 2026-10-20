# uPVC Craft Pro — System Architecture & Technical Specifications

## 1. Executive Overview

**uPVC Craft Pro** is an enterprise-grade web application engineered for Indian UPVC (Unplasticized Polyvinyl Chloride) window and door fabrication shops, dealers, and architectural fenestration contractors. The platform unifies estimation, dynamic parametric CAD generation, workshop cut-list optimization, client quotations, GST tax invoicing, and milestone payment tracking into a coherent single-page application.

---

## 2. High-Level Architectural Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                          React SPA (Vite)                                         |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                  Application Root (`App.tsx`)                               |  |
|  |   - Global State (Active Quotations, Invoices, Customers, Rate Sheet, Business Profile)     |  |
|  |   - Toast Notification Manager                                                              |  |
|  |   - Navigation Router & View Switcher                                                       |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                  |                                                |
|         +----------------------------------------+----------------------------------------+       |
|         |                                        |                                        |       |
|  +--------------+                     +--------------------+                     +----------------+
|  | Navigation   |                     | Main View Switcher |                     | Active Modals  |
|  | - Header     |                     +--------------------+                     | - PrintQuote   |
|  | - Sidebar    |                                |                               | - InvoiceModal |
|  +--------------+        +-----------------------+-----------------------+       | - CutListModal |
|                          |                       |                       |       | - CustModal    |
|                 +-----------------+     +-----------------+     +-----------------+               |
|                 | New Quotation   |     | Create Invoice  |     | Invoices View   |               |
|                 | Builder View    |     | View            |     | (CRUD & Ledger) |               |
|                 +-----------------+     +-----------------+     +-----------------+               |
|                          |                       |                       |                        |
|                 +-----------------+     +-----------------+     +-----------------+               |
|                 | Quotations View |     | Customers View  |     | Products/Rates  |               |
|                 | (Directory)     |     | (Directory/CRM) |     | (Master Sheet)  |               |
|                 +-----------------+     +-----------------+     +-----------------+               |
|                                                  |                                                |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                Core Engine & Domain Logic Layer                             |  |
|  |  +-----------------------+  +-----------------------+  +---------------------------------+  |  |
|  |  | Fabrication Math     |  | Parametric Elevation  |  | GSTIN Lookup & PAN Decoder       |  |  |
|  |  | & Sizing Engine       |  | CAD Engine (SVG)      |  | (`src/utils/gstLookup.ts`)      |  |  |
|  |  | (`calculations.ts`)   |  | (`ParametricElevation`|  | - 15-char regex & state codes   |  |  |
|  |  | - Area & perimeter    |  |  Interactive Canvas)  |  | - 4th char entity identification|  |  |
|  |  | - Material pricing    |  | - Dimension overlays  |  | - Persistent custom registry    |  |  |
|  |  | - Hardware & fitting  |  | - Panel sliding arrows|  |                                 |  |  |
|  |  | - 18% GST (CGST/SGST/ |  | - Hinge indicators    |  |                                 |  |  |
|  |  |   IGST)               |  | - Zoom & pan viewport |  |                                 |  |  |
|  |  | - Workshop cut-list   |  |                       |  |                                 |  |  |
|  |  +-----------------------+  +-----------------------+  +---------------------------------+  |  |
|  |  +--------------------------------------------------+  +---------------------------------+  |  |
|  |  | Print & Export Pipeline (`printDocument.ts`)     |  | WhatsApp Integration Engine     |  |  |
|  |  | - Offscreen dimensional iframe printing          |  | (`calculations.ts`)             |  |  |
|  |  | - Direct in-DOM `#applet-print-container`       |  | - Formatted pricing & items     |  |  |
|  |  | - Iframe sandbox fallback with auto HTML export  |  | - Bank details & UPI payload    |  |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Directory Layout & Source Code Organization

```
├── .env.example                       # Environment configuration template
├── architecture.md                    # System architecture documentation (this document)
├── index.html                         # SPA entry point with Google Fonts preconnect
├── metadata.json                      # AI Studio application manifest & permissions
├── package.json                       # Dependencies & script definitions
├── tsconfig.json                      # Strict TypeScript compilation configuration
├── vite.config.ts                     # Vite bundler configuration
└── src/
    ├── main.tsx                       # React application bootstrap
    ├── App.tsx                        # Master application state, view routing, modals
    ├── index.css                      # Tailwind v4 configuration, scrollbars & @media print rules
    ├── data/
    │   └── initialData.ts             # Initial product typologies, sample quotes & rates
    ├── types/
    │   └── index.ts                   # Core TypeScript interfaces & domain data models
    ├── utils/
    │   ├── calculations.ts            # Mathematical fenestration engine, cut lists, WhatsApp
    │   ├── gstLookup.ts               # Indian GSTIN validation, PAN parser, persistent registry
    │   └── printDocument.ts           # Multi-tier print pipeline & standalone A4 HTML generator
    └── components/
        ├── diagram/
        │   ├── ParametricElevation.tsx    # Live dynamic CAD vector diagram with controls
        │   └── MiniDiagramThumbnail.tsx   # Lightweight elevation preview icon
        ├── layout/
        │   ├── Header.tsx             # Persistent header bar, search & rate sheet popover
        │   └── Sidebar.tsx            # Navigation drawer with shop operations & badges
        ├── modals/
        │   ├── CustomerModal.tsx      # Customer selector, GST directory search, editor
        │   ├── CutListModal.tsx       # Workshop cut-list schedule with extrusion optimizer
        │   ├── InvoiceDetailModal.tsx # Full CRUD invoice detail, ledger & payment recorder
        │   └── PrintQuoteModal.tsx    # Printable quotation document preview & export
        ├── quotation/
        │   ├── ConfigurationForm.tsx  # Simple vs Advanced mode configurator
        │   ├── LivePricingCard.tsx    # Real-time cost & area breakdown widget
        │   ├── ProductSelector.tsx    # UPVC typology selector grid
        │   ├── QuotationTable.tsx     # Configured schedule table with action triggers
        │   └── SummaryBar.tsx         # Sticky bottom summary & action bar
        └── views/
            ├── CreateInvoiceView.tsx   # Dedicated tax invoice generator with GST presets
            ├── CustomersView.tsx       # CRM customer list & quick quote assignment
            ├── DashboardView.tsx       # Executive overview metrics & quick shortcuts
            ├── InvoicesView.tsx        # Tax invoices list, KPI metrics, CRUD operations
            ├── NewQuotationBuilder.tsx # Core multi-step quotation creation workstation
            ├── ProductsRatesView.tsx   # Master fabrication price book manager
            └── SettingsView.tsx        # Fabricator business profile, bank & tax details
```

---

## 4. Key Subsystems & Technical Details

### 4.1. Quotation Builder: Simple Mode vs. Advanced Mode

The **Quotation Builder** (`NewQuotationBuilder.tsx`) incorporates a dual-mode configuration system to balance speed for field sales with depth for workshop engineers:

* **Simple Mode (Default):**
  * Displays only essential fields: **Customer**, **Product Typology**, **Width**, **Height**, **Quantity**, and core typology options (e.g., Track Count, Panel Count, Opening Direction).
  * Automatically sets sensible, market-tested defaults for profile brand (`Kommerling 60mm`), glass (`5mm Toughened Clear`), hardware, and reinforcement.
  * Ensures fast, error-free quotation creation in under 30 seconds.
* **Advanced Mode (Toggle):**
  * Expands to reveal full engineering specifications:
    * **Profile Series & Brand:** Kommerling, Deceuninck, Aluplast, NCL Profiline.
    * **Foil Colors:** White, Golden Oak, Dark Walnut, Anthracite Grey.
    * **Glass Architecture:** 5mm Toughened, 6mm Frosted, 24mm DGU (Double Glazed), 6mm Reflective Blue.
    * **Hardware & Reinforcement:** Heavy-duty brass tandem rollers, multi-point transmission gear locks, crescent locks, 1.2mm / 1.5mm GI steel reinforcement.
    * **Add-ons:** Stainless steel mosquito mesh, Georgian decorative bars, exhaust fan cutouts, site installation charges.

### 4.2. Parametric CAD Elevation Engine (`ParametricElevation.tsx`)

The CAD elevation engine generates real-time vector graphics (`<svg>`) representing the exact physical geometry of the configured UPVC product:

* **Proportional Scaling Viewport:**
  * Uses parametric coordinates computed from raw dimensions (`widthInInches`, `heightInInches`) mapped into an SVG viewBox with a fixed aspect boundary.
* **Typology-Specific Profile Geometry:**
  * **Sliding Systems (2-Track, 3-Track, Sliding Doors):**
    * Multi-track outer frame with mitred joints (45° corner lines).
    * Independent sashes rendered on adjacent track offsets.
    * Dynamic sliding direction arrows indicating active sliding panels.
  * **Casement Openable Systems (Side-Hung, Top-Hung):**
    * Dual-line hinge symbols on the hung stile/rail.
    * Triangular dashed swing-line projection toward the locking handle point.
  * **Fixed Glass & Combination Units:**
    * Transom and mullion intersection joints.
    * Glass daylight reflection diagonals.
* **Interactive Tooling:**
  * **Show/Hide Dimensions:** Toggles overall exterior dimensions and individual panel daylight dimensions.
  * **Show/Hide Panel Labels:** Toggles panel identifiers (`P1`, `P2`, `Sash A`, `Fixed`).
  * **Zoom In / Zoom Out / Reset View:** Viewport scale transforms with pan-centering.

### 4.3. Fabrication Math & Pricing Engine (`calculations.ts`)

Fabrication calculations adhere to Indian fenestration manufacturing standards:

1. **Area Calculation:**
   $$\text{Area (Sq.Ft)} = \frac{\text{Width (inches)} \times \text{Height (inches)}}{144} \times \text{Quantity}$$
2. **Material Base Cost:**
   $$\text{Base Cost} = \text{Area (Sq.Ft)} \times \text{Master Rate per Sq.Ft (from Active Fab Rate Sheet)}$$
3. **Glass & Finish Multipliers:**
   * DGU 24mm Acoustic Glass: $+₹180/\text{sq.ft}$
   * Woodgrain Laminated Foils (Golden Oak, Dark Walnut): $+₹90/\text{sq.ft}$
   * Anthracite Grey Foil: $+₹110/\text{sq.ft}$
4. **Accessories & Hardware Surcharges:**
   * Stainless Steel Mesh (SS 304): $+₹65/\text{sq.ft}$
   * Site Installation & Structural Silicone Seal: $+₹40/\text{sq.ft}$
   * Multi-point Casement Gear Locks: $+₹450/\text{unit}$
   * Heavy-duty Brass Tandem Rollers: $+₹300/\text{unit}$
5. **Goods & Services Tax (GST 18%):**
   * **Intra-State (within Maharashtra, State Code 27):** $\text{CGST } 9\% + \text{SGST } 9\%$
   * **Inter-State (e.g., Uttar Pradesh 09, Delhi 07, Haryana 06):** $\text{IGST } 18\%$

### 4.4. Workshop Cut-List Optimizer (`generateWorkshopCutList`)

To facilitate error-free cutting at the twin-head saw machine:
* **Outer Frame Cuts:**
  $$\text{Cut Length (mm)} = \text{Dimension (mm)} + 6\text{mm (Welding Burn-off)}$$
  Cuts prepared at $45^\circ \times 45^\circ$ miter angles.
* **Sliding Sash Cuts:**
  $$\text{Sash Width (mm)} = \frac{\text{Frame Width} + \text{Overlap Constant}}{\text{Panel Count}} + 6\text{mm}$$
* **Steel Reinforcement Length:**
  $$\text{Steel Length (mm)} = \text{Profile Cut Length (mm)} - 100\text{mm}$$
  (Leaves $50\text{mm}$ clearance at each corner to permit clean thermal corner welding without contacting steel).
* **Glass Daylight Size:**
  $$\text{Glass Daylight Width (mm)} = \text{Sash Width} - 110\text{mm}$$
  $$\text{Glass Daylight Height (mm)} = \text{Sash Height} - 110\text{mm}$$
* **Extrusion Stick Estimation:**
  Aggregates total linear millimetres of profile divided by $5800\text{mm}$ usable stick length (accounting for saw kerf and edge squaring).

### 4.5. GSTIN Intelligence & Verification Engine (`gstLookup.ts`)

The GST engine implements deep PAN structure decoding:
* **Structure:** $15\text{ characters} = [2\text{ State Code}][10\text{ PAN}][1\text{ Entity Number}][\text{'Z'}][1\text{ Checksum}]$
* **State Jurisdiction:** Pan-India state code dictionary covering all 36 states and union territories.
* **PAN 4th Character Decoding:**
  * `C` $\rightarrow$ Private / Public Limited Company
  * `P` $\rightarrow$ Proprietorship / Individual Enterprise
  * `F` $\rightarrow$ Partnership Firm / LLP
  * `H` $\rightarrow$ Hindu Undivided Family (HUF)
  * `A` $\rightarrow$ Association of Persons (AOP)
  * `T` $\rightarrow$ Trust / Educational Institution
* **Persistent Custom Registry (`localStorage`):**
  When a user modifies or inputs verified company details for a GSTIN, `saveCustomGstDetails()` caches the record permanently. Subsequent entries of that GSTIN immediately recall the client's company name, site address, and phone number.

### 4.6. Invoice & Milestone Payment Ledger Subsystem

The application provides a comprehensive accounting workflow:
* **CRUD Operations:**
  * **Create:** Direct generation from scratch via `CreateInvoiceView` or 1-click conversion from confirmed Quotations.
  * **Read / View:** Interactive `InvoiceDetailModal` displaying company credentials, buyer details, fenestration line item schedule, tax breakdown, and payment history.
  * **Update:** In-place editing of invoice date, due date, customer information, status, and individual line items with automatic tax and balance recalculation.
  * **Delete:** Safe removal with confirmation dialog.
  * **Duplicate:** Quick clone functionality for recurring customer projects.
* **Status State Machine:**
  $$\text{Pending} \xrightarrow{\text{Payment} > 0} \text{Partially Paid} \xrightarrow{\text{Balance} = 0} \text{Paid}$$
* **Payment History Ledger:**
  Records each payment transaction with amount, date, payment mode (`UPI`, `NEFT`, `Cash`, `Cheque`), bank reference/UTR number, and optional notes.

### 4.7. Multi-Tier Print & PDF Pipeline (`printDocument.ts`)

To overcome browser security restrictions in iframe sandboxes (e.g., Google AI Studio preview containers):
1. **Tier 1 (Offscreen Styled Frame):**
   Renders an offscreen iframe with standard desktop dimensions ($1024\text{px} \times 1400\text{px}$) to prevent Chromium from suppressing print on $0 \times 0$ elements.
2. **Tier 2 (In-DOM `#applet-print-container` with `@media print`):**
   Injects the document into a root print container, sets `document.body.classList.add('is-printing-active')`, and invokes `window.print()`. CSS rules hide all normal UI and display only the document.
3. **Tier 3 (Automated Self-Contained HTML Download Fallback):**
   If browser security policies block the modal print dialog (throwing `DOMException`), the engine catches the exception and immediately downloads a standalone, styled `.html` file. Opening this file in any browser allows printing or saving as PDF via standard browser controls.

---

## 5. Data Models (`src/types/index.ts`)

```typescript
// Core Quotation Item
export interface QuotationItem {
  id: string;
  itemNumber: number;
  name: string;
  locationTag: string;
  typologyId: ProductTypologyId;
  category: 'windows' | 'doors' | 'ventilators';
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
  trackCount: number;
  panelCount: number;
  openingDirection: OpeningDirection;
  profileSeries?: string;
  reinforcementThickness?: string;
}

// Master Tax Invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  quoteNumber?: string;
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
}

// Milestone Payment Record
export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  mode: 'UPI' | 'NEFT' | 'Cash' | 'Cheque';
  refNo: string;
  notes?: string;
}
```

---

## 6. Security, Performance & Offline Operation

* **Client-Side Data Integrity:** All calculations and data structures are strongly typed with zero external third-party telemetry or runtime API vulnerabilities.
* **Instantaneous UI Reactivity:** Zero network roundtrip latency for parametric CAD rendering, area math, or GST lookup.
* **Offline Readiness:** The entire suite operates completely offline in local workshops with no external dependencies required for pricing, CAD generation, or invoice printing.

---

## 7. Backend Architecture: Option A — Supabase BaaS (Active)

The current implementation utilizes **Option A: Backend-as-a-Service (BaaS) via Supabase (PostgreSQL)**.

### Architecture Highlights:
* **Direct Client Integration:** The React frontend connects directly to PostgreSQL via `@supabase/supabase-js` without requiring an intermediate API middleware layer.
* **Schema & Migration:** `supabase_schema.sql` defines relational tables (`customers`, `quotations`, `quotation_items`, `invoices`, `invoice_items`, `invoice_payments`, `rate_sheet_items`, `business_profile`, `custom_gst_registry`) with strict foreign keys, cascade rules, and `JSONB` accessory payloads.
* **Row-Level Security (RLS):** Built-in RLS policies ensure data security at the database engine level.
* **Local-First Fallback:** If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured in `.env`, `supabaseClient.ts` gracefully degrades to local memory and browser storage so development, offline estimation, and testing remain uninterrupted.

---

## 8. Future Enhancement: Option B — Dedicated Node.js & Express REST API (Roadmap)

As an enterprise scaling roadmap for large multi-branch fabrication networks or private on-premise factory deployments, **Option B** represents a dedicated custom backend service.

### Proposed Architecture for Option B:
* **Runtime & Framework:** Node.js (v20+) with Express (`express` 4.21+) or Fastify, fully typed with TypeScript.
* **ORM & Database Layer:** **Prisma** or **Drizzle ORM** connected to a self-hosted PostgreSQL cluster or enterprise AWS RDS / GCP Cloud SQL.
* **Authentication & RBAC:** JWT authentication with role-based authorization (SuperAdmin, Shop Manager, Estimator, Accountant, Workshop Saw Operator).
* **Proposed RESTful Endpoints (`/api/v1`):**
  * `GET /api/v1/health` — Server health & database connectivity
  * `GET/POST /api/v1/customers` — Customer CRM management
  * `GET/POST/PUT/DELETE /api/v1/quotations` — Quotation creation, item schedules & status updates
  * `POST /api/v1/quotations/:id/convert-to-invoice` — Atomic conversion of quotation into formal tax invoice
  * `GET/POST/PUT/DELETE /api/v1/invoices` — Tax invoices, line items, and audit trails
  * `POST /api/v1/invoices/:id/payments` — Milestone payment recorder with automated balance recalculation
  * `GET /api/v1/rates` — Master fabrication rate sheet editor
  * `POST /api/v1/integrations/whatsapp` — Server-side WhatsApp Business Cloud API automated messaging
  * `POST /api/v1/integrations/payment-webhook` — Automated payment gateway reconciliation (Razorpay / PayU)
* **Containerization:** Dockerfile & Docker Compose (`docker-compose.yml`) bundling the Vite React frontend, Express API server, and PostgreSQL database into a single deployable unit.
