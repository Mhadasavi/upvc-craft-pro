-- ==============================================================================
-- uPVC Craft Pro — Supabase PostgreSQL Schema Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company_name TEXT,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  gstin VARCHAR(15),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
  date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'confirmed', 'invoiced')) DEFAULT 'draft',
  notes TEXT,
  delivery_timeline TEXT DEFAULT '7-10 Working Days',
  payment_terms TEXT DEFAULT '50% Advance, 40% Dispatch, 10% Handover',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_area_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Quotation Line Items (Engineering & CAD Data)
CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY,
  quotation_id TEXT REFERENCES quotations(id) ON DELETE CASCADE,
  item_number INT NOT NULL,
  name TEXT NOT NULL,
  location_tag TEXT,
  typology_id TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'in',
  raw_width NUMERIC(8, 2) NOT NULL,
  raw_height NUMERIC(8, 2) NOT NULL,
  width_inches NUMERIC(8, 2) NOT NULL,
  height_inches NUMERIC(8, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  area_per_unit_sqft NUMERIC(8, 2) NOT NULL,
  total_area_sqft NUMERIC(8, 2) NOT NULL,
  glass_package TEXT NOT NULL,
  profile_brand TEXT NOT NULL,
  color_foil TEXT NOT NULL DEFAULT 'white',
  accessories JSONB NOT NULL DEFAULT '{}'::jsonb,
  rate_per_sqft NUMERIC(10, 2) NOT NULL,
  hardware_cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fitting_cost_per_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
  mesh_cost_per_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL,
  gst_amount NUMERIC(12, 2) NOT NULL,
  item_total NUMERIC(12, 2) NOT NULL,
  track_count INT DEFAULT 2,
  panel_count INT DEFAULT 2,
  opening_direction TEXT DEFAULT 'slide-left',
  profile_series TEXT,
  reinforcement_thickness TEXT
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  quotation_id TEXT,
  quote_number TEXT,
  customer_id TEXT REFERENCES customers(id) ON DELETE RESTRICT,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  advance_received NUMERIC(12, 2) DEFAULT 0,
  balance_due NUMERIC(12, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'partially_paid', 'paid', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  item_number INT NOT NULL,
  name TEXT NOT NULL,
  location_tag TEXT,
  typology_id TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'in',
  raw_width NUMERIC(8, 2) NOT NULL,
  raw_height NUMERIC(8, 2) NOT NULL,
  width_inches NUMERIC(8, 2) NOT NULL,
  height_inches NUMERIC(8, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  area_per_unit_sqft NUMERIC(8, 2) NOT NULL,
  total_area_sqft NUMERIC(8, 2) NOT NULL,
  glass_package TEXT NOT NULL,
  profile_brand TEXT NOT NULL,
  color_foil TEXT NOT NULL DEFAULT 'white',
  accessories JSONB NOT NULL DEFAULT '{}'::jsonb,
  rate_per_sqft NUMERIC(10, 2) NOT NULL,
  hardware_cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fitting_cost_per_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
  mesh_cost_per_sqft NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL,
  gst_amount NUMERIC(12, 2) NOT NULL,
  item_total NUMERIC(12, 2) NOT NULL,
  track_count INT DEFAULT 2,
  panel_count INT DEFAULT 2,
  opening_direction TEXT DEFAULT 'slide-left',
  profile_series TEXT,
  reinforcement_thickness TEXT
);

-- 6. Milestone Payments Table
CREATE TABLE IF NOT EXISTS invoice_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date TEXT NOT NULL,
  payment_mode TEXT CHECK (payment_mode IN ('UPI', 'NEFT', 'Cash', 'Cheque')),
  ref_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Master Rate Sheet Table
CREATE TABLE IF NOT EXISTS rate_sheet_items (
  id TEXT PRIMARY KEY,
  typology_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  base_rate_per_sqft NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL
);

-- 8. Business Profile Table
CREATE TABLE IF NOT EXISTS business_profile (
  id INT PRIMARY KEY DEFAULT 1,
  shop_name TEXT NOT NULL,
  tagline TEXT,
  owner_name TEXT NOT NULL,
  role TEXT DEFAULT 'Proprietor',
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT,
  gstin VARCHAR(15),
  bank_name TEXT,
  account_no TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  rate_tier TEXT DEFAULT 'Standard Commercial',
  terms_and_conditions JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Custom Verified GST Registry Table
CREATE TABLE IF NOT EXISTS custom_gst_registry (
  gstin VARCHAR(15) PRIMARY KEY,
  company_name TEXT NOT NULL,
  trade_name TEXT,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code VARCHAR(2),
  mobile TEXT,
  email TEXT,
  tax_payer_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation_id ON invoices(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_qid ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invid ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invid ON invoice_payments(invoice_id);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_sheet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_gst_registry ENABLE ROW LEVEL SECURITY;

-- Default open policies for authenticated/anon shop access (customize as needed)
CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public write customers" ON customers FOR ALL USING (true);

CREATE POLICY "Allow public read quotations" ON quotations FOR SELECT USING (true);
CREATE POLICY "Allow public write quotations" ON quotations FOR ALL USING (true);

CREATE POLICY "Allow public read quotation_items" ON quotation_items FOR SELECT USING (true);
CREATE POLICY "Allow public write quotation_items" ON quotation_items FOR ALL USING (true);

CREATE POLICY "Allow public read invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow public write invoices" ON invoices FOR ALL USING (true);

CREATE POLICY "Allow public read invoice_items" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow public write invoice_items" ON invoice_items FOR ALL USING (true);

CREATE POLICY "Allow public read invoice_payments" ON invoice_payments FOR SELECT USING (true);
CREATE POLICY "Allow public write invoice_payments" ON invoice_payments FOR ALL USING (true);

CREATE POLICY "Allow public read rate_sheet_items" ON rate_sheet_items FOR SELECT USING (true);
CREATE POLICY "Allow public write rate_sheet_items" ON rate_sheet_items FOR ALL USING (true);

CREATE POLICY "Allow public read business_profile" ON business_profile FOR SELECT USING (true);
CREATE POLICY "Allow public write business_profile" ON business_profile FOR ALL USING (true);

CREATE POLICY "Allow public read custom_gst_registry" ON custom_gst_registry FOR SELECT USING (true);
CREATE POLICY "Allow public write custom_gst_registry" ON custom_gst_registry FOR ALL USING (true);
