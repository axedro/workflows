export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  userId: string;
  organizationId?: string;
  status: WorkflowStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  config?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
}

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
  status?: WorkflowStatus;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  category: string;
  isPublic: boolean;
  createdAt: Date;
} 