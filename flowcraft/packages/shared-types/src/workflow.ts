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

// ===== WORKFLOW EDITOR TYPES =====

export enum NodeType {
  START = 'start',
  END = 'end',
  ACTION = 'action',
  CONDITION = 'condition',
  LOOP = 'loop',
  HTTP_REQUEST = 'http_request',
  EMAIL = 'email',
  SLACK = 'slack',
  DATA_TRANSFORM = 'data_transform',
  TIMER = 'timer',
  WEBHOOK = 'webhook',
}

export enum EdgeType {
  DEFAULT = 'default',
  CONDITIONAL = 'conditional',
  LOOP = 'loop',
}

export interface EditorNode extends WorkflowNode {
  type: NodeType;
  data: NodeData;
  selected?: boolean;
  dragging?: boolean;
}

export interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  config: Record<string, any>;
  validation?: NodeValidation;
  // Start node specific properties
  triggerType?: 'manual' | 'scheduled' | 'webhook';
  schedule?: string;
  webhookUrl?: string;
  // Action node specific properties
  actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
  status?: 'idle' | 'running' | 'success' | 'error';
  retryCount?: number;
  maxRetries?: number;
  // End node specific properties
  resultType?: 'success' | 'error' | 'partial';
  outputData?: Record<string, any>;
}

export interface NodeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EditorEdge extends WorkflowEdge {
  type: EdgeType;
  data?: EdgeData;
  selected?: boolean;
  animated?: boolean;
}

export interface EdgeData {
  label?: string;
  condition?: string;
  validation?: EdgeValidation;
}

export interface EdgeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowEditorState {
  nodes: EditorNode[];
  edges: EditorEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  history: {
    past: WorkflowEditorState[];
    future: WorkflowEditorState[];
  };
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  autoSave: {
    enabled: boolean;
    lastSaved: Date | null;
    isSaving: boolean;
  };
}

export interface ValidationError {
  id: string;
  type: 'node' | 'edge' | 'workflow';
  message: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationWarning {
  id: string;
  type: 'node' | 'edge' | 'workflow';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface NodeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  nodes: NodeType[];
}

export interface WorkflowEditorConfig {
  snapToGrid: boolean;
  gridSize: number;
  minZoom: number;
  maxZoom: number;
  autoSaveInterval: number;
  maxHistorySteps: number;
  enableMinimap: boolean;
  enableControls: boolean;
} 