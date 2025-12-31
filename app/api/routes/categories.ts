/**
 * Category API routes
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as categoryRepo from '../../repositories/category-repository.js';
import * as schemas from '../../schemas/validation.js';
import type { ApiResponse } from '../../types/index.js';

export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new category
   * POST /api/categories
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createCategorySchema.parse(request.body);
      const category = await categoryRepo.createCategory(data);

      return reply.status(201).send({
        success: true,
        data: category,
      } satisfies ApiResponse);
    } catch (error) {
      request.log.error(error, 'Failed to create category');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create category',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  app.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const category = await categoryRepo.getCategoryById(id);

        if (!category) {
          return reply.status(404).send({
            success: false,
            error: 'Category not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: category,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get category');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get category',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * List categories
   * GET /api/categories?user_id={uuid}&type={income|expense}
   */
  app.get(
    '/',
    async (
      request: FastifyRequest<{
        Querystring: { user_id?: string; type?: string; include_system?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { user_id, type, include_system } = request.query;

        const categories = await categoryRepo.listCategories({
          userId: user_id,
          type: type as any,
          includeSystem: include_system !== 'false',
        });

        return reply.send({
          success: true,
          data: categories,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to list categories');
        return reply.status(500).send({
          success: false,
          error: 'Failed to list categories',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get system categories
   * GET /api/categories/system?type={income|expense}
   */
  app.get(
    '/system',
    async (request: FastifyRequest<{ Querystring: { type?: string } }>, reply: FastifyReply) => {
      try {
        const { type } = request.query;
        const categories = await categoryRepo.getSystemCategories(type as any);

        return reply.send({
          success: true,
          data: categories,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get system categories');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get system categories',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Update category
   * PATCH /api/categories/:id
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const data = schemas.updateCategorySchema.parse(request.body);
        const category = await categoryRepo.updateCategory(id, data);

        if (!category) {
          return reply.status(404).send({
            success: false,
            error: 'Category not found or is a system category',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: category,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to update category');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update category',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await categoryRepo.deleteCategory(id);

        return reply.send({
          success: true,
          message: 'Category deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete category');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete category',
        } satisfies ApiResponse);
      }
    }
  );
}
