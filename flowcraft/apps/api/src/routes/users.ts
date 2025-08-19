import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@flowcraft/database';
import { z } from 'zod';
import {
  authenticate,
  AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
  // Get current user profile
  fastify.get(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              organizationId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  plan: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;

        const userProfile = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                plan: true,
              },
            },
          },
        });

        if (!userProfile) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        return reply.send(userProfile);
      } catch (error) {
        throw error;
      }
    }
  );

  // Update current user profile
  fastify.put(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              organizationId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  plan: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const data = updateProfileSchema.parse(request.body);

        // Check if email is being changed and if it's already taken
        if (data.email && data.email !== user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
          });

          if (existingUser) {
            return reply.status(409).send({
              error: 'Conflict',
              message: 'Email already exists',
            });
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.userId },
          data,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                plan: true,
              },
            },
          },
        });

        return reply.send(updatedUser);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors,
          });
        }

        throw error;
      }
    }
  );

  // Get all users in organization (admin only)
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            search: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'USER', 'VIEWER'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { page = 1, limit = 20, search, role } = request.query as any;

        // Only allow admins to list users
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        // Build where clause
        const where: any = {
          organizationId: user.organizationId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (role) {
          where.role = role;
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Get users with pagination
        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        });

        const totalPages = Math.ceil(total / limit);

        return reply.send({
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      } catch (error) {
        throw error;
      }
    }
  );

  // Get user by ID (admin only)
  fastify.get(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };

        // Only allow admins to view other users
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        const userProfile = await prisma.user.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!userProfile) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        return reply.send(userProfile);
      } catch (error) {
        throw error;
      }
    }
  );

  // Update user (admin only)
  fastify.put(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'USER', 'VIEWER'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };
        const data = updateUserSchema.parse(request.body);

        // Only allow admins to update other users
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        // Check if user exists and belongs to the same organization
        const existingUser = await prisma.user.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
        });

        if (!existingUser) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        // Check if email is being changed and if it's already taken
        if (data.email && data.email !== existingUser.email) {
          const emailExists = await prisma.user.findUnique({
            where: { email: data.email },
          });

          if (emailExists) {
            return reply.status(409).send({
              error: 'Conflict',
              message: 'Email already exists',
            });
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return reply.send(updatedUser);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors,
          });
        }

        throw error;
      }
    }
  );

  // Delete user (admin only)
  fastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { id } = request.params as { id: string };

        // Only allow admins to delete users
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        // Prevent self-deletion
        if (id === user.userId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Cannot delete your own account',
          });
        }

        // Check if user exists and belongs to the same organization
        const existingUser = await prisma.user.findFirst({
          where: {
            id,
            organizationId: user.organizationId,
          },
        });

        if (!existingUser) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        await prisma.user.delete({
          where: { id },
        });

        return reply.send({
          message: 'User deleted successfully',
        });
      } catch (error) {
        throw error;
      }
    }
  );
}
