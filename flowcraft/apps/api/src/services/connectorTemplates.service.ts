import { prisma } from '@flowcraft/database';
import { z } from 'zod';

// Schema for connector template
const ConnectorTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['http', 'email', 'webhook', 'timer', 'data-transform']),
  category: z.string().optional(),
  description: z.string().optional(),
  configurationSchema: z.record(z.any()),
  isPublic: z.boolean().default(false),
  organizationId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ConnectorTemplate = z.infer<typeof ConnectorTemplateSchema>;

class ConnectorTemplatesService {
  async createTemplate(data: {
    name: string;
    type: 'http' | 'email' | 'webhook' | 'timer' | 'data-transform';
    category?: string;
    description?: string;
    configurationSchema: Record<string, any>;
    isPublic?: boolean;
    organizationId?: string;
  }): Promise<ConnectorTemplate> {
    const template = await prisma.connectorTemplate.create({
      data: {
        ...data,
        isPublic: data.isPublic ?? false,
      },
    });

    return ConnectorTemplateSchema.parse(template);
  }

  async getTemplates(userId: string, organizationId?: string, filters?: {
    type?: string;
    category?: string;
    isPublic?: boolean;
    search?: string;
  }): Promise<ConnectorTemplate[]> {
    const where: any = {
      OR: [
        { isPublic: true },
        { organizationId: organizationId || null },
      ],
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        ...where.OR,
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.connectorTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return templates.map(template => ConnectorTemplateSchema.parse(template));
  }

  async getTemplateById(id: string, userId: string, organizationId?: string): Promise<ConnectorTemplate | null> {
    const template = await prisma.connectorTemplate.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { organizationId: organizationId || null },
        ],
      },
    });

    return template ? ConnectorTemplateSchema.parse(template) : null;
  }

  async updateTemplate(
    id: string,
    data: Partial<{
      name: string;
      category: string;
      description: string;
      configurationSchema: Record<string, any>;
      isPublic: boolean;
    }>,
    userId: string,
    organizationId?: string
  ): Promise<ConnectorTemplate | null> {
    const template = await prisma.connectorTemplate.findFirst({
      where: {
        id,
        organizationId: organizationId || null,
      },
    });

    if (!template) {
      return null;
    }

    const updatedTemplate = await prisma.connectorTemplate.update({
      where: { id },
      data,
    });

    return ConnectorTemplateSchema.parse(updatedTemplate);
  }

  async deleteTemplate(id: string, userId: string, organizationId?: string): Promise<boolean> {
    const template = await prisma.connectorTemplate.findFirst({
      where: {
        id,
        organizationId: organizationId || null,
      },
    });

    if (!template) {
      return false;
    }

    await prisma.connectorTemplate.delete({
      where: { id },
    });

    return true;
  }

  async getPublicTemplates(): Promise<ConnectorTemplate[]> {
    const templates = await prisma.connectorTemplate.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map(template => ConnectorTemplateSchema.parse(template));
  }
}

export default new ConnectorTemplatesService(); 