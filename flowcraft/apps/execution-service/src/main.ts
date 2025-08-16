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

    // Generate a unique execution ID that will be used consistently
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add workflow execution job to queue
    const job = await WorkflowQueue.addWorkflowExecution({
      workflowId,
      userId,
      input: input || {},
      executionId: executionId, // Pre-generated execution ID
    });

    fastify.log.info(
      { workflowId, userId, jobId: job.id, executionId },
      'Workflow execution job queued'
    );

    return reply.status(200).send({
      executionId: executionId, // Return the consistent execution ID
      status: 'queued',
      message: 'Workflow execution queued successfully',
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to queue workflow execution');
    
    return reply.status(500).send({
      error: 'Failed to queue workflow execution',
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
    const execution = await executionEngine.getExecutionStatus(executionId);

    if (!execution) {
      return reply.status(404).send({
        error: 'Execution not found',
      });
    }

    await executionEngine.disconnect();

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