/**
 * OCR-related types
 */

export interface OcrResult {
  text: string;
  confidence: number;
  invoice_data?: InvoiceData;
}

export interface InvoiceData {
  vendor?: string;
  invoice_number?: string;
  date?: string;
  due_date?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
  items?: InvoiceLineItem[];
  raw_data?: Record<string, unknown>;
}

export interface InvoiceLineItem {
  description?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  line_number?: number;
}

export interface OcrProvider {
  name: 'tesseract' | 'textract' | 'cloudflare-ai';
  processImage(buffer: Buffer): Promise<OcrResult>;
}

export interface OcrConfig {
  provider: 'tesseract' | 'textract' | 'cloudflare-ai';
  language?: string;
  awsRegion?: string;
  cloudflareAccountId?: string;
  cloudflareApiKey?: string;
}

// Tesseract.js specific types
export interface TesseractResult {
  data: {
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      confidence: number;
      bbox: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      };
    }>;
  };
}
