# uPVC Craft Pro — UPVC Quotation, CAD & Billing System

A modern, high-precision fenestration estimation, dynamic parametric CAD elevation, workshop cut-list, and GST tax invoicing application designed specifically for Indian UPVC window and door fabrication shops, contractors, and dealers.

---

## 🛠️ Tech Stack Used

The application is built using a modern, local-first web stack optimized for rapid performance, strict type safety, zero external CAD bloat, and responsive cross-device usability:

### **Frontend Core & Framework**
* **[React 19](https://react.dev/) (`v19.0.1`)**: Component-driven user interface leveraging the latest concurrent rendering features, functional state management, and declarative UI patterns.
* **[TypeScript](https://www.typescriptlang.org/) (`v7.0.2` / `v5.x`)**: End-to-end static typing across fenestration engineering domain models (`QuotationItem`, `Invoice`, `Customer`, `RateSheetItem`, `WorkshopCutItem`), mathematical calculation formulas, and UI component props.

### **Styling & Design System**
* **[Tailwind CSS v4](https://tailwindcss.com/) (`v4.3.3`)**: Next-generation utility-first CSS engine powered by `@tailwindcss/vite` with CSS-first configuration, custom responsive variables, and specialized `@media print` rules for clean A4 paper layouts.
* **[Lucide React](https://lucide.dev/) (`v0.546.0`)**: High-clarity, consistent vector iconography for fenestration actions, toolbars, and system navigation.
* **Typography**:
  * **Inter**: Clean, ergonomic sans-serif typeface for UI controls, form fields, and administrative schedules.
  * **JetBrains Mono**: High-legibility monospaced typeface for precision dimensional readouts, GSTIN codes, and currency tabular formatting.

### **Parametric CAD & Visualization**
* **Native SVG (Scalable Vector Graphics)**: Custom-built parametric vector rendering engine (`ParametricElevation.tsx`) that generates real-time CAD elevations directly from dimensional inputs with zero heavy third-party Canvas/WebGL dependencies.
* **[Motion](https://motion.dev/) (`v12.23.24`)**: Fluid UI elevation animations and layout transitions.

### **Build Tooling & Bundling**
* **[Vite 8](https://vite.dev/) (`v8.3.0`)**: Ultra-fast next-generation frontend tooling with instant Hot Module Replacement (HMR) and optimized Rollup/ESM production bundles.
* **[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) (`v6.1.1`)**: React Fast Refresh and compiler optimizations.
* **[esbuild](https://esbuild.github.io/) (`v0.25.0`)**: Sub-millisecond TypeScript transpilation.

### **Backend & Database Architecture**
* **Active (Option A) — [Supabase BaaS (PostgreSQL)](https://supabase.com/) (`@supabase/supabase-js` `v2.118.0`)**: Direct client-to-database architecture leveraging PostgreSQL tables, Row Level Security (RLS), and JSONB accessory schemas. Includes ready-to-execute migration script [`supabase_schema.sql`](supabase_schema.sql) and local-first fallback mode.
* **Planned (Option B) — Dedicated Node.js & Express REST API**: Future scaling path featuring custom Express REST endpoints (`/api/v1`), Prisma ORM, and Docker containerization (see [architecture.md](architecture.md#8-future-enhancement-option-b--dedicated-nodejs--express-rest-api-roadmap)).
* **[Express](https://expressjs.com/) (`v4.21.2`)**: Installed Node.js runtime support.
* **[@google/genai](https://www.npmjs.com/package/@google/genai) (`v2.4.0`)**: Google Gen AI SDK for Gemini AI integrations.
* **[dotenv](https://github.com/motdotla/dotenv) (`v17.2.3`)**: Secure environment variable management.

### **Client-Side Storage & Printing Subsystem**
* **HTML5 Web Storage (`localStorage`)**: Local-first persistent storage for business profiles, custom verified GST records, and master fabrication price books.
* **Multi-Tier Print Engine (`printDocument.ts`)**: Custom pure-browser printing architecture with offscreen dimensional iframes, in-DOM print containers, and automatic fallback downloadable standalone HTML documents.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **Quotation Builder (Simple & Advanced Modes)** | Toggle between rapid 30-second sales estimates and deep engineering configurators (brand profiles, foils, glass packages, reinforcements, hardware). |
| **Parametric CAD Elevation Engine** | Real-time dynamic SVG window/door elevations with frame miters, sashes, sliding direction arrows, openable swing lines, and zoom/pan controls. |
| **Workshop Cut-List Optimizer** | Automated fabrication schedules with 45° miter saw cutting lengths, 6mm welding burn-off allowance, steel reinforcement lengths, and glass daylight sizes. |
| **GSTIN Intelligence & PAN Decoder** | Pan-India 36 state code detection, PAN 4th-character legal entity identification (Company, Proprietor, LLP, Trust), and persistent customer registry. |
| **Tax Invoice & Payment Ledger** | Complete CRUD operations for GST tax invoices, milestone advance tracking, balance due calculations, and payment history logs (UPI, NEFT, Cash, Cheque). |
| **WhatsApp Direct Sharing** | 1-click URL-encoded customer quotes and invoices formatted with item counts, bank credentials, UPI ID, and direct `wa.me` links. |
| **Official A4 Print & PDF Export** | Clean, standards-compliant A4 Estimates, Tax Invoices, and Workshop Cut-Lists with offline fallback support. |

---

## 📁 Project Structure

```
├── architecture.md                    # Deep-dive system architecture & formulas
├── index.html                         # Application HTML shell
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # Strict TypeScript settings
├── vite.config.ts                     # Vite configuration (port 3000)
└── src/
    ├── main.tsx                       # React application root
    ├── App.tsx                        # Master state, view routing & modals
    ├── index.css                      # Tailwind v4 setup & print media styling
    ├── data/
    │   └── initialData.ts             # Initial UPVC typologies & pricing presets
    ├── types/
    │   └── index.ts                   # Domain TypeScript interfaces
    ├── utils/
    │   ├── calculations.ts            # Fenestration math, cut-list formulas & WhatsApp
    │   ├── gstLookup.ts               # Indian GSTIN validation & PAN decoding
    │   └── printDocument.ts           # Multi-tier print & HTML export pipeline
    └── components/
        ├── diagram/                   # Parametric SVG CAD elevations & thumbnails
        ├── layout/                    # Persistent Header & Sidebar navigation
        ├── modals/                    # Customer, Cut-List, Invoice, & Print modals
        ├── quotation/                 # Quotation builder configurator, tables & summaries
        └── views/                     # Main tabs (Quotation, Invoices, CRM, Rates, Settings)
```

---

## 💻 Getting Started

### **Prerequisites**
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* `npm` or `bun`

### **Installation**
1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd uPVC-Craft-Pro---UPVC-Quotation-&-Billing
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables (Optional for Cloud Sync):
   ```bash
   cp .env.example .env
   ```
   * Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to connect PostgreSQL.
   * Paste the contents of [`supabase_schema.sql`](supabase_schema.sql) into your Supabase SQL Editor.
   * *(Note: If not configured, the app runs automatically in Local-First Demo Mode).*

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## 📋 Available Scripts

* `npm run dev` — Launches the Vite development server on port 3000 (`--host=0.0.0.0`).
* `npm run build` — Compiles TypeScript and creates an optimized production bundle in `dist/`.
* `npm run preview` — Locally previews the production build.
* `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`) to verify strict static typing.

---

## 🗺️ Roadmap & Future Enhancements

* [x] **Option A (Current)**: Client-side React 19 + Supabase BaaS (PostgreSQL) with local-first fallback.
* [ ] **Option B (Future Enhancement)**: Dedicated Node.js & Express REST API (`server/`) with Prisma ORM, containerized deployment, and multi-tenant isolation.
* [ ] **Automated Payment Webhooks**: Real-time UPI and net-banking settlement callbacks via Razorpay / PayU into the invoice payment ledger.
* [ ] **WhatsApp Cloud API Integration**: Automated server-side PDF invoice dispatching via verified Meta WhatsApp Business Cloud API.
* [ ] **Multi-Branch Stock & Extrusion Inventory**: Real-time warehouse tracking of 6m profile sticks, glass sheets, and hardware accessories.

---

## 📄 Documentation

For deep technical details on the fabrication calculation formulas, saw cutting allowances, GST rules, parametric SVG geometry, and backend designs, refer to [architecture.md](architecture.md).