import { z } from 'zod';

export const WebhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('POST'),
  headers: z.record(z.string()).optional(),
  timeout: z.number().min(1000).max(30000).default(10000),
  retries: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(1000).max(30000).default(5000),
  signature: z.object({
    enabled: z.boolean().default(false),
    algorithm: z.enum(['sha256', 'sha1', 'md5']).default('sha256'),
    secret: z.string().optional(),
    header: z.string().default('X-Webhook-Signature'),
  }).optional(),
  rateLimit: z.object({
    maxPerMinute: z.number().min(1).default(60),
    maxPerHour: z.number().min(1).default(1000),
  }).optional(),
  payload: z.object({
    template: z.string().optional(),
    variables: z.record(z.any()).optional(),
  }).optional(),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

export const WebhookConfigDefaults: WebhookConfig = {
  url: '',
  method: 'POST',
  timeout: 10000,
  retries: 3,
  retryDelay: 5000,
  signature: {
    enabled: false,
    algorithm: 'sha256',
    header: 'X-Webhook-Signature',
  },
  rateLimit: {
    maxPerMinute: 60,
    maxPerHour: 1000,
  },
};

export const WebhookConfigDescription = {
  url: 'Webhook endpoint URL',
  method: 'HTTP method for the webhook request',
  headers: 'Custom headers to include in the request',
  timeout: 'Request timeout in milliseconds',
  retries: 'Number of retry attempts on failure',
  retryDelay: 'Delay between retries in milliseconds',
  signature: {
    enabled: 'Enable webhook signature verification',
    algorithm: 'Hashing algorithm for signature',
    secret: 'Secret key for signature generation',
    header: 'Header name for the signature',
  },
  rateLimit: 'Rate limiting settings',
  payload: 'Payload template and variables',
};
