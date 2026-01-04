/**
 * Alert API routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as alertRepo from '../../repositories/alert-repository.js';
import * as schemas from '../../schemas/validation.js';
import type { ApiResponse } from '../../types/index.js';

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new alert
   * POST /api/alerts
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createAlertSchema.parse(request.body);
      const alert = await alertRepo.createAlert(data);

      return reply.status(201).send({
        success: true,
        data: alert,
      } satisfies ApiResponse);
    } catch (error) {
      request.log.error(error, 'Failed to create alert');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create alert',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get unread alerts
   * GET /api/alerts/unread?user_id={uuid}
   */
  app.get(
    '/unread',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const alerts = await alertRepo.getUnreadAlerts(user_id);

        return reply.send({
          success: true,
          data: alerts,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get unread alerts');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get unread alerts',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get alert by ID
   * GET /api/alerts/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const alert = await alertRepo.getAlertById(id);

        if (!alert) {
          return reply.status(404).send({
            success: false,
            error: 'Alert not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: alert,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get alert');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get alert',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List alerts for a user
   * GET /api/alerts?user_id={uuid}
   */
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          user_id: string;
          type?: string;
          priority?: string;
          is_read?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, type, priority, is_read, limit } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const alerts = await alertRepo.listAlertsByUser(user_id, {
          type: type as any,
          priority: priority as any,
          isRead: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
          limit: limit ? Number.parseInt(limit, 10) : undefined,
        });

        return reply.send({
          success: true,
          data: alerts,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list alerts');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list alerts',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Mark alert as read
   * PATCH /api/alerts/:id/read
   */
  app.patch<{ Params: { id: string } }>(
    '/:id/read',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const alert = await alertRepo.markAlertAsRead(id);

        if (!alert) {
          return reply.status(404).send({
            success: false,
            error: 'Alert not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: alert,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to mark alert as read');
        return reply.status(500).send({
          success: false,
          error: 'Failed to mark alert as read',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Mark all alerts as read
   * POST /api/alerts/read-all
   */
  app.post(
    '/read-all',
    async (request: FastifyRequest<{ Body: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.body;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        await alertRepo.markAllAlertsAsRead(user_id);

        return reply.send({
          success: true,
          message: 'All alerts marked as read',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to mark all alerts as read');
        return reply.status(500).send({
          success: false,
          error: 'Failed to mark all alerts as read',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete alert
   * DELETE /api/alerts/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await alertRepo.deleteAlert(id);

        return reply.send({
          success: true,
          message: 'Alert deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete alert');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete alert',
        } satisfies ApiResponse);
      }
    }
  );
}
