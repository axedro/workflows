import { Job } from 'bullmq';
import { WorkflowExecutionJob } from '../types/execution.js';
import { ExecutionEngine } from '../services/ExecutionEngine.js';
import { logger } from '../utils/logger.js';

export class WorkflowWorker {
  private executionEngine: ExecutionEngine;

  constructor() {
    this.executionEngine = new ExecutionEngine();
  }

  /**
   * Process a workflow execution job
   */
  async processWorkflowJob(job: Job<WorkflowExecutionJob>): Promise<void> {
    const { workflowId, executionId, userId, input } = job.data;
    const startTime = Date.now();

    logger.info(
      { 
        jobId: job.id,
        workflowId, 
        executionId, 
        userId,
        attempt: job.attemptsMade + 1
      }, 
      'Starting workflow job processing'
    );

    try {
      // Update job progress
      await job.updateProgress(10);

      // Execute the workflow
      await this.executionEngine.executeWorkflow(workflowId, userId, input);

      // Update job progress to complete
      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      logger.info(
        { 
          jobId: job.id,
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
          jobId: job.id,
          workflowId, 
          executionId, 
          duration,
          attempt: job.attemptsMade + 1
        }, 
        'Workflow job processing failed'
      );

      // Re-throw the error so BullMQ can handle it appropriately
      throw error;
    }
  }

  /**
   * Handle job failure with custom logic
   */
  async handleJobFailure(
    job: Job<WorkflowExecutionJob>, 
    error: Error
  ): Promise<void> {
    const { workflowId, executionId } = job.data;

    logger.error(
      { 
        jobId: job.id,
        workflowId, 
        executionId, 
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts || 1
      }, 
      'Processing job failure'
    );

    // If this was the final attempt, mark execution as failed
    if (job.attemptsMade >= (job.opts.attempts || 1)) {
      try {
        // This should be handled by ExecutionEngine, but as a safety net
        logger.warn(
          { workflowId, executionId }, 
          'Final attempt failed, ensuring execution is marked as failed'
        );
      } catch (cleanupError) {
        logger.error(
          { cleanupError, workflowId, executionId }, 
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

    logger.info(
      { 
        jobId: job.id,
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

    // Could implement automatic recovery logic here
    // For now, just log the incident
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.executionEngine.disconnect();
  }
}