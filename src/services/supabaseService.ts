import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { Customer, Invoice, PaymentRecord, Quotation, RateSheetItem, BusinessProfile } from '../types';

/**
 * Supabase Data Service
 * Provides unified async methods for Quotations, Invoices, Customers, and Payments.
 * When Supabase is configured in .env, it synchronizes with PostgreSQL tables.
 * Otherwise, it logs an informational note and safely resolves.
 */

// ================= CUSTOMERS =================

export async function dbFetchCustomers(): Promise<Customer[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      companyName: row.company_name || undefined,
      mobile: row.mobile,
      email: row.email || undefined,
      address: row.address,
      city: row.city,
      gstin: row.gstin || undefined,
    }));
  } catch (err) {
    console.warn('[Supabase] Failed to fetch customers:', err);
    return null;
  }
}

export async function dbSaveCustomer(cust: Customer): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('customers').upsert({
      id: cust.id,
      name: cust.name,
      company_name: cust.companyName || null,
      mobile: cust.mobile,
      email: cust.email || null,
      address: cust.address,
      city: cust.city,
      gstin: cust.gstin || null,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[Supabase] Failed to save customer:', err);
    return false;
  }
}

// ================= QUOTATIONS =================

export async function dbFetchQuotations(): Promise<Quotation[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*, customer:customers(*), items:quotation_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      quoteNumber: row.quote_number,
      date: row.date,
      validUntil: row.valid_until,
      status: row.status,
      notes: row.notes || '',
      deliveryTimeline: row.delivery_timeline || '7-10 Days',
      paymentTerms: row.payment_terms || '50% Adv, 40% Disp, 10% Handover',
      createdAt: row.created_at,
      customer: {
        id: row.customer?.id || row.customer_id,
        name: row.customer?.name || 'Customer',
        companyName: row.customer?.company_name || undefined,
        mobile: row.customer?.mobile || '',
        email: row.customer?.email || undefined,
        address: row.customer?.address || '',
        city: row.customer?.city || '',
        gstin: row.customer?.gstin || undefined,
      },
      items: (row.items || []).map((i: any) => ({
        id: i.id,
        itemNumber: i.item_number,
        name: i.name,
        locationTag: i.location_tag,
        typologyId: i.typology_id,
        category: i.category,
        unit: i.unit,
        rawWidth: Number(i.raw_width),
        rawHeight: Number(i.raw_height),
        widthInInches: Number(i.width_inches),
        heightInInches: Number(i.height_inches),
        quantity: i.quantity,
        areaPerUnitSqFt: Number(i.area_per_unit_sqft),
        totalAreaSqFt: Number(i.total_area_sqft),
        glassPackage: i.glass_package,
        profileBrand: i.profile_brand,
        colorFoil: i.color_foil,
        accessories: i.accessories || {},
        ratePerSqFt: Number(i.rate_per_sqft),
        hardwareCostPerUnit: Number(i.hardware_cost_per_unit),
        fittingCostPerSqFt: Number(i.fitting_cost_per_sqft),
        meshCostPerSqFt: Number(i.mesh_cost_per_sqft),
        subtotal: Number(i.subtotal),
        gstAmount: Number(i.gst_amount),
        itemTotal: Number(i.item_total),
        trackCount: i.track_count,
        panelCount: i.panel_count,
        openingDirection: i.opening_direction,
        profileSeries: i.profile_series,
        reinforcementThickness: i.reinforcement_thickness,
      })),
    }));
  } catch (err) {
    console.warn('[Supabase] Failed to fetch quotations:', err);
    return null;
  }
}

export async function dbSaveQuotation(quote: Quotation): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // 1. Upsert customer
    await dbSaveCustomer(quote.customer);

    // 2. Upsert quotation
    const totalArea = quote.items.reduce((acc, i) => acc + i.totalAreaSqFt, 0);
    const subtotal = quote.items.reduce((acc, i) => acc + i.itemTotal, 0);
    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const grandTotal = subtotal + gstAmount;

    const { error: quoteErr } = await supabase.from('quotations').upsert({
      id: quote.id,
      quote_number: quote.quoteNumber,
      customer_id: quote.customer.id,
      date: quote.date,
      valid_until: quote.validUntil,
      status: quote.status,
      notes: quote.notes,
      delivery_timeline: quote.deliveryTimeline,
      payment_terms: quote.paymentTerms,
      subtotal,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      total_area_sqft: totalArea,
    });
    if (quoteErr) throw quoteErr;

    // 3. Upsert quotation items
    if (quote.items.length > 0) {
      const itemsPayload = quote.items.map((i) => ({
        id: i.id,
        quotation_id: quote.id,
        item_number: i.itemNumber,
        name: i.name,
        location_tag: i.locationTag,
        typology_id: i.typologyId,
        category: i.category,
        unit: i.unit,
        raw_width: i.rawWidth,
        raw_height: i.rawHeight,
        width_inches: i.widthInInches,
        height_inches: i.heightInInches,
        quantity: i.quantity,
        area_per_unit_sqft: i.areaPerUnitSqFt,
        total_area_sqft: i.totalAreaSqFt,
        glass_package: i.glassPackage,
        profile_brand: i.profileBrand,
        color_foil: i.colorFoil,
        accessories: i.accessories,
        rate_per_sqft: i.ratePerSqFt,
        hardware_cost_per_unit: i.hardwareCostPerUnit,
        fitting_cost_per_sqft: i.fittingCostPerSqFt,
        mesh_cost_per_sqft: i.meshCostPerSqFt,
        subtotal: i.subtotal,
        gst_amount: i.gstAmount,
        item_total: i.itemTotal,
        track_count: i.trackCount,
        panel_count: i.panelCount,
        opening_direction: i.openingDirection,
        profile_series: i.profileSeries,
        reinforcement_thickness: i.reinforcementThickness,
      }));
      const { error: itemsErr } = await supabase.from('quotation_items').upsert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Failed to save quotation:', err);
    return false;
  }
}

// ================= INVOICES & PAYMENTS =================

export async function dbFetchInvoices(): Promise<Invoice[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*), payments:invoice_payments(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      quotationId: row.quotation_id || '',
      quoteNumber: row.quote_number || '',
      date: row.date,
      dueDate: row.due_date,
      totalAmount: Number(row.total_amount),
      advanceReceived: Number(row.advance_received),
      balanceDue: Number(row.balance_due),
      status: row.status,
      notes: row.notes || undefined,
      customer: {
        id: row.customer?.id || row.customer_id,
        name: row.customer?.name || 'Customer',
        companyName: row.customer?.company_name || undefined,
        mobile: row.customer?.mobile || '',
        email: row.customer?.email || undefined,
        address: row.customer?.address || '',
        city: row.customer?.city || '',
        gstin: row.customer?.gstin || undefined,
      },
      items: (row.items || []).map((i: any) => ({
        id: i.id,
        itemNumber: i.item_number,
        name: i.name,
        locationTag: i.location_tag,
        typologyId: i.typology_id,
        category: i.category,
        unit: i.unit,
        rawWidth: Number(i.raw_width),
        rawHeight: Number(i.raw_height),
        widthInInches: Number(i.width_inches),
        heightInInches: Number(i.height_inches),
        quantity: i.quantity,
        areaPerUnitSqFt: Number(i.area_per_unit_sqft),
        totalAreaSqFt: Number(i.total_area_sqft),
        glassPackage: i.glass_package,
        profileBrand: i.profile_brand,
        colorFoil: i.color_foil,
        accessories: i.accessories || {},
        ratePerSqFt: Number(i.rate_per_sqft),
        hardwareCostPerUnit: Number(i.hardware_cost_per_unit),
        fittingCostPerSqFt: Number(i.fitting_cost_per_sqft),
        meshCostPerSqFt: Number(i.mesh_cost_per_sqft),
        subtotal: Number(i.subtotal),
        gstAmount: Number(i.gst_amount),
        itemTotal: Number(i.item_total),
        trackCount: i.track_count,
        panelCount: i.panel_count,
        openingDirection: i.opening_direction,
        profileSeries: i.profile_series,
        reinforcementThickness: i.reinforcement_thickness,
      })),
      payments: (row.payments || []).map((p: any) => ({
        id: p.id,
        date: p.payment_date,
        amount: Number(p.amount),
        mode: p.payment_mode,
        refNo: p.ref_no,
        notes: p.notes || undefined,
      })),
    }));
  } catch (err) {
    console.warn('[Supabase] Failed to fetch invoices:', err);
    return null;
  }
}

export async function dbSaveInvoice(inv: Invoice): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // 1. Upsert customer
    await dbSaveCustomer(inv.customer);

    // 2. Upsert invoice record
    const { error: invErr } = await supabase.from('invoices').upsert({
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      quotation_id: inv.quotationId || null,
      quote_number: inv.quoteNumber || null,
      customer_id: inv.customer.id,
      date: inv.date,
      due_date: inv.dueDate,
      total_amount: inv.totalAmount,
      advance_received: inv.advanceReceived,
      balance_due: inv.balanceDue,
      status: inv.status,
      notes: inv.notes || null,
    });
    if (invErr) throw invErr;

    // 3. Upsert invoice items
    if (inv.items.length > 0) {
      const itemsPayload = inv.items.map((i) => ({
        id: i.id,
        invoice_id: inv.id,
        item_number: i.itemNumber,
        name: i.name,
        location_tag: i.locationTag,
        typology_id: i.typologyId,
        category: i.category,
        unit: i.unit,
        raw_width: i.rawWidth,
        raw_height: i.rawHeight,
        width_inches: i.widthInInches,
        height_inches: i.heightInInches,
        quantity: i.quantity,
        area_per_unit_sqft: i.areaPerUnitSqFt,
        total_area_sqft: i.totalAreaSqFt,
        glass_package: i.glassPackage,
        profile_brand: i.profileBrand,
        color_foil: i.colorFoil,
        accessories: i.accessories,
        rate_per_sqft: i.ratePerSqFt,
        hardware_cost_per_unit: i.hardwareCostPerUnit,
        fitting_cost_per_sqft: i.fittingCostPerSqFt,
        mesh_cost_per_sqft: i.meshCostPerSqFt,
        subtotal: i.subtotal,
        gst_amount: i.gstAmount,
        item_total: i.itemTotal,
        track_count: i.trackCount,
        panel_count: i.panelCount,
        opening_direction: i.openingDirection,
        profile_series: i.profileSeries,
        reinforcement_thickness: i.reinforcementThickness,
      }));
      await supabase.from('invoice_items').upsert(itemsPayload);
    }

    // 4. Upsert payments
    if (inv.payments.length > 0) {
      const payPayload = inv.payments.map((p) => ({
        id: p.id,
        invoice_id: inv.id,
        amount: p.amount,
        payment_date: p.date,
        payment_mode: p.mode,
        ref_no: p.refNo,
        notes: p.notes || null,
      }));
      await supabase.from('invoice_payments').upsert(payPayload);
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Failed to save invoice:', err);
    return false;
  }
}
