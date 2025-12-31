/**
 * Debt API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as debtService from '../../services/debt-service.js';
import * as schemas from '../../schemas/validation.js';
import type { ApiResponse } from '../../types/index.js';

export async function debtRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new debt
   * POST /api/debts
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createDebtSchema.parse(request.body);
      const debt = await debtService.createDebt(data);

      return reply.status(201).send({
        success: true,
        data: debt,
      } satisfies ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('cannot exceed principal')) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        } satisfies ApiResponse);
      }

      request.log.error(error, 'Failed to create debt');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create debt',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get debt by ID
   * GET /api/debts/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const debt = await debtService.getDebtById(id);

        return reply.send({
          success: true,
          data: debt,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Debt not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to get debt');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get debt',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List debts for a user
   * GET /api/debts?user_id={uuid}
   */
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: { user_id: string; type?: string; active_only?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, type, active_only } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const activeOnly = active_only !== 'false';
        const debts = await debtService.listUserDebts(user_id, type as any, activeOnly);

        return reply.send({
          success: true,
          data: debts,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list debts');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list debts',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Update debt
   * PATCH /api/debts/:id
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const data = schemas.updateDebtSchema.parse(request.body);
        const debt = await debtService.updateDebt(id, data);

        return reply.send({
          success: true,
          data: debt,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Debt not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to update debt');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update debt',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Make payment on debt
   * POST /api/debts/:id/payment
   */
  app.post<{ Params: { id: string } }>(
    '/:id/payment',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { amount } = schemas.makePaymentSchema.parse(request.body);
        const debt = await debtService.makePayment(id, amount);

        return reply.send({
          success: true,
          data: debt,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && (error.message === 'Debt not found' || error.message.includes('must be positive'))) {
          return reply.status(400).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to make payment');
        return reply.status(500).send({
          success: false,
          error: 'Failed to make payment',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete debt
   * DELETE /api/debts/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await debtService.deleteDebt(id);

        return reply.send({
          success: true,
          message: 'Debt deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete debt');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete debt',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get debt summary for user
   * GET /api/debts/summary?user_id={uuid}
   */
  app.get(
    '/summary',
    async (
      request: FastifyRequest<{ Querystring: { user_id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const summary = await debtService.getDebtSummary(user_id);

        return reply.send({
          success: true,
          data: summary,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get debt summary');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get debt summary',
        } satisfies ApiResponse);
      }
    }
  );
}
