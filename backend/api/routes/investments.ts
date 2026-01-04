/**
 * Investment API routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as schemas from '../../schemas/validation.js';
import * as investmentService from '../../services/investment-service.js';
import type { ApiResponse } from '../../types/index.js';

export async function investmentRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new investment
   * POST /api/investments
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createInvestmentSchema.parse(request.body);
      const investment = await investmentService.createInvestment(data);

      return reply.status(201).send({
        success: true,
        data: investment,
      } satisfies ApiResponse);
    } catch (error) {
      request.log.error(error, 'Failed to create investment');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create investment',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get investment performance
   * GET /api/investments/performance?user_id={uuid}
   */
  app.get(
    '/performance',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const performance = await investmentService.getInvestmentPerformance(user_id);

        return reply.send({
          success: true,
          data: performance,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get investment performance');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get investment performance',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get investment by ID
   * GET /api/investments/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const investment = await investmentService.getInvestmentById(id);

        return reply.send({
          success: true,
          data: investment,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Investment not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to get investment');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get investment',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List investments for a user
   * GET /api/investments?user_id={uuid}
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
        const investments = await investmentService.listUserInvestments(
          user_id,
          type as any,
          activeOnly
        );

        return reply.send({
          success: true,
          data: investments,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list investments');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list investments',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Update investment
   * PATCH /api/investments/:id
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const data = schemas.updateInvestmentSchema.parse(request.body);
        const investment = await investmentService.updateInvestment(id, data);

        return reply.send({
          success: true,
          data: investment,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Investment not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to update investment');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update investment',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete investment
   * DELETE /api/investments/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await investmentService.deleteInvestment(id);

        return reply.send({
          success: true,
          message: 'Investment deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete investment');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete investment',
        } satisfies ApiResponse);
      }
    }
  );
}
