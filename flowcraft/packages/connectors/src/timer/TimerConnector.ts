import { BaseConnector } from '../base';
import { ConnectorConfig, ConnectorResult } from '@flowcraft/shared-types';

export interface TimerConfig {
  type: 'delay' | 'schedule' | 'interval';
  delay?: number; // milliseconds
  schedule?: string; // cron expression
  interval?: number; // milliseconds
  timezone?: string; // IANA timezone
  maxExecutions?: number; // for interval type
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface TimerInput {
  customDelay?: number;
  customSchedule?: string;
  data?: any;
}

export class TimerConnector extends BaseConnector {
  private timeoutId: NodeJS.Timeout | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private executionCount = 0;

  async execute(config: TimerConfig, input?: TimerInput): Promise<ConnectorResult> {
    try {
      const startTime = new Date();
      
      switch (config.type) {
        case 'delay':
          return await this.handleDelay(config, input, startTime);
        case 'schedule':
          return await this.handleSchedule(config, input, startTime);
        case 'interval':
          return await this.handleInterval(config, input, startTime);
        default:
          throw new Error(`Unsupported timer type: ${config.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Timer execution failed',
      };
    }
  }

  private async handleDelay(config: TimerConfig, input?: TimerInput, startTime?: Date): Promise<ConnectorResult> {
    const delay = input?.customDelay || config.delay || 1000;
    
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(() => {
        const endTime = new Date();
        resolve({
          success: true,
          data: {
            startTime: startTime?.toISOString(),
            endTime: endTime.toISOString(),
            duration: endTime.getTime() - (startTime?.getTime() || 0),
            delay,
            type: 'delay',
          },
          message: 'Timer delay completed',
        });
      }, delay);
    });
  }

  private async handleSchedule(config: TimerConfig, input?: TimerInput, startTime?: Date): Promise<ConnectorResult> {
    const schedule = input?.customSchedule || config.schedule;
    if (!schedule) {
      throw new Error('Schedule expression is required for schedule type');
    }

    // For now, we'll simulate a schedule execution
    // In a real implementation, this would integrate with a cron scheduler
    const endTime = new Date();
    
    return {
      success: true,
      data: {
        startTime: startTime?.toISOString(),
        endTime: endTime.toISOString(),
        schedule,
        timezone: config.timezone || 'UTC',
        type: 'schedule',
        nextExecution: this.calculateNextExecution(schedule, config.timezone),
      },
      message: 'Timer schedule executed',
    };
  }

  private async handleInterval(config: TimerConfig, input?: TimerInput, startTime?: Date): Promise<ConnectorResult> {
    const interval = config.interval || 1000;
    const maxExecutions = config.maxExecutions || 1;
    
    return new Promise((resolve) => {
      this.intervalId = setInterval(() => {
        this.executionCount++;
        const currentTime = new Date();
        
        if (this.executionCount >= maxExecutions) {
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }
          
          resolve({
            success: true,
            data: {
              startTime: startTime?.toISOString(),
              endTime: currentTime.toISOString(),
              interval,
              executionCount: this.executionCount,
              maxExecutions,
              type: 'interval',
            },
            message: 'Timer interval completed',
          });
        }
      }, interval);
    });
  }

  private calculateNextExecution(schedule: string, timezone?: string): string {
    // Simplified next execution calculation
    // In a real implementation, this would use a cron parser
    const now = new Date();
    const next = new Date(now.getTime() + 60000); // Add 1 minute as placeholder
    return next.toISOString();
  }

  async test(config: TimerConfig): Promise<ConnectorResult> {
    try {
      // Test with a short delay
      const testConfig: TimerConfig = {
        ...config,
        type: 'delay',
        delay: 100, // 100ms for testing
      };

      return await this.execute(testConfig);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Timer connector test failed',
      };
    }
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.executionCount = 0;
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          title: 'Timer Type',
          description: 'Type of timer operation',
          enum: ['delay', 'schedule', 'interval'],
          default: 'delay',
        },
        delay: {
          type: 'number',
          title: 'Delay (ms)',
          description: 'Delay duration in milliseconds',
          minimum: 100,
          maximum: 86400000, // 24 hours
          examples: [1000, 5000, 30000],
        },
        schedule: {
          type: 'string',
          title: 'Cron Schedule',
          description: 'Cron expression for scheduled execution',
          pattern: '^[\\*\\d,\\/\\-\\?\\s]+$',
          examples: ['0 0 * * *', '0 */6 * * *', '0 9 * * 1-5'],
        },
        interval: {
          type: 'number',
          title: 'Interval (ms)',
          description: 'Interval between executions in milliseconds',
          minimum: 1000,
          maximum: 86400000, // 24 hours
          examples: [5000, 30000, 300000],
        },
        timezone: {
          type: 'string',
          title: 'Timezone',
          description: 'IANA timezone for schedule execution',
          default: 'UTC',
          examples: ['UTC', 'America/New_York', 'Europe/London'],
        },
        maxExecutions: {
          type: 'number',
          title: 'Max Executions',
          description: 'Maximum number of executions for interval type',
          minimum: 1,
          maximum: 1000,
          default: 1,
        },
        startDate: {
          type: 'string',
          title: 'Start Date',
          description: 'Start date for timer (ISO string)',
          format: 'date-time',
        },
        endDate: {
          type: 'string',
          title: 'End Date',
          description: 'End date for timer (ISO string)',
          format: 'date-time',
        },
      },
      required: ['type'],
    };
  }

  getInputSchema(): any {
    return {
      type: 'object',
      properties: {
        customDelay: {
          type: 'number',
          title: 'Custom Delay',
          description: 'Override delay duration (ms)',
          minimum: 100,
        },
        customSchedule: {
          type: 'string',
          title: 'Custom Schedule',
          description: 'Override cron schedule expression',
        },
        data: {
          type: 'object',
          title: 'Additional Data',
          description: 'Additional data to pass through timer',
          additionalProperties: true,
        },
      },
    };
  }

  getOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          title: 'Start Time',
          description: 'Timer start time (ISO string)',
          format: 'date-time',
        },
        endTime: {
          type: 'string',
          title: 'End Time',
          description: 'Timer end time (ISO string)',
          format: 'date-time',
        },
        duration: {
          type: 'number',
          title: 'Duration',
          description: 'Execution duration in milliseconds',
        },
        delay: {
          type: 'number',
          title: 'Delay',
          description: 'Actual delay used (ms)',
        },
        schedule: {
          type: 'string',
          title: 'Schedule',
          description: 'Cron schedule expression used',
        },
        interval: {
          type: 'number',
          title: 'Interval',
          description: 'Interval duration used (ms)',
        },
        executionCount: {
          type: 'number',
          title: 'Execution Count',
          description: 'Number of executions completed',
        },
        maxExecutions: {
          type: 'number',
          title: 'Max Executions',
          description: 'Maximum executions configured',
        },
        timezone: {
          type: 'string',
          title: 'Timezone',
          description: 'Timezone used for execution',
        },
        nextExecution: {
          type: 'string',
          title: 'Next Execution',
          description: 'Next scheduled execution time',
          format: 'date-time',
        },
        type: {
          type: 'string',
          title: 'Timer Type',
          description: 'Type of timer that was executed',
        },
      },
    };
  }
}
