import { ConnectorManagementService } from '../services/connectorManagement.service';
import { prisma } from '@flowcraft/database';

// Mock Prisma client
jest.mock('@flowcraft/database', () => ({
  prisma: {
    connector: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    connectorCredential: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    connectorLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('ConnectorManagementService', () => {
  let service: ConnectorManagementService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  const mockUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    organizationId: 'test-org-id',
    role: 'ADMIN' as const,
  };

  const mockConnector = {
    id: 'connector-id',
    name: 'Test Connector',
    type: 'http',
    description: 'Test connector description',
    configuration: { url: 'https://api.example.com' },
    isActive: true,
    createdBy: 'test-user-id',
    organizationId: 'test-org-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
  };

  beforeEach(() => {
    service = new ConnectorManagementService();
    jest.clearAllMocks();
  });

  describe('createConnector', () => {
    it('should create a new connector successfully', async () => {
      const connectorData = {
        name: 'Test Connector',
        type: 'http' as const,
        description: 'Test description',
        configuration: { url: 'https://api.example.com' },
      };

      mockPrisma.connector.create.mockResolvedValue(mockConnector);

      const result = await service.createConnector(connectorData, mockUser);

      expect(result).toEqual(mockConnector);
      expect(mockPrisma.connector.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: connectorData.name,
          type: connectorData.type,
          description: connectorData.description,
          configuration: connectorData.configuration,
          createdBy: mockUser.userId,
          organizationId: mockUser.organizationId,
          isActive: true,
        }),
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        type: 'invalid' as any,
        configuration: {},
      };

      await expect(service.createConnector(invalidData, mockUser)).rejects.toThrow();
      expect(mockPrisma.connector.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const connectorData = {
        name: 'Test Connector',
        type: 'http' as const,
        configuration: { url: 'https://api.example.com' },
      };

      mockPrisma.connector.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createConnector(connectorData, mockUser)).rejects.toThrow('Database error');
    });

    it('should create connector without organization ID for personal use', async () => {
      const userWithoutOrg = { ...mockUser, organizationId: null };
      const connectorData = {
        name: 'Personal Connector',
        type: 'http' as const,
        configuration: { url: 'https://api.example.com' },
      };

      mockPrisma.connector.create.mockResolvedValue({
        ...mockConnector,
        organizationId: null,
      });

      const result = await service.createConnector(connectorData, userWithoutOrg);

      expect(result.organizationId).toBeNull();
      expect(mockPrisma.connector.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: null,
        }),
      });
    });
  });

  describe('getConnectors', () => {
    it('should retrieve connectors for user', async () => {
      const mockConnectors = [mockConnector];
      mockPrisma.connector.findMany.mockResolvedValue(mockConnectors);

      const result = await service.getConnectors(mockUser);

      expect(result).toEqual(mockConnectors);
      expect(mockPrisma.connector.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { createdBy: mockUser.userId },
            { organizationId: mockUser.organizationId },
          ],
        },
        include: {
          credentials: true,
          logs: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              configs: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should filter connectors by type', async () => {
      const mockConnectors = [mockConnector];
      mockPrisma.connector.findMany.mockResolvedValue(mockConnectors);

      const filters = { type: 'http' as const };
      const result = await service.getConnectors(mockUser, filters);

      expect(result).toEqual(mockConnectors);
      expect(mockPrisma.connector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'http',
          }),
        })
      );
    });

    it('should filter active connectors only', async () => {
      const mockConnectors = [mockConnector];
      mockPrisma.connector.findMany.mockResolvedValue(mockConnectors);

      const filters = { isActive: true };
      const result = await service.getConnectors(mockUser, filters);

      expect(result).toEqual(mockConnectors);
      expect(mockPrisma.connector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should search connectors by name', async () => {
      const mockConnectors = [mockConnector];
      mockPrisma.connector.findMany.mockResolvedValue(mockConnectors);

      const filters = { search: 'test' };
      const result = await service.getConnectors(mockUser, filters);

      expect(result).toEqual(mockConnectors);
      expect(mockPrisma.connector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'test',
              mode: 'insensitive',
            },
          }),
        })
      );
    });
  });

  describe('getConnectorById', () => {
    it('should retrieve connector by ID', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(mockConnector);

      const result = await service.getConnectorById('connector-id', mockUser);

      expect(result).toEqual(mockConnector);
      expect(mockPrisma.connector.findUnique).toHaveBeenCalledWith({
        where: { id: 'connector-id' },
        include: {
          credentials: true,
          logs: {
            take: 50,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              configs: true,
            },
          },
        },
      });
    });

    it('should return null for non-existent connector', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(null);

      const result = await service.getConnectorById('non-existent-id', mockUser);

      expect(result).toBeNull();
    });

    it('should throw error for unauthorized access', async () => {
      const unauthorizedConnector = {
        ...mockConnector,
        createdBy: 'other-user-id',
        organizationId: 'other-org-id',
      };

      mockPrisma.connector.findUnique.mockResolvedValue(unauthorizedConnector);

      await expect(service.getConnectorById('connector-id', mockUser)).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('updateConnector', () => {
    it('should update connector successfully', async () => {
      const updateData = {
        name: 'Updated Connector',
        description: 'Updated description',
        isActive: false,
      };

      mockPrisma.connector.findUnique.mockResolvedValue(mockConnector);
      mockPrisma.connector.update.mockResolvedValue({
        ...mockConnector,
        ...updateData,
      });

      const result = await service.updateConnector('connector-id', updateData, mockUser);

      expect(result).toEqual(expect.objectContaining(updateData));
      expect(mockPrisma.connector.update).toHaveBeenCalledWith({
        where: { id: 'connector-id' },
        data: updateData,
      });
    });

    it('should throw error for non-existent connector', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(null);

      const updateData = { name: 'Updated Name' };

      await expect(service.updateConnector('non-existent-id', updateData, mockUser)).rejects.toThrow(
        'Connector not found'
      );
    });

    it('should validate update data', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(mockConnector);

      const invalidData = { name: '' }; // Empty name should fail validation

      await expect(service.updateConnector('connector-id', invalidData, mockUser)).rejects.toThrow();
    });
  });

  describe('deleteConnector', () => {
    it('should delete connector successfully', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(mockConnector);
      mockPrisma.connector.delete.mockResolvedValue(mockConnector);

      const result = await service.deleteConnector('connector-id', mockUser);

      expect(result).toBe(true);
      expect(mockPrisma.connector.delete).toHaveBeenCalledWith({
        where: { id: 'connector-id' },
      });
    });

    it('should throw error for non-existent connector', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(null);

      await expect(service.deleteConnector('non-existent-id', mockUser)).rejects.toThrow(
        'Connector not found'
      );
    });

    it('should handle database errors during deletion', async () => {
      mockPrisma.connector.findUnique.mockResolvedValue(mockConnector);
      mockPrisma.connector.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteConnector('connector-id', mockUser)).rejects.toThrow('Delete failed');
    });
  });

  describe('testConnector', () => {
    it('should test HTTP connector successfully', async () => {
      const httpConnector = {
        ...mockConnector,
        type: 'http',
        configuration: { url: 'https://httpbin.org/get', method: 'GET' },
      };

      mockPrisma.connector.findUnique.mockResolvedValue(httpConnector);
      mockPrisma.connectorLog.create.mockResolvedValue({
        id: 'log-id',
        connectorId: 'connector-id',
        message: 'Test successful',
        level: 'info',
        createdAt: new Date(),
        metadata: null,
      });

      const result = await service.testConnector('connector-id', mockUser);

      expect(result.success).toBe(true);
      expect(mockPrisma.connectorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          connectorId: 'connector-id',
          level: 'info',
          message: expect.stringContaining('Test successful'),
        }),
      });
    });

    it('should test Email connector successfully', async () => {
      const emailConnector = {
        ...mockConnector,
        type: 'email',
        configuration: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'test@gmail.com',
          smtpPassword: 'password',
          defaultFrom: 'test@gmail.com',
        },
      };

      mockPrisma.connector.findUnique.mockResolvedValue(emailConnector);
      mockPrisma.connectorLog.create.mockResolvedValue({
        id: 'log-id',
        connectorId: 'connector-id',
        message: 'Email test successful',
        level: 'info',
        createdAt: new Date(),
        metadata: null,
      });

      const result = await service.testConnector('connector-id', mockUser);

      expect(result.success).toBe(true);
      expect(mockPrisma.connectorLog.create).toHaveBeenCalled();
    });

    it('should handle unsupported connector type', async () => {
      const unsupportedConnector = {
        ...mockConnector,
        type: 'unsupported',
      };

      mockPrisma.connector.findUnique.mockResolvedValue(unsupportedConnector);

      const result = await service.testConnector('connector-id', mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported connector type');
    });

    it('should handle test failures', async () => {
      const httpConnector = {
        ...mockConnector,
        type: 'http',
        configuration: { url: 'https://invalid-url' },
      };

      mockPrisma.connector.findUnique.mockResolvedValue(httpConnector);
      mockPrisma.connectorLog.create.mockResolvedValue({
        id: 'log-id',
        connectorId: 'connector-id',
        message: 'Test failed',
        level: 'error',
        createdAt: new Date(),
        metadata: null,
      });

      const result = await service.testConnector('connector-id', mockUser);

      expect(result.success).toBe(false);
      expect(mockPrisma.connectorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          level: 'error',
        }),
      });
    });
  });

  // TODO: Add logConnectorActivity tests when the method is implemented
  // describe('logConnectorActivity', () => {
  //   it('should log connector activity successfully', async () => {
  //     const logData = {
  //       message: 'Connector executed successfully',
  //       level: 'info' as const,
  //       metadata: { duration: 1000 },
  //     };

  //     mockPrisma.connectorLog.create.mockResolvedValue({
  //       id: 'log-id',
  //       connectorId: 'connector-id',
  //       message: logData.message,
  //       level: logData.level,
  //       metadata: logData.metadata,
  //       createdAt: new Date(),
  //     });

  //     const result = await service.logConnectorActivity('connector-id', logData);

  //     expect(result).toBeDefined();
  //     expect(mockPrisma.connectorLog.create).toHaveBeenCalledWith({
  //       data: {
  //         connectorId: 'connector-id',
  //         message: logData.message,
  //         level: logData.level,
  //         metadata: logData.metadata,
  //       },
  //     });
  //   });

  //   it('should handle logging errors gracefully', async () => {
  //     const logData = {
  //       message: 'Test message',
  //       level: 'info' as const,
  //     };

  //     mockPrisma.connectorLog.create.mockRejectedValue(new Error('Logging failed'));

  //     // Should not throw, but handle the error gracefully
  //     await expect(service.logConnectorActivity('connector-id', logData)).resolves.not.toThrow();
  //   });
  // });
});