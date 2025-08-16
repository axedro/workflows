import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import dotenv from 'dotenv';

import { config } from './config/index.js';
import { WorkflowQueue } from './queues/WorkflowQueue.js';
import { ExecutionEngine } from './services/ExecutionEngine.js';
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

    // Execute workflow directly to get the real execution ID from database
    const executionEngine = new ExecutionEngine();
    const executionId = await executionEngine.executeWorkflow(workflowId, userId, input || {});
    await executionEngine.disconnect();

    fastify.log.info(
      { workflowId, userId, executionId },
      'Workflow execution completed successfully'
    );

    return reply.status(200).send({
      executionId: executionId, // Return the real execution ID from database
      status: 'completed',
      message: 'Workflow executed successfully',
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

// Cancel execution endpoint
fastify.post('/api/executions/:id/cancel', async (request, reply) => {
  try {
    const { id: executionId } = request.params as { id: string };

    if (!executionId) {
      return reply.status(400).send({
        error: 'Missing execution ID',
      });
    }

    const executionEngine = new ExecutionEngine();
    await executionEngine.cancelExecution(executionId);
    await executionEngine.disconnect();

    // Also cancel the job in the queue
    await WorkflowQueue.cancelJob(executionId);

    fastify.log.info({ executionId }, 'Execution cancelled');

    return reply.status(200).send({
      message: 'Execution cancelled successfully',
      status: 'cancelled',
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to cancel execution');
    
    return reply.status(500).send({
      error: 'Failed to cancel execution',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Queue management endpoints (for monitoring/debugging)
fastify.get('/api/queue/stats', async (request, reply) => {
  try {
    const stats = await WorkflowQueue.getQueueStats();
    return reply.status(200).send(stats);
  } catch (error) {
    fastify.log.error({ error }, 'Failed to get queue stats');
    return reply.status(500).send({
      error: 'Failed to get queue stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

fastify.post('/api/queue/pause', async (request, reply) => {
  try {
    await WorkflowQueue.pauseQueue();
    return reply.status(200).send({ message: 'Queue paused' });
  } catch (error) {
    fastify.log.error({ error }, 'Failed to pause queue');
    return reply.status(500).send({
      error: 'Failed to pause queue',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

fastify.post('/api/queue/resume', async (request, reply) => {
  try {
    await WorkflowQueue.resumeQueue();
    return reply.status(200).send({ message: 'Queue resumed' });
  } catch (error) {
    fastify.log.error({ error }, 'Failed to resume queue');
    return reply.status(500).send({
      error: 'Failed to resume queue',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Test HTTP connector endpoint (for development/testing)
fastify.post('/api/test/http-connector', async (request, reply) => {
  try {
    const { input } = request.body as {
      input?: Record<string, any>;
    };

    if (!input?.url) {
      return reply.status(400).send({
        error: 'Missing required field: url',
      });
    }

    const executionEngine = new ExecutionEngine();
    
    // Create a mock HTTP request node
    const mockHttpNode = {
      id: 'test-http-node',
      type: 'http_request',
      data: {
        url: input.url,
        method: input.method || 'GET',
        headers: input.headers || {},
        body: input.body,
        timeout: input.timeout || 30000,
        retries: input.retries || 3,
        retryDelay: input.retryDelay || 1000,
        followRedirects: input.followRedirects ?? true,
        validateSSL: input.validateSSL ?? true,
        authentication: input.authentication,
      },
      position: { x: 0, y: 0 },
    };

    // Create mock execution context
    const mockContext = {
      executionId: 'test-execution',
      workflowId: 'test-workflow',
      userId: 'test-user',
      nodeId: 'test-http-node',
      input: {
        ...input,
        params: input.params || input.queryParams,
      },
      startedAt: new Date(),
      status: 'RUNNING' as any,
    };

    // Execute the HTTP node directly
    const result = await (executionEngine as any).executeHttpRequestNode(mockHttpNode, mockContext);
    
    await executionEngine.disconnect();

    fastify.log.info(
      { 
        url: input.url, 
        method: input.method || 'GET',
        success: result.success,
        status: result.data?.status 
      },
      'HTTP connector test completed'
    );

    return reply.status(200).send({
      success: result.success,
      data: result.data,
      duration: result.duration,
      error: result.error,
      message: 'HTTP connector test completed',
    });

  } catch (error) {
    fastify.log.error({ error }, 'Failed to test HTTP connector');
    
    return reply.status(500).send({
      error: 'Failed to test HTTP connector',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, gracefully shutting down...`);
  
  try {
    // Disconnect queue and cleanup
    await WorkflowQueue.disconnect();
    
    // Stop Fastify server
    await fastify.close();
    
    logger.info('Execution service shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    // Initialize queue system
    await WorkflowQueue.initialize();
    
    const port = config.PORT;
    const host = config.HOST;

    await fastify.listen({ port, host });
    logger.info(`Execution service listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();