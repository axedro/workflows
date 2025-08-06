/**
 * Data Validation Service - FlowCraft Workflow Automation Platform
 *
 * This module provides comprehensive validation for the workflow data flow system.
 */
import { DataType, TransformationType } from './data-flow';
// ===== DEFAULT CONFIGURATION =====
export const DEFAULT_VALIDATION_CONFIG = {
    strictTypes: true,
    allowTypeConversion: false,
    validateRequired: true,
    showWarnings: true
};
// ===== TYPE COMPATIBILITY MATRIX =====
export const TYPE_COMPATIBILITY = {
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
// ===== CORE VALIDATION FUNCTIONS =====
/**
 * Validates a single data field against its type and rules
 */
export function validateDataField(field, value) {
    const errors = [];
    const warnings = [];
    // Type validation
    const valueType = getValueType(value);
    if (!isTypeCompatible(field.type, valueType)) {
        errors.push(`Value type '${valueType}' is not compatible with field type '${field.type}'`);
    }
    // Rule validation
    if (field.validation) {
        const ruleErrors = validateFieldRules(field, value);
        errors.push(...ruleErrors);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates field type compatibility
 */
export function validateFieldType(expectedType, value) {
    const errors = [];
    const warnings = [];
    const actualType = getValueType(value);
    if (!isTypeCompatible(expectedType, actualType)) {
        errors.push(`Expected type '${expectedType}', got '${actualType}'`);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates field validation rules
 */
export function validateFieldRules(field, value) {
    const errors = [];
    if (!field.validation)
        return errors;
    const rules = field.validation;
    // Min/Max length for strings
    if (field.type === DataType.STRING && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Minimum length is ${rules.minLength}, got ${value.length}`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Maximum length is ${rules.maxLength}, got ${value.length}`);
        }
    }
    // Min/Max for numbers
    if (field.type === DataType.NUMBER && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
            errors.push(`Minimum value is ${rules.min}, got ${value}`);
        }
        if (rules.max !== undefined && value > rules.max) {
            errors.push(`Maximum value is ${rules.max}, got ${value}`);
        }
    }
    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
            errors.push(`Value does not match pattern: ${rules.pattern}`);
        }
    }
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`Value must be one of: ${rules.enum.join(', ')}`);
    }
    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
        const result = rules.custom(value);
        if (result === false) {
            errors.push(`Custom validation failed for field '${field.name}'`);
        }
        else if (typeof result === 'string') {
            errors.push(result);
        }
    }
    return errors;
}
/**
 * Validates a data port
 */
export function validateDataPort(port, data) {
    const errors = [];
    const warnings = [];
    // Check required fields
    for (const field of port.fields) {
        if (field.required && (data[field.id] === undefined || data[field.id] === null || data[field.id] === '')) {
            errors.push(`Required field '${field.name}' is missing in port '${port.name}'`);
        }
    }
    // Validate field values
    for (const field of port.fields) {
        if (data[field.id] !== undefined && data[field.id] !== null) {
            const fieldValidation = validateDataField(field, data[field.id]);
            if (!fieldValidation.isValid) {
                errors.push(...fieldValidation.errors.map(e => `${field.name}: ${e}`));
            }
            warnings.push(...fieldValidation.warnings.map(w => `${field.name}: ${w}`));
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates a field mapping between source and target fields
 */
export function validateFieldMapping(mapping, sourceField, targetField) {
    const errors = [];
    const warnings = [];
    // Check type compatibility
    if (!isTypeCompatible(targetField.type, sourceField.type)) {
        errors.push(`Cannot map ${sourceField.type} to ${targetField.type}`);
    }
    // Validate transformation if present
    if (mapping.transformation) {
        const transformValidation = validateTransformation({
            id: mapping.transformation.type,
            type: mapping.transformation.type,
            config: mapping.transformation.config,
            enabled: true,
            order: 0
        }, sourceField.type, targetField.type);
        if (!transformValidation.isValid) {
            errors.push(...transformValidation.errors);
        }
        warnings.push(...transformValidation.warnings);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates a complete data flow between two ports
 */
export function validateDataFlow(flow, sourcePort, targetPort) {
    const errors = [];
    const warnings = [];
    // Check port compatibility
    if (sourcePort.type === targetPort.type) {
        errors.push('Cannot connect ports of the same type');
    }
    // Validate required field mappings
    const requiredTargetFields = targetPort.fields.filter(f => f.required);
    const mappedTargetFields = flow.fieldMappings.map(m => m.targetField);
    for (const requiredField of requiredTargetFields) {
        if (!mappedTargetFields.includes(requiredField.id)) {
            errors.push(`Required field '${requiredField.name}' is not mapped`);
        }
    }
    // Validate individual mappings
    for (const mapping of flow.fieldMappings) {
        const sourceField = sourcePort.fields.find(f => f.id === mapping.sourceField);
        const targetField = targetPort.fields.find(f => f.id === mapping.targetField);
        if (!sourceField) {
            errors.push(`Source field '${mapping.sourceField}' not found`);
            continue;
        }
        if (!targetField) {
            errors.push(`Target field '${mapping.targetField}' not found`);
            continue;
        }
        const mappingValidation = validateFieldMapping(mapping, sourceField, targetField);
        if (!mappingValidation.isValid) {
            errors.push(...mappingValidation.errors);
        }
        warnings.push(...mappingValidation.warnings);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates a data transformation
 */
export function validateTransformation(transformation, inputType, outputType) {
    const errors = [];
    const warnings = [];
    // Check if transformation can be applied to input type
    if (!canApplyTransformation(transformation.type, inputType, outputType)) {
        errors.push(`Transformation '${transformation.type}' cannot be applied from ${inputType} to ${outputType}`);
    }
    // Validate transformation configuration
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
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates a data condition
 */
export function validateCondition(condition, availableFields) {
    const errors = [];
    const warnings = [];
    // Check if field exists
    const field = availableFields.find(f => f.id === condition.field);
    if (!field) {
        errors.push(`Field '${condition.field}' not found`);
        return { isValid: false, errors, warnings };
    }
    // Check if operator is valid for field type
    if (!isConditionOperatorValid(condition.operator, field.type)) {
        errors.push(`Operator '${condition.operator}' is not valid for field type '${field.type}'`);
    }
    // Check if value is compatible with field type
    if (!isConditionValueCompatible(condition.value, field.type)) {
        errors.push(`Value is not compatible with field type '${field.type}'`);
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
/**
 * Validates the entire workflow's data flow
 */
export function validateWorkflowDataFlow(nodes, edges) {
    const errors = [];
    const warnings = [];
    // Validate each node's data flow
    for (const node of nodes) {
        if (node.data && node.data.inputPorts) {
            for (const port of node.data.inputPorts) {
                const portValidation = validateDataPort(port, {});
                if (!portValidation.isValid) {
                    errors.push(`Node ${node.id}: ${portValidation.errors.join(', ')}`);
                }
                warnings.push(...portValidation.warnings.map(w => `Node ${node.id}: ${w}`));
            }
        }
    }
    // Validate edge connections
    for (const edge of edges) {
        if (edge.data && edge.data.dataFlow) {
            // For now, create dummy ports for validation
            const dummySourcePort = {
                id: 'dummy-source',
                name: 'Source',
                type: 'output',
                fields: [],
                position: 'right',
                required: false
            };
            const dummyTargetPort = {
                id: 'dummy-target',
                name: 'Target',
                type: 'input',
                fields: [],
                position: 'left',
                required: false
            };
            const flowValidation = validateDataFlow(edge.data.dataFlow, dummySourcePort, dummyTargetPort);
            if (!flowValidation.isValid) {
                errors.push(`Edge ${edge.id}: ${flowValidation.errors.join(', ')}`);
            }
            warnings.push(...flowValidation.warnings.map(w => `Edge ${edge.id}: ${w}`));
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
// ===== UTILITY FUNCTIONS =====
/**
 * Gets the type of a value
 */
export function getValueType(value) {
    if (value === null || value === undefined)
        return DataType.STRING;
    if (typeof value === 'string')
        return DataType.STRING;
    if (typeof value === 'number')
        return DataType.NUMBER;
    if (typeof value === 'boolean')
        return DataType.BOOLEAN;
    if (Array.isArray(value))
        return DataType.ARRAY;
    if (value instanceof Date)
        return DataType.DATE;
    if (typeof value === 'object')
        return DataType.OBJECT;
    return DataType.STRING;
}
/**
 * Checks if two types are compatible
 */
export function isTypeCompatible(targetType, sourceType) {
    const compatibleTypes = TYPE_COMPATIBILITY[targetType] || [];
    return compatibleTypes.includes(sourceType) || targetType === sourceType;
}
/**
 * Checks if a type can be converted to another type
 */
export function canConvertType(fromType, toType) {
    return isTypeCompatible(toType, fromType);
}
/**
 * Checks if ports are compatible for connection
 */
export function validatePortCompatibility(sourcePort, targetPort) {
    return sourcePort.type !== targetPort.type;
}
/**
 * Checks if a condition operator is valid for a field type
 */
export function isConditionOperatorValid(operator, fieldType) {
    const stringOperators = ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'];
    const numberOperators = ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'];
    const booleanOperators = ['equals', 'not_equals'];
    const arrayOperators = ['contains', 'not_contains', 'is_empty', 'is_not_empty'];
    switch (fieldType) {
        case DataType.STRING:
        case DataType.EMAIL:
        case DataType.URL:
            return stringOperators.includes(operator);
        case DataType.NUMBER:
            return numberOperators.includes(operator);
        case DataType.BOOLEAN:
            return booleanOperators.includes(operator);
        case DataType.ARRAY:
            return arrayOperators.includes(operator);
        default:
            return true;
    }
}
/**
 * Checks if a condition value is compatible with a field type
 */
export function isConditionValueCompatible(value, fieldType) {
    const valueType = getValueType(value);
    return isTypeCompatible(fieldType, valueType);
}
/**
 * Checks if a transformation can be applied to the given types
 */
export function canApplyTransformation(_transformationType, sourceType, targetType) {
    // Basic compatibility check - in a real implementation, this would be more sophisticated
    return isTypeCompatible(targetType, sourceType);
}
//# sourceMappingURL=data-validation.js.map