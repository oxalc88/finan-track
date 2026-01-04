/**
 * Dashboard API routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as dashboardService from '../../services/dashboard-service.js';
import type { ApiResponse } from '../../types/index.js';

/**
 * Register dashboard routes
 */
export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Get complete dashboard summary
   * GET /api/dashboard
   */
  app.get(
    '/',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const summary = await dashboardService.getDashboardSummary(user_id);

        return reply.send({
          success: true,
          data: summary,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get dashboard summary');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get dashboard summary',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get cash flow insights
   * GET /api/dashboard/cash-flow
   */
  app.get(
    '/cash-flow',
    async (
      request: FastifyRequest<{
        Querystring: {
          user_id: string;
          start_date: string;
          end_date: string;
          group_by?: 'day' | 'week' | 'month' | 'year';
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, start_date, end_date, group_by } = request.query;

        if (!user_id || !start_date || !end_date) {
          return reply.status(400).send({
            success: false,
            error: 'user_id, start_date, and end_date are required',
          } satisfies ApiResponse);
        }

        const insights = await dashboardService.getCashFlowInsights({
          userId: user_id,
          startDate: new Date(start_date),
          endDate: new Date(end_date),
          groupBy: group_by,
        });

        return reply.send({
          success: true,
          data: insights,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get cash flow insights');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get cash flow insights',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get upcoming financial obligations
   * GET /api/dashboard/upcoming
   */
  app.get(
    '/upcoming',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const obligations = await dashboardService.getUpcomingObligations(user_id);

        return reply.send({
          success: true,
          data: obligations,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get upcoming obligations');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get upcoming obligations',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get financial warnings
   * GET /api/dashboard/warnings
   */
  app.get(
    '/warnings',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const warnings = await dashboardService.getFinancialWarnings(user_id);

        return reply.send({
          success: true,
          data: warnings,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get financial warnings');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get financial warnings',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get investment performance
   * GET /api/dashboard/investments
   */
  app.get(
    '/investments',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const performance = await dashboardService.getInvestmentPerformance(user_id);

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
   * Get credit card recommendations
   * GET /api/dashboard/credit-recommendations
   */
  app.get(
    '/credit-recommendations',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const recommendations = await dashboardService.getCreditCardRecommendation(user_id);

        return reply.send({
          success: true,
          data: recommendations,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get credit card recommendations');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get credit card recommendations',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get accounts summary
   * GET /api/dashboard/accounts
   */
  app.get(
    '/accounts',
    async (request: FastifyRequest<{ Querystring: { user_id: string } }>, reply: FastifyReply) => {
      try {
        const { user_id } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const accountsSummary = await dashboardService.getAccountsSummary(user_id);

        return reply.send({
          success: true,
          data: accountsSummary,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get accounts summary');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get accounts summary',
        } satisfies ApiResponse);
      }
    }
  );
}
