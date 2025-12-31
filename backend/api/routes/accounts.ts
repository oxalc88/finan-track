/**
 * Account API routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as schemas from '../../schemas/validation.js';
import * as accountService from '../../services/account-service.js';
import type { ApiResponse } from '../../types/index.js';

export async function accountRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new account
   * POST /api/accounts
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createAccountSchema.parse(request.body);
      const account = await accountService.createAccount(data);

      return reply.status(201).send({
        success: true,
        data: account,
      } satisfies ApiResponse);
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        } satisfies ApiResponse);
      }

      request.log.error(error, 'Failed to create account');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create account',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get account by ID
   * GET /api/accounts/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const account = await accountService.getAccountById(id);

        return reply.send({
          success: true,
          data: account,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Account not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to get account');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get account',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List accounts for a user
   * GET /api/accounts?user_id={uuid}
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
        const accounts = await accountService.listUserAccounts(user_id, activeOnly);

        return reply.send({
          success: true,
          data: accounts,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list accounts');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list accounts',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Update account
   * PATCH /api/accounts/:id
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const data = schemas.updateAccountSchema.parse(request.body);
        const account = await accountService.updateAccount(id, data);

        return reply.send({
          success: true,
          data: account,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Account not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to update account');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update account',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete account
   * DELETE /api/accounts/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await accountService.deleteAccount(id);

        return reply.send({
          success: true,
          message: 'Account deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete account');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete account',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Deactivate account (soft delete)
   * POST /api/accounts/:id/deactivate
   */
  app.post<{ Params: { id: string } }>(
    '/:id/deactivate',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const account = await accountService.deactivateAccount(id);

        return reply.send({
          success: true,
          data: account,
        } satisfies ApiResponse);
      } catch (error) {
        if (error instanceof Error && error.message === 'Account not found') {
          return reply.status(404).send({
            success: false,
            error: error.message,
          } satisfies ApiResponse);
        }

        request.log.error(error, 'Failed to deactivate account');
        return reply.status(500).send({
          success: false,
          error: 'Failed to deactivate account',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get account summary for user
   * GET /api/accounts/summary?user_id={uuid}
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

        const summary = await accountService.getAccountsSummary(user_id);

        return reply.send({
          success: true,
          data: summary,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get account summary');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get account summary',
        } satisfies ApiResponse);
      }
    }
  );
}
