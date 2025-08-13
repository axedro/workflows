export const config = {
  // Server configuration
  PORT: parseInt(process.env.EXECUTION_SERVICE_PORT || '3001'),
  HOST: process.env.EXECUTION_SERVICE_HOST || '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://flowcraft:flowcraft@localhost:5432/flowcraft',

  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),

  // Queue configuration
  QUEUE_NAME: 'workflow-execution',
  QUEUE_CONCURRENCY: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
  
  // Execution configuration
  DEFAULT_TIMEOUT: parseInt(process.env.DEFAULT_EXECUTION_TIMEOUT || '300000'), // 5 minutes
  MAX_RETRIES: parseInt(process.env.MAX_EXECUTION_RETRIES || '3'),
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '5000'), // 5 seconds
} as const;

export type Config = typeof config;