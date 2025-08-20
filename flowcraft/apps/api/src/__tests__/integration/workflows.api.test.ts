import request from 'supertest';
import fastify from 'fastify';
import { prisma } from '@flowcraft/database';

// Mock database
jest.mock('@flowcraft/database', () => ({
  prisma: {
    workflow: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    workflowVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('Workflows API Integration Tests', () => {
  let app: any;
  let token: string;

  const mockWorkflow = {
    id: 'workflow-id',
    name: 'Test Workflow',
    description: 'Test workflow description',
    definition: { nodes: [], edges: [] },
    status: 'DRAFT',
    version: 1,
    userId: 'user-id',
    organizationId: 'org-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [],
  };

  const mockWorkflowVersion = {
    id: 'version-id',
    workflowId: 'workflow-id',
    versionNumber: 1,
    definition: { nodes: [], edges: [] },
    changelog: 'Initial version',
    createdBy: 'user-id',
    createdAt: new Date(),
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

    // Register workflow routes
    await app.register(import('../../routes/workflows'));
    
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

  describe('GET /workflows', () => {
    it('should return paginated list of workflows', async () => {
      const mockWorkflows = [mockWorkflow];
      (prisma.workflow.findMany as jest.Mock).mockResolvedValue(mockWorkflows);
      (prisma.workflow.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app.server)
        .get('/workflows')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('workflows', mockWorkflows);
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 50);
    });

    it('should filter workflows by status', async () => {
      const activeWorkflows = [{ ...mockWorkflow, status: 'ACTIVE' }];
      (prisma.workflow.findMany as jest.Mock).mockResolvedValue(activeWorkflows);
      (prisma.workflow.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app.server)
        .get('/workflows?status=ACTIVE')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.workflows).toEqual(activeWorkflows);
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should search workflows by name', async () => {
      const searchResults = [mockWorkflow];
      (prisma.workflow.findMany as jest.Mock).mockResolvedValue(searchResults);
      (prisma.workflow.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app.server)
        .get('/workflows?search=test')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.workflows).toEqual(searchResults);
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
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

    it('should handle pagination parameters', async () => {
      const mockWorkflows = [mockWorkflow];
      (prisma.workflow.findMany as jest.Mock).mockResolvedValue(mockWorkflows);
      (prisma.workflow.count as jest.Mock).mockResolvedValue(100);

      const response = await request(app.server)
        .get('/workflows?page=2&limit=20')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('page', 2);
      expect(response.body).toHaveProperty('limit', 20);
      expect(response.body).toHaveProperty('total', 100);
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 20, // (page - 1) * limit
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app.server).get('/workflows');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /workflows', () => {
    it('should create new workflow', async () => {
      const newWorkflow = {
        name: 'New Workflow',
        description: 'New test workflow',
        definition: { nodes: [{ id: '1', type: 'start' }], edges: [] },
      };

      (prisma.workflow.create as jest.Mock).mockResolvedValue({
        ...mockWorkflow,
        ...newWorkflow,
      });

      const response = await request(app.server)
        .post('/workflows')
        .set('Authorization', `Bearer ${token}`)
        .send(newWorkflow);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining(newWorkflow));
      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...newWorkflow,
          userId: 'user-id',
          organizationId: 'org-id',
          status: 'DRAFT',
          version: 1,
        }),
        include: expect.any(Object),
      });
    });

    it('should validate required fields', async () => {
      const invalidWorkflow = {
        name: '', // Empty name should fail
        definition: {},
      };

      const response = await request(app.server)
        .post('/workflows')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidWorkflow);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(prisma.workflow.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const newWorkflow = {
        name: 'New Workflow',
        definition: { nodes: [], edges: [] },
      };

      (prisma.workflow.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app.server)
        .post('/workflows')
        .set('Authorization', `Bearer ${token}`)
        .send(newWorkflow);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /workflows/:id', () => {
    it('should return specific workflow with versions', async () => {
      const workflowWithVersions = {
        ...mockWorkflow,
        versions: [mockWorkflowVersion],
      };
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(workflowWithVersions);

      const response = await request(app.server)
        .get('/workflows/workflow-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(workflowWithVersions);
      expect(prisma.workflow.findUnique).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
        include: {
          versions: {
            select: {
              id: true,
              versionNumber: true,
              changelog: true,
              createdAt: true,
              createdBy: true,
            },
            orderBy: { versionNumber: 'desc' },
          },
        },
      });
    });

    it('should return 404 for non-existent workflow', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .get('/workflows/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should deny access to unauthorized workflow', async () => {
      const unauthorizedWorkflow = {
        ...mockWorkflow,
        userId: 'other-user-id',
        organizationId: 'other-org-id',
      };
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(unauthorizedWorkflow);

      const response = await request(app.server)
        .get('/workflows/workflow-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /workflows/:id', () => {
    it('should update workflow', async () => {
      const updateData = {
        name: 'Updated Workflow',
        description: 'Updated description',
        status: 'ACTIVE',
      };

      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflow.update as jest.Mock).mockResolvedValue({
        ...mockWorkflow,
        ...updateData,
      });

      const response = await request(app.server)
        .put('/workflows/workflow-id')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining(updateData));
      expect(prisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
        data: updateData,
      });
    });

    it('should increment version when definition is updated', async () => {
      const updateData = {
        definition: { nodes: [{ id: '1', type: 'start' }], edges: [] },
      };

      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflow.update as jest.Mock).mockResolvedValue({
        ...mockWorkflow,
        ...updateData,
        version: 2,
      });

      const response = await request(app.server)
        .put('/workflows/workflow-id')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.version).toBe(2);
      expect(prisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
        data: expect.objectContaining({
          definition: updateData.definition,
          version: { increment: 1 },
        }),
      });
    });

    it('should validate update data', async () => {
      const invalidData = { name: '' }; // Empty name

      const response = await request(app.server)
        .put('/workflows/workflow-id')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent workflow', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .put('/workflows/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /workflows/:id', () => {
    it('should delete workflow', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflow.delete as jest.Mock).mockResolvedValue(mockWorkflow);

      const response = await request(app.server)
        .delete('/workflows/workflow-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
      expect(prisma.workflow.delete).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
      });
    });

    it('should return 404 for non-existent workflow', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .delete('/workflows/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /workflows/:id/duplicate', () => {
    it('should duplicate workflow', async () => {
      const duplicatedWorkflow = {
        ...mockWorkflow,
        id: 'duplicated-workflow-id',
        name: 'Test Workflow (Copy)',
        version: 1,
      };

      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflow.create as jest.Mock).mockResolvedValue(duplicatedWorkflow);

      const response = await request(app.server)
        .post('/workflows/workflow-id/duplicate')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(duplicatedWorkflow);
      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Workflow (Copy)',
          description: mockWorkflow.description,
          definition: mockWorkflow.definition,
          userId: 'user-id',
          organizationId: 'org-id',
          status: 'DRAFT',
          version: 1,
        }),
      });
    });

    it('should return 404 for non-existent workflow', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .post('/workflows/non-existent-id/duplicate')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /workflows/:id/versions', () => {
    it('should create new workflow version', async () => {
      const versionData = {
        definition: { nodes: [{ id: '1', type: 'start' }], edges: [] },
        changelog: 'Added start node',
      };

      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflowVersion.create as jest.Mock).mockResolvedValue({
        ...mockWorkflowVersion,
        ...versionData,
        versionNumber: 2,
      });

      const response = await request(app.server)
        .post('/workflows/workflow-id/versions')
        .set('Authorization', `Bearer ${token}`)
        .send(versionData);

      expect(response.status).toBe(201);
      expect(response.body.versionNumber).toBe(2);
      expect(prisma.workflowVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: 'workflow-id',
          definition: versionData.definition,
          changelog: versionData.changelog,
          createdBy: 'user-id',
          versionNumber: 2,
        }),
      });
    });

    it('should validate version data', async () => {
      const invalidData = { definition: null }; // Invalid definition

      const response = await request(app.server)
        .post('/workflows/workflow-id/versions')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent workflow', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(null);

      const versionData = {
        definition: { nodes: [], edges: [] },
        changelog: 'Test version',
      };

      const response = await request(app.server)
        .post('/workflows/non-existent-id/versions')
        .set('Authorization', `Bearer ${token}`)
        .send(versionData);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /workflows/:id/versions/:version', () => {
    it('should return specific workflow version', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflowVersion.findUnique as jest.Mock).mockResolvedValue(mockWorkflowVersion);

      const response = await request(app.server)
        .get('/workflows/workflow-id/versions/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWorkflowVersion);
      expect(prisma.workflowVersion.findUnique).toHaveBeenCalledWith({
        where: {
          workflowId_versionNumber: {
            workflowId: 'workflow-id',
            versionNumber: 1,
          },
        },
      });
    });

    it('should return 404 for non-existent version', async () => {
      (prisma.workflow.findUnique as jest.Mock).mockResolvedValue(mockWorkflow);
      (prisma.workflowVersion.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app.server)
        .get('/workflows/workflow-id/versions/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});