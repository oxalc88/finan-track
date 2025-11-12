/**
 * Transaction API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as transactionRepo from '../../repositories/transaction-repository.js';
import type { ApiResponse, CreateTransactionRequest } from '../../types/index.js';

/**
 * Register transaction routes
 */
export async function transactionRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new transaction
   * POST /api/transactions
   */
  app.post(
    '/',
    async (
      request: FastifyRequest<{ Body: CreateTransactionRequest & { user_id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, ...data } = request.body;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const transaction = await transactionRepo.createTransaction({
          user_id,
          account_id: data.account_id,
          category_id: data.category_id,
          invoice_id: data.invoice_id,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          transaction_date: new Date(data.transaction_date),
          notes: data.notes,
        });

        return reply.status(201).send({
          success: true,
          data: transaction,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to create transaction');
        return reply.status(500).send({
          success: false,
          error: 'Failed to create transaction',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get transaction by ID
   * GET /api/transactions/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const transaction = await transactionRepo.getTransactionById(id);

        if (!transaction) {
          return reply.status(404).send({
            success: false,
            error: 'Transaction not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: transaction,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get transaction');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get transaction',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List transactions for a user
   * GET /api/transactions
   */
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: {
          user_id: string;
          account_id?: string;
          category_id?: string;
          type?: 'income' | 'expense' | 'transfer';
          start_date?: string;
          end_date?: string;
          page?: string;
          limit?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const {
          user_id,
          account_id,
          category_id,
          type,
          start_date,
          end_date,
          page,
          limit,
        } = request.query;

        if (!user_id) {
          return reply.status(400).send({
            success: false,
            error: 'user_id is required',
          } satisfies ApiResponse);
        }

        const result = await transactionRepo.listTransactions({
          user_id,
          account_id,
          category_id,
          type,
          start_date: start_date ? new Date(start_date) : undefined,
          end_date: end_date ? new Date(end_date) : undefined,
          page: page ? Number.parseInt(page, 10) : undefined,
          limit: limit ? Number.parseInt(limit, 10) : undefined,
        });

        return reply.send({
          success: true,
          data: result,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list transactions');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list transactions',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete a transaction
   * DELETE /api/transactions/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        await transactionRepo.deleteTransaction(id);

        return reply.send({
          success: true,
          message: 'Transaction deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete transaction');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete transaction',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get cash flow summary
   * GET /api/transactions/analytics/cash-flow
   */
  app.get(
    '/analytics/cash-flow',
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

        const cashFlow = await transactionRepo.getCashFlowSummary({
          user_id,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          group_by,
        });

        return reply.send({
          success: true,
          data: cashFlow,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get cash flow summary');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get cash flow summary',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get category breakdown
   * GET /api/transactions/analytics/categories
   */
  app.get(
    '/analytics/categories',
    async (
      request: FastifyRequest<{
        Querystring: {
          user_id: string;
          start_date: string;
          end_date: string;
          type?: 'income' | 'expense' | 'transfer';
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, start_date, end_date, type } = request.query;

        if (!user_id || !start_date || !end_date) {
          return reply.status(400).send({
            success: false,
            error: 'user_id, start_date, and end_date are required',
          } satisfies ApiResponse);
        }

        const breakdown = await transactionRepo.getCategoryBreakdown({
          user_id,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          type,
        });

        return reply.send({
          success: true,
          data: breakdown,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get category breakdown');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get category breakdown',
        } satisfies ApiResponse);
      }
    }
  );
}
