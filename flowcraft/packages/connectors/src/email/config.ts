import { z } from 'zod';

export const EmailConfigSchema = z.object({
  smtp: z.object({
    host: z.string().min(1, 'SMTP host is required'),
    port: z.number().min(1).max(65535).default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().email('Invalid email address'),
      pass: z.string().min(1, 'Password is required'),
    }),
  }),
  from: z.string().email('Invalid from email address'),
  replyTo: z.string().email('Invalid reply-to email address').optional(),
  templates: z.array(z.object({
    name: z.string(),
    subject: z.string(),
    body: z.string(),
    variables: z.array(z.string()).optional(),
  })).optional(),
  rateLimit: z.object({
    maxPerHour: z.number().min(1).default(100),
    maxPerMinute: z.number().min(1).default(10),
  }).optional(),
});

export type EmailConfig = z.infer<typeof EmailConfigSchema>;

export const EmailConfigDefaults: EmailConfig = {
  smtp: {
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: '',
    },
  },
  from: '',
  rateLimit: {
    maxPerHour: 100,
    maxPerMinute: 10,
  },
};

export const EmailConfigDescription = {
  smtp: {
    host: 'SMTP server hostname (e.g., smtp.gmail.com)',
    port: 'SMTP server port (587 for TLS, 465 for SSL)',
    secure: 'Use SSL/TLS connection',
    auth: {
      user: 'SMTP username (usually your email)',
      pass: 'SMTP password or app password',
    },
  },
  from: 'Default sender email address',
  replyTo: 'Default reply-to email address (optional)',
  templates: 'Email templates for common use cases',
  rateLimit: 'Rate limiting settings to avoid spam filters',
};
