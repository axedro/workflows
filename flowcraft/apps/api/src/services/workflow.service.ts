import { prisma } from '../../../../packages/database/dist/index.js';
import { z } from 'zod';

// Validation schemas
export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  definition: z.record(z.any()),
  organizationId: z.string().optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  definition: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});

export const createVersionSchema = z.object({
  definition: z.record(z.any()),
  changelog: z.string().optional(),
});

export interface WorkflowWithVersions {
  id: string;
  name: string;
  description?: string;
  definition: any;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string;
  userId: string;
  versions: Array<{
    id: string;
    versionNumber: number;
    changelog?: string;
    createdAt: Date;
  }>;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  definition: any;
  changelog?: string;
  createdAt: Date;
  createdBy: string;
}

export class WorkflowService {
  /**
   * Create a new workflow
   */
  async createWorkflow(
    data: z.infer<typeof createWorkflowSchema>,
    userId: string
  ): Promise<WorkflowWithVersions> {
    // Validate definition structure
    this.validateWorkflowDefinition(data.definition);

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        definition: data.definition,
        userId,
        organizationId: data.organizationId,
        status: 'DRAFT',
        version: 1,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    // Create initial version
    await prisma.workflowVersion.create({
      data: {
        workflowId: workflow.id,
        versionNumber: 1,
        definition: data.definition,
        changelog: 'Initial version',
        createdBy: userId,
      },
    });

    return workflow as WorkflowWithVersions;
  }

  /**
   * Get workflow by ID with versions
   */
  async getWorkflowById(
    workflowId: string,
    userId: string,
    organizationId?: string
  ): Promise<WorkflowWithVersions | null> {
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        OR: [
          { userId },
          { organizationId, organization: { users: { some: { id: userId } } } },
        ],
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return workflow as WorkflowWithVersions | null;
  }

  /**
   * Get all workflows for user/organization
   */
  async getWorkflows(
    userId: string,
    organizationId?: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {}
  ): Promise<{
    workflows: WorkflowWithVersions[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { userId },
        { organizationId, organization: { users: { some: { id: userId } } } },
      ],
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workflow.count({ where }),
    ]);

    return {
      workflows: workflows as WorkflowWithVersions[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update workflow
   */
  async updateWorkflow(
    workflowId: string,
    data: z.infer<typeof updateWorkflowSchema>,
    userId: string
  ): Promise<WorkflowWithVersions> {
    // Check if workflow exists and user has access
    const existingWorkflow = await this.getWorkflowById(workflowId, userId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found or access denied');
    }

    // Validate definition if provided
    if (data.definition) {
      this.validateWorkflowDefinition(data.definition);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    // If definition changed, create new version
    if (data.definition) {
      const newVersionNumber = existingWorkflow.version + 1;
      updateData.definition = data.definition;
      updateData.version = newVersionNumber;

      await prisma.workflowVersion.create({
        data: {
          workflowId,
          versionNumber: newVersionNumber,
          definition: data.definition,
          changelog: 'Updated workflow definition',
          createdBy: userId,
        },
      });
    }

    const workflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: updateData,
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    return workflow as WorkflowWithVersions;
  }

  /**
   * Create new version of workflow
   */
  async createVersion(
    workflowId: string,
    data: z.infer<typeof createVersionSchema>,
    userId: string
  ): Promise<WorkflowVersion> {
    // Check if workflow exists and user has access
    const existingWorkflow = await this.getWorkflowById(workflowId, userId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found or access denied');
    }

    // Validate definition
    this.validateWorkflowDefinition(data.definition);

    const newVersionNumber = existingWorkflow.version + 1;

    // Create new version
    const version = await prisma.workflowVersion.create({
      data: {
        workflowId,
        versionNumber: newVersionNumber,
        definition: data.definition,
        changelog: data.changelog,
        createdBy: userId,
      },
    });

    // Update workflow
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        definition: data.definition,
        version: newVersionNumber,
      },
    });

    return version as WorkflowVersion;
  }

  /**
   * Get workflow version
   */
  async getWorkflowVersion(
    workflowId: string,
    versionNumber: number,
    userId: string
  ): Promise<WorkflowVersion | null> {
    // Check if workflow exists and user has access
    const existingWorkflow = await this.getWorkflowById(workflowId, userId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found or access denied');
    }

    const version = await prisma.workflowVersion.findFirst({
      where: {
        workflowId,
        versionNumber,
      },
    });

    return version as WorkflowVersion | null;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId: string, userId: string): Promise<void> {
    // Check if workflow exists and user has access
    const existingWorkflow = await this.getWorkflowById(workflowId, userId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found or access denied');
    }

    // Check if workflow has executions
    const executionCount = await prisma.execution.count({
      where: { workflowId },
    });

    if (executionCount > 0) {
      throw new Error('Cannot delete workflow with existing executions');
    }

    await prisma.workflow.delete({
      where: { id: workflowId },
    });
  }

  /**
   * Duplicate workflow
   */
  async duplicateWorkflow(
    workflowId: string,
    newName: string,
    userId: string
  ): Promise<WorkflowWithVersions> {
    // Check if workflow exists and user has access
    const existingWorkflow = await this.getWorkflowById(workflowId, userId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found or access denied');
    }

    // Create new workflow
    const newWorkflow = await prisma.workflow.create({
      data: {
        name: newName,
        description: `${existingWorkflow.description || ''} (Copy)`,
        definition: existingWorkflow.definition,
        userId,
        organizationId: existingWorkflow.organizationId,
        status: 'DRAFT',
        version: 1,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    // Create initial version
    await prisma.workflowVersion.create({
      data: {
        workflowId: newWorkflow.id,
        versionNumber: 1,
        definition: existingWorkflow.definition,
        changelog: 'Duplicated from existing workflow',
        createdBy: userId,
      },
    });

    return newWorkflow as WorkflowWithVersions;
  }

  /**
   * Validate workflow definition structure
   */
  private validateWorkflowDefinition(definition: any): void {
    if (!definition || typeof definition !== 'object') {
      throw new Error('Invalid workflow definition: must be an object');
    }

    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      throw new Error(
        'Invalid workflow definition: missing or invalid nodes array'
      );
    }

    if (!definition.edges || !Array.isArray(definition.edges)) {
      throw new Error(
        'Invalid workflow definition: missing or invalid edges array'
      );
    }

    // Validate nodes
    for (const node of definition.nodes) {
      if (!node.id || !node.type || !node.data) {
        throw new Error(
          'Invalid node: missing required fields (id, type, data)'
        );
      }
    }

    // Validate edges
    for (const edge of definition.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        throw new Error(
          'Invalid edge: missing required fields (id, source, target)'
        );
      }
    }
  }
}
