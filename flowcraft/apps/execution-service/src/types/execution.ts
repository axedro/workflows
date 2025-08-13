export interface WorkflowExecutionJob {
  workflowId: string;
  executionId: string;
  userId: string;
  input?: Record<string, any>;
}

export interface NodeExecutionJob {
  executionId: string;
  nodeId: string;
  workflowId: string;
  inputData?: Record<string, any>;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  nodeId: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  status: ExecutionStatus;
  error?: string;
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING', 
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface ExecutionResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  duration: number;
}

export interface QueueJobData {
  id: string;
  type: 'workflow' | 'node';
  data: WorkflowExecutionJob | NodeExecutionJob;
  createdAt: Date;
}