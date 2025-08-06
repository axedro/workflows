/**
 * Data Validation Service - FlowCraft Workflow Automation Platform
 *
 * This module provides comprehensive validation for the workflow data flow system.
 */
import { DataField, DataType, DataPort, DataFlow, FieldMapping, DataTransformation, DataCondition, TransformationType, ValidationResult, ValidationConfig } from './data-flow';
export declare const DEFAULT_VALIDATION_CONFIG: ValidationConfig;
export declare const TYPE_COMPATIBILITY: Record<DataType, DataType[]>;
/**
 * Validates a single data field against its type and rules
 */
export declare function validateDataField(field: DataField, value: any): ValidationResult;
/**
 * Validates field type compatibility
 */
export declare function validateFieldType(expectedType: DataType, value: any): ValidationResult;
/**
 * Validates field validation rules
 */
export declare function validateFieldRules(field: DataField, value: any): string[];
/**
 * Validates a data port
 */
export declare function validateDataPort(port: DataPort, data: Record<string, any>): ValidationResult;
/**
 * Validates a field mapping between source and target fields
 */
export declare function validateFieldMapping(mapping: FieldMapping, sourceField: DataField, targetField: DataField): ValidationResult;
/**
 * Validates a complete data flow between two ports
 */
export declare function validateDataFlow(flow: DataFlow, sourcePort: DataPort, targetPort: DataPort): ValidationResult;
/**
 * Validates a data transformation
 */
export declare function validateTransformation(transformation: DataTransformation, inputType: DataType, outputType: DataType): ValidationResult;
/**
 * Validates a data condition
 */
export declare function validateCondition(condition: DataCondition, availableFields: DataField[]): ValidationResult;
/**
 * Validates the entire workflow's data flow
 */
export declare function validateWorkflowDataFlow(nodes: any[], edges: any[]): ValidationResult;
/**
 * Gets the type of a value
 */
export declare function getValueType(value: any): DataType;
/**
 * Checks if two types are compatible
 */
export declare function isTypeCompatible(targetType: DataType, sourceType: DataType): boolean;
/**
 * Checks if a type can be converted to another type
 */
export declare function canConvertType(fromType: DataType, toType: DataType): boolean;
/**
 * Checks if ports are compatible for connection
 */
export declare function validatePortCompatibility(sourcePort: DataPort, targetPort: DataPort): boolean;
/**
 * Checks if a condition operator is valid for a field type
 */
export declare function isConditionOperatorValid(operator: string, fieldType: DataType): boolean;
/**
 * Checks if a condition value is compatible with a field type
 */
export declare function isConditionValueCompatible(value: any, fieldType: DataType): boolean;
/**
 * Checks if a transformation can be applied to the given types
 */
export declare function canApplyTransformation(_transformationType: TransformationType, sourceType: DataType, targetType: DataType): boolean;
//# sourceMappingURL=data-validation.d.ts.map