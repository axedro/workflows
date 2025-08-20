import request from 'supertest';
import fastify from 'fastify';
import { prisma } from '@flowcraft/database';

// Mock database
jest.mock('@flowcraft/database', () => ({
  prisma: {
    connector: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    connectorLog: {
      create: jest.fn(),
    },
  },
}));

describe('Connectors API Integration Tests', () => {
  let app: any;
  let token: string;

  const mockConnector = {
    id: 'connector-id',
    name: 'Test Connector',
    type: 'http',
    description: 'Test connector',
    configuration: { url: 'https://api.example.com' },
    isActive: true,
    createdBy: 'user-id',
    organizationId: 'org-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    credentials: [],
    logs: [],
    _count: { configs: 0 },
  };

  beforeAll(async () => {
    // Setup test Fastify instance
    app = fastify({ logger: false });
    
    // Mock JWT authentication
    app.register(async function (fastify: any) {
      fastify.addHook('preHandler', async (request: any, reply: any) => {
        request.user = {
          userId: 'user-id',
          email: 'test@example.com',
          organizationId: 'org-id',
          role: 'ADMIN',
        };
      });
    });

    // Register connector routes
    await app.register(import('../../routes/connectors'));
    
    await app.ready();
    
    // Mock JWT token for tests
    token = 'mock-jwt-token';
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/connectors', () => {
    it('should return list of connectors', async () => {
      const mockConnectors = [mockConnector];
      (prisma.connector.findMany as jest.Mock).mockResolvedValue(mockConnectors);

      const response = await request(app.server)
        .get('/api/connectors')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockConnectors);
      expect(prisma.connector.findMany).toHaveBeenCalled();
    });

    it('should filter connectors by type', async () => {
      const httpConnectors = [{ ...mockConnector, type: 'http' }];
      (prisma.connector.findMany as jest.Mock).mockResolvedValue(httpConnectors);

      const response = await request(app.server)
        .get('/api/connectors?type=http')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(httpConnectors);
      expect(prisma.connector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'http',
          }),
        })
      );
    });

    it('should filter active connectors only', async () => {
      const activeConnectors = [mockConnector];
      (prisma.connector.findMany as jest.Mock).mockResolvedValue(activeConnectors);

      const response = await request(app.server)
        .get('/api/connectors?isActive=true')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(activeConnectors);
      expect(prisma.connector.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should search connectors by name', async () => {
      const searchResults = [mockConnector];
      (prisma.connector.findMany as jest.Mock).mockResolvedValue(searchResults);

      const response = await request(app.server)
        .get('/api/connectors?search=test')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(searchResults);
      expect(prisma.connector.findMany).toHaveBeenCalledWith(
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

    it('should require authentication', async () => {
      const response = await request(app.server)
        .get('/api/connectors');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/connectors', () => {
    it('should create new connector', async () => {
      const newConnector = {
        name: 'New Connector',
        type: 'http',
        description: 'New test connector',
        configuration: { url: 'https://new-api.example.com' },
      };

      (prisma.connector.create as jest.Mock).mockResolvedValue({
        ...mockConnector,
        ...newConnector,
      });

      const response = await request(app.server)
        .post('/api/connectors')
        .set('Authorization', `Bearer ${token}`)
        .send(newConnector);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining(newConnector));
      expect(prisma.connector.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...newConnector,
          createdBy: 'user-id',
          organizationId: 'org-id',
        }),
      });
    });

    it('should validate required fields', async () => {
      const invalidConnector = {
        name: '', // Empty name should fail
        type: 'http',
        configuration: {},
      };

      const response = await request(app.server)
        .post('/api/connectors')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidConnector);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(prisma.connector.create).not.toHaveBeenCalled();
    });

    it('should validate connector type', async () => {
      const invalidConnector = {
        name: 'Invalid Connector',
        type: 'invalid-type', // Invalid type
        configuration: {},
      };

      const response = await request(app.server)
        .post('/api/connectors')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidConnector);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(prisma.connector.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const newConnector = {
        name: 'New Connector',
        type: 'http',
        configuration: { url: 'https://api.example.com' },
      };

      (prisma.connector.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app.server)
        .post('/api/connectors')
        .set('Authorization', `Bearer ${token}`)
        .send(newConnector);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/connectors/:id', () => {
    it('should return specific connector', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(mockConnector);

      const response = await request(app.server)
        .get('/api/connectors/connector-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockConnector);
      expect(prisma.connector.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'connector-id',
          OR: [
            { createdBy: 'user-id' },
            { organizationId: 'org-id' },
          ],
        },
        include: expect.any(Object),
      });
    });

    it('should return 404 for non-existent connector', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .get('/api/connectors/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/connectors/:id', () => {
    it('should update connector', async () => {
      const updateData = {
        name: 'Updated Connector',
        description: 'Updated description',
        isActive: false,
      };

      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(mockConnector);
      (prisma.connector.update as jest.Mock).mockResolvedValue({
        ...mockConnector,
        ...updateData,
      });

      const response = await request(app.server)
        .put('/api/connectors/connector-id')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining(updateData));
      expect(prisma.connector.update).toHaveBeenCalledWith({
        where: { id: 'connector-id' },
        data: updateData,
      });
    });

    it('should validate update data', async () => {
      const invalidData = { name: '' }; // Empty name

      const response = await request(app.server)
        .put('/api/connectors/connector-id')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent connector', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .put('/api/connectors/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/connectors/:id', () => {
    it('should delete connector', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(mockConnector);
      (prisma.connector.delete as jest.Mock).mockResolvedValue(mockConnector);

      const response = await request(app.server)
        .delete('/api/connectors/connector-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(prisma.connector.delete).toHaveBeenCalledWith({
        where: { id: 'connector-id' },
      });
    });

    it('should return 404 for non-existent connector', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .delete('/api/connectors/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('should handle database errors during deletion', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(mockConnector);
      (prisma.connector.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const response = await request(app.server)
        .delete('/api/connectors/connector-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/connectors/:id/test', () => {
    it('should test connector successfully', async () => {
      const testResult = {
        success: true,
        message: 'Test successful',
        data: { status: 200 },
      };

      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(mockConnector);
      (prisma.connectorLog.create as jest.Mock).mockResolvedValue({
        id: 'log-id',
        connectorId: 'connector-id',
        message: 'Test successful',
        level: 'info',
        createdAt: new Date(),
      });

      const response = await request(app.server)
        .post('/api/connectors/connector-id/test')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(prisma.connectorLog.create).toHaveBeenCalled();
    });

    it('should handle test failures', async () => {
      const failedConnector = {
        ...mockConnector,
        configuration: { url: 'invalid-url' },
      };

      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(failedConnector);
      (prisma.connectorLog.create as jest.Mock).mockResolvedValue({
        id: 'log-id',
        connectorId: 'connector-id',
        message: 'Test failed',
        level: 'error',
        createdAt: new Date(),
      });

      const response = await request(app.server)
        .post('/api/connectors/connector-id/test')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', false);
      expect(prisma.connectorLog.create).toHaveBeenCalled();
    });

    it('should return 404 for non-existent connector', async () => {
      (prisma.connector.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .post('/api/connectors/non-existent-id/test')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});