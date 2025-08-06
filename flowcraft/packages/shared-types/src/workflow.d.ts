import { DataPort, DataSchema, DataFlow, DataField, DataType, DataCondition } from './data-flow';
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
    dataFlows?: DataFlow[];
    metadata?: Record<string, any>;
}
export interface WorkflowNode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: Record<string, any>;
    config?: Record<string, any>;
    dataSchema?: DataSchema;
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: Record<string, any>;
    dataFlow?: DataFlow;
}
export declare enum WorkflowStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    ARCHIVED = "ARCHIVED"
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
export declare enum NodeType {
    START = "start",
    END = "end",
    ACTION = "action",
    CONDITION = "condition",
    LOOP = "loop",
    HTTP_REQUEST = "http_request",
    EMAIL = "email",
    SLACK = "slack",
    DATA_TRANSFORM = "data_transform",
    TIMER = "timer",
    WEBHOOK = "webhook",
    TEST = "test"
}
export declare enum EdgeType {
    DEFAULT = "default",
    CONDITIONAL = "conditional",
    LOOP = "loop"
}
export interface EditorNode extends WorkflowNode {
    type: NodeType;
    data: NodeData;
    selected?: boolean;
    dragging?: boolean;
    dataPorts?: DataPort[];
    dataSchema?: DataSchema;
}
export interface BaseNodeData {
    label: string;
    description?: string;
    icon?: string;
    color?: string;
    config: Record<string, any>;
    validation?: NodeValidation;
    dataSchema?: DataSchema;
    inputPorts?: DataPort[];
    outputPorts?: DataPort[];
}
export interface StartNodeData extends BaseNodeData {
    triggerType?: 'manual' | 'scheduled' | 'webhook';
    schedule?: string;
    webhookUrl?: string;
    inputData?: Record<string, any>;
    outputSchema?: Record<string, DataField>;
}
export interface ActionNodeData extends BaseNodeData {
    actionType?: 'http' | 'email' | 'slack' | 'transform' | 'custom';
    status?: 'idle' | 'running' | 'success' | 'error';
    retryCount?: number;
    maxRetries?: number;
    dataTransformations?: Array<{
        id: string;
        type: string;
        config: Record<string, any>;
        enabled: boolean;
    }>;
    fieldMappings?: Array<{
        inputField: string;
        outputField: string;
        transformation?: string;
    }>;
}
export interface ConditionNodeData extends BaseNodeData {
    condition?: {
        variable: string;
        operator: string;
        value: string;
    };
    dataConditions?: DataCondition[];
    trueBranchSchema?: Record<string, DataField>;
    falseBranchSchema?: Record<string, DataField>;
    trueOutputPort?: DataPort;
    falseOutputPort?: DataPort;
}
export interface EndNodeData extends BaseNodeData {
    resultType?: 'success' | 'error' | 'partial';
    outputData?: Record<string, any>;
    inputSchema?: Record<string, DataField>;
    outputConfig?: {
        format: 'json' | 'csv' | 'xml' | 'custom';
        template?: string;
        fields?: string[];
    };
}
export interface LoopNodeData extends BaseNodeData {
    loopType?: 'for' | 'while' | 'foreach';
    maxIterations?: number;
    condition?: string;
    loopDataConfig?: {
        inputArray?: string;
        outputArray?: string;
        itemVariable?: string;
        indexVariable?: string;
    };
}
export interface DataTransformNodeData extends BaseNodeData {
    transformType?: 'map' | 'filter' | 'aggregate' | 'sort' | 'custom';
    transformConfig?: Record<string, any>;
    transformations?: Array<{
        id: string;
        type: string;
        config: Record<string, any>;
        order: number;
        enabled: boolean;
    }>;
}
export interface HttpRequestNodeData extends BaseNodeData {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    requestDataConfig?: {
        inputMapping?: Record<string, string>;
        outputMapping?: Record<string, string>;
        responseSchema?: Record<string, DataField>;
    };
}
export interface EmailNodeData extends BaseNodeData {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    body?: string;
    emailDataConfig?: {
        recipientMapping?: Record<string, string>;
        contentMapping?: Record<string, string>;
        attachmentMapping?: string[];
    };
}
export interface SlackNodeData extends BaseNodeData {
    channel?: string;
    message?: string;
    slackDataConfig?: {
        messageMapping?: Record<string, string>;
        channelMapping?: string;
        attachmentMapping?: string[];
    };
}
export interface TimerNodeData extends BaseNodeData {
    timerType?: 'delay' | 'schedule' | 'interval';
    duration?: string;
    schedule?: string;
    timerDataConfig?: {
        outputTimestamp?: string;
        outputDuration?: string;
    };
}
export interface WebhookNodeData extends BaseNodeData {
    webhookUrl?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    webhookDataConfig?: {
        payloadMapping?: Record<string, string>;
        responseMapping?: Record<string, string>;
    };
}
export type NodeData = StartNodeData | ActionNodeData | ConditionNodeData | EndNodeData | LoopNodeData | DataTransformNodeData | HttpRequestNodeData | EmailNodeData | SlackNodeData | TimerNodeData | WebhookNodeData;
export interface NodeValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
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
    dataFlow?: DataFlow;
}
export interface EdgeData {
    label?: string;
    condition?: string;
    validation?: EdgeValidation;
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
    dataFlow?: {
        enabled: boolean;
        strictTypeChecking: boolean;
        allowTypeConversion: boolean;
        showDataFlow: boolean;
        validateOnConnect: boolean;
    };
}
//# sourceMappingURL=workflow.d.ts.map