import React, { useState, useEffect } from 'react';
import { DataCondition, ConditionOperator, DataField, DataType } from '@flowcraft/shared-types';

interface ConditionEditorProps {
  conditions: DataCondition[];
  availableFields: Record<string, DataField>;
  onConditionsChange: (conditions: DataCondition[]) => void;
  className?: string;
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({
  conditions,
  availableFields,
  onConditionsChange,
  className = ''
}) => {
  const [localConditions, setLocalConditions] = useState<DataCondition[]>(conditions);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  // Operadores disponibles por tipo de campo
  const getOperatorsForType = (fieldType: DataType): ConditionOperator[] => {
    switch (fieldType) {
      case DataType.STRING:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.STARTS_WITH,
          ConditionOperator.ENDS_WITH,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      case DataType.NUMBER:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.GREATER_THAN,
          ConditionOperator.LESS_THAN,
          ConditionOperator.GREATER_EQUAL,
          ConditionOperator.LESS_EQUAL,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      case DataType.BOOLEAN:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      case DataType.ARRAY:
        return [
          ConditionOperator.CONTAINS,
          ConditionOperator.NOT_CONTAINS,
          ConditionOperator.IS_EMPTY,
          ConditionOperator.IS_NOT_EMPTY,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
      default:
        return [
          ConditionOperator.EQUALS,
          ConditionOperator.NOT_EQUALS,
          ConditionOperator.IS_NULL,
          ConditionOperator.IS_NOT_NULL
        ];
    }
  };

  // Obtener el tipo de campo por nombre
  const getFieldType = (fieldName: string): DataType => {
    return availableFields[fieldName]?.type || DataType.STRING;
  };

  // Agregar nueva condición
  const addCondition = () => {
    const newCondition: DataCondition = {
      id: `condition_${Date.now()}`,
      field: '',
      operator: ConditionOperator.EQUALS,
      value: '',
      enabled: true,
      description: ''
    };
    const updatedConditions = [...localConditions, newCondition];
    setLocalConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  // Actualizar condición
  const updateCondition = (id: string, updates: Partial<DataCondition>) => {
    const updatedConditions = localConditions.map(condition =>
      condition.id === id ? { ...condition, ...updates } : condition
    );
    setLocalConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  // Eliminar condición
  const removeCondition = (id: string) => {
    const updatedConditions = localConditions.filter(condition => condition.id !== id);
    setLocalConditions(updatedConditions);
    onConditionsChange(updatedConditions);
  };

  // Evaluar condición para preview
  const evaluateCondition = (condition: DataCondition): boolean => {
    if (!condition.field || !condition.enabled) return true;

    const fieldValue = previewData[condition.field];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === conditionValue;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== conditionValue;
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue);
      case ConditionOperator.GREATER_EQUAL:
        return Number(fieldValue) >= Number(conditionValue);
      case ConditionOperator.LESS_EQUAL:
        return Number(fieldValue) <= Number(conditionValue);
      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(conditionValue));
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(conditionValue));
      case ConditionOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(conditionValue));
      case ConditionOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(conditionValue));
      case ConditionOperator.IS_EMPTY:
        return !fieldValue || String(fieldValue).length === 0;
      case ConditionOperator.IS_NOT_EMPTY:
        return fieldValue && String(fieldValue).length > 0;
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return true;
    }
  };

  // Evaluar todas las condiciones
  const evaluateAllConditions = (): boolean => {
    if (localConditions.length === 0) return true;
    return localConditions.every(condition => evaluateCondition(condition));
  };

  // Generar datos de ejemplo para preview
  const generatePreviewData = () => {
    const data: Record<string, any> = {};
    Object.entries(availableFields).forEach(([fieldName, field]) => {
      switch (field.type) {
        case DataType.STRING:
          data[fieldName] = field.example || 'example string';
          break;
        case DataType.NUMBER:
          data[fieldName] = field.example || 42;
          break;
        case DataType.BOOLEAN:
          data[fieldName] = field.example || true;
          break;
        case DataType.ARRAY:
          data[fieldName] = field.example || ['item1', 'item2'];
          break;
        default:
          data[fieldName] = field.example || null;
      }
    });
    setPreviewData(data);
  };

  useEffect(() => {
    generatePreviewData();
  }, [availableFields]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Condition Editor</h3>
        <button
          onClick={addCondition}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Condition
        </button>
      </div>

      {/* Lista de condiciones */}
      <div className="space-y-3">
        {localConditions.map((condition, index) => (
          <div key={condition.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Condition {index + 1}</h4>
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={condition.enabled}
                    onChange={(e) => updateCondition(condition.id, { enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Enabled</span>
                </label>
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Campo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a field</option>
                  {Object.keys(availableFields).map(fieldName => (
                    <option key={fieldName} value={fieldName}>
                      {fieldName} ({availableFields[fieldName].type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value as ConditionOperator })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {condition.field && getOperatorsForType(getFieldType(condition.field)).map(operator => (
                    <option key={operator} value={operator}>
                      {operator.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                  placeholder="Enter value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Resultado de evaluación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
                <div className={`px-3 py-2 rounded-md text-sm font-medium ${
                  evaluateCondition(condition) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {evaluateCondition(condition) ? 'True' : 'False'}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={condition.description || ''}
                onChange={(e) => updateCondition(condition.id, { description: e.target.value })}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}

        {localConditions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No conditions defined. Click "Add Condition" to get started.
          </div>
        )}
      </div>

      {/* Preview de evaluación */}
      {localConditions.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Evaluation Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Data</h5>
              <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                <pre className="whitespace-pre-wrap">{JSON.stringify(previewData, null, 2)}</pre>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Overall Result</h5>
              <div className={`px-4 py-3 rounded-md text-lg font-medium text-center ${
                evaluateAllConditions() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {evaluateAllConditions() ? 'ALL CONDITIONS PASS' : 'SOME CONDITIONS FAIL'}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {localConditions.filter(c => c.enabled).length} of {localConditions.length} conditions enabled
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionEditor; 