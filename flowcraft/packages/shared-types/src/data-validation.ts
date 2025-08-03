/**
 * Data Validation Service - FlowCraft Workflow Automation Platform
 * 
 * This module provides comprehensive data validation for the workflow
 * data flow system, including type checking, field validation, and
 * compatibility validation.
 */

import {
  DataField,
  DataType,
  DataPort,
  DataFlow,
  FieldMapping,
  DataTransformation,
  DataSchema,
  ValidationResult,
  ValidationConfig,
  ConditionOperator,
  TransformationType,
  PortValidation,
  FlowValidation,
  FieldMappingValidation,
  TransformationValidation,
  ConditionValidation
} from './data-flow';
import { NodeType, EditorNode, EditorEdge } from './workflow';
import { getNodeSchema, getNodePorts } from './node-schemas';

// ===== VALIDATION CONFIGURATION =====

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  strictTypes: true,
  allowTypeConversion: false,
  validateRequired: true,
  showWarnings: true,
  customValidators: {}
};

// ===== TYPE COMPATIBILITY MATRIX =====

export const TYPE_COMPATIBILITY: Record<DataType, DataType[]> = {
  [DataType.STRING]: [DataType.STRING, DataType.EMAIL, DataType.URL],
  [DataType.NUMBER]: [DataType.NUMBER],
  [DataType.BOOLEAN]: [DataType.BOOLEAN],
  [DataType.OBJECT]: [DataType.OBJECT, DataType.JSON],
  [DataType.ARRAY]: [DataType.ARRAY],
  [DataType.DATE]: [DataType.DATE],
  [DataType.EMAIL]: [DataType.STRING, DataType.EMAIL],
  [DataType.URL]: [DataType.STRING, DataType.URL],
  [DataType.FILE]: [DataType.FILE],
  [DataType.JSON]: [DataType.OBJECT, DataType.JSON]
};

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate a single data field
 */
export function validateDataField(
  field: DataField,
  value: any,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if field is required
  if (field.required && (value === undefined || value === null || value === '')) {
    errors.push(`Field '${field.name}' is required`);
    return { isValid: false, errors, warnings };
  }

  // Skip validation if value is null/undefined and not required
  if (value === undefined || value === null) {
    return { isValid: true, errors, warnings };
  }

  // Type validation
  const typeValidation = validateFieldType(field.type, value, config);
  if (!typeValidation.isValid) {
    errors.push(...typeValidation.errors);
  }
  if (typeValidation.warnings.length > 0) {
    warnings.push(...typeValidation.warnings);
  }

  // Custom validation rules
  if (field.validation) {
    const ruleValidation = validateFieldRules(field, value, config);
    if (!ruleValidation.isValid) {
      errors.push(...ruleValidation.errors);
    }
    if (ruleValidation.warnings.length > 0) {
      warnings.push(...ruleValidation.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate field type compatibility
 */
export function validateFieldType(
  expectedType: DataType,
  value: any,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const actualType = getValueType(value);
  
  if (actualType !== expectedType) {
    if (config.strictTypes) {
      errors.push(`Expected type '${expectedType}', got '${actualType}'`);
    } else if (config.allowTypeConversion && canConvertType(actualType, expectedType)) {
      warnings.push(`Type conversion from '${actualType}' to '${expectedType}' will be applied`);
    } else {
      errors.push(`Incompatible type: expected '${expectedType}', got '${actualType}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate field validation rules
 */
export function validateFieldRules(
  field: DataField,
  value: any,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!field.validation) {
    return { isValid: true, errors, warnings };
  }

  const rules = field.validation;

  // String validations
  if (field.type === DataType.STRING && typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength}, got ${value.length}`);
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength}, got ${value.length}`);
    }
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      errors.push(`Value does not match pattern: ${rules.pattern}`);
    }
  }

  // Number validations
  if (field.type === DataType.NUMBER && typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`Minimum value is ${rules.min}, got ${value}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`Maximum value is ${rules.max}, got ${value}`);
    }
  }

  // Enum validations
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`Value must be one of: ${rules.enum.join(', ')}`);
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(value);
    if (typeof customResult === 'string') {
      errors.push(customResult);
    } else if (!customResult) {
      errors.push(`Custom validation failed for field '${field.name}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate data port compatibility
 */
export function validateDataPort(
  port: DataPort,
  data: Record<string, any>,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): PortValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  // Check required fields
  for (const field of port.fields) {
    if (field.required && !(field.id in data)) {
      missingFields.push(field.id);
      errors.push(`Required field '${field.name}' is missing`);
    }
  }

  // Validate field values
  for (const field of port.fields) {
    if (field.id in data) {
      const fieldValidation = validateDataField(field, data[field.id], config);
      if (!fieldValidation.isValid) {
        errors.push(...fieldValidation.errors.map(e => `${field.name}: ${e}`));
      }
      if (fieldValidation.warnings.length > 0) {
        warnings.push(...fieldValidation.warnings.map(w => `${field.name}: ${w}`));
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFields
  };
}

/**
 * Validate field mapping compatibility
 */
export function validateFieldMapping(
  mapping: FieldMapping,
  sourceSchema: Record<string, DataField>,
  targetSchema: Record<string, DataField>,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): FieldMappingValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sourceExists = mapping.sourceField in sourceSchema;
  const targetExists = mapping.targetField in targetSchema;

  if (!sourceExists) {
    errors.push(`Source field '${mapping.sourceField}' does not exist`);
  }

  if (!targetExists) {
    errors.push(`Target field '${mapping.targetField}' does not exist`);
  }

  if (sourceExists && targetExists) {
    const sourceField = sourceSchema[mapping.sourceField];
    const targetField = targetSchema[mapping.targetField];

    const typeCompatible = isTypeCompatible(sourceField.type, targetField.type, config);
    if (!typeCompatible) {
      errors.push(`Type mismatch: cannot map '${sourceField.type}' to '${targetField.type}'`);
    }

    // Validate transformation if present
    if (mapping.transformation) {
      // Convert FieldTransformation to DataTransformation for validation
      const dataTransformation: DataTransformation = {
        id: `field-${mapping.sourceField}-${mapping.targetField}`,
        type: mapping.transformation.type,
        config: mapping.transformation.config,
        enabled: mapping.transformation.enabled ?? true,
        order: 0
      };
      
      const transformValidation = validateTransformation(
        dataTransformation,
        sourceField,
        targetField,
        config
      );
      if (!transformValidation.isValid) {
        errors.push(...transformValidation.errors);
      }
      if (transformValidation.warnings.length > 0) {
        warnings.push(...transformValidation.warnings);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    typeCompatible: sourceExists && targetExists && isTypeCompatible(
      sourceSchema[mapping.sourceField]?.type,
      targetSchema[mapping.targetField]?.type,
      config
    ),
    sourceExists,
    targetExists
  };
}

/**
 * Validate data flow
 */
export function validateDataFlow(
  flow: DataFlow,
  sourcePort: DataPort,
  targetPort: DataPort,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): FlowValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingMappings: string[] = [];
  const invalidMappings: string[] = [];

  // Validate port compatibility
  const portsCompatible = validatePortCompatibility(sourcePort, targetPort, config);
  if (!portsCompatible.isValid) {
    errors.push(...portsCompatible.errors);
  }

  // Validate field mappings
  const requiredTargetFields = targetPort.fields.filter(f => f.required);
  const mappedTargetFields = new Set(flow.fieldMappings.map(m => m.targetField));

  for (const field of requiredTargetFields) {
    if (!mappedTargetFields.has(field.id)) {
      missingMappings.push(field.id);
      errors.push(`Required target field '${field.name}' is not mapped`);
    }
  }

  // Validate individual mappings
  for (const mapping of flow.fieldMappings) {
    const mappingValidation = validateFieldMapping(
      mapping,
      Object.fromEntries(sourcePort.fields.map(f => [f.id, f])),
      Object.fromEntries(targetPort.fields.map(f => [f.id, f])),
      config
    );

    if (!mappingValidation.isValid) {
      invalidMappings.push(mapping.targetField);
      errors.push(...mappingValidation.errors);
    }
    if (mappingValidation.warnings.length > 0) {
      warnings.push(...mappingValidation.warnings);
    }
  }

  // Validate transformations
  if (flow.transformations) {
    for (const transformation of flow.transformations) {
      const transformValidation = validateTransformation(
        transformation,
        null,
        null,
        config
      );
      if (!transformValidation.isValid) {
        errors.push(...transformValidation.errors);
      }
      if (transformValidation.warnings.length > 0) {
        warnings.push(...transformValidation.warnings);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    portsCompatible: portsCompatible.isValid,
    requiredFieldsMapped: missingMappings.length === 0,
    typeCompatible: portsCompatible.isValid,
    missingMappings,
    invalidMappings
  };
}

/**
 * Validate transformation
 */
export function validateTransformation(
  transformation: DataTransformation,
  sourceField?: DataField | null,
  targetField?: DataField | null,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): TransformationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate transformation type
  const validTypes = Object.values(TransformationType);
  if (!validTypes.includes(transformation.type as TransformationType)) {
    errors.push(`Invalid transformation type: ${transformation.type}`);
  }

  // Validate configuration based on type
  switch (transformation.type) {
    case TransformationType.RENAME:
      if (!transformation.config.newName) {
        errors.push('Rename transformation requires newName configuration');
      }
      break;

    case TransformationType.FILTER:
      if (!transformation.config.condition) {
        errors.push('Filter transformation requires condition configuration');
      }
      break;

    case TransformationType.TRANSFORM:
      if (!transformation.config.operation) {
        errors.push('Transform transformation requires operation configuration');
      }
      break;

    case TransformationType.AGGREGATE:
      if (!transformation.config.function) {
        errors.push('Aggregate transformation requires function configuration');
      }
      break;

    case TransformationType.FORMAT:
      if (!transformation.config.format) {
        errors.push('Format transformation requires format configuration');
      }
      break;
  }

  // Validate field compatibility if fields are provided
  if (sourceField && targetField) {
    const canApply = canApplyTransformation(transformation.type, sourceField.type, targetField.type);
    if (!canApply) {
      errors.push(`Cannot apply ${transformation.type} transformation from ${sourceField.type} to ${targetField.type}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canApply: errors.length === 0
  };
}

/**
 * Validate condition
 */
export function validateCondition(
  condition: any,
  availableFields: Record<string, DataField>,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ConditionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fieldExists = condition.field in availableFields;
  const operatorValid = Object.values(ConditionOperator).includes(condition.operator);
  let valueCompatible = true;

  if (!fieldExists) {
    errors.push(`Field '${condition.field}' does not exist`);
  }

  if (!operatorValid) {
    errors.push(`Invalid operator: ${condition.operator}`);
  }

  if (fieldExists && operatorValid) {
    const field = availableFields[condition.field];
    valueCompatible = isConditionValueCompatible(condition.operator, condition.value, field.type);
    
    if (!valueCompatible) {
      errors.push(`Value '${condition.value}' is not compatible with field type '${field.type}' for operator '${condition.operator}'`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fieldExists,
    operatorValid,
    valueCompatible
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get the type of a value
 */
export function getValueType(value: any): DataType {
  if (value === null || value === undefined) {
    return DataType.STRING; // Default type
  }

  if (typeof value === 'string') {
    // Check for specific string types
    if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
      return DataType.EMAIL;
    }
    if (/^https?:\/\/.+/.test(value)) {
      return DataType.URL;
    }
    return DataType.STRING;
  }

  if (typeof value === 'number') {
    return DataType.NUMBER;
  }

  if (typeof value === 'boolean') {
    return DataType.BOOLEAN;
  }

  if (value instanceof Date) {
    return DataType.DATE;
  }

  if (Array.isArray(value)) {
    return DataType.ARRAY;
  }

  if (typeof value === 'object') {
    return DataType.OBJECT;
  }

  return DataType.STRING;
}

/**
 * Check if two types are compatible
 */
export function isTypeCompatible(
  sourceType: DataType,
  targetType: DataType,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): boolean {
  if (sourceType === targetType) {
    return true;
  }

  if (!config.strictTypes) {
    const compatibleTypes = TYPE_COMPATIBILITY[sourceType] || [];
    return compatibleTypes.includes(targetType);
  }

  return false;
}

/**
 * Check if type conversion is possible
 */
export function canConvertType(sourceType: DataType, targetType: DataType): boolean {
  const compatibleTypes = TYPE_COMPATIBILITY[sourceType] || [];
  return compatibleTypes.includes(targetType);
}

/**
 * Validate port compatibility
 */
export function validatePortCompatibility(
  sourcePort: DataPort,
  targetPort: DataPort,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if ports are of opposite types
  if (sourcePort.type === targetPort.type) {
    errors.push(`Cannot connect ${sourcePort.type} port to ${targetPort.type} port`);
  }

  // Check field compatibility
  const sourceFields = Object.fromEntries(sourcePort.fields.map(f => [f.id, f]));
  const targetFields = Object.fromEntries(targetPort.fields.map(f => [f.id, f]));

  for (const targetField of targetPort.fields) {
    if (targetField.required) {
      const compatibleSourceField = sourcePort.fields.find(sf => 
        isTypeCompatible(sf.type, targetField.type, config)
      );
      
      if (!compatibleSourceField) {
        errors.push(`No compatible source field found for required target field '${targetField.name}'`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Check if condition value is compatible with field type
 */
export function isConditionValueCompatible(
  operator: ConditionOperator,
  value: any,
  fieldType: DataType
): boolean {
  switch (operator) {
    case ConditionOperator.EQUALS:
    case ConditionOperator.NOT_EQUALS:
      return true; // All types support equality

    case ConditionOperator.GREATER_THAN:
    case ConditionOperator.LESS_THAN:
    case ConditionOperator.GREATER_EQUAL:
    case ConditionOperator.LESS_EQUAL:
      return fieldType === DataType.NUMBER || fieldType === DataType.DATE;

    case ConditionOperator.CONTAINS:
    case ConditionOperator.NOT_CONTAINS:
    case ConditionOperator.STARTS_WITH:
    case ConditionOperator.ENDS_WITH:
      return fieldType === DataType.STRING || fieldType === DataType.ARRAY;

    case ConditionOperator.IS_EMPTY:
    case ConditionOperator.IS_NOT_EMPTY:
    case ConditionOperator.IS_NULL:
    case ConditionOperator.IS_NOT_NULL:
      return true; // All types support null/empty checks

    case ConditionOperator.IN:
    case ConditionOperator.NOT_IN:
      return Array.isArray(value);

    default:
      return false;
  }
}

/**
 * Check if transformation can be applied
 */
export function canApplyTransformation(
  transformationType: TransformationType,
  sourceType: DataType,
  targetType: DataType
): boolean {
  switch (transformationType) {
    case TransformationType.RENAME:
      return true; // Always possible

    case TransformationType.FILTER:
      return sourceType === targetType;

    case TransformationType.TRANSFORM:
      return isTypeCompatible(sourceType, targetType, { strictTypes: false } as ValidationConfig);

    case TransformationType.AGGREGATE:
      return sourceType === DataType.ARRAY && targetType === DataType.NUMBER;

    case TransformationType.CONCATENATE:
      return sourceType === DataType.STRING && targetType === DataType.STRING;

    case TransformationType.SPLIT:
      return sourceType === DataType.STRING && targetType === DataType.ARRAY;

    case TransformationType.FORMAT:
      return sourceType === DataType.DATE && targetType === DataType.STRING;

    case TransformationType.VALIDATE:
      return sourceType === targetType;

    default:
      return false;
  }
}

/**
 * Validate complete workflow data flow
 */
export function validateWorkflowDataFlow(
  nodes: EditorNode[],
  edges: EditorEdge[],
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each node's data schema
  for (const node of nodes) {
    const nodeSchema = getNodeSchema(node.type as NodeType);
    const nodePorts = getNodePorts(node.type as NodeType);

    if (node.dataSchema) {
      // Validate node's custom schema against default
      const schemaValidation = validateNodeSchema(node.dataSchema, nodeSchema, config);
      if (!schemaValidation.isValid) {
        errors.push(`Node ${node.id}: ${schemaValidation.errors.join(', ')}`);
      }
    }

    if (node.dataPorts) {
      // Validate node's custom ports against default
      const portsValidation = validateNodePorts(node.dataPorts, nodePorts, config);
      if (!portsValidation.isValid) {
        errors.push(`Node ${node.id}: ${portsValidation.errors.join(', ')}`);
      }
    }
  }

  // Validate edges and data flows
  for (const edge of edges) {
    if (edge.dataFlow) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourcePorts = sourceNode.dataPorts || getNodePorts(sourceNode.type as NodeType);
        const targetPorts = targetNode.dataPorts || getNodePorts(targetNode.type as NodeType);

        const sourcePort = sourcePorts.find(p => p.id === edge.dataFlow?.sourcePortId);
        const targetPort = targetPorts.find(p => p.id === edge.dataFlow?.targetPortId);

        if (sourcePort && targetPort) {
          const flowValidation = validateDataFlow(edge.dataFlow, sourcePort, targetPort, config);
          if (!flowValidation.isValid) {
            errors.push(`Edge ${edge.id}: ${flowValidation.errors.join(', ')}`);
          }
          if (flowValidation.warnings.length > 0) {
            warnings.push(`Edge ${edge.id}: ${flowValidation.warnings.join(', ')}`);
          }
        } else {
          errors.push(`Edge ${edge.id}: Invalid port configuration`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate node schema against default schema
 */
export function validateNodeSchema(
  customSchema: DataSchema,
  defaultSchema: DataSchema,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if required fields from default schema are present
  for (const [fieldId, field] of Object.entries(defaultSchema.output)) {
    if (field.required && !(fieldId in customSchema.output)) {
      errors.push(`Required output field '${field.name}' is missing`);
    }
  }

  // Validate field types
  for (const [fieldId, customField] of Object.entries(customSchema.output)) {
    const defaultField = defaultSchema.output[fieldId];
    if (defaultField) {
      if (customField.type !== defaultField.type) {
        if (config.strictTypes) {
          errors.push(`Field '${customField.name}' type mismatch: expected ${defaultField.type}, got ${customField.type}`);
        } else {
          warnings.push(`Field '${customField.name}' type differs from default: ${defaultField.type} vs ${customField.type}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate node ports against default ports
 */
export function validateNodePorts(
  customPorts: DataPort[],
  defaultPorts: DataPort[],
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if required ports are present
  const requiredDefaultPorts = defaultPorts.filter(p => p.required);
  for (const requiredPort of requiredDefaultPorts) {
    const hasPort = customPorts.some(p => p.type === requiredPort.type && p.position === requiredPort.position);
    if (!hasPort) {
      errors.push(`Required ${requiredPort.type} port at ${requiredPort.position} is missing`);
    }
  }

  // Validate port configurations
  for (const customPort of customPorts) {
    const defaultPort = defaultPorts.find(p => p.type === customPort.type && p.position === customPort.position);
    if (defaultPort) {
      // Check if required fields are present
      for (const requiredField of defaultPort.fields.filter(f => f.required)) {
        const hasField = customPort.fields.some(f => f.id === requiredField.id);
        if (!hasField) {
          errors.push(`Required field '${requiredField.name}' is missing in ${customPort.type} port`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
} 