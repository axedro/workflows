import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  WorkflowService,
  createWorkflowSchema,
  updateWorkflowSchema,
  createVersionSchema,
} from '../services/workflow.service.js';
import { WorkflowValidationService } from '../services/workflowValidation.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

const workflowService = new WorkflowService();
const validationService = new WorkflowValidationService();

// Query parameters schema for list workflows
const listWorkflowsQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default('10'),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

// Params schema for workflow ID
const workflowIdParamsSchema = z.object({
  id: z.string().cuid(),
});

// Params schema for workflow version
const workflowVersionParamsSchema = z.object({
  id: z.string().cuid(),
  version: z.string().transform(Number).pipe(z.number().min(1)),
});

export async function workflowRoutes(fastify: FastifyInstance) {
  // Create workflow
  fastify.post(
    '/',
    {
      preValidation: [authenticate],
      schema: {
        description: 'Create a new workflow',
        tags: ['workflows'],
        body: {
          type: 'object',
          required: ['name', 'definition'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            definition: { type: 'object' },
            organizationId: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              definition: {
                type: 'object',
                additionalProperties: true, // Allow any properties in definition
              },
              status: { type: 'string' },
              version: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organizationId: { type: 'string' },
              userId: { type: 'string' },
              versions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    versionNumber: { type: 'number' },
                    changelog: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const data = createWorkflowSchema.parse(request.body);

        // Validate workflow definition
        const validation = await validationService.validateWorkflow(
          data.definition as any
        );
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Workflow definition is invalid',
            details: validation.errors,
            warnings: validation.warnings,
          });
        }

        const workflow = await workflowService.createWorkflow(
          data,
          user.userId
        );
        return reply.status(201).send(workflow);
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

  // List workflows
  fastify.get(
    '/',
    {
      preValidation: [authenticate],
      schema: {
        description: 'List workflows with pagination and filters',
        tags: ['workflows'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', pattern: '^[1-9]\\d*$' },
            limit: { type: 'string', pattern: '^[1-9]\\d*$' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
            },
            search: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              workflows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string' },
                    version: { type: 'number' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const query = listWorkflowsQuerySchema.parse(request.query);

        const result = await workflowService.getWorkflows(
          user.userId,
          user.organizationId,
          {
            page: query.page,
            limit: query.limit,
            status: query.status,
            search: query.search,
          }
        );

        return reply.send(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Get workflow by ID
  fastify.get(
    '/:id',
    {
      preValidation: [authenticate],
      schema: {
        description: 'Get workflow by ID with versions',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              definition: {
                type: 'object',
                additionalProperties: true, // Allow any properties in definition
              },
              status: { type: 'string' },
              version: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organizationId: { type: 'string' },
              userId: { type: 'string' },
              versions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    versionNumber: { type: 'number' },
                    changelog: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = workflowIdParamsSchema.parse(request.params);

        const workflow = await workflowService.getWorkflowById(
          id,
          user.userId,
          user.organizationId
        );
        if (!workflow) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow not found',
          });
        }

        return reply.send(workflow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid workflow ID',
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Update workflow
  fastify.put(
    '/:id',
    {
      preValidation: [authenticate],
      schema: {
        description: 'Update workflow',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            definition: { type: 'object' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              definition: {
                type: 'object',
                additionalProperties: true, // Allow any properties in definition
              },
              status: { type: 'string' },
              version: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organizationId: { type: 'string' },
              userId: { type: 'string' },
              versions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    versionNumber: { type: 'number' },
                    changelog: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = workflowIdParamsSchema.parse(request.params);
        const data = updateWorkflowSchema.parse(request.body);

        // Validate workflow definition if provided
        if (data.definition) {
          const validation = await validationService.validateWorkflow(
            data.definition as any
          );
          if (!validation.isValid) {
            return reply.status(400).send({
              error: 'Validation Error',
              message: 'Workflow definition is invalid',
              details: validation.errors,
              warnings: validation.warnings,
            });
          }
        }

        const workflow = await workflowService.updateWorkflow(
          id,
          data,
          user.userId
        );

        return reply.send(workflow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors,
          });
        }
        if (
          error instanceof Error &&
          error.message === 'Workflow not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow not found',
          });
        }
        throw error;
      }
    }
  );

  // Delete workflow
  fastify.delete(
    '/:id',
    {
      preValidation: [authenticate],
      schema: {
        description: 'Delete workflow',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
          },
        },
        response: {
          204: { type: 'null' },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = workflowIdParamsSchema.parse(request.params);

        await workflowService.deleteWorkflow(id, user.userId);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid workflow ID',
            details: error.errors,
          });
        }
        if (error instanceof Error) {
          if (error.message === 'Workflow not found or access denied') {
            return reply.status(404).send({
              error: 'Not Found',
              message: 'Workflow not found',
            });
          }
          if (
            error.message === 'Cannot delete workflow with existing executions'
          ) {
            return reply.status(409).send({
              error: 'Conflict',
              message: error.message,
            });
          }
        }
        throw error;
      }
    }
  );

  // Duplicate workflow
  fastify.post(
    '/:id/duplicate',
    {
      schema: {
        description: 'Duplicate workflow',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
          },
        },
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              definition: {
                type: 'object',
                additionalProperties: true, // Allow any properties in definition
              },
              status: { type: 'string' },
              version: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organizationId: { type: 'string' },
              userId: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = workflowIdParamsSchema.parse(request.params);
        const { name } = z
          .object({ name: z.string().min(1).max(255) })
          .parse(request.body);

        const workflow = await workflowService.duplicateWorkflow(
          id,
          name,
          user.userId
        );
        return reply.status(201).send(workflow);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors,
          });
        }
        if (
          error instanceof Error &&
          error.message === 'Workflow not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow not found',
          });
        }
        throw error;
      }
    }
  );

  // Create new version
  fastify.post(
    '/:id/versions',
    {
      schema: {
        description: 'Create new workflow version',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
          },
        },
        body: {
          type: 'object',
          required: ['definition'],
          properties: {
            definition: { type: 'object' },
            changelog: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              workflowId: { type: 'string' },
              versionNumber: { type: 'number' },
              definition: {
                type: 'object',
                additionalProperties: true, // Allow any properties in definition
              },
              changelog: { type: 'string' },
              createdAt: { type: 'string' },
              createdBy: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = workflowIdParamsSchema.parse(request.params);
        const data = createVersionSchema.parse(request.body);

        // Validate workflow definition
        const validation = await validationService.validateWorkflow(
          data.definition as any
        );
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Workflow definition is invalid',
            details: validation.errors,
            warnings: validation.warnings,
          });
        }

        const version = await workflowService.createVersion(
          id,
          data,
          user.userId
        );
        return reply.status(201).send(version);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: error.errors,
          });
        }
        if (
          error instanceof Error &&
          error.message === 'Workflow not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow not found',
          });
        }
        throw error;
      }
    }
  );

  // Get workflow version
  fastify.get(
    '/:id/versions/:version',
    {
      schema: {
        description: 'Get specific workflow version',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id', 'version'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
            version: { type: 'string', pattern: '^[1-9]\\d*$' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              workflowId: { type: 'string' },
              versionNumber: { type: 'number' },
              definition: {
                type: 'object',
                additionalProperties: true, // Allow any properties in definition
              },
              changelog: { type: 'string' },
              createdAt: { type: 'string' },
              createdBy: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id, version } = workflowVersionParamsSchema.parse(
          request.params
        );

        const workflowVersion = await workflowService.getWorkflowVersion(
          id,
          version,
          user.userId
        );
        if (!workflowVersion) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow version not found',
          });
        }

        return reply.send(workflowVersion);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid parameters',
            details: error.errors,
          });
        }
        if (
          error instanceof Error &&
          error.message === 'Workflow not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow not found',
          });
        }
        throw error;
      }
    }
  );

  // Validate workflow
  fastify.post(
    '/:id/validate',
    {
      schema: {
        description: 'Validate workflow definition',
        tags: ['workflows'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
          },
        },
        body: {
          type: 'object',
          required: ['definition'],
          properties: {
            definition: { type: 'object' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              isValid: { type: 'boolean' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    code: { type: 'string' },
                    message: { type: 'string' },
                    nodeId: { type: 'string' },
                    edgeId: { type: 'string' },
                    field: { type: 'string' },
                  },
                },
              },
              warnings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    code: { type: 'string' },
                    message: { type: 'string' },
                    nodeId: { type: 'string' },
                    edgeId: { type: 'string' },
                    field: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = workflowIdParamsSchema.parse(request.params);
        const { definition } = z
          .object({ definition: z.record(z.any()) })
          .parse(request.body);

        // Check if workflow exists and user has access
        const workflow = await workflowService.getWorkflowById(
          id,
          user.userId,
          user.organizationId
        );
        if (!workflow) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Workflow not found',
          });
        }

        const validation = await validationService.validateWorkflow(
          definition as any
        );
        return reply.send(validation);
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
}
