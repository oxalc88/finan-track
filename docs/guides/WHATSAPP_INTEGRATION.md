# WhatsApp Integration with Kapso.ai

## Overview

The WhatsApp integration allows users to send invoice images via WhatsApp and automatically process them with OCR. This creates a seamless mobile-first experience for expense tracking.

---

## How It Works

### User Journey

1. **User sends invoice photo** via WhatsApp to your business number
2. **Kapso webhook** notifies your backend
3. **Backend downloads** the image from WhatsApp
4. **OCR processes** the invoice (vendor, amount, date, items)
5. **User receives** extracted data via WhatsApp message
6. **Invoice stored** in their dashboard

### Architecture

```
WhatsApp User
    ↓ (sends image)
Kapso.ai API
    ↓ (webhook event)
Your Backend (/api/whatsapp/webhook)
    ↓ (downloads media)
OCR Service (Tesseract)
    ↓ (extracts data)
Database (invoices table)
    ↓ (stores invoice)
WhatsApp User
    ↓ (receives confirmation)
```

---

## Setup Instructions

### 1. Get Kapso API Credentials

1. Sign up at [https://kapso.ai](https://kapso.ai)
2. Create a new project
3. Go to **Settings** → **API Keys**
4. Copy your API key
5. Generate a webhook secret

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# WhatsApp Integration (Kapso.ai)
KAPSO_API_KEY=your_api_key_here
KAPSO_API_URL=https://api.kapso.ai
KAPSO_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Configure Webhook in Kapso Dashboard

1. Go to **Webhooks** in Kapso dashboard
2. Add new webhook endpoint:
   - **URL**: `https://your-domain.com/api/whatsapp/webhook`
   - **Events**: Select `whatsapp.message.received`
3. Copy the webhook secret to your `.env` file

### 4. Test the Integration

```bash
# Start your server
npm run dev

# Test webhook endpoint
curl http://localhost:3000/api/whatsapp/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "configured": true,
    "webhook_secret_set": true,
    "api_url": "https://api.kapso.ai"
  }
}
```

---

## API Endpoints

### Webhook Endpoint

**POST** `/api/whatsapp/webhook`

Receives events from Kapso when WhatsApp messages arrive.

**Headers:**
- `x-kapso-signature` - HMAC signature for verification
- `x-kapso-timestamp` - Timestamp for replay attack prevention

**Webhook Event Types:**
- `whatsapp.message.received` - New message from user
- `whatsapp.message.sent` - Message successfully sent
- `whatsapp.message.delivered` - Message delivered to user
- `whatsapp.message.read` - Message read by user
- `whatsapp.message.failed` - Message sending failed

**Example Payload (Message Received):**
```json
{
  "event": "whatsapp.message.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "conversation_id": "conv_abc123",
  "message": {
    "id": "msg_xyz789",
    "from": "+1234567890",
    "timestamp": "2024-01-15T10:30:00Z",
    "type": "image",
    "image": {
      "id": "media_456",
      "mime_type": "image/jpeg",
      "sha256": "...",
      "caption": "My restaurant receipt"
    }
  },
  "customer": {
    "phone": "+1234567890",
    "name": "John Doe"
  }
}
```

### Test Message Endpoint

**POST** `/api/whatsapp/test`

Send a test WhatsApp message (for debugging).

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Hello from Finan-Track!"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test message"
  }'
```

### Health Check

**GET** `/api/whatsapp/health`

Check WhatsApp integration status.

---

## Supported Message Types

### 1. Image Messages

User sends a photo of their invoice/receipt.

**What happens:**
1. Image downloaded from WhatsApp
2. Passed to Tesseract OCR
3. Invoice data extracted (vendor, total, date, items)
4. User receives confirmation with extracted data

**User receives:**
```
📄 Invoice Processed Successfully

Vendor: Starbucks
Total: $12.50
Date: 2024-01-15

Invoice ID: inv_abc123

Your invoice has been added to your financial dashboard.
```

### 2. Document Messages (PDF)

User sends a PDF invoice.

**What happens:**
1. PDF downloaded from WhatsApp
2. Converted to image (if needed)
3. OCR extraction
4. Confirmation sent to user

### 3. Text Messages

User sends text commands.

**Supported commands:**
- `help`, `start`, `hi`, `hello` - Get help message
- `support` - Get support contact information

**Help message:**
```
🤖 Finan-Track Bot

I can help you track your invoices and expenses!

How to use:
📸 Send a photo of your receipt or invoice
📎 Or send a PDF document

I'll automatically extract:
• Vendor name
• Total amount
• Date
• Line items

Your data will be added to your financial dashboard.

Need help? Reply with "support" to contact us.
```

---

## WhatsApp Library Functions

### Sending Messages

```typescript
import * as whatsapp from '../lib/whatsapp.js';

// Send text message
await whatsapp.sendTextMessage('+1234567890', 'Hello!');

// Send image with caption
await whatsapp.sendImageMessage(
  '+1234567890',
  'https://example.com/image.jpg',
  'Check out this invoice'
);

// Send document
await whatsapp.sendDocumentMessage(
  '+1234567890',
  'https://example.com/invoice.pdf',
  'invoice.pdf',
  'Your processed invoice'
);
```

### Receiving Messages

```typescript
import * as whatsappService from '../services/whatsapp-service.js';

// Handle incoming webhook
await whatsappService.handleIncomingMessage(event);
```

### Downloading Media

```typescript
import * as whatsapp from '../lib/whatsapp.js';

// Download image or document
const buffer = await whatsapp.downloadMedia('media_id_here');
```

---

## Processing Flow

### Invoice Image Processing

```typescript
// 1. Webhook receives image message
POST /api/whatsapp/webhook
  → Event: whatsapp.message.received
  → Type: image

// 2. Download image
const imageBuffer = await whatsapp.downloadMedia(mediaId);

// 3. Get or create user
const user = await getOrCreateUserByPhone(phone);

// 4. Process with OCR
const invoice = await ocrService.uploadAndProcessInvoice({
  userId: user.id,
  file: imageBuffer,
  filename: 'whatsapp-msg.jpg',
  contentType: 'image/jpeg'
});

// 5. Wait for OCR to complete
const result = await waitForOcrProcessing(invoice.id);

// 6. Send confirmation
await whatsapp.sendInvoiceCompleteMessage({
  to: phone,
  vendor: result.vendor_name,
  total: result.total,
  date: result.invoice_date,
  invoiceId: result.id
});
```

---

## User Management

### Automatic User Creation

When a user sends their first WhatsApp message:

1. **Check if user exists** by phone number
2. **If not, create new user:**
   - Email: `{phone}@whatsapp.user` (temporary)
   - Name: WhatsApp User {phone}
   - Phone: Normalized phone number (+1234567890)

3. **Link all future invoices** to this user account

### Phone Number Normalization

All phone numbers are normalized:
- Remove spaces, dashes, parentheses
- Add `+` prefix if missing
- Example: `(123) 456-7890` → `+1234567890`

---

## Security

### Webhook Signature Verification

All webhooks are verified using HMAC-SHA256:

```typescript
const signedPayload = `${timestamp}.${payload}`;
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload)
  .digest('hex');

// Compare signatures using timing-safe comparison
crypto.timingSafeEqual(
  Buffer.from(receivedSignature),
  Buffer.from(expectedSignature)
);
```

### Best Practices

1. **Always verify signatures** in production
2. **Use HTTPS** for webhook endpoints
3. **Store webhook secret** securely (environment variable)
4. **Rate limit** webhook endpoint
5. **Log all events** for debugging
6. **Respond quickly** to webhooks (<30s)

---

## Error Handling

### OCR Failures

If OCR fails to extract invoice data:

```
❌ Sorry, we couldn't process your invoice.

Reason: Low OCR confidence: 45%

Please try sending a clearer image or contact support.
```

### Invalid Messages

If user sends unsupported media:

```
Please send an image or PDF of your invoice.
```

### Processing Errors

If unexpected error occurs:

```
❌ Sorry, we couldn't process your invoice.

Reason: An unexpected error occurred. Please try again later.

Please try sending a clearer image or contact support.
```

---

## Testing

### Local Testing with ngrok

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your server:**
   ```bash
   npm run dev
   ```

3. **Expose via ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Update Kapso webhook URL:**
   - Copy ngrok HTTPS URL
   - Set webhook: `https://abc123.ngrok.io/api/whatsapp/webhook`

5. **Send test message** via WhatsApp to your Kapso number

### Manual Testing

Send test message via API:

```bash
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test from API"
  }'
```

---

## Monitoring

### Logs

All WhatsApp events are logged:

```json
{
  "level": "info",
  "msg": "Received WhatsApp webhook",
  "event": "whatsapp.message.received",
  "messageType": "image",
  "from": "+1234567890"
}
```

### Metrics to Track

- **Messages received** per day
- **OCR success rate** (completed vs failed)
- **Average processing time**
- **User engagement** (active users)
- **Error rate** by type

---

## Production Deployment

### Checklist

- [ ] KAPSO_API_KEY configured
- [ ] KAPSO_WEBHOOK_SECRET configured
- [ ] Webhook URL set in Kapso dashboard
- [ ] HTTPS enabled on webhook endpoint
- [ ] Signature verification enabled
- [ ] Error alerts configured
- [ ] Monitoring/logging set up
- [ ] Rate limiting configured
- [ ] Database backups enabled

### Scaling Considerations

For high message volume:

1. **Use queue system** (SQS/RabbitMQ) for async processing
2. **Background workers** for OCR processing
3. **Media caching** to avoid re-downloading
4. **Database indexing** on phone numbers
5. **Rate limiting** per user

---

## Troubleshooting

### Webhook not receiving events

1. Check Kapso dashboard for webhook status
2. Verify webhook URL is correct and accessible
3. Check server logs for errors
4. Test endpoint with curl
5. Ensure HTTPS is working (use ngrok for local testing)

### Signature verification failing

1. Check KAPSO_WEBHOOK_SECRET matches Kapso dashboard
2. Verify timestamp is recent (prevent replay attacks)
3. Check raw body is used for signature (not parsed JSON)

### OCR not extracting data

1. Check image quality (resolution, clarity)
2. Test with different invoice formats
3. Review OCR confidence scores
4. Check Tesseract logs
5. Try manual reprocessing: `POST /api/invoices/:id/reprocess`

### User not receiving messages

1. Check Kapso API key is valid
2. Verify phone number format (+1234567890)
3. Check Kapso message quota
4. Review API error logs
5. Test with `/api/whatsapp/test` endpoint

---

## Next Steps

### Enhancements

1. **Add message templates** for common responses
2. **Support multiple languages** in OCR
3. **Add receipt categorization** (food, transport, etc.)
4. **Implement conversation context** for follow-up questions
5. **Add spending insights** via WhatsApp ("How much did I spend on food this month?")
6. **Support bulk invoice upload** (multiple images)
7. **Add payment reminders** via WhatsApp

### Integration Ideas

1. **Link to bank accounts** for automatic reconciliation
2. **Generate expense reports** on demand
3. **Set spending budgets** and get alerts
4. **Share invoices** with accountant
5. **Export to accounting software** (QuickBooks, Xero)

---

## Resources

- **Kapso Documentation**: https://docs.kapso.ai
- **WhatsApp Cloud API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Tesseract OCR**: https://github.com/naptha/tesseract.js
- **Fastify Documentation**: https://www.fastify.io/docs/latest/

---

## Support

For issues or questions:
- Email: support@finan-track.com
- GitHub: Create an issue
- Discord: Join our community
