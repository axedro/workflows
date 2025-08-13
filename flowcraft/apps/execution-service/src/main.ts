import Fastify from 'fastify';
import { config } from './config/index.js';
import { ExecutionEngine } from './services/ExecutionEngine.js';
import { WorkflowQueue } from './queues/WorkflowQueue.js';
import { logger } from './utils/logger.js';

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
  },
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error({ error, url: request.url, method: request.method }, 'Request error');
  reply.status(500).send({ error: 'Internal Server Error' });
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'execution-service', timestamp: new Date().toISOString() };
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