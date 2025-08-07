import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../../packages/database/dist/index.js';
import { z } from 'zod';
import {
  authenticate,
  AuthenticatedRequest,
} from '../middleware/auth.middleware.js';

// Validation schemas
const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  settings: z.record(z.any()).optional(),
});

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  settings: z.record(z.any()).optional(),
});

export async function organizationRoutes(fastify: FastifyInstance) {
  // Get current user's organization
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
              name: { type: 'string' },
              plan: { type: 'string' },
              settings: { type: 'object' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              userCount: { type: 'number' },
              workflowCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;

        if (!user.organizationId) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User does not belong to an organization',
          });
        }

        const organization = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          include: {
            _count: {
              select: {
                users: true,
                workflows: true,
              },
            },
          },
        });

        if (!organization) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Organization not found',
          });
        }

        const { _count, ...orgData } = organization;

        return reply.send({
          ...orgData,
          userCount: _count.users,
          workflowCount: _count.workflows,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  // Update current user's organization (admin only)
  fastify.put(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            settings: { type: 'object' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              plan: { type: 'string' },
              settings: { type: 'object' },
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
        const data = updateOrganizationSchema.parse(request.body);

        if (!user.organizationId) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User does not belong to an organization',
          });
        }

        // Only allow admins to update organization
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        const updatedOrganization = await prisma.organization.update({
          where: { id: user.organizationId },
          data,
        });

        return reply.send(updatedOrganization);
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

  // Create new organization
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2 },
            settings: { type: 'object' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              plan: { type: 'string' },
              settings: { type: 'object' },
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
        const data = createOrganizationSchema.parse(request.body);

        // Check if user already belongs to an organization
        if (user.organizationId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'User already belongs to an organization',
          });
        }

        // Create organization
        const organization = await prisma.organization.create({
          data: {
            name: data.name,
            plan: 'FREE',
            settings: data.settings || {},
          },
        });

        // Update user to belong to the new organization and make them admin
        await prisma.user.update({
          where: { id: user.userId },
          data: {
            organizationId: organization.id,
            role: 'ADMIN',
          },
        });

        return reply.status(201).send(organization);
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

  // Get organization statistics (admin only)
  fastify.get(
    '/me/stats',
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              totalUsers: { type: 'number' },
              totalWorkflows: { type: 'number' },
              activeWorkflows: { type: 'number' },
              totalExecutions: { type: 'number' },
              successfulExecutions: { type: 'number' },
              failedExecutions: { type: 'number' },
              averageExecutionTime: { type: 'number' },
              plan: { type: 'string' },
              planLimits: {
                type: 'object',
                properties: {
                  users: { type: 'number' },
                  workflows: { type: 'number' },
                  executionsPerMonth: { type: 'number' },
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

        if (!user.organizationId) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User does not belong to an organization',
          });
        }

        // Only allow admins to view statistics
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        const organization = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          include: {
            users: {
              select: { id: true },
            },
            workflows: {
              select: { id: true, status: true },
            },
          },
        });

        if (!organization) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Organization not found',
          });
        }

        // Get execution statistics
        const executionStats = await prisma.execution.groupBy({
          by: ['status'],
          where: {
            workflow: {
              organizationId: user.organizationId,
            },
          },
          _count: {
            status: true,
          },
          _avg: {
            executionTimeMs: true,
          },
        });

        const totalExecutions = executionStats.reduce(
          (sum: number, stat: any) => sum + stat._count.status,
          0
        );
        const successfulExecutions =
          executionStats.find((s: any) => s.status === 'COMPLETED')?._count
            .status || 0;
        const failedExecutions =
          executionStats.find((s: any) => s.status === 'FAILED')?._count
            .status || 0;
        const averageExecutionTime =
          executionStats.reduce(
            (sum: number, stat: any) => sum + (stat._avg.executionTimeMs || 0),
            0
          ) / totalExecutions || 0;

        const activeWorkflows = organization.workflows.filter(
          (w: any) => w.status === 'ACTIVE'
        ).length;

        // Define plan limits
        const planLimits = {
          FREE: { users: 5, workflows: 10, executionsPerMonth: 1000 },
          PRO: { users: 25, workflows: 100, executionsPerMonth: 10000 },
          TEAM: { users: 100, workflows: 500, executionsPerMonth: 50000 },
          ENTERPRISE: { users: -1, workflows: -1, executionsPerMonth: -1 }, // Unlimited
        };

        return reply.send({
          totalUsers: organization.users.length,
          totalWorkflows: organization.workflows.length,
          activeWorkflows,
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          averageExecutionTime,
          plan: organization.plan,
          planLimits: planLimits[organization.plan as keyof typeof planLimits],
        });
      } catch (error) {
        throw error;
      }
    }
  );

  // Invite user to organization (admin only)
  fastify.post(
    '/me/invite',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['email', 'role'],
          properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'VIEWER'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              inviteToken: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as AuthenticatedRequest).user;
        const { email, role } = request.body as { email: string; role: string };

        if (!user.organizationId) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User does not belong to an organization',
          });
        }

        // Only allow admins to invite users
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Insufficient permissions',
          });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          if (existingUser.organizationId === user.organizationId) {
            return reply.status(409).send({
              error: 'Conflict',
              message: 'User is already a member of this organization',
            });
          } else if (existingUser.organizationId) {
            return reply.status(409).send({
              error: 'Conflict',
              message: 'User already belongs to another organization',
            });
          }
        }

        // Generate invite token
        const inviteToken = `invite_${user.organizationId}_${email}_${Date.now()}`;

        // TODO: Send email with invite link
        // For now, just return the token
        console.log(`Invite token for ${email}: ${inviteToken}`);

        return reply.send({
          message: 'Invitation sent successfully',
          inviteToken,
        });
      } catch (error) {
        throw error;
      }
    }
  );

  // Accept organization invitation
  fastify.post(
    '/invite/accept',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token', 'name', 'password'],
          properties: {
            token: { type: 'string' },
            name: { type: 'string', minLength: 2 },
            password: { type: 'string', minLength: 8 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  organizationId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { token, name, password } = request.body as {
          token: string;
          name: string;
          password: string;
        };

        // Parse invite token (simple implementation)
        const tokenParts = token.split('_');
        if (tokenParts.length !== 4 || tokenParts[0] !== 'invite') {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid invite token',
          });
        }

        const organizationId = tokenParts[1];
        const email = tokenParts[2];

        // Check if organization exists
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId },
        });

        if (!organization) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Organization not found',
          });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'User already exists',
          });
        }

        // Create user
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash,
            organizationId,
            role: 'USER', // Default role for invited users
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
          },
        });

        return reply.send({
          message: 'Invitation accepted successfully',
          user: newUser,
        });
      } catch (error) {
        throw error;
      }
    }
  );
}
