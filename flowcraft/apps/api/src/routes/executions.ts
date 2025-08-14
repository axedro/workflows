import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@flowcraft/database';
import { ExecutionService } from '../services/executionService.js';

const prisma = new PrismaClient();
const executionService = new ExecutionService();

// Validation schemas
const executeWorkflowSchema = z.object({
  input: z.record(z.any()).optional(),
});

const executionParamsSchema = z.object({
  id: z.string().min(1),
});

const workflowParamsSchema = z.object({
  id: z.string().cuid(),
});

const listExecutionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
});

export default async function executionRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Execute workflow (proxy to execution service)
  fastify.post('/workflows/:id/execute', {
    // preHandler: fastify.authenticate, // Temporarily disabled for testing
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: workflowId } = workflowParamsSchema.parse(request.params);
      const { input } = executeWorkflowSchema.parse(request.body);
      
      // For now, use a test user ID when authentication is disabled
      const userId = 'test-user'; // (request.user as any)?.id || 'test-user';

      // Forward request to execution service
      const executionServiceUrl = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3001';
      const response = await fetch(`${executionServiceUrl}/api/workflows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.authorization || '',
        },
        body: JSON.stringify({
          workflowId,
          userId,
          input: input || {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return reply.status(response.status).send(errorData);
      }

      const executionData = await response.json();
      
      fastify.log.info({ workflowId, executionId: executionData.executionId, userId }, 'Workflow execution started via proxy');

      return reply.status(200).send(executionData);

    } catch (error) {
      fastify.log.error({ error, params: request.params }, 'Failed to execute workflow via execution service');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors.map(e => e.message).join(', '),
        });
      }

      return reply.status(500).send({
        error: 'Failed to execute workflow',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get execution status (proxy to execution service)
  fastify.get('/executions/:id', {
    // preHandler: fastify.authenticate, // Temporarily disabled for testing
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: executionId } = executionParamsSchema.parse(request.params);
      
      // Forward request to execution service
      const executionServiceUrl = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3001';
      const response = await fetch(`${executionServiceUrl}/api/executions/${executionId}`, {
        headers: {
          'Authorization': request.headers.authorization || '',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return reply.status(response.status).send(errorData);
      }

      const executionData = await response.json();
      return reply.status(200).send(executionData);

    } catch (error) {
      fastify.log.error({ error, params: request.params }, 'Failed to get execution from execution service');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors.map(e => e.message).join(', '),
        });
      }

      return reply.status(500).send({
        error: 'Failed to get execution',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // List executions for a workflow
  fastify.get('/workflows/:id/executions', {
    preHandler: fastify.authenticate,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: workflowId } = workflowParamsSchema.parse(request.params);
      const { page, limit, status } = listExecutionsQuerySchema.parse(request.query);
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      // Check if workflow exists and user has access
      const workflow = await prisma.workflow.findFirst({
        where: {
          id: workflowId,
          OR: [
            { userId: userId },
            { organization: { users: { some: { id: userId } } } },
          ],
        },
      });

      if (!workflow) {
        return reply.status(404).send({ error: 'Workflow not found or access denied' });
      }

      // Build where condition
      const whereCondition: any = { workflowId };
      if (status) {
        whereCondition.status = status;
      }

      // Get executions with pagination
      const [executions, total] = await Promise.all([
        prisma.execution.findMany({
          where: whereCondition,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            errorDetails: true,
          },
          orderBy: { startedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.execution.count({ where: whereCondition }),
      ]);

      // Calculate execution times
      const executionsWithTime = executions.map(execution => ({
        ...execution,
        executionTimeMs: execution.completedAt && execution.startedAt
          ? execution.completedAt.getTime() - execution.startedAt.getTime()
          : null,
      }));

      return reply.status(200).send({
        executions: executionsWithTime,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });

    } catch (error) {
      fastify.log.error({ error, params: request.params }, 'Failed to list executions');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors.map(e => e.message).join(', '),
        });
      }

      return reply.status(500).send({
        error: 'Failed to list executions',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Cancel execution
  fastify.post('/executions/:id/cancel', {
    preHandler: fastify.authenticate,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id: executionId } = executionParamsSchema.parse(request.params);
      const userId = (request.user as any)?.id;

      if (!userId) {
        return reply.status(401).send({ error: 'User not authenticated' });
      }

      // Check if execution exists and user has access
      const execution = await prisma.execution.findFirst({
        where: {
          id: executionId,
          OR: [
            { userId: userId },
            { workflow: { organization: { users: { some: { id: userId } } } } },
          ],
        },
      });

      if (!execution) {
        return reply.status(404).send({ error: 'Execution not found or access denied' });
      }

      // Cancel execution
      await executionService.cancelExecution(executionId);

      fastify.log.info({ executionId, userId }, 'Execution cancelled');

      return reply.status(200).send({
        message: 'Execution cancelled successfully',
        status: 'cancelled',
      });

    } catch (error) {
      fastify.log.error({ error, params: request.params }, 'Failed to cancel execution');

      return reply.status(500).send({
        error: 'Failed to cancel execution',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}