import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import connectorManagementService from '../services/connectorManagement.service';
import connectorTemplatesService from '../services/connectorTemplates.service';

// Request schemas
const CreateConnectorSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['http', 'email', 'webhook', 'timer', 'data-transform']),
  description: z.string().optional(),
  configuration: z.record(z.any()),
  organizationId: z.string().optional(),
});

const UpdateConnectorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

const CreateCredentialSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['oauth2', 'api_key', 'username_password', 'custom']),
  data: z.record(z.any()),
  expiresAt: z.string().optional(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['http', 'email', 'webhook', 'timer', 'data-transform']),
  category: z.string().optional(),
  description: z.string().optional(),
  configurationSchema: z.record(z.any()),
  isPublic: z.boolean().default(false),
  organizationId: z.string().optional(),
});

// Request interfaces
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    organizationId?: string;
  };
}

// Type assertion helper
function assertAuthenticatedRequest(request: FastifyRequest): asserts request is AuthenticatedRequest {
  if (!request.user || typeof request.user === 'string') {
    throw new Error('User not authenticated');
  }
}

interface ConnectorParams {
  id: string;
}

interface CredentialParams {
  id: string;
}

interface TemplateParams {
  id: string;
}

export default async function connectorRoutes(fastify: FastifyInstance) {
  // Require authentication for all connector routes, but skip CORS preflight (OPTIONS)
  fastify.addHook('preHandler', (request, reply, done) => {
    if (request.method === 'OPTIONS') {
      return done();
    }
    return (fastify as any).authenticate(request, reply, done);
  });
  // Get all connectors
  fastify.get('/connectors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { type, isActive, search } = request.query as any;
      const connectors = await connectorManagementService.getConnectors(
        request.user.id,
        request.user.organizationId,
        { type, isActive, search }
      );

      return reply.send({
        success: true,
        data: connectors,
      });
    } catch (error) {
      fastify.log.error('Error getting connectors:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get connectors',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get connector by ID
  fastify.get('/connectors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
          try {
      assertAuthenticatedRequest(request);
        const { id } = request.params as ConnectorParams;
        const connector = await connectorManagementService.getConnector(
          id,
          request.user.id,
          request.user.organizationId
        );

      if (!connector) {
        return reply.status(404).send({
          success: false,
          error: 'Connector not found',
        });
      }

      return reply.send({
        success: true,
        data: connector,
      });
    } catch (error) {
      fastify.log.error('Error getting connector:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get connector',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Create connector
  fastify.post('/connectors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      fastify.log.info({ userId: request.user.id, orgId: request.user.organizationId, body: request.body }, 'Create connector request');
      const validatedData = CreateConnectorSchema.parse(request.body);
      // Ensure organization context if not provided explicitly
      const dataWithOrg = {
        ...validatedData,
        organizationId: validatedData.organizationId ?? request.user.organizationId,
      };
      const connector = await connectorManagementService.createConnector(
        dataWithOrg,
        request.user.id
      );
      fastify.log.info({ connectorId: connector.id, name: (connector as any).name, type: (connector as any).type }, 'Connector created');

      return reply.status(201).send({
        success: true,
        data: connector,
      });
    } catch (error) {
      fastify.log.error({ err: error }, 'Error creating connector');
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to create connector',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update connector
  fastify.put('/connectors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as ConnectorParams;
      const validatedData = UpdateConnectorSchema.parse(request.body);
      
      const connector = await connectorManagementService.updateConnector(
        id,
        validatedData,
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        data: connector,
      });
    } catch (error) {
      fastify.log.error('Error updating connector:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to update connector',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete connector
  fastify.delete('/connectors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as ConnectorParams;
      await connectorManagementService.deleteConnector(
        id,
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        message: 'Connector deleted successfully',
      });
    } catch (error) {
      fastify.log.error('Error deleting connector:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete connector',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Test connector
  fastify.post('/connectors/:id/test', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as ConnectorParams;
      const result = await connectorManagementService.testConnector(
        id,
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      fastify.log.error('Error testing connector:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to test connector',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get connector statistics
  fastify.get('/connectors/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const stats = await connectorManagementService.getConnectorStats(
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      fastify.log.error('Error getting connector stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get connector statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get connector credentials
  fastify.get('/connectors/:id/credentials', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as ConnectorParams;
      const credentials = await connectorManagementService.getCredentials(
        id,
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        data: credentials,
      });
    } catch (error) {
      fastify.log.error('Error getting credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Add credentials to connector
  fastify.post('/connectors/:id/credentials', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as ConnectorParams;
      const validatedData = CreateCredentialSchema.parse(request.body);
      
      // Convert expiresAt string to Date if provided
      const credentialData = {
        ...validatedData,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      };

      const credential = await connectorManagementService.addCredentials(
        id,
        credentialData,
        request.user.id,
        request.user.organizationId
      );

      return reply.status(201).send({
        success: true,
        data: credential,
      });
    } catch (error) {
      fastify.log.error('Error adding credentials:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to add credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete credentials
  fastify.delete('/credentials/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as CredentialParams;
      await connectorManagementService.deleteCredentials(
        id,
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        message: 'Credentials deleted successfully',
      });
    } catch (error) {
      fastify.log.error('Error deleting credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get connector logs
  fastify.get('/connectors/:id/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as ConnectorParams;
      const { limit = 100 } = request.query as any;
      
      const logs = await connectorManagementService.getLogs(
        id,
        request.user.id,
        request.user.organizationId,
        parseInt(limit)
      );

      return reply.send({
        success: true,
        data: logs,
      });
    } catch (error) {
      fastify.log.error('Error getting logs:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Template routes
  // Get all templates
  fastify.get('/connector-templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { type, category, isPublic, search } = request.query as any;
      const templates = await connectorTemplatesService.getTemplates(
        request.user.id,
        request.user.organizationId,
        { type, category, isPublic, search }
      );

      return reply.send({
        success: true,
        data: templates,
      });
    } catch (error) {
      fastify.log.error('Error getting templates:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get template by ID
  fastify.get('/connector-templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { id } = request.params as TemplateParams;
      const template = await connectorTemplatesService.getTemplate(
        id,
        request.user.id,
        request.user.organizationId
      );

      if (!template) {
        return reply.status(404).send({
          success: false,
          error: 'Template not found',
        });
      }

      return reply.send({
        success: true,
        data: template,
      });
    } catch (error) {
      fastify.log.error('Error getting template:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Create template
  fastify.post('/connector-templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const validatedData = CreateTemplateSchema.parse(request.body);
      const template = await connectorTemplatesService.createTemplate(
        validatedData,
        request.user.id
      );

      return reply.status(201).send({
        success: true,
        data: template,
      });
    } catch (error) {
      fastify.log.error('Error creating template:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get template categories
  fastify.get('/connector-templates/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const categories = await connectorTemplatesService.getCategories();

      return reply.send({
        success: true,
        data: categories,
      });
    } catch (error) {
      fastify.log.error('Error getting categories:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get popular templates
  fastify.get('/connector-templates/popular', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const { limit = 10 } = request.query as any;
      const templates = await connectorTemplatesService.getPopularTemplates(
        parseInt(limit),
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        data: templates,
      });
    } catch (error) {
      fastify.log.error('Error getting popular templates:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get popular templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get template statistics
  fastify.get('/connector-templates/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      const stats = await connectorTemplatesService.getTemplateStats(
        request.user.id,
        request.user.organizationId
      );

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      fastify.log.error('Error getting template stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get template statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Seed default templates (admin only)
  fastify.post('/connector-templates/seed', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      assertAuthenticatedRequest(request);
      // TODO: Add admin check
      await connectorTemplatesService.seedDefaultTemplates();

      return reply.send({
        success: true,
        message: 'Default templates seeded successfully',
      });
    } catch (error) {
      fastify.log.error('Error seeding templates:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to seed templates',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
