import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config/index.js';
import { WorkflowExecutionJob, NodeExecutionJob } from '../types/execution.js';
import { ExecutionEngine } from '../services/ExecutionEngine.js';
import { logger } from '../utils/logger.js';

export class WorkflowQueue {
  private static queue: Queue<WorkflowExecutionJob>;
  private static worker: Worker<WorkflowExecutionJob>;
  private static redis: Redis;
  private static executionEngine: ExecutionEngine;

  /**
   * Initialize queue system
   */
  static async initialize(): Promise<void> {
    // Create Redis connection
    this.redis = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      maxRetriesPerRequest: 3,
    });

    // Create execution engine instance
    this.executionEngine = new ExecutionEngine();

    // Create queue
    this.queue = new Queue<WorkflowExecutionJob>(config.QUEUE_NAME, {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: true, 
        removeOnFail: true,      
        attempts: config.MAX_RETRIES,
        delay: config.RETRY_DELAY,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Create worker
    this.worker = new Worker<WorkflowExecutionJob>(
      config.QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection: this.redis,
        concurrency: config.QUEUE_CONCURRENCY,
      }
    );

    // Setup event listeners
    this.setupEventListeners();

    logger.info('WorkflowQueue initialized successfully');
  }

  /**
   * Add workflow execution job to queue
   */
  static async addWorkflowExecution(job: WorkflowExecutionJob): Promise<Job<WorkflowExecutionJob>> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const queueJob = await this.queue.add('execute-workflow', job, {
      jobId: `workflow-${job.workflowId}-${Date.now()}`,
      delay: 0, // Execute immediately
    });

    logger.info(
      { 
        jobId: queueJob.id, 
        workflowId: job.workflowId, 
        executionId: job.executionId 
      }, 
      'Workflow execution job added to queue'
    );

    return queueJob;
  }

  /**
   * Process workflow execution job
   */
  private static async processJob(job: Job<WorkflowExecutionJob>): Promise<void> {
    const { workflowId, executionId, userId, input } = job.data;
    
    logger.info(
      { 
        jobId: job.id, 
        workflowId, 
        executionId,
        attempt: job.attemptsMade + 1
      }, 
      'Processing workflow execution job'
    );

    try {
      // Execute workflow using ExecutionEngine
      await this.executionEngine.executeWorkflow(workflowId, userId, input);
      
      logger.info(
        { 
          jobId: job.id, 
          workflowId, 
          executionId 
        }, 
        'Workflow execution job completed successfully'
      );

    } catch (error) {
      logger.error(
        { 
          error, 
          jobId: job.id, 
          workflowId, 
          executionId,
          attempt: job.attemptsMade + 1
        }, 
        'Workflow execution job failed'
      );

      // Re-throw error so BullMQ can handle retries
      throw error;
    }
  }

  /**
   * Setup event listeners for monitoring
   */
  private static setupEventListeners(): void {
    // Worker events
    this.worker.on('completed', (job) => {
      logger.info(
        { 
          jobId: job.id, 
          duration: Date.now() - job.timestamp 
        }, 
        'Job completed'
      );
    });

    this.worker.on('failed', (job, err) => {
      logger.error(
        { 
          jobId: job?.id, 
          error: err.message,
          attempts: job?.attemptsMade,
          maxAttempts: config.MAX_RETRIES
        }, 
        'Job failed'
      );
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn({ jobId }, 'Job stalled');
    });

    this.worker.on('error', (err) => {
      logger.error({ error: err }, 'Worker error');
    });

    // Queue events
    this.queue.on('error', (err) => {
      logger.error({ error: err }, 'Queue error');
    });

    // Redis connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });

    this.redis.on('error', (err) => {
      logger.error({ error: err }, 'Redis error');
    });

    this.redis.on('disconnect', () => {
      logger.warn('Redis disconnected');
    });
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  /**
   * Get specific job status
   */
  static async getJobStatus(jobId: string): Promise<Job<WorkflowExecutionJob> | undefined> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    return await this.queue.getJob(jobId);
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info({ jobId }, 'Job cancelled and removed from queue');
    }
  }

  /**
   * Pause queue processing
   */
  static async pauseQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.pause();
    logger.info('Queue paused');
  }

  /**
   * Resume queue processing
   */
  static async resumeQueue(): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.resume();
    logger.info('Queue resumed');
  }

  /**
   * Clean up old jobs
   */
  static async cleanQueue(olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    await this.queue.clean(olderThan, 100, 'completed');
    await this.queue.clean(olderThan, 50, 'failed');
    
    logger.info({ olderThan }, 'Queue cleaned');
  }

  /**
   * Disconnect and cleanup
   */
  static async disconnect(): Promise<void> {
    logger.info('Disconnecting WorkflowQueue...');

    if (this.worker) {
      await this.worker.close();
    }

    if (this.queue) {
      await this.queue.close();
    }

    if (this.executionEngine) {
      await this.executionEngine.disconnect();
    }

    if (this.redis) {
      this.redis.disconnect();
    }

    logger.info('WorkflowQueue disconnected');
  }
}