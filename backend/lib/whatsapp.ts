/**
 * WhatsApp integration library using Kapso.ai
 * Handles sending messages and receiving webhooks for invoice processing
 */

import crypto from 'node:crypto';
import { getConfig } from '../config/env.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * Message types supported by WhatsApp
 */
export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'template';

/**
 * WhatsApp message payload
 */
export interface WhatsAppMessage {
  to: string; // Phone number in format: +1234567890
  type: WhatsAppMessageType;
  text?: {
    body: string;
  };
  image?: {
    link?: string;
    caption?: string;
  };
  document?: {
    link?: string;
    filename?: string;
    caption?: string;
  };
  template?: {
    name: string;
    language: string;
    components?: unknown[];
  };
}

/**
 * Webhook event from Kapso
 */
export interface KapsoWebhookEvent {
  event: string; // e.g., 'whatsapp.message.received'
  timestamp: string;
  conversation_id: string;
  message: {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video';
    text?: {
      body: string;
    };
    image?: {
      id: string;
      mime_type: string;
      sha256: string;
      caption?: string;
    };
    document?: {
      id: string;
      mime_type: string;
      sha256: string;
      filename?: string;
      caption?: string;
    };
  };
  customer: {
    phone: string;
    name?: string;
  };
}

/**
 * Send a WhatsApp message via Kapso API
 */
export async function sendMessage(message: WhatsAppMessage): Promise<{ message_id: string }> {
  const config = getConfig();

  if (!config.whatsapp.apiKey) {
    throw new Error('WhatsApp API key not configured');
  }

  const response = await fetch(`${config.whatsapp.apiUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsapp.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error({ error, status: response.status }, 'Failed to send WhatsApp message');
    throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
  }

  return (await response.json()) as { message_id: string };
}

/**
 * Send a text message
 */
export async function sendTextMessage(to: string, text: string): Promise<{ message_id: string }> {
  return sendMessage({
    to,
    type: 'text',
    text: { body: text },
  });
}

/**
 * Send an image message
 */
export async function sendImageMessage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<{ message_id: string }> {
  return sendMessage({
    to,
    type: 'image',
    image: {
      link: imageUrl,
      caption,
    },
  });
}

/**
 * Send a document message
 */
export async function sendDocumentMessage(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<{ message_id: string }> {
  return sendMessage({
    to,
    type: 'document',
    document: {
      link: documentUrl,
      filename,
      caption,
    },
  });
}

/**
 * Download media from WhatsApp
 */
export async function downloadMedia(mediaId: string): Promise<Buffer> {
  const config = getConfig();

  if (!config.whatsapp.apiKey) {
    throw new Error('WhatsApp API key not configured');
  }

  const response = await fetch(`${config.whatsapp.apiUrl}/v1/media/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${config.whatsapp.apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Verify webhook signature from Kapso
 * This ensures the webhook request is genuinely from Kapso
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const config = getConfig();

  if (!config.whatsapp.webhookSecret) {
    logger.warn('Webhook secret not configured, skipping verification');
    return true; // Allow in development
  }

  // Kapso uses HMAC-SHA256 for webhook signature verification
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.whatsapp.webhookSecret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Parse and validate webhook event
 */
export function parseWebhookEvent(body: unknown): KapsoWebhookEvent {
  // Basic validation
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid webhook payload');
  }

  const event = body as KapsoWebhookEvent;

  if (!event.event || !event.message || !event.customer) {
    throw new Error('Invalid webhook event structure');
  }

  return event;
}

/**
 * Check if webhook event is a message received event
 */
export function isMessageReceivedEvent(event: KapsoWebhookEvent): boolean {
  return event.event === 'whatsapp.message.received';
}

/**
 * Check if message contains an image
 */
export function hasImage(event: KapsoWebhookEvent): boolean {
  return event.message.type === 'image' && !!event.message.image;
}

/**
 * Check if message contains a document
 */
export function hasDocument(event: KapsoWebhookEvent): boolean {
  return event.message.type === 'document' && !!event.message.document;
}

/**
 * Extract phone number from event
 */
export function getCustomerPhone(event: KapsoWebhookEvent): string {
  return event.customer.phone;
}

/**
 * Extract customer name from event
 */
export function getCustomerName(event: KapsoWebhookEvent): string | undefined {
  return event.customer.name;
}

/**
 * Format phone number for WhatsApp (ensure it starts with +)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Add + if missing
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Send invoice processing confirmation
 */
export async function sendInvoiceProcessingMessage(to: string, invoiceId: string): Promise<void> {
  await sendTextMessage(
    to,
    `✅ Invoice received! We're processing it now. You'll receive the details shortly.\n\nInvoice ID: ${invoiceId}`
  );
}

/**
 * Send invoice processing complete message
 */
export async function sendInvoiceCompleteMessage(params: {
  to: string;
  vendor: string;
  total: number;
  date: string;
  invoiceId: string;
}): Promise<void> {
  const message = `
📄 *Invoice Processed Successfully*

*Vendor:* ${params.vendor}
*Total:* $${params.total.toFixed(2)}
*Date:* ${params.date}

Invoice ID: ${params.invoiceId}

Your invoice has been added to your financial dashboard.
  `.trim();

  await sendTextMessage(params.to, message);
}

/**
 * Send invoice processing error message
 */
export async function sendInvoiceErrorMessage(to: string, error: string): Promise<void> {
  await sendTextMessage(
    to,
    `❌ Sorry, we couldn't process your invoice.\n\nReason: ${error}\n\nPlease try sending a clearer image or contact support.`
  );
}

/**
 * Send help message
 */
export async function sendHelpMessage(to: string): Promise<void> {
  const message = `
🤖 *Finan-Track Bot*

I can help you track your invoices and expenses!

*How to use:*
📸 Send a photo of your receipt or invoice
📎 Or send a PDF document

I'll automatically extract:
• Vendor name
• Total amount
• Date
• Line items

Your data will be added to your financial dashboard.

Need help? Reply with "support" to contact us.
  `.trim();

  await sendTextMessage(to, message);
}
