import { prisma } from '@flowcraft/database';
import type { Connector, ConnectorCredential, ConnectorTemplate, ConnectorLog } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

// Use shared Prisma client from @flowcraft/database to avoid multiple instances

// Validation schemas
const CreateConnectorSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['http', 'email', 'webhook', 'timer', 'data-transform']),
  description: z.string().optional(),
  configuration: z.record(z.any()),
  organizationId: z.string().optional(),
});

const UpdateConnectorSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

const CreateCredentialSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['oauth2', 'api_key', 'username_password', 'custom']),
  data: z.record(z.any()),
  expiresAt: z.date().optional(),
});

export interface ConnectorWithRelations extends Connector {
  credentials: ConnectorCredential[];
  logs: ConnectorLog[];
  _count: {
    configs: number;
  };
}

export interface ConnectorTemplateWithRelations extends ConnectorTemplate {
  _count: {
    // Add counts if needed
  };
}

export class ConnectorManagementService {
  /**
   * Create a new connector
   */
  async createConnector(
    data: z.infer<typeof CreateConnectorSchema>,
    userId: string
  ): Promise<Connector> {
    const validatedData = CreateConnectorSchema.parse(data);

    // Check if connector name already exists for the organization
    const existingConnector = await prisma.connector.findFirst({
      where: {
        name: validatedData.name,
        organizationId: validatedData.organizationId || null,
      },
    });

    if (existingConnector) {
      throw new Error(`Connector with name "${validatedData.name}" already exists`);
    }

    return await prisma.connector.create({
      data: {
        ...validatedData,
        createdBy: userId,
        version: 1,
      },
    });
  }

  /**
   * Get all connectors for a user/organization
   */
  async getConnectors(
    userId: string,
    organizationId?: string,
    filters?: {
      type?: string;
      isActive?: boolean;
      search?: string;
    }
  ): Promise<ConnectorWithRelations[]> {
    const where: any = {
      OR: [
        { createdBy: userId },
        { organizationId: organizationId || null },
      ],
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.connector.findMany({
      where,
      include: {
        credentials: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 logs
        },
        _count: {
          select: { configs: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get a specific connector by ID
   */
  async getConnector(
    connectorId: string,
    userId: string,
    organizationId?: string
  ): Promise<ConnectorWithRelations | null> {
    return await prisma.connector.findFirst({
      where: {
        id: connectorId,
        OR: [
          { createdBy: userId },
          { organizationId: organizationId || null },
        ],
      },
      include: {
        credentials: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 logs
        },
        _count: {
          select: { configs: true },
        },
      },
    });
  }

  /**
   * Update a connector
   */
  async updateConnector(
    connectorId: string,
    data: z.infer<typeof UpdateConnectorSchema>,
    userId: string,
    organizationId?: string
  ): Promise<Connector> {
    const validatedData = UpdateConnectorSchema.parse(data);

    // Check if connector exists and user has access
    const existingConnector = await this.getConnector(connectorId, userId, organizationId);
    if (!existingConnector) {
      throw new Error('Connector not found or access denied');
    }

    // If updating name, check for conflicts
    if (validatedData.name && validatedData.name !== (existingConnector as any).name) {
      const nameConflict = await prisma.connector.findFirst({
        where: {
          name: validatedData.name,
          organizationId: organizationId || null,
          id: { not: connectorId },
        },
      });

      if (nameConflict) {
        throw new Error(`Connector with name "${validatedData.name}" already exists`);
      }
    }

    return await prisma.connector.update({
      where: { id: connectorId },
      data: {
        ...validatedData,
        version: { increment: 1 },
      },
    });
  }

  /**
   * Delete a connector
   */
  async deleteConnector(
    connectorId: string,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    // Check if connector exists and user has access
    const existingConnector = await this.getConnector(connectorId, userId, organizationId);
    if (!existingConnector) {
      throw new Error('Connector not found or access denied');
    }

    await prisma.connector.delete({
      where: { id: connectorId },
    });
  }

  /**
   * Add credentials to a connector
   */
  async addCredentials(
    connectorId: string,
    data: z.infer<typeof CreateCredentialSchema>,
    userId: string,
    organizationId?: string
  ): Promise<ConnectorCredential> {
    const validatedData = CreateCredentialSchema.parse(data);

    // Check if connector exists and user has access
    const existingConnector = await this.getConnector(connectorId, userId, organizationId);
    if (!existingConnector) {
      throw new Error('Connector not found or access denied');
    }

    // Encrypt the credentials
    const encryptedData = this.encryptCredentials(validatedData.data);

    return await prisma.connectorCredential.create({
      data: {
        connectorId,
        name: validatedData.name,
        type: validatedData.type,
        encryptedData,
        expiresAt: validatedData.expiresAt,
      },
    });
  }

  /**
   * Get credentials for a connector
   */
  async getCredentials(
    connectorId: string,
    userId: string,
    organizationId?: string
  ): Promise<ConnectorCredential[]> {
    // Check if connector exists and user has access
    const existingConnector = await this.getConnector(connectorId, userId, organizationId);
    if (!existingConnector) {
      throw new Error('Connector not found or access denied');
    }

    return await prisma.connectorCredential.findMany({
      where: { connectorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete credentials
   */
  async deleteCredentials(
    credentialId: string,
    userId: string,
    organizationId?: string
  ): Promise<void> {
    const credential = await prisma.connectorCredential.findFirst({
      where: { id: credentialId },
      include: {
        connector: true,
      },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Check if user has access to the connector
    const hasAccess = await this.getConnector(
      credential.connectorId,
      userId,
      organizationId
    );

    if (!hasAccess) {
      throw new Error('Access denied');
    }

    await prisma.connectorCredential.delete({
      where: { id: credentialId },
    });
  }

  /**
   * Add a log entry for a connector
   */
  async addLog(
    connectorId: string,
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    message: string,
    metadata?: Record<string, any>
  ): Promise<ConnectorLog> {
    return await prisma.connectorLog.create({
      data: {
        connectorId,
        level,
        message,
        metadata,
      },
    });
  }

  /**
   * Get logs for a connector
   */
  async getLogs(
    connectorId: string,
    userId: string,
    organizationId?: string,
    limit: number = 100
  ): Promise<ConnectorLog[]> {
    // Check if connector exists and user has access
    const existingConnector = await this.getConnector(connectorId, userId, organizationId);
    if (!existingConnector) {
      throw new Error('Connector not found or access denied');
    }

    return await prisma.connectorLog.findMany({
      where: { connectorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Test a connector configuration
   */
  async testConnector(
    connectorId: string,
    userId: string,
    organizationId?: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    const connector = await this.getConnector(connectorId, userId, organizationId);
    if (!connector) {
      throw new Error('Connector not found or access denied');
    }

    try {
      // Add test log
      await this.addLog(connectorId, 'INFO', 'Starting connector test');

      // Import and test the appropriate connector
      const testResult = await this.performConnectorTest(connector);

      // Add result log
      await this.addLog(
        connectorId,
        testResult.success ? 'INFO' : 'ERROR',
        `Connector test ${testResult.success ? 'passed' : 'failed'}: ${testResult.message}`,
        testResult.details
      );

      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.addLog(connectorId, 'ERROR', `Test failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get connector statistics
   */
  async getConnectorStats(
    userId: string,
    organizationId?: string
  ): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
    recentActivity: number;
  }> {
    const where: any = {
      OR: [
        { createdBy: userId },
        { organizationId: organizationId || null },
      ],
    };

    const [total, active, byType, recentActivity] = await Promise.all([
      prisma.connector.count({ where }),
      prisma.connector.count({ where: { ...where, isActive: true } }),
      prisma.connector.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      prisma.connectorLog.count({
        where: {
          connector: where,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      }),
    ]);

    const byTypeMap = byType.reduce((acc: Record<string, number>, item: any) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      byType: byTypeMap,
      recentActivity,
    };
  }

  /**
   * Encrypt credentials using AES-256
   * Note: In production, use a proper encryption service
   */
  private encryptCredentials(data: Record<string, any>): string {
    // This is a simplified encryption for demo purposes
    // In production, use a proper encryption service with key management
    const dataString = JSON.stringify(data);
    const hash = createHash('sha256').update(dataString).digest('hex');
    return hash; // Simplified - should use proper encryption
  }

  /**
   * Perform connector-specific testing
   */
  private async performConnectorTest(connector: Connector): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    switch (connector.type) {
      case 'http':
        return await this.testHttpConnector(connector);
      case 'email':
        return await this.testEmailConnector(connector);
      case 'webhook':
        return await this.testWebhookConnector(connector);
      case 'timer':
        return await this.testTimerConnector(connector);
      case 'data-transform':
        return await this.testDataTransformConnector(connector);
      default:
        throw new Error(`Unsupported connector type: ${connector.type}`);
    }
  }

  private async testHttpConnector(connector: Connector) {
    try {
      const config: any = connector.configuration as any;
      // Support both old format (baseUrl + endpoint) and new format (url)
      const url: string = config.url || `${config.baseUrl || ''}${config.endpoint || ''}`;
      const method: string = (config.method || 'GET').toUpperCase();
      const timeoutMs: number = typeof config.timeout === 'number' ? config.timeout : 30000;
      const headers: Record<string, string> = config.headers || {};
      const followRedirects: boolean = config.followRedirects !== false;
      const validateSSL: boolean = config.validateSSL !== false;

      if (!url) {
        return { success: false, message: 'Falta URL en la configuración', details: { field: 'url' } };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const fetchOptions: any = {
        method,
        headers,
        signal: controller.signal,
        redirect: followRedirects ? 'follow' : 'manual',
      };

      // Optional JSON body for non-GET
      if (config.body && method !== 'GET') {
        if (!headers['Content-Type']) {
          fetchOptions.headers = { ...headers, 'Content-Type': 'application/json' };
        }
        fetchOptions.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
      }

      // Node fetch ignores SSL validation only via env; we document validateSSL but won't bypass here for security

      const res = await fetch(url, fetchOptions as RequestInit).catch((err: any) => {
        throw new Error(`HTTP request failed: ${err.message}`);
      });
      clearTimeout(timeout);

      const contentType = res.headers.get('content-type') || '';
      const responseBody = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          message: `HTTP ${res.status} ${res.statusText}`,
          details: { url, method, headers, responseBody },
        };
      }

      return {
        success: true,
        message: 'HTTP connector test passed',
        details: { url, method, headers, status: res.status, responseBody },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message, details: { error: message } };
    }
  }

  private async testEmailConnector(connector: Connector) {
    try {
      const { EmailConnector } = await import('@flowcraft/connectors');
      const emailConnector = new EmailConnector();
      const config = connector.configuration as any;
      
      const result = await emailConnector.test(config);
      
      return {
        success: result.success,
        message: result.message,
        details: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Email connector test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async testWebhookConnector(connector: Connector) {
    try {
      const { WebhookConnector } = await import('@flowcraft/connectors');
      const webhookConnector = new WebhookConnector();
      const config = connector.configuration as any;
      
      const result = await webhookConnector.test(config);
      
      return {
        success: result.success,
        message: result.message,
        details: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Webhook connector test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async testTimerConnector(connector: Connector) {
    try {
      const { TimerConnector } = await import('@flowcraft/connectors');
      const timerConnector = new TimerConnector();
      const config = connector.configuration as any;
      
      const result = await timerConnector.test(config);
      
      return {
        success: result.success,
        message: result.message,
        details: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Timer connector test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async testDataTransformConnector(connector: Connector) {
    try {
      const { DataTransformConnector } = await import('@flowcraft/connectors');
      const dataTransformConnector = new DataTransformConnector();
      const config = connector.configuration as any;
      
      const result = await dataTransformConnector.test(config);
      
      return {
        success: result.success,
        message: result.message,
        details: result.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Data Transform connector test failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }
}

export default new ConnectorManagementService();
