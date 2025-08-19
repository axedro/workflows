import { z } from 'zod';

export const TimerConfigSchema = z.object({
  type: z.enum(['cron', 'delay', 'interval']).default('cron'),
  cron: z.object({
    expression: z.string().min(1, 'Cron expression is required'),
    timezone: z.string().default('UTC'),
  }).optional(),
  delay: z.object({
    milliseconds: z.number().min(1000).max(86400000), // 1 second to 24 hours
  }).optional(),
  interval: z.object({
    milliseconds: z.number().min(1000).max(86400000), // 1 second to 24 hours
    maxExecutions: z.number().min(1).optional(),
  }).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  enabled: z.boolean().default(true),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(1000).max(60000).default(5000),
  timezone: z.string().default('UTC'),
});

export type TimerConfig = z.infer<typeof TimerConfigSchema>;

export const TimerConfigDefaults: TimerConfig = {
  type: 'cron',
  cron: {
    expression: '0 * * * *', // Every hour
    timezone: 'UTC',
  },
  enabled: true,
  maxRetries: 3,
  retryDelay: 5000,
  timezone: 'UTC',
};

export const TimerConfigDescription = {
  type: 'Timer type: cron (scheduled), delay (one-time), or interval (repeating)',
  cron: {
    expression: 'Cron expression (e.g., "0 * * * *" for every hour)',
    timezone: 'Timezone for the cron expression',
  },
  delay: {
    milliseconds: 'Delay in milliseconds before execution',
  },
  interval: {
    milliseconds: 'Interval in milliseconds between executions',
    maxExecutions: 'Maximum number of executions (optional)',
  },
  startDate: 'Start date for the timer (optional)',
  endDate: 'End date for the timer (optional)',
  enabled: 'Whether the timer is enabled',
  maxRetries: 'Maximum number of retry attempts',
  retryDelay: 'Delay between retries in milliseconds',
  timezone: 'Default timezone for date/time operations',
};
