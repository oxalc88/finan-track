/**
 * Credit Card API routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as schemas from '../../schemas/validation.js';
import * as creditCardService from '../../services/credit-card-service.js';
import type { ApiResponse } from '../../types/index.js';

export async function creditCardRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new credit card
   * POST /api/credit-cards
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createCreditCardSchema.parse(request.body);
      const card = await creditCardService.createCreditCard(data);

      return reply.status(201).send({
        success: true,
        data: card,
      } satisfies ApiResponse);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('must be positive') || error.message.includes('cannot exceed'))
      ) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        } satisfies ApiResponse);
      }

      request.log.error(error, 'Failed to create credit card');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create credit card',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get credit card by ID
   * GET /api/credit-cards/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const card = await creditCardService.getCreditCardById(id);

        return reply.send({
          success: true,
          data: card,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Credit card not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to get credit card');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get credit card',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List credit cards for a user
   * GET /api/credit-cards?user_id={uuid}
   */
  app.get(
    '/',
    async (
      request: FastifyRequest<{ Querystring: { user_id: string; active_only?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, active_only } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const activeOnly = active_only !== 'false';
        const cards = await creditCardService.listUserCreditCards(user_id, activeOnly);

        return reply.send({
          success: true,
          data: cards,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list credit cards');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list credit cards',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Update credit card
   * PATCH /api/credit-cards/:id
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const data = schemas.updateCreditCardSchema.parse(request.body);
        const card = await creditCardService.updateCreditCard(id, data);

        return reply.send({
          success: true,
          data: card,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Credit card not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to update credit card');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update credit card',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Make payment on credit card
   * POST /api/credit-cards/:id/payment
   */
  app.post<{ Params: { id: string } }>(
    '/:id/payment',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { amount } = schemas.makePaymentSchema.parse(request.body);
        const card = await creditCardService.makePayment(id, amount);

        return reply.send({
          success: true,
          data: card,
          message: `Payment of $${amount.toFixed(2)} processed successfully`,
        } satisfies ApiResponse);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === 'Credit card not found' || error.message.includes('must be positive'))
        ) {
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
   * Delete credit card
   * DELETE /api/credit-cards/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await creditCardService.deleteCreditCard(id);

        return reply.send({
          success: true,
          message: 'Credit card deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete credit card');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete credit card',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get credit card summary for user
   * GET /api/credit-cards/summary?user_id={uuid}
   */
  app.get(
    '/summary',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const summary = await creditCardService.getCreditCardSummary(user_id);

        return reply.send({
          success: true,
          data: summary,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get credit card summary');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get credit card summary',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get recommended card to use
   * GET /api/credit-cards/recommend?user_id={uuid}
   */
  app.get(
    '/recommend',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const card = await creditCardService.getBestCardRecommendation(user_id);

        if (!card) {
          return reply.send({
            success: true,
            data: null,
            message: 'No available cards to recommend',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: card,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get card recommendation');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get card recommendation',
        } satisfies ApiResponse);
      }
    }
  );
}
