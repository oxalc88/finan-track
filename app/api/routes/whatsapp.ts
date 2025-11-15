/**
 * WhatsApp webhook routes for Kapso integration
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as whatsapp from '../../lib/whatsapp.js';
import * as whatsappService from '../../services/whatsapp-service.js';
import type { ApiResponse } from '../../types/index.js';

/**
 * Register WhatsApp webhook routes
 */
export async function whatsappRoutes(app: FastifyInstance): Promise<void> {
  /**
   * WhatsApp webhook endpoint
   * POST /api/whatsapp/webhook
   *
   * This endpoint receives events from Kapso when WhatsApp messages are received
   */
  app.post('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get signature headers for verification
      const signature = request.headers['x-kapso-signature'] as string;
      const timestamp = request.headers['x-kapso-timestamp'] as string;

      if (!signature || !timestamp) {
        request.log.warn('Missing signature headers');
        return reply.status(401).send({
          success: false,
          error: 'Missing signature headers',
        } satisfies ApiResponse);
      }

      // Verify webhook signature
      const rawBody = JSON.stringify(request.body);
      const isValid = whatsapp.verifyWebhookSignature(rawBody, signature, timestamp);

      if (!isValid) {
        request.log.warn('Invalid webhook signature');
        return reply.status(401).send({
          success: false,
          error: 'Invalid signature',
        } satisfies ApiResponse);
      }

      // Parse webhook event
      const event = whatsapp.parseWebhookEvent(request.body);

      request.log.info(
        {
          event: event.event,
          messageType: event.message?.type,
          from: event.customer?.phone,
        },
        'Received WhatsApp webhook'
      );

      // Process the message asynchronously
      // Don't await - respond immediately to Kapso to avoid timeout
      whatsappService.handleIncomingMessage(event).catch((error) => {
        request.log.error({ error, event }, 'Failed to process WhatsApp message');
      });

      // Respond immediately to Kapso (200 OK)
      return reply.send({
        success: true,
        message: 'Webhook received',
      } satisfies ApiResponse);
    } catch (error) {
      request.log.error(error, 'Webhook processing error');

      // Still return 200 to prevent Kapso from retrying
      // (we don't want to reprocess invalid webhooks)
      return reply.send({
        success: false,
        error: 'Failed to process webhook',
      } satisfies ApiResponse);
    }
  });

  /**
   * WhatsApp webhook verification endpoint (GET)
   * Some webhook systems send a GET request to verify the endpoint
   */
  app.get('/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    // Kapso may send a verification challenge
    const params = request.query as { 'hub.mode'?: string; 'hub.challenge'?: string; 'hub.verify_token'?: string };

    if (params['hub.mode'] === 'subscribe') {
      // Return the challenge to verify the webhook
      return reply.send(params['hub.challenge'] || 'OK');
    }

    return reply.send({
      success: true,
      message: 'WhatsApp webhook endpoint is active',
    } satisfies ApiResponse);
  });

  /**
   * Send a test message (for debugging)
   * POST /api/whatsapp/test
   */
  app.post(
    '/test',
    async (
      request: FastifyRequest<{
        Body: {
          to: string;
          message: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { to, message } = request.body;

        if (!to || !message) {
          return reply.status(400).send({
            success: false,
            error: 'to and message are required',
          } satisfies ApiResponse);
        }

        const result = await whatsapp.sendTextMessage(to, message);

        return reply.send({
          success: true,
          data: result,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to send test message');
        return reply.status(500).send({
          success: false,
          error: 'Failed to send message',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Health check for WhatsApp integration
   * GET /api/whatsapp/health
   */
  app.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const config = await import('../../config/env.js').then(m => m.getConfig());

    const status = {
      configured: !!config.whatsapp.apiKey,
      webhook_secret_set: !!config.whatsapp.webhookSecret,
      api_url: config.whatsapp.apiUrl,
    };

    return reply.send({
      success: true,
      data: status,
    } satisfies ApiResponse);
  });
}
