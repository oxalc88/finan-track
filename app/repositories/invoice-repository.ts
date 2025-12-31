/**
 * Invoice repository - Data access layer for invoices
 */

import { query, queryOne, transaction, buildPaginationClause } from './db.js';
import type {
  Invoice,
  InvoiceItem,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  UpdateInvoiceInput,
  OcrStatus,
} from '../types/index.js';

/**
 * Create a new invoice record
 */
export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  const sql = `
    INSERT INTO invoices (user_id, file_key, file_url, file_type)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await queryOne<Invoice>(sql, [
    data.user_id,
    data.file_key,
    data.file_url || null,
    data.file_type || null,
  ]);

  if (!result) {
    throw new Error('Failed to create invoice');
  }

  return result;
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const sql = 'SELECT * FROM invoices WHERE id = $1';
  return queryOne<Invoice>(sql, [id]);
}

/**
 * Get invoice by ID with items
 */
export async function getInvoiceWithItems(id: string): Promise<{
  invoice: Invoice;
  items: InvoiceItem[];
} | null> {
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return null;
  }

  const items = await getInvoiceItems(id);

  return { invoice, items };
}

/**
 * List invoices for a user with filters and pagination
 */
export async function listInvoices(params: {
  user_id: string;
  status?: OcrStatus;
  start_date?: Date;
  end_date?: Date;
  vendor_name?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<{ invoices: Invoice[]; total: number }> {
  const conditions: string[] = ['user_id = $1'];
  const values: unknown[] = [params.user_id];
  let paramIndex = 2;

  if (params.status) {
    conditions.push(`ocr_status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }

  if (params.start_date) {
    conditions.push(`invoice_date >= $${paramIndex}`);
    values.push(params.start_date);
    paramIndex++;
  }

  if (params.end_date) {
    conditions.push(`invoice_date <= $${paramIndex}`);
    values.push(params.end_date);
    paramIndex++;
  }

  if (params.vendor_name) {
    conditions.push(`vendor_name ILIKE $${paramIndex}`);
    values.push(`%${params.vendor_name}%`);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM invoices ${whereClause}`;
  const countResult = await queryOne<{ count: string }>(countSql, values);
  const total = Number.parseInt(countResult?.count || '0', 10);

  // Get paginated results
  const { clause: paginationClause } = buildPaginationClause({
    page: params.page,
    limit: params.limit,
    sort_by: params.sort_by || 'created_at',
    sort_order: params.sort_order || 'desc',
  });

  const sql = `
    SELECT * FROM invoices
    ${whereClause}
    ${paginationClause}
  `;

  const invoices = await query<Invoice>(sql, values);

  return { invoices, total };
}

/**
 * Update invoice
 */
export async function updateInvoice(
  id: string,
  data: UpdateInvoiceInput
): Promise<Invoice | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Build dynamic update query
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return getInvoiceById(id);
  }

  values.push(id);

  const sql = `
    UPDATE invoices
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return queryOne<Invoice>(sql, values);
}

/**
 * Delete invoice (soft delete by setting status to failed or hard delete)
 */
export async function deleteInvoice(id: string): Promise<void> {
  const sql = 'DELETE FROM invoices WHERE id = $1';
  await query(sql, [id]);
}

/**
 * Create invoice items in a transaction
 */
export async function createInvoiceItems(
  items: CreateInvoiceItemInput[]
): Promise<InvoiceItem[]> {
  if (items.length === 0) {
    return [];
  }

  return transaction(async (client) => {
    const results: InvoiceItem[] = [];

    for (const item of items) {
      const sql = `
        INSERT INTO invoice_items (
          invoice_id, description, quantity, unit_price, amount, line_number
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query(sql, [
        item.invoice_id,
        item.description || null,
        item.quantity || null,
        item.unit_price || null,
        item.amount || null,
        item.line_number || null,
      ]);

      results.push(result.rows[0] as InvoiceItem);
    }

    return results;
  });
}

/**
 * Get all items for an invoice
 */
export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const sql = `
    SELECT * FROM invoice_items
    WHERE invoice_id = $1
    ORDER BY line_number ASC
  `;

  return query<InvoiceItem>(sql, [invoiceId]);
}

/**
 * Get invoices pending OCR processing
 */
export async function getPendingInvoices(limit = 10): Promise<Invoice[]> {
  const sql = `
    SELECT * FROM invoices
    WHERE ocr_status = 'pending'
    ORDER BY created_at ASC
    LIMIT $1
  `;

  return query<Invoice>(sql, [limit]);
}

/**
 * Mark invoice as processing
 */
export async function markInvoiceAsProcessing(id: string): Promise<void> {
  const sql = `
    UPDATE invoices
    SET ocr_status = 'processing'
    WHERE id = $1
  `;

  await query(sql, [id]);
}

/**
 * Mark invoice as completed with OCR data
 */
export async function markInvoiceAsCompleted(
  id: string,
  ocrData: UpdateInvoiceInput
): Promise<Invoice | null> {
  return updateInvoice(id, {
    ...ocrData,
    ocr_status: 'completed',
    processed_at: new Date(),
  });
}

/**
 * Mark invoice as failed
 */
export async function markInvoiceAsFailed(
  id: string,
  errorMessage: string
): Promise<Invoice | null> {
  return updateInvoice(id, {
    ocr_status: 'failed',
    error_message: errorMessage,
    processed_at: new Date(),
  });
}
