import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  WorkflowTemplateService,
  createTemplateSchema,
  updateTemplateSchema,
} from '../services/workflowTemplate.service.js';
import { WorkflowValidationService } from '../services/workflowValidation.service.js';

const templateService = new WorkflowTemplateService();
const validationService = new WorkflowValidationService();

// Query parameters schema for list templates
const listTemplatesQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default('10'),
  category: z.string().optional(),
  search: z.string().optional(),
  isPublic: z
    .string()
    .transform(val => val === 'true')
    .optional(),
});

// Params schema for template ID
const templateIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export async function workflowTemplateRoutes(fastify: FastifyInstance) {
  // Create template
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create a new workflow template',
        tags: ['workflow-templates'],
        body: {
          type: 'object',
          required: ['name', 'category', 'definition'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            category: { type: 'string', minLength: 1, maxLength: 100 },
            definition: { type: 'object' },
            isPublic: { type: 'boolean', default: false },
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
              category: { type: 'string' },
              definition: { type: 'object' },
              isPublic: { type: 'boolean' },
              organizationId: { type: 'string' },
              createdBy: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
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
        const data = createTemplateSchema.parse(request.body);

        // Validate workflow definition
        const validation = await validationService.validateWorkflow(
          data.definition as any
        );
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Template definition is invalid',
            details: validation.errors,
            warnings: validation.warnings,
          });
        }

        const template = await templateService.createTemplate(
          data,
          user.userId
        );
        return reply.status(201).send(template);
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

  // List templates (public and user's private templates)
  fastify.get(
    '/',
    {
      schema: {
        description: 'List workflow templates with pagination and filters',
        tags: ['workflow-templates'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', pattern: '^[1-9]\\d*$' },
            limit: { type: 'string', pattern: '^[1-9]\\d*$' },
            category: { type: 'string' },
            search: { type: 'string' },
            isPublic: { type: 'string', enum: ['true', 'false'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              templates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    isPublic: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    organization: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
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
        const query = listTemplatesQuerySchema.parse(request.query);

        const result = await templateService.getTemplates(
          user.userId,
          user.organizationId,
          {
            page: query.page,
            limit: query.limit,
            category: query.category,
            search: query.search,
            isPublic: query.isPublic,
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

  // Get public templates
  fastify.get(
    '/public',
    {
      schema: {
        description: 'List public workflow templates',
        tags: ['workflow-templates'],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', pattern: '^[1-9]\\d*$' },
            limit: { type: 'string', pattern: '^[1-9]\\d*$' },
            category: { type: 'string' },
            search: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              templates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    isPublic: { type: 'boolean' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    organization: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
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
        const query = listTemplatesQuerySchema.parse(request.query);

        const result = await templateService.getPublicTemplates({
          page: query.page,
          limit: query.limit,
          category: query.category,
          search: query.search,
        });

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

  // Get template by ID
  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get workflow template by ID',
        tags: ['workflow-templates'],
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
              category: { type: 'string' },
              definition: { type: 'object' },
              isPublic: { type: 'boolean' },
              organizationId: { type: 'string' },
              createdBy: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
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
        const { id } = templateIdParamsSchema.parse(request.params);

        const template = await templateService.getTemplateById(
          id,
          user.userId,
          user.organizationId
        );
        if (!template) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Template not found',
          });
        }

        return reply.send(template);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid template ID',
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Update template
  fastify.put(
    '/:id',
    {
      schema: {
        description: 'Update workflow template',
        tags: ['workflow-templates'],
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
            category: { type: 'string', minLength: 1, maxLength: 100 },
            definition: { type: 'object' },
            isPublic: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              definition: { type: 'object' },
              isPublic: { type: 'boolean' },
              organizationId: { type: 'string' },
              createdBy: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
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
        const { id } = templateIdParamsSchema.parse(request.params);
        const data = updateTemplateSchema.parse(request.body);

        // Validate workflow definition if provided
        if (data.definition) {
          const validation = await validationService.validateWorkflow(
            data.definition as any
          );
          if (!validation.isValid) {
            return reply.status(400).send({
              error: 'Validation Error',
              message: 'Template definition is invalid',
              details: validation.errors,
              warnings: validation.warnings,
            });
          }
        }

        const template = await templateService.updateTemplate(
          id,
          data,
          user.userId
        );
        return reply.send(template);
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
          error.message === 'Template not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Template not found',
          });
        }
        throw error;
      }
    }
  );

  // Delete template
  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete workflow template',
        tags: ['workflow-templates'],
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
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { id } = templateIdParamsSchema.parse(request.params);

        await templateService.deleteTemplate(id, user.userId);
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid template ID',
            details: error.errors,
          });
        }
        if (
          error instanceof Error &&
          error.message === 'Template not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Template not found',
          });
        }
        throw error;
      }
    }
  );

  // Duplicate template
  fastify.post(
    '/:id/duplicate',
    {
      schema: {
        description: 'Duplicate workflow template',
        tags: ['workflow-templates'],
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
              category: { type: 'string' },
              definition: { type: 'object' },
              isPublic: { type: 'boolean' },
              organizationId: { type: 'string' },
              createdBy: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
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
        const { id } = templateIdParamsSchema.parse(request.params);
        const { name } = z
          .object({ name: z.string().min(1).max(255) })
          .parse(request.body);

        const template = await templateService.duplicateTemplate(
          id,
          name,
          user.userId,
          user.organizationId
        );
        return reply.status(201).send(template);
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
          error.message === 'Template not found or access denied'
        ) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Template not found',
          });
        }
        throw error;
      }
    }
  );

  // Get template categories
  fastify.get(
    '/categories',
    {
      schema: {
        description: 'Get all template categories',
        tags: ['workflow-templates'],
        response: {
          200: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categories = await templateService.getCategories();
        return reply.send(categories);
      } catch (error) {
        throw error;
      }
    }
  );

  // Validate template
  fastify.post(
    '/:id/validate',
    {
      schema: {
        description: 'Validate template definition',
        tags: ['workflow-templates'],
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
        const { id } = templateIdParamsSchema.parse(request.params);
        const { definition } = z
          .object({ definition: z.record(z.any()) })
          .parse(request.body);

        // Check if template exists and user has access
        const template = await templateService.getTemplateById(
          id,
          user.userId,
          user.organizationId
        );
        if (!template) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Template not found',
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
