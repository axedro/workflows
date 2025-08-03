import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { WorkflowService } from '../services/workflow.service.js';
import { WorkflowTemplateService } from '../services/workflowTemplate.service.js';
import { WorkflowValidationService } from '../services/workflowValidation.service.js';

const workflowService = new WorkflowService();
const templateService = new WorkflowTemplateService();
const validationService = new WorkflowValidationService();

// Params schema for workflow ID
const workflowIdParamsSchema = z.object({
  id: z.string().cuid(),
});

// Params schema for template ID
const templateIdParamsSchema = z.object({
  id: z.string().cuid(),
});

// Export schema for workflow
const exportWorkflowSchema = z.object({
  includeVersions: z.boolean().default(false),
  includeExecutions: z.boolean().default(false),
});

// Import schema for workflow
const importWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  definition: z.record(z.any()),
  organizationId: z.string().optional(),
  overwrite: z.boolean().default(false),
});

// Import schema for template
const importTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().min(1).max(100),
  definition: z.record(z.any()),
  isPublic: z.boolean().default(false),
  organizationId: z.string().optional(),
  overwrite: z.boolean().default(false),
});

export async function workflowImportExportRoutes(fastify: FastifyInstance) {
  // Export workflow
  fastify.post(
    '/workflows/:id/export',
    {
      schema: {
        description: 'Export workflow to JSON format',
        tags: ['import-export'],
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
            includeVersions: { type: 'boolean', default: false },
            includeExecutions: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              workflow: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  definition: { type: 'object' },
                  status: { type: 'string' },
                  version: { type: 'number' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  organizationId: { type: 'string' },
                  userId: { type: 'string' },
                },
              },
              versions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    versionNumber: { type: 'number' },
                    definition: { type: 'object' },
                    changelog: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
              executions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    status: { type: 'string' },
                    startedAt: { type: 'string' },
                    completedAt: { type: 'string' },
                  },
                },
              },
              exportDate: { type: 'string' },
              exportVersion: { type: 'string' },
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
        const options = exportWorkflowSchema.parse(request.body);

        // Get workflow with versions if requested
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

        const exportData: any = {
          workflow: {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            definition: workflow.definition,
            status: workflow.status,
            version: workflow.version,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
            organizationId: workflow.organizationId,
            userId: workflow.userId,
          },
          exportDate: new Date().toISOString(),
          exportVersion: '1.0.0',
        };

        if (options.includeVersions) {
          exportData.versions = workflow.versions;
        }

        if (options.includeExecutions) {
          // Note: This would require adding execution service
          exportData.executions = [];
        }

        return reply.send(exportData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid parameters',
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Import workflow
  fastify.post(
    '/workflows/import',
    {
      schema: {
        description: 'Import workflow from JSON format',
        tags: ['import-export'],
        body: {
          type: 'object',
          required: ['name', 'definition'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string' },
            definition: { type: 'object' },
            organizationId: { type: 'string' },
            overwrite: { type: 'boolean', default: false },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              definition: { type: 'object' },
              status: { type: 'string' },
              version: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              organizationId: { type: 'string' },
              userId: { type: 'string' },
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
        const data = importWorkflowSchema.parse(request.body);

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

        // Check if workflow with same name exists
        if (!data.overwrite) {
          const existingWorkflows = await workflowService.getWorkflows(
            user.userId,
            user.organizationId,
            { search: data.name }
          );

          const existingWorkflow = existingWorkflows.workflows.find(
            w => w.name.toLowerCase() === data.name.toLowerCase()
          );

          if (existingWorkflow) {
            return reply.status(409).send({
              error: 'Conflict',
              message:
                'Workflow with this name already exists. Use overwrite=true to replace it.',
            });
          }
        }

        const workflow = await workflowService.createWorkflow(
          {
            name: data.name,
            description: data.description,
            definition: data.definition,
            organizationId: data.organizationId,
          },
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

  // Export template
  fastify.post(
    '/workflow-templates/:id/export',
    {
      schema: {
        description: 'Export workflow template to JSON format',
        tags: ['import-export'],
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
              template: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  definition: { type: 'object' },
                  isPublic: { type: 'boolean' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  organizationId: { type: 'string' },
                  createdBy: { type: 'string' },
                },
              },
              exportDate: { type: 'string' },
              exportVersion: { type: 'string' },
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

        const exportData = {
          template: {
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            definition: template.definition,
            isPublic: template.isPublic,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            organizationId: template.organizationId,
            createdBy: template.createdBy,
          },
          exportDate: new Date().toISOString(),
          exportVersion: '1.0.0',
        };

        return reply.send(exportData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid parameters',
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Import template
  fastify.post(
    '/workflow-templates/import',
    {
      schema: {
        description: 'Import workflow template from JSON format',
        tags: ['import-export'],
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
            overwrite: { type: 'boolean', default: false },
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
        const data = importTemplateSchema.parse(request.body);

        // Validate template definition
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

        // Check if template with same name exists
        if (!data.overwrite) {
          const existingTemplates = await templateService.getTemplates(
            user.userId,
            user.organizationId,
            { search: data.name }
          );

          const existingTemplate = existingTemplates.templates.find(
            t => t.name.toLowerCase() === data.name.toLowerCase()
          );

          if (existingTemplate) {
            return reply.status(409).send({
              error: 'Conflict',
              message:
                'Template with this name already exists. Use overwrite=true to replace it.',
            });
          }
        }

        const template = await templateService.createTemplate(
          {
            name: data.name,
            description: data.description,
            category: data.category,
            definition: data.definition,
            isPublic: data.isPublic,
            organizationId: data.organizationId,
          },
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

  // Bulk export workflows
  fastify.post(
    '/workflows/bulk-export',
    {
      schema: {
        description: 'Export multiple workflows to JSON format',
        tags: ['import-export'],
        body: {
          type: 'object',
          required: ['workflowIds'],
          properties: {
            workflowIds: {
              type: 'array',
              items: { type: 'string', pattern: '^c[a-z0-9]{24}$' },
              minItems: 1,
              maxItems: 50,
            },
            includeVersions: { type: 'boolean', default: false },
            includeExecutions: { type: 'boolean', default: false },
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
                    definition: { type: 'object' },
                    status: { type: 'string' },
                    version: { type: 'number' },
                  },
                },
              },
              exportDate: { type: 'string' },
              exportVersion: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as any;
        const { workflowIds, includeVersions, includeExecutions } = z
          .object({
            workflowIds: z.array(z.string().cuid()).min(1).max(50),
            includeVersions: z.boolean().default(false),
            includeExecutions: z.boolean().default(false),
          })
          .parse(request.body);

        const workflows = [];

        for (const workflowId of workflowIds) {
          const workflow = await workflowService.getWorkflowById(
            workflowId,
            user.userId,
            user.organizationId
          );
          if (workflow) {
            const exportData: any = {
              id: workflow.id,
              name: workflow.name,
              description: workflow.description,
              definition: workflow.definition,
              status: workflow.status,
              version: workflow.version,
            };

            if (includeVersions) {
              exportData.versions = workflow.versions;
            }

            workflows.push(exportData);
          }
        }

        const exportData = {
          workflows,
          exportDate: new Date().toISOString(),
          exportVersion: '1.0.0',
        };

        return reply.send(exportData);
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

  // Bulk import workflows
  fastify.post(
    '/workflows/bulk-import',
    {
      schema: {
        description: 'Import multiple workflows from JSON format',
        tags: ['import-export'],
        body: {
          type: 'object',
          required: ['workflows'],
          properties: {
            workflows: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'definition'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 255 },
                  description: { type: 'string' },
                  definition: { type: 'object' },
                  organizationId: { type: 'string' },
                },
              },
              minItems: 1,
              maxItems: 50,
            },
            overwrite: { type: 'boolean', default: false },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              imported: { type: 'number' },
              failed: { type: 'number' },
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    success: { type: 'boolean' },
                    id: { type: 'string' },
                    error: { type: 'string' },
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
        const { workflows, overwrite } = z
          .object({
            workflows: z
              .array(
                z.object({
                  name: z.string().min(1).max(255),
                  description: z.string().optional(),
                  definition: z.record(z.any()),
                  organizationId: z.string().optional(),
                })
              )
              .min(1)
              .max(50),
            overwrite: z.boolean().default(false),
          })
          .parse(request.body);

        const results = [];
        let imported = 0;
        let failed = 0;

        for (const workflowData of workflows) {
          try {
            // Validate workflow definition
            const validation = await validationService.validateWorkflow(
              workflowData.definition as any
            );
            if (!validation.isValid) {
              results.push({
                name: workflowData.name,
                success: false,
                error: 'Invalid workflow definition',
              });
              failed++;
              continue;
            }

            // Check if workflow exists
            if (!overwrite) {
              const existingWorkflows = await workflowService.getWorkflows(
                user.userId,
                user.organizationId,
                { search: workflowData.name }
              );

              const existingWorkflow = existingWorkflows.workflows.find(
                w => w.name.toLowerCase() === workflowData.name.toLowerCase()
              );

              if (existingWorkflow) {
                results.push({
                  name: workflowData.name,
                  success: false,
                  error: 'Workflow already exists',
                });
                failed++;
                continue;
              }
            }

            const workflow = await workflowService.createWorkflow(
              {
                name: workflowData.name,
                description: workflowData.description,
                definition: workflowData.definition,
                organizationId: workflowData.organizationId,
              },
              user.userId
            );

            results.push({
              name: workflowData.name,
              success: true,
              id: workflow.id,
            });
            imported++;
          } catch (error) {
            results.push({
              name: workflowData.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            failed++;
          }
        }

        return reply.status(201).send({
          imported,
          failed,
          results,
        });
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
