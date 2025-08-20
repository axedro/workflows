import { WorkflowService } from '../services/workflow.service';
import { prisma } from '@flowcraft/database';

// Mock Prisma client
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

describe('WorkflowService', () => {
  let service: WorkflowService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  const mockUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    organizationId: 'test-org-id',
    role: 'ADMIN' as const,
  };

  const mockWorkflow = {
    id: 'workflow-id',
    name: 'Test Workflow',
    description: 'Test workflow description',
    definition: { nodes: [], edges: [] },
    status: 'DRAFT',
    version: 1,
    userId: 'test-user-id',
    organizationId: 'test-org-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkflowVersion = {
    id: 'version-id',
    workflowId: 'workflow-id',
    versionNumber: 1,
    definition: { nodes: [], edges: [] },
    changelog: 'Initial version',
    createdBy: 'test-user-id',
    createdAt: new Date(),
  };

  beforeEach(() => {
    service = new WorkflowService();
    jest.clearAllMocks();
  });

  describe('createWorkflow', () => {
    it('should create a new workflow successfully', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'Test description',
        definition: { nodes: [], edges: [] },
      };

      mockPrisma.workflow.create.mockResolvedValue(mockWorkflow);

      const result = await service.createWorkflow(workflowData, mockUser);

      expect(result).toEqual(mockWorkflow);
      expect(mockPrisma.workflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: workflowData.name,
          description: workflowData.description,
          definition: workflowData.definition,
          userId: mockUser.userId,
          organizationId: mockUser.organizationId,
          status: 'DRAFT',
          version: 1,
        }),
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '',
        definition: {},
      };

      await expect(service.createWorkflow(invalidData, mockUser)).rejects.toThrow();
      expect(mockPrisma.workflow.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const workflowData = {
        name: 'Test Workflow',
        definition: { nodes: [], edges: [] },
      };

      mockPrisma.workflow.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createWorkflow(workflowData, mockUser)).rejects.toThrow('Database error');
    });

    it('should create workflow without organization ID for personal use', async () => {
      const userWithoutOrg = { ...mockUser, organizationId: null };
      const workflowData = {
        name: 'Personal Workflow',
        definition: { nodes: [], edges: [] },
      };

      mockPrisma.workflow.create.mockResolvedValue({
        ...mockWorkflow,
        organizationId: null,
      });

      const result = await service.createWorkflow(workflowData, userWithoutOrg);

      expect(result.organizationId).toBeNull();
      expect(mockPrisma.workflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: null,
        }),
      });
    });
  });

  describe('getWorkflows', () => {
    it('should retrieve workflows for user', async () => {
      const mockWorkflows = [mockWorkflow];
      mockPrisma.workflow.findMany.mockResolvedValue(mockWorkflows);
      mockPrisma.workflow.count.mockResolvedValue(1);

      const result = await service.getWorkflows(mockUser, {});

      expect(result.workflows).toEqual(mockWorkflows);
      expect(result.total).toBe(1);
      expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: mockUser.userId },
            {
              organizationId: mockUser.organizationId,
              organization: {
                users: {
                  some: {
                    id: mockUser.userId,
                  },
                },
              },
            },
          ],
        },
        include: {
          versions: {
            select: {
              id: true,
              versionNumber: true,
              changelog: true,
              createdAt: true,
            },
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should filter workflows by status', async () => {
      const mockWorkflows = [{ ...mockWorkflow, status: 'ACTIVE' }];
      mockPrisma.workflow.findMany.mockResolvedValue(mockWorkflows);
      mockPrisma.workflow.count.mockResolvedValue(1);

      const filters = { status: 'ACTIVE' as const };
      const result = await service.getWorkflows(mockUser, filters);

      expect(result.workflows).toEqual(mockWorkflows);
      expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });

    it('should search workflows by name', async () => {
      const mockWorkflows = [mockWorkflow];
      mockPrisma.workflow.findMany.mockResolvedValue(mockWorkflows);
      mockPrisma.workflow.count.mockResolvedValue(1);

      const filters = { search: 'test' };
      const result = await service.getWorkflows(mockUser, filters);

      expect(result.workflows).toEqual(mockWorkflows);
      expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
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

    it('should handle pagination', async () => {
      const mockWorkflows = [mockWorkflow];
      mockPrisma.workflow.findMany.mockResolvedValue(mockWorkflows);
      mockPrisma.workflow.count.mockResolvedValue(100);

      const pagination = { page: 2, limit: 20 };
      const result = await service.getWorkflows(mockUser, {}, pagination);

      expect(result.workflows).toEqual(mockWorkflows);
      expect(result.total).toBe(100);
      expect(mockPrisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 20, // (page - 1) * limit
        })
      );
    });
  });

  describe('getWorkflowById', () => {
    it('should retrieve workflow by ID', async () => {
      const workflowWithVersions = {
        ...mockWorkflow,
        versions: [mockWorkflowVersion],
      };
      mockPrisma.workflow.findUnique.mockResolvedValue(workflowWithVersions);

      const result = await service.getWorkflowById('workflow-id', mockUser);

      expect(result).toEqual(workflowWithVersions);
      expect(mockPrisma.workflow.findUnique).toHaveBeenCalledWith({
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
            orderBy: {
              versionNumber: 'desc',
            },
          },
        },
      });
    });

    it('should return null for non-existent workflow', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      const result = await service.getWorkflowById('non-existent-id', mockUser);

      expect(result).toBeNull();
    });

    it('should throw error for unauthorized access', async () => {
      const unauthorizedWorkflow = {
        ...mockWorkflow,
        userId: 'other-user-id',
        organizationId: 'other-org-id',
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(unauthorizedWorkflow);

      await expect(service.getWorkflowById('workflow-id', mockUser)).rejects.toThrow(
        'Access denied'
      );
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow successfully', async () => {
      const updateData = {
        name: 'Updated Workflow',
        description: 'Updated description',
        status: 'ACTIVE' as const,
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.update.mockResolvedValue({
        ...mockWorkflow,
        ...updateData,
      });

      const result = await service.updateWorkflow('workflow-id', updateData, mockUser);

      expect(result).toEqual(expect.objectContaining(updateData));
      expect(mockPrisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
        data: updateData,
      });
    });

    it('should increment version when definition is updated', async () => {
      const updateData = {
        definition: { nodes: [{ id: '1', type: 'start' }], edges: [] },
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.update.mockResolvedValue({
        ...mockWorkflow,
        ...updateData,
        version: 2,
      });

      const result = await service.updateWorkflow('workflow-id', updateData, mockUser);

      expect(result.version).toBe(2);
      expect(mockPrisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
        data: expect.objectContaining({
          definition: updateData.definition,
          version: { increment: 1 },
        }),
      });
    });

    it('should throw error for non-existent workflow', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      const updateData = { name: 'Updated Name' };

      await expect(service.updateWorkflow('non-existent-id', updateData, mockUser)).rejects.toThrow(
        'Workflow not found'
      );
    });

    it('should validate update data', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      const invalidData = { name: '' }; // Empty name should fail validation

      await expect(service.updateWorkflow('workflow-id', invalidData, mockUser)).rejects.toThrow();
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.delete.mockResolvedValue(mockWorkflow);

      const result = await service.deleteWorkflow('workflow-id', mockUser);

      expect(result).toBe(true);
      expect(mockPrisma.workflow.delete).toHaveBeenCalledWith({
        where: { id: 'workflow-id' },
      });
    });

    it('should throw error for non-existent workflow', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      await expect(service.deleteWorkflow('non-existent-id', mockUser)).rejects.toThrow(
        'Workflow not found'
      );
    });

    it('should handle database errors during deletion', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteWorkflow('workflow-id', mockUser)).rejects.toThrow('Delete failed');
    });
  });

  describe('duplicateWorkflow', () => {
    it('should duplicate workflow successfully', async () => {
      const duplicatedWorkflow = {
        ...mockWorkflow,
        id: 'duplicated-workflow-id',
        name: 'Test Workflow (Copy)',
        version: 1,
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflow.create.mockResolvedValue(duplicatedWorkflow);

      const result = await service.duplicateWorkflow('workflow-id', mockUser);

      expect(result).toEqual(duplicatedWorkflow);
      expect(mockPrisma.workflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Workflow (Copy)',
          description: mockWorkflow.description,
          definition: mockWorkflow.definition,
          userId: mockUser.userId,
          organizationId: mockUser.organizationId,
          status: 'DRAFT',
          version: 1,
        }),
      });
    });

    it('should handle duplicate names by adding incremental suffix', async () => {
      const existingCopy = { ...mockWorkflow, name: 'Test Workflow (Copy)' };
      mockPrisma.workflow.findUnique
        .mockResolvedValueOnce(mockWorkflow) // Original workflow
        .mockResolvedValueOnce(existingCopy); // Check for existing copy

      mockPrisma.workflow.create.mockResolvedValue({
        ...mockWorkflow,
        id: 'duplicated-workflow-id',
        name: 'Test Workflow (Copy 2)',
      });

      const result = await service.duplicateWorkflow('workflow-id', mockUser);

      expect(result.name).toBe('Test Workflow (Copy 2)');
    });

    it('should throw error for non-existent workflow', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      await expect(service.duplicateWorkflow('non-existent-id', mockUser)).rejects.toThrow(
        'Workflow not found'
      );
    });
  });

  describe('createWorkflowVersion', () => {
    it('should create new workflow version successfully', async () => {
      const versionData = {
        definition: { nodes: [{ id: '1', type: 'start' }], edges: [] },
        changelog: 'Added start node',
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflowVersion.create.mockResolvedValue({
        ...mockWorkflowVersion,
        ...versionData,
        versionNumber: 2,
      });

      const result = await service.createWorkflowVersion('workflow-id', versionData, mockUser);

      expect(result.versionNumber).toBe(2);
      expect(mockPrisma.workflowVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workflowId: 'workflow-id',
          definition: versionData.definition,
          changelog: versionData.changelog,
          createdBy: mockUser.userId,
          versionNumber: 2,
        }),
      });
    });

    it('should validate version data', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);

      const invalidData = { definition: null }; // Invalid definition

      await expect(
        service.createWorkflowVersion('workflow-id', invalidData, mockUser)
      ).rejects.toThrow();
    });

    it('should throw error for non-existent workflow', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(null);

      const versionData = {
        definition: { nodes: [], edges: [] },
        changelog: 'Test version',
      };

      await expect(
        service.createWorkflowVersion('non-existent-id', versionData, mockUser)
      ).rejects.toThrow('Workflow not found');
    });
  });

  describe('getWorkflowVersion', () => {
    it('should retrieve specific workflow version', async () => {
      const workflowWithVersion = {
        ...mockWorkflow,
        versions: [mockWorkflowVersion],
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(workflowWithVersion);
      mockPrisma.workflowVersion.findUnique.mockResolvedValue(mockWorkflowVersion);

      const result = await service.getWorkflowVersion('workflow-id', 1, mockUser);

      expect(result).toEqual(mockWorkflowVersion);
      expect(mockPrisma.workflowVersion.findUnique).toHaveBeenCalledWith({
        where: {
          workflowId_versionNumber: {
            workflowId: 'workflow-id',
            versionNumber: 1,
          },
        },
      });
    });

    it('should return null for non-existent version', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflowVersion.findUnique.mockResolvedValue(null);

      const result = await service.getWorkflowVersion('workflow-id', 999, mockUser);

      expect(result).toBeNull();
    });

    it('should throw error for unauthorized access', async () => {
      const unauthorizedWorkflow = {
        ...mockWorkflow,
        userId: 'other-user-id',
        organizationId: 'other-org-id',
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(unauthorizedWorkflow);

      await expect(service.getWorkflowVersion('workflow-id', 1, mockUser)).rejects.toThrow(
        'Access denied'
      );
    });
  });
});