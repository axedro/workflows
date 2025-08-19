import { BaseConnector } from '../base';
import { ConnectorConfig, ConnectorResult } from '@flowcraft/shared-types';
import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export class EmailConnector extends BaseConnector {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    super();
  }

  async initialize(config: EmailConfig): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    // Verify connection configuration
    await this.transporter.verify();
  }

  async execute(config: EmailConfig, input?: any): Promise<ConnectorResult> {
    try {
      if (!this.transporter) {
        await this.initialize(config);
      }

      const mailOptions = {
        from: config.from,
        to: config.to.join(', '),
        subject: config.subject,
        text: config.text,
        html: config.html,
        attachments: config.attachments,
      };

      const result = await this.transporter!.sendMail(mailOptions);

      return {
        success: true,
        data: {
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
        },
        message: 'Email sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to send email',
      };
    }
  }

  async test(config: EmailConfig): Promise<ConnectorResult> {
    try {
      await this.initialize(config);
      
      // Send a test email
      const testMailOptions = {
        from: config.from,
        to: config.to[0], // Send to first recipient for testing
        subject: 'FlowCraft - Test Email',
        text: 'This is a test email from FlowCraft connector.',
        html: '<p>This is a test email from <strong>FlowCraft</strong> connector.</p>',
      };

      const result = await this.transporter!.sendMail(testMailOptions);

      return {
        success: true,
        data: {
          messageId: result.messageId,
          response: result.response,
        },
        message: 'Email connector test passed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Email connector test failed',
      };
    }
  }

  getConfigSchema(): any {
    return {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          title: 'SMTP Host',
          description: 'SMTP server hostname',
          examples: ['smtp.gmail.com', 'smtp.office365.com'],
        },
        port: {
          type: 'number',
          title: 'SMTP Port',
          description: 'SMTP server port',
          default: 587,
          examples: [587, 465, 25],
        },
        secure: {
          type: 'boolean',
          title: 'Use SSL/TLS',
          description: 'Use secure connection (SSL/TLS)',
          default: false,
        },
        auth: {
          type: 'object',
          title: 'Authentication',
          properties: {
            user: {
              type: 'string',
              title: 'Username/Email',
              description: 'SMTP username or email address',
            },
            pass: {
              type: 'string',
              title: 'Password',
              description: 'SMTP password or app password',
              format: 'password',
            },
          },
          required: ['user', 'pass'],
        },
        from: {
          type: 'string',
          title: 'From Email',
          description: 'Sender email address',
          format: 'email',
        },
        to: {
          type: 'array',
          title: 'To Emails',
          description: 'Recipient email addresses',
          items: {
            type: 'string',
            format: 'email',
          },
          minItems: 1,
        },
        subject: {
          type: 'string',
          title: 'Subject',
          description: 'Email subject line',
        },
        text: {
          type: 'string',
          title: 'Plain Text Content',
          description: 'Plain text version of the email',
        },
        html: {
          type: 'string',
          title: 'HTML Content',
          description: 'HTML version of the email',
        },
        attachments: {
          type: 'array',
          title: 'Attachments',
          description: 'Email attachments',
          items: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                title: 'Filename',
              },
              content: {
                type: 'string',
                title: 'File Content',
              },
              contentType: {
                type: 'string',
                title: 'Content Type',
                examples: ['text/plain', 'application/pdf', 'image/png'],
              },
            },
            required: ['filename', 'content'],
          },
        },
      },
      required: ['host', 'port', 'auth', 'from', 'to', 'subject'],
    };
  }

  getInputSchema(): any {
    return {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          title: 'Subject',
          description: 'Email subject (overrides config)',
        },
        text: {
          type: 'string',
          title: 'Plain Text Content',
          description: 'Plain text version (overrides config)',
        },
        html: {
          type: 'string',
          title: 'HTML Content',
          description: 'HTML version (overrides config)',
        },
        to: {
          type: 'array',
          title: 'To Emails',
          description: 'Recipient emails (overrides config)',
          items: {
            type: 'string',
            format: 'email',
          },
        },
        attachments: {
          type: 'array',
          title: 'Attachments',
          description: 'Additional attachments',
          items: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                title: 'Filename',
              },
              content: {
                type: 'string',
                title: 'File Content',
              },
              contentType: {
                type: 'string',
                title: 'Content Type',
              },
            },
            required: ['filename', 'content'],
          },
        },
      },
    };
  }

  getOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        messageId: {
          type: 'string',
          title: 'Message ID',
          description: 'Unique message identifier',
        },
        response: {
          type: 'string',
          title: 'Server Response',
          description: 'SMTP server response',
        },
        accepted: {
          type: 'array',
          title: 'Accepted Recipients',
          description: 'Successfully accepted recipients',
          items: {
            type: 'string',
          },
        },
        rejected: {
          type: 'array',
          title: 'Rejected Recipients',
          description: 'Rejected recipients',
          items: {
            type: 'string',
          },
        },
      },
    };
  }
}
