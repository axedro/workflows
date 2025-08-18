import { Job } from 'bullmq';
import { WorkflowExecutionJob } from '../types/execution.js';
import { ExecutionEngine } from '../services/ExecutionEngine.js';
import { logger } from '../utils/logger.js';

export class WorkflowWorker {
  private executionEngine: ExecutionEngine;
  private isHealthy: boolean = true;
  private activeJobs: Set<string> = new Set();
  private maxConcurrentJobs: number = 5;

  constructor() {
    this.executionEngine = new ExecutionEngine();
  }

  /**
   * Process a workflow execution job with enhanced error handling
   */
  async processWorkflowJob(job: Job<WorkflowExecutionJob>): Promise<void> {
    const { workflowId, executionId, userId, input } = job.data;
    const startTime = Date.now();
    const jobId = job.id as string;

    // Track active job
    this.activeJobs.add(jobId);

    logger.info(
      { 
        jobId,
        workflowId, 
        executionId, 
        userId,
        attempt: job.attemptsMade + 1,
        activeJobs: this.activeJobs.size
      }, 
      'Starting workflow job processing'
    );

    try {
      // Check worker health
      if (!this.isHealthy) {
        throw new Error('Worker is not healthy');
      }

      // Update job progress
      await job.updateProgress(10);

      // Execute the workflow using the execution engine
      await this.executionEngine.executeWorkflowByExecutionId(executionId, workflowId, userId, input);

      // Update job progress to complete
      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      logger.info(
        { 
          jobId,
          workflowId, 
          executionId, 
          duration 
        }, 
        'Workflow job processing completed successfully'
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(
        { 
          error,
          jobId,
          workflowId, 
          executionId, 
          duration,
          attempt: job.attemptsMade + 1
        }, 
        'Workflow job processing failed'
      );

      // Determine if this error should trigger a retry
      const shouldRetry = this.shouldRetryJob(error, job.attemptsMade);
      
      if (shouldRetry) {
        logger.info(
          { 
            jobId,
            workflowId, 
            executionId,
            attempt: job.attemptsMade + 1
          }, 
          'Job will be retried'
        );
      } else {
        logger.error(
          { 
            jobId,
            workflowId, 
            executionId,
            attempt: job.attemptsMade + 1
          }, 
          'Job failed permanently, no more retries'
        );
      }

      // Re-throw the error so BullMQ can handle it appropriately
      throw error;
    } finally {
      // Clean up active job tracking
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Determine if a job should be retried based on error type and attempt count
   */
  private shouldRetryJob(error: any, attemptsMade: number): boolean {
    const maxRetries = 3;
    
    // Don't retry if we've exceeded max attempts
    if (attemptsMade >= maxRetries) {
      return false;
    }

    // Don't retry certain types of errors
    const nonRetryableErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
      'Workflow not found',
      'Invalid workflow definition'
    ];

    const errorMessage = error.message || error.toString();
    for (const nonRetryableError of nonRetryableErrors) {
      if (errorMessage.includes(nonRetryableError)) {
        return false;
      }
    }

    // Retry network errors, timeouts, and temporary failures
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'timeout',
      'network error',
      'temporary failure'
    ];

    for (const retryableError of retryableErrors) {
      if (errorMessage.toLowerCase().includes(retryableError.toLowerCase())) {
        return true;
      }
    }

    // Default to retry for unknown errors (up to max attempts)
    return true;
  }

  /**
   * Calculate delay for retry with exponential backoff
   */
  calculateRetryDelay(attemptsMade: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, attemptsMade);
    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Handle job failure with enhanced logic
   */
  async handleJobFailure(
    job: Job<WorkflowExecutionJob>, 
    error: Error
  ): Promise<void> {
    const { workflowId, executionId } = job.data;
    const jobId = job.id as string;

    logger.error(
      { 
        jobId,
        workflowId, 
        executionId, 
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts || 3
      }, 
      'Processing job failure'
    );

    // If this was the final attempt, mark execution as failed
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      try {
        // Ensure execution is marked as failed in the database
        await this.executionEngine.markExecutionAsFailed(executionId, error.message);
        
        logger.warn(
          { jobId, workflowId, executionId }, 
          'Final attempt failed, execution marked as failed'
        );
      } catch (cleanupError) {
        logger.error(
          { cleanupError, jobId, workflowId, executionId }, 
          'Error during job failure cleanup'
        );
      }
    }
  }

  /**
   * Handle job completion
   */
  async handleJobCompletion(job: Job<WorkflowExecutionJob>): Promise<void> {
    const { workflowId, executionId } = job.data;
    const jobId = job.id as string;

    logger.info(
      { 
        jobId,
        workflowId, 
        executionId 
      }, 
      'Job completed successfully'
    );

    // Any additional cleanup or notification logic can go here
  }

  /**
   * Handle job stalling
   */
  async handleJobStalled(jobId: string): Promise<void> {
    logger.warn(
      { jobId }, 
      'Job stalled - may need manual intervention'
    );

    // Remove from active jobs if it was tracked
    this.activeJobs.delete(jobId);

    // Could implement automatic recovery logic here
    // For now, just log the incident
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    activeJobs: number;
    maxConcurrentJobs: number;
    uptime: number;
  }> {
    return {
      healthy: this.isHealthy,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      uptime: process.uptime()
    };
  }

  /**
   * Set worker health status
   */
  setHealthStatus(healthy: boolean): void {
    this.isHealthy = healthy;
    logger.info(
      { healthy, activeJobs: this.activeJobs.size }, 
      'Worker health status updated'
    );
  }

  /**
   * Get worker statistics
   */
  getStats(): {
    activeJobs: number;
    maxConcurrentJobs: number;
    isHealthy: boolean;
    uptime: number;
  } {
    return {
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      isHealthy: this.isHealthy,
      uptime: process.uptime()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info(
      { activeJobs: this.activeJobs.size }, 
      'Worker shutdown initiated'
    );

    // Set unhealthy to prevent new jobs
    this.isHealthy = false;

    // Wait for active jobs to complete (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      logger.info(
        { activeJobs: this.activeJobs.size }, 
        'Waiting for active jobs to complete'
      );
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      logger.warn(
        { activeJobs: this.activeJobs.size }, 
        'Some jobs did not complete before shutdown timeout'
      );
    }

    // Cleanup resources
    await this.cleanup();
    
    logger.info('Worker shutdown completed');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.executionEngine.disconnect();
      logger.info('Worker cleanup completed');
    } catch (error) {
      logger.error({ error }, 'Error during worker cleanup');
    }
  }
}