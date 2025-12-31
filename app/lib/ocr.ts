/**
 * Cloud-agnostic OCR library
 * Supports Tesseract.js (local), AWS Textract, and Cloudflare AI
 */

import { createWorker } from 'tesseract.js';
import { getConfig } from '../config/env.js';
import type { InvoiceData, OcrResult } from '../types/ocr.js';

/**
 * Process an image with OCR
 */
export async function processImage(buffer: Buffer): Promise<OcrResult> {
  const config = getConfig();

  switch (config.ocr.provider) {
    case 'tesseract':
      return processTesseract(buffer);
    case 'textract':
      throw new Error('AWS Textract support not yet implemented');
    case 'cloudflare-ai':
      throw new Error('Cloudflare AI support not yet implemented');
    default:
      throw new Error(`Unknown OCR provider: ${config.ocr.provider}`);
  }
}

/**
 * Process image with Tesseract.js
 */
async function processTesseract(buffer: Buffer): Promise<OcrResult> {
  const config = getConfig();
  const worker = await createWorker(config.ocr.language);

  try {
    const { data } = await worker.recognize(buffer);

    // Extract invoice data from the text
    const invoiceData = extractInvoiceData(data.text);

    return {
      text: data.text,
      confidence: data.confidence,
      invoice_data: invoiceData,
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract structured invoice data from OCR text
 * This is a simple implementation - you can enhance it with ML or better parsing
 */
function extractInvoiceData(text: string): InvoiceData {
  const invoiceData: InvoiceData = {
    raw_data: { original_text: text },
  };

  // Extract vendor/merchant name (usually at the top)
  const vendorMatch = text.match(/^(.+?)(?:\n|$)/);
  if (vendorMatch) {
    invoiceData.vendor = vendorMatch[1].trim();
  }

  // Extract invoice number
  const invoiceNumberPatterns = [
    /invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /inv\s*#?\s*:?\s*([A-Z0-9-]+)/i,
    /receipt\s*#?\s*:?\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of invoiceNumberPatterns) {
    const match = text.match(pattern);
    if (match) {
      invoiceData.invoice_number = match[1];
      break;
    }
  }

  // Extract dates
  const datePatterns = [
    /date\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      invoiceData.date = normalizeDate(match[1]);
      break;
    }
  }

  // Extract total amount
  const totalPatterns = [
    /total\s*:?\s*\$?\s*([0-9,]+\.?\d{0,2})/i,
    /amount\s*due\s*:?\s*\$?\s*([0-9,]+\.?\d{0,2})/i,
    /balance\s*:?\s*\$?\s*([0-9,]+\.?\d{0,2})/i,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1].replace(/,/g, '');
      invoiceData.total = Number.parseFloat(amount);
      break;
    }
  }

  // Extract tax
  const taxPatterns = [
    /tax\s*:?\s*\$?\s*([0-9,]+\.?\d{0,2})/i,
    /vat\s*:?\s*\$?\s*([0-9,]+\.?\d{0,2})/i,
  ];

  for (const pattern of taxPatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1].replace(/,/g, '');
      invoiceData.tax = Number.parseFloat(amount);
      break;
    }
  }

  // Calculate subtotal if we have total and tax
  if (invoiceData.total !== undefined && invoiceData.tax !== undefined) {
    invoiceData.subtotal = invoiceData.total - invoiceData.tax;
  }

  // Extract currency (default to USD)
  const currencyPatterns = [/\b(USD|EUR|GBP|JPY|CAD|AUD)\b/i, /\$|€|£|¥/];

  for (const pattern of currencyPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1]) {
        invoiceData.currency = match[1].toUpperCase();
      } else {
        // Map symbols to currency codes
        const symbolMap: Record<string, string> = {
          $: 'USD',
          '€': 'EUR',
          '£': 'GBP',
          '¥': 'JPY',
        };
        invoiceData.currency = symbolMap[match[0]] || 'USD';
      }
      break;
    }
  }

  // Extract line items (basic implementation)
  const items = extractLineItems(text);
  if (items.length > 0) {
    invoiceData.items = items;
  }

  return invoiceData;
}

/**
 * Extract line items from invoice text
 */
function extractLineItems(text: string): Array<{
  description?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  line_number?: number;
}> {
  const items: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    amount?: number;
    line_number?: number;
  }> = [];

  // Look for patterns like: "Item Name    2    $10.00    $20.00"
  const lineItemPattern = /^(.+?)\s+(\d+)\s+\$?([0-9,]+\.?\d{0,2})\s+\$?([0-9,]+\.?\d{0,2})$/gm;

  let match: RegExpExecArray | null;
  let lineNumber = 1;

  while ((match = lineItemPattern.exec(text)) !== null) {
    items.push({
      description: match[1].trim(),
      quantity: Number.parseInt(match[2], 10),
      unit_price: Number.parseFloat(match[3].replace(/,/g, '')),
      amount: Number.parseFloat(match[4].replace(/,/g, '')),
      line_number: lineNumber++,
    });
  }

  return items;
}

/**
 * Normalize date string to ISO format
 */
function normalizeDate(dateStr: string): string {
  try {
    // Try to parse various date formats
    const cleaned = dateStr.replace(/\s/g, '');
    let date: Date;

    if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        // Assume MM/DD/YYYY or DD/MM/YYYY
        const month = Number.parseInt(parts[0], 10);
        const day = Number.parseInt(parts[1], 10);
        let year = Number.parseInt(parts[2], 10);

        // Handle 2-digit years
        if (year < 100) {
          year += 2000;
        }

        date = new Date(year, month - 1, day);
      } else {
        throw new Error('Invalid date format');
      }
    } else if (cleaned.includes('-')) {
      date = new Date(cleaned);
    } else {
      throw new Error('Invalid date format');
    }

    return date.toISOString().split('T')[0];
  } catch {
    return dateStr; // Return original if parsing fails
  }
}

/**
 * Validate OCR result confidence
 */
export function isConfidenceAcceptable(confidence: number, threshold = 60): boolean {
  return confidence >= threshold;
}
