/**
 * User API routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as userRepo from '../../repositories/user-repository.js';
import * as schemas from '../../schemas/validation.js';
import type { ApiResponse } from '../../types/index.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Create a new user
   * POST /api/users
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = schemas.createUserSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await userRepo.getUserByEmail(data.email);
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: 'User with this email already exists',
        } satisfies ApiResponse);
      }

      const user = await userRepo.createUser(data);

      return reply.status(201).send({
        success: true,
        data: user,
      } satisfies ApiResponse);
    } catch (error) {
      request.log.error(error, 'Failed to create user');
      return reply.status(500).send({
        success: false,
        error: 'Failed to create user',
      } satisfies ApiResponse);
    }
  });

  /**
   * Get user by email
   * GET /api/users/by-email?email={email}
   */
  app.get(
    '/by-email',
    async (
      request: FastifyRequest<{ Querystring: { email: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { email } = request.query;

        if (!email) {
          return reply.status(400).send({
            success: false,
            error: 'email is required',
          } satisfies ApiResponse);
        }

        const user = await userRepo.getUserByEmail(email);

        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'User not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: user,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get user by email');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get user by email',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  app.get(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const user = await userRepo.getUserById(id);

        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'User not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: user,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to get user');
        return reply.status(500).send({
          success: false,
          error: 'Failed to get user',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Update user
   * PATCH /api/users/:id
   */
  app.patch(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const data = schemas.updateUserSchema.parse(request.body);

        // Check if email is being updated and already exists
        if (data.email) {
          const existingUser = await userRepo.getUserByEmail(data.email);
          if (existingUser && existingUser.id !== id) {
            return reply.status(409).send({
              success: false,
              error: 'Email already in use by another user',
            } satisfies ApiResponse);
          }
        }

        const user = await userRepo.updateUser(id, data);

        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'User not found',
          } satisfies ApiResponse);
        }

        return reply.send({
          success: true,
          data: user,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to update user');
        return reply.status(500).send({
          success: false,
          error: 'Failed to update user',
        } satisfies ApiResponse);
      }
    }
  );

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  app.delete(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        await userRepo.deleteUser(id);

        return reply.send({
          success: true,
          message: 'User deleted successfully',
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Failed to delete user');
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete user',
        } satisfies ApiResponse);
      }
    }
  );
}
