/**
 * Data Flow System - FlowCraft Workflow Automation Platform
 * 
 * This module defines the core interfaces and types for the data flow system
 * that enables data processing between workflow nodes.
 */

// ===== DATA TYPES =====

/**
 * Supported data types for fields in the workflow
 */
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  DATE = 'date',
  EMAIL = 'email',
  URL = 'url',
  FILE = 'file',
  JSON = 'json'
}

/**
 * Validation rules for data fields
 */
export interface FieldValidation {
  /** Minimum length for strings */
  minLength?: number;
  /** Maximum length for strings */
  maxLength?: number;
  /** Minimum value for numbers */
  min?: number;
  /** Maximum value for numbers */
  max?: number;
  /** Regular expression pattern */
  pattern?: string;
  /** Allowed values for enum types */
  enum?: any[];
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  custom?: (value: any) => boolean | string;
}

/**
 * Represents a single data field with type and validation
 */
export interface DataField {
  /** Unique identifier for the field */
  id: string;
  /** Display name of the field */
  name: string;
  /** Data type of the field */
  type: DataType;
  /** Whether the field is required */
  required: boolean;
  /** Description of the field */
  description?: string;
  /** Default value for the field */
  defaultValue?: any;
  /** Validation rules for the field */
  validation?: FieldValidation;
  /** Example value for documentation */
  example?: any;
  /** Whether the field is computed/derived */
  computed?: boolean;
  /** Source field if this is a mapped field */
  sourceField?: string;
}

// ===== DATA PORTS =====

/**
 * Position of a data port on a node
 */
export type PortPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Type of data port
 */
export type PortType = 'input' | 'output';

/**
 * Represents a data port (input or output) on a workflow node
 */
export interface DataPort {
  /** Unique identifier for the port */
  id: string;
  /** Display name of the port */
  name: string;
  /** Type of port (input or output) */
  type: PortType;
  /** Fields available in this port */
  fields: DataField[];
  /** Position of the port on the node */
  position: PortPosition;
  /** Whether the port is required for the node to function */
  required: boolean;
  /** Whether the port supports multiple connections */
  multiple?: boolean;
  /** Description of the port's purpose */
  description?: string;
  /** Whether the port is currently connected */
  connected?: boolean;
  /** Validation status of the port */
  validation?: PortValidation;
}

/**
 * Validation status of a data port
 */
export interface PortValidation {
  /** Whether the port is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Missing required fields */
  missingFields?: string[];
}

// ===== DATA TRANSFORMATIONS =====

/**
 * Types of data transformations
 */
export enum TransformationType {
  RENAME = 'rename',
  FILTER = 'filter',
  TRANSFORM = 'transform',
  AGGREGATE = 'aggregate',
  CONCATENATE = 'concatenate',
  SPLIT = 'split',
  FORMAT = 'format',
  VALIDATE = 'validate'
}

/**
 * Configuration for field transformations
 */
export interface FieldTransformation {
  /** Type of transformation */
  type: TransformationType;
  /** Configuration parameters */
  config: Record<string, any>;
  /** Source field name */
  sourceField?: string;
  /** Target field name */
  targetField?: string;
  /** Whether the transformation is enabled */
  enabled?: boolean;
}

/**
 * Data transformation applied to a connection or node
 */
export interface DataTransformation {
  /** Unique identifier for the transformation */
  id: string;
  /** Type of transformation */
  type: TransformationType;
  /** Configuration parameters */
  config: Record<string, any>;
  /** Description of the transformation */
  description?: string;
  /** Whether the transformation is enabled */
  enabled: boolean;
  /** Order of application */
  order: number;
  /** Validation status */
  validation?: TransformationValidation;
}

/**
 * Validation status of a transformation
 */
export interface TransformationValidation {
  /** Whether the transformation is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Whether the transformation can be applied to the current data */
  canApply: boolean;
}

// ===== FIELD MAPPING =====

/**
 * Mapping between source and target fields
 */
export interface FieldMapping {
  /** Source field identifier */
  sourceField: string;
  /** Target field identifier */
  targetField: string;
  /** Transformation applied to the field */
  transformation?: FieldTransformation;
  /** Whether the mapping is required */
  required?: boolean;
  /** Description of the mapping */
  description?: string;
  /** Validation status */
  validation?: FieldMappingValidation;
}

/**
 * Validation status of a field mapping
 */
export interface FieldMappingValidation {
  /** Whether the mapping is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Type compatibility status */
  typeCompatible: boolean;
  /** Whether the source field exists */
  sourceExists: boolean;
  /** Whether the target field exists */
  targetExists: boolean;
}

// ===== DATA FLOW =====

/**
 * Represents a data flow between two ports
 */
export interface DataFlow {
  /** Unique identifier for the flow */
  id: string;
  /** Source port identifier */
  sourcePortId: string;
  /** Target port identifier */
  targetPortId: string;
  /** Field mappings between source and target */
  fieldMappings: FieldMapping[];
  /** Transformations applied to the data flow */
  transformations?: DataTransformation[];
  /** Validation status of the flow */
  validation: FlowValidation;
  /** Whether the flow is enabled */
  enabled: boolean;
  /** Description of the flow */
  description?: string;
  /** Metadata for the flow */
  metadata?: Record<string, any>;
}

/**
 * Validation status of a data flow
 */
export interface FlowValidation {
  /** Whether the flow is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Whether the ports are compatible */
  portsCompatible: boolean;
  /** Whether all required fields are mapped */
  requiredFieldsMapped: boolean;
  /** Type compatibility status */
  typeCompatible: boolean;
  /** Missing field mappings */
  missingMappings?: string[];
  /** Invalid field mappings */
  invalidMappings?: string[];
}

// ===== DATA SCHEMAS =====

/**
 * Schema for input/output data of a node
 */
export interface DataSchema {
  /** Input fields schema */
  input: Record<string, DataField>;
  /** Output fields schema */
  output: Record<string, DataField>;
  /** Validation rules for the schema */
  validation?: SchemaValidation;
  /** Description of the schema */
  description?: string;
  /** Version of the schema */
  version?: string;
}

/**
 * Validation status of a data schema
 */
export interface SchemaValidation {
  /** Whether the schema is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Whether all required fields are defined */
  requiredFieldsDefined: boolean;
  /** Whether field types are consistent */
  typesConsistent: boolean;
}

// ===== CONDITION LOGIC =====

/**
 * Operators for condition evaluation
 */
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IN = 'in',
  NOT_IN = 'not_in'
}

/**
 * Represents a condition for data filtering
 */
export interface DataCondition {
  /** Unique identifier for the condition */
  id: string;
  /** Field to evaluate */
  field: string;
  /** Operator for comparison */
  operator: ConditionOperator;
  /** Value to compare against */
  value: any;
  /** Whether the condition is enabled */
  enabled: boolean;
  /** Description of the condition */
  description?: string;
  /** Validation status */
  validation?: ConditionValidation;
}

/**
 * Validation status of a condition
 */
export interface ConditionValidation {
  /** Whether the condition is valid */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Whether the field exists */
  fieldExists: boolean;
  /** Whether the operator is valid for the field type */
  operatorValid: boolean;
  /** Whether the value is compatible with the field type */
  valueCompatible: boolean;
}

// ===== UTILITY TYPES =====

/**
 * Result of a data validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Detailed validation information */
  details?: Record<string, any>;
}

/**
 * Configuration for data flow validation
 */
export interface ValidationConfig {
  /** Whether to validate types strictly */
  strictTypes: boolean;
  /** Whether to allow automatic type conversion */
  allowTypeConversion: boolean;
  /** Whether to validate required fields */
  validateRequired: boolean;
  /** Whether to show warnings */
  showWarnings: boolean;
  /** Custom validation functions */
  customValidators?: Record<string, (value: any) => ValidationResult>;
}

// All types are automatically exported by TypeScript 