import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { organizationRoutes } from './routes/organizations.js';
import { healthRoutes } from './routes/health.js';
import { i18nRoutes } from './routes/i18n.js';
import { workflowRoutes } from './routes/workflows.js';
import { workflowTemplateRoutes } from './routes/workflowTemplates.js';
import { workflowImportExportRoutes } from './routes/workflowImportExport.js';
import executionRoutes from './routes/executions.js';
import { authenticate } from './middleware/auth.middleware.js';
import { i18nPlugin } from './middleware/i18n.middleware.js';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});

await fastify.register(helmet);

// Global rate limiting
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Auth-specific rate limiting will be applied in auth routes

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  sign: {
    expiresIn: '15m', // Access token expires in 15 minutes
  },
});

// Register global middleware
fastify.decorate('authenticate', authenticate);

// Register i18n plugin
await fastify.register(i18nPlugin);

// Register Swagger
await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'FlowCraft API',
      description:
        'API documentation for FlowCraft workflow automation platform',
      version: '1.0.0',
      contact: {
        name: 'FlowCraft Team',
        email: 'support@flowcraft.io',
      },
    },
    host: process.env.API_HOST || 'localhost:3000',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management endpoints' },
      {
        name: 'organizations',
        description: 'Organization management endpoints',
      },
      { name: 'workflows', description: 'Workflow management endpoints' },
      {
        name: 'workflow-templates',
        description: 'Workflow template endpoints',
      },
      { name: 'import-export', description: 'Import/Export endpoints' },
      { name: 'i18n', description: 'Internationalization endpoints' },
      { name: 'health', description: 'Health check endpoints' },
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'Bearer token for authentication',
      },
    },
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next();
    },
    preHandler: function (request, reply, next) {
      next();
    },
  },
  staticCSP: true,
  transformStaticCSP: header => header,
  transformSpecification: (swaggerObject, _request, _reply) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
});

// Register routes
await fastify.register(healthRoutes, { prefix: '/health' });
await fastify.register(authRoutes, { prefix: '/auth' });
await fastify.register(userRoutes, { prefix: '/users' });
await fastify.register(organizationRoutes, { prefix: '/organizations' });
await fastify.register(i18nRoutes, { prefix: '/i18n' });
await fastify.register(workflowRoutes, { prefix: '/workflows' });
await fastify.register(workflowTemplateRoutes, {
  prefix: '/workflow-templates',
});
await fastify.register(workflowImportExportRoutes, {
  prefix: '/import-export',
});
await fastify.register(executionRoutes);

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong',
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
