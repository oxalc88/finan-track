/**
 * OCR Service - Business logic for invoice OCR processing
 */

import * as ocr from '../lib/ocr.js';
import * as storage from '../lib/storage.js';
import * as invoiceRepo from '../repositories/invoice-repository.js';
import type { Invoice, InvoiceItem } from '../types/index.js';

/**
 * Upload and process an invoice file
 */
export async function uploadAndProcessInvoice(params: {
  userId: string;
  file: Buffer;
  filename: string;
  contentType: string;
}): Promise<{ invoice: Invoice; processingStarted: boolean }> {
  try {
    // 1. Upload file to storage
    const fileKey = storage.generateInvoiceKey(params.userId, params.filename);
    await storage.uploadFile(fileKey, params.file, {
      contentType: params.contentType,
      metadata: {
        userId: params.userId,
        originalFilename: params.filename,
      },
    });

    const fileUrl = storage.getFileUrl(fileKey);

    // 2. Create invoice record in database
    const invoice = await invoiceRepo.createInvoice({
      user_id: params.userId,
      file_key: fileKey,
      file_url: fileUrl,
      file_type: params.contentType,
    });

    // 3. Start OCR processing asynchronously
    processInvoiceOcr(invoice.id, params.file).catch((error) => {
      console.error(`Failed to process OCR for invoice ${invoice.id}:`, error);
    });

    return {
      invoice,
      processingStarted: true,
    };
  } catch (error) {
    console.error('Failed to upload and process invoice:', error);
    throw new Error('Failed to upload invoice file');
  }
}

/**
 * Process OCR for an invoice
 * This is called asynchronously after the invoice is uploaded
 */
export async function processInvoiceOcr(invoiceId: string, fileBuffer: Buffer): Promise<void> {
  try {
    // Mark as processing
    await invoiceRepo.markInvoiceAsProcessing(invoiceId);

    // Run OCR
    const ocrResult = await ocr.processImage(fileBuffer);

    // Check confidence
    if (!ocr.isConfidenceAcceptable(ocrResult.confidence)) {
      await invoiceRepo.markInvoiceAsFailed(
        invoiceId,
        `Low OCR confidence: ${ocrResult.confidence}%`
      );
      return;
    }

    // Update invoice with OCR results
    await invoiceRepo.markInvoiceAsCompleted(invoiceId, {
      vendor_name: ocrResult.invoice_data?.vendor || null,
      invoice_number: ocrResult.invoice_data?.invoice_number || null,
      invoice_date: ocrResult.invoice_data?.date ? new Date(ocrResult.invoice_data.date) : null,
      due_date: ocrResult.invoice_data?.due_date ? new Date(ocrResult.invoice_data.due_date) : null,
      subtotal: ocrResult.invoice_data?.subtotal || null,
      tax: ocrResult.invoice_data?.tax || null,
      total: ocrResult.invoice_data?.total || null,
      currency: ocrResult.invoice_data?.currency || 'USD',
      raw_ocr_text: ocrResult.text,
      ocr_data: ocrResult.invoice_data?.raw_data || null,
      confidence_score: ocrResult.confidence,
    });

    // Create invoice items if extracted
    if (ocrResult.invoice_data?.items && ocrResult.invoice_data.items.length > 0) {
      const itemsToCreate = ocrResult.invoice_data.items.map((item) => ({
        invoice_id: invoiceId,
        description: item.description || null,
        quantity: item.quantity || null,
        unit_price: item.unit_price || null,
        amount: item.amount || null,
        line_number: item.line_number || null,
      }));

      await invoiceRepo.createInvoiceItems(itemsToCreate);
    }

    console.log(`✅ Successfully processed OCR for invoice ${invoiceId}`);
  } catch (error) {
    console.error(`❌ Failed to process OCR for invoice ${invoiceId}:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await invoiceRepo.markInvoiceAsFailed(invoiceId, errorMessage);
  }
}

/**
 * Get invoice with items
 */
export async function getInvoiceWithItems(
  invoiceId: string
): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
  return invoiceRepo.getInvoiceWithItems(invoiceId);
}

/**
 * List invoices for a user
 */
export async function listUserInvoices(params: {
  userId: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  startDate?: string;
  endDate?: string;
  vendorName?: string;
  page?: number;
  limit?: number;
}): Promise<{ invoices: Invoice[]; total: number; page: number; limit: number }> {
  const { invoices, total } = await invoiceRepo.listInvoices({
    user_id: params.userId,
    status: params.status,
    start_date: params.startDate ? new Date(params.startDate) : undefined,
    end_date: params.endDate ? new Date(params.endDate) : undefined,
    vendor_name: params.vendorName,
    page: params.page,
    limit: params.limit,
  });

  const page = params.page || 1;
  const limit = params.limit || 20;

  return {
    invoices,
    total,
    page,
    limit,
  };
}

/**
 * Delete an invoice and its file
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const invoice = await invoiceRepo.getInvoiceById(invoiceId);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  try {
    // Delete from storage
    await storage.deleteFile(invoice.file_key);
  } catch (error) {
    console.error(`Failed to delete file from storage: ${invoice.file_key}`, error);
    // Continue with database deletion even if storage deletion fails
  }

  // Delete from database (will cascade delete invoice items)
  await invoiceRepo.deleteInvoice(invoiceId);
}

/**
 * Reprocess an invoice (useful if OCR failed or returned poor results)
 */
export async function reprocessInvoice(invoiceId: string): Promise<void> {
  const invoice = await invoiceRepo.getInvoiceById(invoiceId);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Download the file from storage
  const fileBuffer = await storage.downloadFile(invoice.file_key);

  // Reprocess OCR
  await processInvoiceOcr(invoiceId, fileBuffer);
}
