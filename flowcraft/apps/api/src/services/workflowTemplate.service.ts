import { z } from 'zod';
import { prisma } from '@flowcraft/database';
import { WorkflowValidationService } from './workflowValidation.service.js';

// Zod schemas for validation
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().min(1).max(100),
  definition: z.record(z.any()),
  isPublic: z.boolean().default(false),
  organizationId: z.string().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(100).optional(),
  definition: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
});

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  definition: any;
  isPublic: boolean;
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  organization?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

export class WorkflowTemplateService {
  private validationService = new WorkflowValidationService();

  /**
   * Create new template
   */
  async createTemplate(
    data: z.infer<typeof createTemplateSchema>,
    userId: string
  ): Promise<WorkflowTemplate> {
    // Validate definition
    this.validateWorkflowDefinition(data.definition);

    const template = await prisma.workflowTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        definition: data.definition,
        isPublic: data.isPublic,
        organizationId: data.organizationId,
        createdBy: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return template as WorkflowTemplate;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(
    templateId: string,
    userId: string,
    organizationId?: string
  ): Promise<WorkflowTemplate | null> {
    const template = await prisma.workflowTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { createdBy: userId },
          { organizationId, organization: { users: { some: { id: userId } } } },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return template as WorkflowTemplate | null;
  }

  /**
   * Get templates with pagination and filters
   */
  async getTemplates(
    userId: string,
    organizationId?: string,
    options: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      isPublic?: boolean;
    } = {}
  ): Promise<{
    templates: WorkflowTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, category, search, isPublic } = options;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { isPublic: true },
        { createdBy: userId },
        { organizationId, organization: { users: { some: { id: userId } } } },
      ],
      ...(category && { category }),
      ...(isPublic !== undefined && { isPublic }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.workflowTemplate.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workflowTemplate.count({ where }),
    ]);

    return {
      templates: templates as WorkflowTemplate[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get public templates
   */
  async getPublicTemplates(options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}): Promise<{
    templates: WorkflowTemplate[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, category, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      isPublic: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.workflowTemplate.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workflowTemplate.count({ where }),
    ]);

    return {
      templates: templates as WorkflowTemplate[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    data: z.infer<typeof updateTemplateSchema>,
    userId: string
  ): Promise<WorkflowTemplate> {
    // Check if template exists and user has access
    const existingTemplate = await this.getTemplateById(templateId, userId);
    if (!existingTemplate) {
      throw new Error('Template not found or access denied');
    }

    // Validate definition if provided
    if (data.definition) {
      this.validateWorkflowDefinition(data.definition);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.definition !== undefined) updateData.definition = data.definition;

    const template = await prisma.workflowTemplate.update({
      where: { id: templateId },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return template as WorkflowTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    // Check if template exists and user has access
    const existingTemplate = await this.getTemplateById(templateId, userId);
    if (!existingTemplate) {
      throw new Error('Template not found or access denied');
    }

    await prisma.workflowTemplate.delete({
      where: { id: templateId },
    });
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(
    templateId: string,
    newName: string,
    userId: string,
    organizationId?: string
  ): Promise<WorkflowTemplate> {
    // Get original template
    const originalTemplate = await this.getTemplateById(templateId, userId);
    if (!originalTemplate) {
      throw new Error('Template not found or access denied');
    }

    // Create new template as private
    const template = await prisma.workflowTemplate.create({
      data: {
        name: newName,
        description: originalTemplate.description,
        category: originalTemplate.category,
        definition: originalTemplate.definition,
        isPublic: false, // Always private when duplicated
        organizationId: organizationId || originalTemplate.organizationId,
        createdBy: userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return template as WorkflowTemplate;
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<string[]> {
    const categories = await prisma.workflowTemplate.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map(c => c.category);
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflowDefinition(definition: any): void {
    if (!definition || typeof definition !== 'object') {
      throw new Error('Invalid workflow definition');
    }

    if (!Array.isArray(definition.nodes)) {
      throw new Error('Workflow definition must have nodes array');
    }

    if (!Array.isArray(definition.edges)) {
      throw new Error('Workflow definition must have edges array');
    }
  }
} 