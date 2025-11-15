/**
 * WhatsApp service - Business logic for handling WhatsApp messages
 */

import * as whatsapp from '../lib/whatsapp.js';
import * as ocrService from './ocr-service.js';
import * as userRepo from '../repositories/user-repository.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * Handle incoming WhatsApp message
 */
export async function handleIncomingMessage(
  event: whatsapp.KapsoWebhookEvent
): Promise<void> {
  try {
    // Only process message received events
    if (!whatsapp.isMessageReceivedEvent(event)) {
      logger.info({ event: event.event }, 'Ignoring non-message event');
      return;
    }

    const customerPhone = whatsapp.getCustomerPhone(event);
    logger.info({ phone: customerPhone, type: event.message.type }, 'Processing WhatsApp message');

    // Check if message contains an invoice (image or document)
    if (whatsapp.hasImage(event)) {
      await handleInvoiceImage(event);
      return;
    }

    if (whatsapp.hasDocument(event)) {
      await handleInvoiceDocument(event);
      return;
    }

    // Handle text messages
    if (event.message.type === 'text' && event.message.text) {
      await handleTextMessage(event);
      return;
    }

    // Unsupported message type
    await whatsapp.sendTextMessage(
      customerPhone,
      'Please send an image or PDF of your invoice.'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to handle WhatsApp message');

    // Send error message to user
    const customerPhone = whatsapp.getCustomerPhone(event);
    await whatsapp.sendInvoiceErrorMessage(
      customerPhone,
      'An unexpected error occurred. Please try again later.'
    );
  }
}

/**
 * Handle invoice image
 */
async function handleInvoiceImage(event: whatsapp.KapsoWebhookEvent): Promise<void> {
  const customerPhone = whatsapp.getCustomerPhone(event);
  const image = event.message.image!;

  try {
    // Get or create user by phone number
    const user = await getOrCreateUserByPhone(
      customerPhone,
      whatsapp.getCustomerName(event)
    );

    // Send acknowledgment
    await whatsapp.sendTextMessage(
      customerPhone,
      '📸 Image received! Processing your invoice...'
    );

    // Download the image
    logger.info({ mediaId: image.id }, 'Downloading WhatsApp image');
    const imageBuffer = await whatsapp.downloadMedia(image.id);

    // Process invoice with OCR
    const result = await ocrService.uploadAndProcessInvoice({
      userId: user.id,
      file: imageBuffer,
      filename: `whatsapp-${event.message.id}.jpg`,
      contentType: image.mime_type,
    });

    // Send processing started message
    await whatsapp.sendInvoiceProcessingMessage(customerPhone, result.invoice.id);

    // Wait for OCR to complete (polling with timeout)
    const processedInvoice = await waitForOcrProcessing(result.invoice.id, 30000);

    if (processedInvoice.ocr_status === 'completed') {
      // Send success message with extracted data
      await whatsapp.sendInvoiceCompleteMessage({
        to: customerPhone,
        vendor: processedInvoice.vendor_name || 'Unknown',
        total: processedInvoice.total || 0,
        date: processedInvoice.invoice_date?.toISOString().split('T')[0] || 'Unknown',
        invoiceId: processedInvoice.id,
      });
    } else {
      // OCR failed
      await whatsapp.sendInvoiceErrorMessage(
        customerPhone,
        processedInvoice.error_message || 'Failed to extract invoice data'
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to process invoice image');
    await whatsapp.sendInvoiceErrorMessage(
      customerPhone,
      'Failed to process your invoice. Please try again with a clearer image.'
    );
  }
}

/**
 * Handle invoice document (PDF)
 */
async function handleInvoiceDocument(event: whatsapp.KapsoWebhookEvent): Promise<void> {
  const customerPhone = whatsapp.getCustomerPhone(event);
  const document = event.message.document!;

  try {
    // Get or create user by phone number
    const user = await getOrCreateUserByPhone(
      customerPhone,
      whatsapp.getCustomerName(event)
    );

    // Send acknowledgment
    await whatsapp.sendTextMessage(
      customerPhone,
      '📎 Document received! Processing your invoice...'
    );

    // Download the document
    logger.info({ mediaId: document.id }, 'Downloading WhatsApp document');
    const documentBuffer = await whatsapp.downloadMedia(document.id);

    // Process invoice with OCR
    const result = await ocrService.uploadAndProcessInvoice({
      userId: user.id,
      file: documentBuffer,
      filename: document.filename || `whatsapp-${event.message.id}.pdf`,
      contentType: document.mime_type,
    });

    // Send processing started message
    await whatsapp.sendInvoiceProcessingMessage(customerPhone, result.invoice.id);

    // Wait for OCR to complete
    const processedInvoice = await waitForOcrProcessing(result.invoice.id, 30000);

    if (processedInvoice.ocr_status === 'completed') {
      // Send success message
      await whatsapp.sendInvoiceCompleteMessage({
        to: customerPhone,
        vendor: processedInvoice.vendor_name || 'Unknown',
        total: processedInvoice.total || 0,
        date: processedInvoice.invoice_date?.toISOString().split('T')[0] || 'Unknown',
        invoiceId: processedInvoice.id,
      });
    } else {
      // OCR failed
      await whatsapp.sendInvoiceErrorMessage(
        customerPhone,
        processedInvoice.error_message || 'Failed to extract invoice data'
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to process invoice document');
    await whatsapp.sendInvoiceErrorMessage(
      customerPhone,
      'Failed to process your invoice. Please try again.'
    );
  }
}

/**
 * Handle text message
 */
async function handleTextMessage(event: whatsapp.KapsoWebhookEvent): Promise<void> {
  const customerPhone = whatsapp.getCustomerPhone(event);
  const text = event.message.text!.body.toLowerCase().trim();

  // Handle commands
  if (text === 'help' || text === 'start' || text === 'hi' || text === 'hello') {
    await whatsapp.sendHelpMessage(customerPhone);
    return;
  }

  if (text === 'support') {
    await whatsapp.sendTextMessage(
      customerPhone,
      'For support, please email support@finan-track.com or call +1-800-FINAN-TRACK'
    );
    return;
  }

  // Default response
  await whatsapp.sendTextMessage(
    customerPhone,
    'Please send an image or PDF of your invoice, or type "help" for instructions.'
  );
}

/**
 * Get or create user by phone number
 */
async function getOrCreateUserByPhone(
  phone: string,
  name?: string
): Promise<{ id: string; phone: string }> {
  // Normalize phone number
  const normalizedPhone = whatsapp.formatPhoneNumber(phone);

  // Try to find existing user
  let user = await userRepo.getUserByPhone(normalizedPhone);

  if (!user) {
    // Create new user
    logger.info({ phone: normalizedPhone }, 'Creating new user from WhatsApp');
    user = await userRepo.createUser({
      email: `${normalizedPhone.replace('+', '')}@whatsapp.user`, // Temporary email
      name: name || `WhatsApp User ${normalizedPhone}`,
      phone: normalizedPhone,
    });
  }

  return user;
}

/**
 * Wait for OCR processing to complete (with polling)
 */
async function waitForOcrProcessing(
  invoiceId: string,
  timeoutMs = 30000
): Promise<{
  id: string;
  ocr_status: string;
  vendor_name: string | null;
  total: number | null;
  invoice_date: Date | null;
  error_message: string | null;
}> {
  const startTime = Date.now();
  const pollInterval = 1000; // Check every second

  while (Date.now() - startTime < timeoutMs) {
    const invoice = await ocrService.getInvoiceWithItems(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.invoice.ocr_status === 'completed' || invoice.invoice.ocr_status === 'failed') {
      return invoice.invoice;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('OCR processing timeout');
}
