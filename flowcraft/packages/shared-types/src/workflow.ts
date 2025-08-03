import {
  DataPort,
  DataSchema,
  DataFlow,
  DataField,
  DataType,
  ConditionOperator,
  DataCondition
} from './data-flow';

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
  dataFlows?: DataFlow[]; // Flujos de datos entre nodos
  metadata?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  config?: Record<string, any>;
  // Nuevo: Esquema de datos del nodo
  dataSchema?: DataSchema;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: Record<string, any>;
  // Nuevo: Flujo de datos asociado a la conexión
  dataFlow?: DataFlow;
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
  // Nuevo: Puertos de datos del nodo
  dataPorts?: DataPort[];
  // Nuevo: Esquema de datos específico del editor
  dataSchema?: DataSchema;
}

// ===== NODE DATA TYPES WITH DATA FLOW SUPPORT =====

export interface BaseNodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  config: Record<string, any>;
  validation?: NodeValidation;
  // Nuevo: Esquema de datos del nodo
  dataSchema?: DataSchema;
  // Nuevo: Puertos de datos
  inputPorts?: DataPort[];
  outputPorts?: DataPort[];
}

export interface StartNodeData extends BaseNodeData {
  // Start node specific properties
  triggerType?: 'manual' | 'scheduled' | 'webhook';
  schedule?: string;
  webhookUrl?: string;
  // Nuevo: Datos de entrada para el nodo start
  inputData?: Record<string, any>;
  // Nuevo: Esquema de datos de salida
  outputSchema?: Record<string, DataField>;
}

export interface ActionNodeData extends BaseNodeData {
  // Action node specific properties
  actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
  status?: 'idle' | 'running' | 'success' | 'error';
  retryCount?: number;
  maxRetries?: number;
  // Nuevo: Configuración de transformación de datos
  dataTransformations?: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
    enabled: boolean;
  }>;
  // Nuevo: Mapeo de campos de entrada a salida
  fieldMappings?: Array<{
    inputField: string;
    outputField: string;
    transformation?: string;
  }>;
}

export interface ConditionNodeData extends BaseNodeData {
  // Condition node specific properties
  condition?: {
    variable: string;
    operator: string;
    value: string;
  };
  // Nuevo: Condiciones de datos más avanzadas
  dataConditions?: DataCondition[];
  // Nuevo: Esquemas separados para ramas true/false
  trueBranchSchema?: Record<string, DataField>;
  falseBranchSchema?: Record<string, DataField>;
  // Nuevo: Configuración de puertos de salida
  trueOutputPort?: DataPort;
  falseOutputPort?: DataPort;
}

export interface EndNodeData extends BaseNodeData {
  // End node specific properties
  resultType?: 'success' | 'error' | 'partial';
  outputData?: Record<string, any>;
  // Nuevo: Esquema de datos de entrada
  inputSchema?: Record<string, DataField>;
  // Nuevo: Configuración de salida de datos
  outputConfig?: {
    format: 'json' | 'csv' | 'xml' | 'custom';
    template?: string;
    fields?: string[];
  };
}

export interface LoopNodeData extends BaseNodeData {
  // Loop node specific properties
  loopType?: 'for' | 'while' | 'foreach';
  maxIterations?: number;
  condition?: string;
  // Nuevo: Configuración de datos para el bucle
  loopDataConfig?: {
    inputArray?: string;
    outputArray?: string;
    itemVariable?: string;
    indexVariable?: string;
  };
}

export interface DataTransformNodeData extends BaseNodeData {
  // Data transform specific properties
  transformType?: 'map' | 'filter' | 'aggregate' | 'sort' | 'custom';
  transformConfig?: Record<string, any>;
  // Nuevo: Transformaciones de datos
  transformations?: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
    order: number;
    enabled: boolean;
  }>;
}

export interface HttpRequestNodeData extends BaseNodeData {
  // HTTP request specific properties
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  // Nuevo: Configuración de datos para la petición
  requestDataConfig?: {
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
    responseSchema?: Record<string, DataField>;
  };
}

export interface EmailNodeData extends BaseNodeData {
  // Email specific properties
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  // Nuevo: Configuración de datos para el email
  emailDataConfig?: {
    recipientMapping?: Record<string, string>;
    contentMapping?: Record<string, string>;
    attachmentMapping?: string[];
  };
}

export interface SlackNodeData extends BaseNodeData {
  // Slack specific properties
  channel?: string;
  message?: string;
  // Nuevo: Configuración de datos para Slack
  slackDataConfig?: {
    messageMapping?: Record<string, string>;
    channelMapping?: string;
    attachmentMapping?: string[];
  };
}

export interface TimerNodeData extends BaseNodeData {
  // Timer specific properties
  timerType?: 'delay' | 'schedule' | 'interval';
  duration?: string;
  schedule?: string;
  // Nuevo: Configuración de datos para el timer
  timerDataConfig?: {
    outputTimestamp?: string;
    outputDuration?: string;
  };
}

export interface WebhookNodeData extends BaseNodeData {
  // Webhook specific properties
  webhookUrl?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  // Nuevo: Configuración de datos para el webhook
  webhookDataConfig?: {
    payloadMapping?: Record<string, string>;
    responseMapping?: Record<string, string>;
  };
}

// Union type for all node data types
export type NodeData = 
  | StartNodeData 
  | ActionNodeData 
  | ConditionNodeData 
  | EndNodeData 
  | LoopNodeData 
  | DataTransformNodeData 
  | HttpRequestNodeData 
  | EmailNodeData 
  | SlackNodeData 
  | TimerNodeData 
  | WebhookNodeData;

export interface NodeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  // Nuevo: Validación específica de datos
  dataValidation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingFields?: string[];
    typeMismatches?: Array<{
      field: string;
      expectedType: DataType;
      actualType: DataType;
    }>;
  };
}

export interface EditorEdge extends WorkflowEdge {
  type: EdgeType;
  data?: EdgeData;
  selected?: boolean;
  animated?: boolean;
  // Nuevo: Flujo de datos asociado
  dataFlow?: DataFlow;
}

export interface EdgeData {
  label?: string;
  condition?: string;
  validation?: EdgeValidation;
  // Nuevo: Configuración de datos para la conexión
  dataConfig?: {
    fieldMappings?: Array<{
      sourceField: string;
      targetField: string;
      transformation?: string;
    }>;
    transformations?: Array<{
      id: string;
      type: string;
      config: Record<string, any>;
    }>;
  };
}

export interface EdgeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  // Nuevo: Validación de compatibilidad de datos
  dataCompatibility?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    incompatibleFields?: Array<{
      sourceField: string;
      targetField: string;
      reason: string;
    }>;
  };
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
  // Nuevo: Estado de flujo de datos
  dataFlow?: {
    flows: DataFlow[];
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
    activeFlow?: string;
  };
}

export interface ValidationError {
  id: string;
  type: 'node' | 'edge' | 'workflow' | 'data';
  message: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  // Nuevo: Información específica de datos
  dataInfo?: {
    field?: string;
    expectedType?: DataType;
    actualType?: DataType;
    portId?: string;
  };
}

export interface ValidationWarning {
  id: string;
  type: 'node' | 'edge' | 'workflow' | 'data';
  message: string;
  nodeId?: string;
  edgeId?: string;
  // Nuevo: Información específica de datos
  dataInfo?: {
    field?: string;
    suggestion?: string;
    portId?: string;
  };
}

export interface NodeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  nodes: NodeType[];
  // Nuevo: Información de datos soportados
  supportedDataTypes?: DataType[];
  defaultDataSchema?: DataSchema;
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
  // Nuevo: Configuración de flujo de datos
  dataFlow?: {
    enabled: boolean;
    strictTypeChecking: boolean;
    allowTypeConversion: boolean;
    showDataFlow: boolean;
    validateOnConnect: boolean;
  };
} 