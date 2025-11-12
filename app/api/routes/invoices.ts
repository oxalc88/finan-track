/**
 * Invoice API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as ocrService from '../../services/ocr-service.js';
import type { ApiResponse, InvoiceWithItems } from '../../types/index.js';

/**
 * Register invoice routes
 */
export async function invoiceRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Upload an invoice file for OCR processing
   * POST /api/invoices/upload
   */
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          success: false,
          error: 'No file uploaded',
        } satisfies ApiResponse);
      }

      // Get user_id from request body or headers
      // In production, this would come from authentication middleware
      const userId = (request.body as { user_id?: string })?.user_id;

      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: 'user_id is required',
        } satisfies ApiResponse);
      }

      // Read file buffer
      const buffer = await data.toBuffer();

      // Upload and process
      const result = await ocrService.uploadAndProcessInvoice({
        userId,
        file: buffer,
        filename: data.filename,
        contentType: data.mimetype,
      });

      return reply.status(201).send({
        success: true,
        data: result.invoice,
        message: 'Invoice uploaded successfully. OCR processing started.',
      } satisfies ApiResponse);
    } catch (error) {
      request.log.error(error, 'Failed to upload invoice');
      return reply.status(500).send({
        success: false,
        error: 'Failed to upload invoice',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get invoice by ID with items
   * GET /api/invoices/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const result = await ocrService.getInvoiceWithItems(id);

        if (!result) {
          return reply.status(404).send({
            success: false,
            error: 'Invoice not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: result,
        } satisfies ApiResponse<InvoiceWithItems>);
      } catch (error) {
        request.log.error(error, 'Failed to get invoice');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get invoice',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List invoices for a user
   * GET /api/invoices
   */
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          user_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          start_date?: string;
          end_date?: string;
          vendor_name?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, status, start_date, end_date, vendor_name, page, limit } =
          request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const result = await ocrService.listUserInvoices({
          userId: user_id,
          status,
          startDate: start_date,
          endDate: end_date,
          vendorName: vendor_name,
          page: page ? Number.parseInt(page, 10) : undefined,
          limit: limit ? Number.parseInt(limit, 10) : undefined,
        });

        return reply.send({
          success: true,
          data: result,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list invoices');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list invoices',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete an invoice
   * DELETE /api/invoices/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        await ocrService.deleteInvoice(id);

        return reply.send({
          success: true,
          message: 'Invoice deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete invoice');

        if (error instanceof Error && error.message === 'Invoice not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        return reply.status(500).send({
          success: false,
          error: 'Failed to delete invoice',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Reprocess an invoice
   * POST /api/invoices/:id/reprocess
   */
  app.post<{ Params: { id: string } }>(
    '/:id/reprocess',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        await ocrService.reprocessInvoice(id);

        return reply.send({
          success: true,
          message: 'Invoice reprocessing started',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to reprocess invoice');

        if (error instanceof Error && error.message === 'Invoice not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        return reply.status(500).send({
          success: false,
          error: 'Failed to reprocess invoice',
        } satisfies ApiResponse);
      }
    }
  );
}
