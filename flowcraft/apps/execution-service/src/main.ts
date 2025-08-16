import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';

import { config } from './config/index.js';
import { ExecutionEngine } from './services/ExecutionEngine.js';
import { WorkflowQueue } from './queues/WorkflowQueue.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
  },
});

// Register plugins
await fastify.register(cors, {
  origin: true, // Allow all origins for internal service
  credentials: true,
});

await fastify.register(helmet);

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error({ error, url: request.url, method: request.method }, 'Request error');
  reply.status(500).send({ error: 'Internal Server Error' });
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Check queue status
    const queueStats = await WorkflowQueue.getQueueStats();
    
    return reply.status(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'execution-service',
      version: '1.0.0',
      queue: queueStats,
    });
  } catch (error) {
    fastify.log.error('Health check failed:', error);
    return reply.status(500).send({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'execution-service',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Execute workflow endpoint
fastify.post('/api/workflows/execute', async (request, reply) => {
  try {
    const { workflowId, userId, input } = request.body as {
      workflowId: string;
      userId: string;
      input?: Record<string, any>;
    };

    if (!workflowId || !userId) {
      return reply.status(400).send({
        error: 'Missing required fields: workflowId, userId',
      });
    }

    // Execute workflow directly to get the real execution ID
    const executionEngine = new ExecutionEngine();
    const realExecutionId = await executionEngine.executeWorkflow(workflowId, userId, input);
    await executionEngine.disconnect();

    fastify.log.info(
      { workflowId, userId, realExecutionId },
      'Workflow execution started directly'
    );

    return reply.status(200).send({
      executionId: realExecutionId,
      status: 'queued',
      message: 'Workflow execution started successfully',
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to execute workflow');
    
    return reply.status(500).send({
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get execution status endpoint
fastify.get('/api/executions/:id', async (request, reply) => {
  try {
    const { id: executionId } = request.params as { id: string };

    if (!executionId) {
      return reply.status(400).send({
        error: 'Missing execution ID',
      });
    }

    const executionEngine = new ExecutionEngine();
    
    // First, try to get the real execution ID from Redis mapping
    const redis = new (await import('ioredis')).default({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    });
    
    let realExecutionId = executionId;
    const mappedExecutionId = await redis.get(`execution:${executionId}`);
    
    if (mappedExecutionId) {
      realExecutionId = mappedExecutionId;
      logger.info({ jobId: executionId, realExecutionId }, 'Found execution ID mapping');
    }
    
    const execution = await executionEngine.getExecutionStatus(realExecutionId);

    if (!execution) {
      return reply.status(404).send({
        error: 'Execution not found',
      });
    }

    await executionEngine.disconnect();
    await redis.disconnect();

    return reply.status(200).send(execution);

  } catch (error) {
    fastify.log.error({ error }, 'Failed to get execution status');
    
    return reply.status(500).send({
      error: 'Failed to get execution status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down execution service...');
  try {
    await fastify.close();
    await WorkflowQueue.disconnect();
    logger.info('Execution service shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const start = async (): Promise<void> => {
  try {
    // Initialize queue system
    await WorkflowQueue.initialize();
    logger.info('Queue system initialized');

    // Start the server
    await fastify.listen({ port: config.PORT, host: config.HOST });
    logger.info(`🚀 Execution service listening on ${config.HOST}:${config.PORT}`);
  } catch (err) {
    logger.error(err, 'Error starting execution service');
    process.exit(1);
  }
};

start();