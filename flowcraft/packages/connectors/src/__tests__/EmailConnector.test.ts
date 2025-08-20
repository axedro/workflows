import { EmailConnector, EmailConfig } from '../email/EmailConnector';
import { ConnectorResult } from '@flowcraft/shared-types';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailConnector', () => {
  let emailConnector: EmailConnector;
  let mockTransporter: any;

  const validEmailConfig: EmailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'password123'
    },
    from: 'sender@example.com',
    to: ['recipient@example.com'],
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<p>This is a test email</p>'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransporter = {
      verify: jest.fn(),
      sendMail: jest.fn()
    };
    
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter);
    
    emailConnector = new EmailConnector();
  });

  describe('initialize', () => {
    it('should create transporter with correct config', async () => {
      mockTransporter.verify.mockResolvedValue(true);
      
      await emailConnector.initialize(validEmailConfig);
      
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123'
        }
      });
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle invalid SMTP configuration', async () => {
      const invalidConfig = { ...validEmailConfig, host: 'invalid.smtp.server' };
      mockTransporter.verify.mockRejectedValue(new Error('Invalid login'));
      
      await expect(emailConnector.initialize(invalidConfig)).rejects.toThrow('Invalid login');
      expect(mockedNodemailer.createTransport).toHaveBeenCalled();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle network connectivity issues', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('ENOTFOUND smtp.gmail.com'));
      
      await expect(emailConnector.initialize(validEmailConfig)).rejects.toThrow('ENOTFOUND smtp.gmail.com');
    });
  });

  describe('execute', () => {
    beforeEach(() => {
      mockTransporter.verify.mockResolvedValue(true);
    });

    it('should send email successfully', async () => {
      const mockResult = {
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp',
        accepted: ['recipient@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResult);
      
      const result: ConnectorResult = await emailConnector.execute(validEmailConfig);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp',
        accepted: ['recipient@example.com'],
        rejected: []
      });
      expect(result.message).toBe('Email sent successfully');
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
        attachments: undefined
      });
    });

    it('should send email to multiple recipients', async () => {
      const configWithMultipleRecipients: EmailConfig = {
        ...validEmailConfig,
        to: ['recipient1@example.com', 'recipient2@example.com', 'recipient3@example.com']
      };
      
      const mockResult = {
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp',
        accepted: ['recipient1@example.com', 'recipient2@example.com', 'recipient3@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResult);
      
      const result: ConnectorResult = await emailConnector.execute(configWithMultipleRecipients);
      
      expect(result.success).toBe(true);
      expect(result.data?.accepted).toHaveLength(3);
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'recipient1@example.com, recipient2@example.com, recipient3@example.com'
      }));
    });

    it('should send email with attachments', async () => {
      const configWithAttachments: EmailConfig = {
        ...validEmailConfig,
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test file content',
            contentType: 'text/plain'
          },
          {
            filename: 'test.pdf',
            content: Buffer.from('PDF content'),
            contentType: 'application/pdf'
          }
        ]
      };
      
      const mockResult = {
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp',
        accepted: ['recipient@example.com'],
        rejected: []
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResult);
      
      const result: ConnectorResult = await emailConnector.execute(configWithAttachments);
      
      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        attachments: [
          {
            filename: 'test.txt',
            content: 'Test file content',
            contentType: 'text/plain'
          },
          {
            filename: 'test.pdf',
            content: Buffer.from('PDF content'),
            contentType: 'application/pdf'
          }
        ]
      }));
    });

    it('should handle authentication failures', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Invalid login: 535-5.7.8 Username and Password not accepted'));
      
      const result: ConnectorResult = await emailConnector.execute(validEmailConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login: 535-5.7.8 Username and Password not accepted');
      expect(result.message).toBe('Failed to send email');
    });

    it('should handle recipient rejection', async () => {
      const mockResult = {
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp',
        accepted: [],
        rejected: ['invalid@example.com']
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResult);
      
      const result: ConnectorResult = await emailConnector.execute(validEmailConfig);
      
      expect(result.success).toBe(true);
      expect(result.data?.rejected).toEqual(['invalid@example.com']);
      expect(result.data?.accepted).toEqual([]);
    });

    it('should handle SMTP server errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error: 421 4.7.0 Try again later'));
      
      const result: ConnectorResult = await emailConnector.execute(validEmailConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP Error: 421 4.7.0 Try again later');
      expect(result.message).toBe('Failed to send email');
    });

    it('should initialize transporter if not already initialized', async () => {
      mockTransporter.sendMail.mockResolvedValue({
        messageId: '<test@example.com>',
        response: '250 OK',
        accepted: ['recipient@example.com'],
        rejected: []
      });
      
      // Create new connector instance to ensure transporter is null
      const newConnector = new EmailConnector();
      const result = await newConnector.execute(validEmailConfig);
      
      expect(result.success).toBe(true);
      expect(mockedNodemailer.createTransport).toHaveBeenCalled();
      expect(mockTransporter.verify).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('test', () => {
    beforeEach(() => {
      mockTransporter.verify.mockResolvedValue(true);
    });

    it('should send test email successfully', async () => {
      const mockResult = {
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp'
      };
      
      mockTransporter.sendMail.mockResolvedValue(mockResult);
      
      const result: ConnectorResult = await emailConnector.test(validEmailConfig);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        messageId: '<test-message-id@example.com>',
        response: '250 2.0.0 OK  1234567890 - gsmtp'
      });
      expect(result.message).toBe('Email connector test passed');
      
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient@example.com', // Only first recipient for test
        subject: 'FlowCraft - Test Email',
        text: 'This is a test email from FlowCraft connector.',
        html: '<p>This is a test email from <strong>FlowCraft</strong> connector.</p>'
      });
    });

    it('should handle test email failures', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'));
      
      const result: ConnectorResult = await emailConnector.test(validEmailConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SMTP connection failed');
      expect(result.message).toBe('Email connector test failed');
    });

    it('should handle initialization failures during test', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection timeout'));
      
      const result: ConnectorResult = await emailConnector.test(validEmailConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection timeout');
      expect(result.message).toBe('Email connector test failed');
    });

    it('should use only first recipient for test email', async () => {
      const configWithMultipleRecipients: EmailConfig = {
        ...validEmailConfig,
        to: ['recipient1@example.com', 'recipient2@example.com', 'recipient3@example.com']
      };
      
      mockTransporter.sendMail.mockResolvedValue({
        messageId: '<test@example.com>',
        response: '250 OK'
      });
      
      const result: ConnectorResult = await emailConnector.test(configWithMultipleRecipients);
      
      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'recipient1@example.com' // Only first recipient
      }));
    });
  });

  describe('getConfigSchema', () => {
    it('should return valid JSON schema for configuration', () => {
      const schema = emailConnector.getConfigSchema();
      
      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('host');
      expect(schema.properties).toHaveProperty('port');
      expect(schema.properties).toHaveProperty('secure');
      expect(schema.properties).toHaveProperty('auth');
      expect(schema.properties).toHaveProperty('from');
      expect(schema.properties).toHaveProperty('to');
      expect(schema.properties).toHaveProperty('subject');
      expect(schema.required).toEqual(['host', 'port', 'auth', 'from', 'to', 'subject']);
    });

    it('should include authentication schema', () => {
      const schema = emailConnector.getConfigSchema();
      
      expect(schema.properties.auth).toHaveProperty('type', 'object');
      expect(schema.properties.auth.properties).toHaveProperty('user');
      expect(schema.properties.auth.properties).toHaveProperty('pass');
      expect(schema.properties.auth.required).toEqual(['user', 'pass']);
    });

    it('should include attachment schema', () => {
      const schema = emailConnector.getConfigSchema();
      
      expect(schema.properties.attachments).toHaveProperty('type', 'array');
      expect(schema.properties.attachments.items.properties).toHaveProperty('filename');
      expect(schema.properties.attachments.items.properties).toHaveProperty('content');
      expect(schema.properties.attachments.items.properties).toHaveProperty('contentType');
    });
  });

  describe('getInputSchema', () => {
    it('should return valid JSON schema for input data', () => {
      const schema = emailConnector.getInputSchema();
      
      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('subject');
      expect(schema.properties).toHaveProperty('text');
      expect(schema.properties).toHaveProperty('html');
      expect(schema.properties).toHaveProperty('to');
      expect(schema.properties).toHaveProperty('attachments');
    });
  });

  describe('getOutputSchema', () => {
    it('should return valid JSON schema for output data', () => {
      const schema = emailConnector.getOutputSchema();
      
      expect(schema).toHaveProperty('type', 'object');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('messageId');
      expect(schema.properties).toHaveProperty('response');
      expect(schema.properties).toHaveProperty('accepted');
      expect(schema.properties).toHaveProperty('rejected');
    });
  });
});