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
export var DataType;
(function (DataType) {
    DataType["STRING"] = "string";
    DataType["NUMBER"] = "number";
    DataType["BOOLEAN"] = "boolean";
    DataType["OBJECT"] = "object";
    DataType["ARRAY"] = "array";
    DataType["DATE"] = "date";
    DataType["EMAIL"] = "email";
    DataType["URL"] = "url";
    DataType["FILE"] = "file";
    DataType["JSON"] = "json";
})(DataType || (DataType = {}));
// ===== DATA TRANSFORMATIONS =====
/**
 * Types of data transformations
 */
export var TransformationType;
(function (TransformationType) {
    TransformationType["RENAME"] = "rename";
    TransformationType["FILTER"] = "filter";
    TransformationType["TRANSFORM"] = "transform";
    TransformationType["AGGREGATE"] = "aggregate";
    TransformationType["CONCATENATE"] = "concatenate";
    TransformationType["SPLIT"] = "split";
    TransformationType["FORMAT"] = "format";
    TransformationType["VALIDATE"] = "validate";
})(TransformationType || (TransformationType = {}));
// ===== CONDITION LOGIC =====
/**
 * Operators for condition evaluation
 */
export var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["EQUALS"] = "equals";
    ConditionOperator["NOT_EQUALS"] = "not_equals";
    ConditionOperator["GREATER_THAN"] = "greater_than";
    ConditionOperator["LESS_THAN"] = "less_than";
    ConditionOperator["GREATER_EQUAL"] = "greater_equal";
    ConditionOperator["LESS_EQUAL"] = "less_equal";
    ConditionOperator["CONTAINS"] = "contains";
    ConditionOperator["NOT_CONTAINS"] = "not_contains";
    ConditionOperator["STARTS_WITH"] = "starts_with";
    ConditionOperator["ENDS_WITH"] = "ends_with";
    ConditionOperator["IS_EMPTY"] = "is_empty";
    ConditionOperator["IS_NOT_EMPTY"] = "is_not_empty";
    ConditionOperator["IS_NULL"] = "is_null";
    ConditionOperator["IS_NOT_NULL"] = "is_not_null";
    ConditionOperator["IN"] = "in";
    ConditionOperator["NOT_IN"] = "not_in";
})(ConditionOperator || (ConditionOperator = {}));
// All types are automatically exported by TypeScript 
//# sourceMappingURL=data-flow.js.map