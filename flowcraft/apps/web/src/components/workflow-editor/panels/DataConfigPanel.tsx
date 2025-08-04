import React, { useState, useEffect } from 'react';
import { 
  DataField, 
  FieldMapping, 
  DataTransformation, 
  TransformationType,
  DataFlow,
  FlowValidation,
  FieldMappingValidation,
  TransformationValidation
} from '@flowcraft/shared-types';

interface DataConfigPanelProps {
  /** Source node data schema */
  sourceSchema: Record<string, DataField>;
  /** Target node data schema */
  targetSchema: Record<string, DataField>;
  /** Current data flow configuration */
  dataFlow: DataFlow;
  /** Callback when data flow configuration changes */
  onDataFlowChange: (dataFlow: DataFlow) => void;
  /** Whether the panel is in read-only mode */
  readOnly?: boolean;
}

const DataConfigPanel: React.FC<DataConfigPanelProps> = ({
  sourceSchema,
  targetSchema,
  dataFlow,
  onDataFlowChange,
  readOnly = false,
}) => {
  const [localDataFlow, setLocalDataFlow] = useState<DataFlow>(dataFlow);
  const [activeTab, setActiveTab] = useState<'mapping' | 'transformations' | 'validation'>('mapping');

  // Update local state when props change
  useEffect(() => {
    setLocalDataFlow(dataFlow);
  }, [dataFlow]);





  const handleFieldMappingChange = (mappingId: string, updates: Partial<FieldMapping>) => {
    const updatedMappings = localDataFlow.fieldMappings.map(mapping => 
      mapping.sourceField === mappingId ? { ...mapping, ...updates } : mapping
    );

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      fieldMappings: updatedMappings,
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

  const addFieldMapping = () => {
    const newMapping: FieldMapping = {
      sourceField: '',
      targetField: '',
      required: false,
      description: '',
    };

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      fieldMappings: [...localDataFlow.fieldMappings, newMapping],
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

  const removeFieldMapping = (sourceField: string) => {
    const updatedMappings = localDataFlow.fieldMappings.filter(
      mapping => mapping.sourceField !== sourceField
    );

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      fieldMappings: updatedMappings,
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

  const addTransformation = () => {
    const newTransformation: DataTransformation = {
      id: `transformation_${Date.now()}`,
      type: TransformationType.RENAME,
      config: {},
      enabled: true,
      order: localDataFlow.transformations?.length || 0,
    };

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      transformations: [...(localDataFlow.transformations || []), newTransformation],
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

  const updateTransformation = (transformationId: string, updates: Partial<DataTransformation>) => {
    const updatedTransformations = (localDataFlow.transformations || []).map(transformation =>
      transformation.id === transformationId ? { ...transformation, ...updates } : transformation
    );

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      transformations: updatedTransformations,
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

  const removeTransformation = (transformationId: string) => {
    const updatedTransformations = (localDataFlow.transformations || []).filter(
      transformation => transformation.id !== transformationId
    );

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      transformations: updatedTransformations,
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

  const validateFieldMapping = (mapping: FieldMapping): FieldMappingValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if source field exists
    if (!sourceSchema[mapping.sourceField]) {
      errors.push(`Source field "${mapping.sourceField}" does not exist`);
    }

    // Check if target field exists
    if (!targetSchema[mapping.targetField]) {
      errors.push(`Target field "${mapping.targetField}" does not exist`);
    }

    // Check type compatibility
    const sourceField = sourceSchema[mapping.sourceField];
    const targetField = targetSchema[mapping.targetField];
    
    if (sourceField && targetField && sourceField.type !== targetField.type) {
      warnings.push(`Type mismatch: ${sourceField.type} → ${targetField.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      typeCompatible: sourceField && targetField ? sourceField.type === targetField.type : false,
      sourceExists: !!sourceSchema[mapping.sourceField],
      targetExists: !!targetSchema[mapping.targetField],
    };
  };

  const validateTransformation = (transformation: DataTransformation): TransformationValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation based on transformation type
    switch (transformation.type) {
      case TransformationType.RENAME:
        if (!transformation.config.newName) {
          errors.push('New name is required for rename transformation');
        }
        break;
      case TransformationType.FILTER:
        if (!transformation.config.condition) {
          errors.push('Filter condition is required');
        }
        break;
      case TransformationType.TRANSFORM:
        if (!transformation.config.expression) {
          errors.push('Transform expression is required');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canApply: true, // This would be more complex in a real implementation
    };
  };

  const renderFieldMappingTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Field Mappings</h3>
        <button
          onClick={addFieldMapping}
          disabled={readOnly}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Add Mapping
        </button>
      </div>

      <div className="space-y-3">
        {localDataFlow.fieldMappings.map((mapping, index) => {
          const validation = validateFieldMapping(mapping);
          const sourceField = sourceSchema[mapping.sourceField];
          const targetField = targetSchema[mapping.targetField];

          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-700">Mapping {index + 1}</h4>
                <button
                  onClick={() => removeFieldMapping(mapping.sourceField)}
                  disabled={readOnly}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Field
                  </label>
                  <select
                    value={mapping.sourceField}
                    onChange={(e) => handleFieldMappingChange(mapping.sourceField, { sourceField: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select source field</option>
                    {Object.entries(sourceSchema).map(([fieldId, field]) => (
                      <option key={fieldId} value={fieldId}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>
                  {sourceField && (
                    <p className="text-xs text-gray-500 mt-1">
                      {sourceField.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Field
                  </label>
                  <select
                    value={mapping.targetField}
                    onChange={(e) => handleFieldMappingChange(mapping.sourceField, { targetField: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select target field</option>
                    {Object.entries(targetSchema).map(([fieldId, field]) => (
                      <option key={fieldId} value={fieldId}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>
                  {targetField && (
                    <p className="text-xs text-gray-500 mt-1">
                      {targetField.description}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={mapping.description || ''}
                  onChange={(e) => handleFieldMappingChange(mapping.sourceField, { description: e.target.value })}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description of this mapping"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={mapping.required || false}
                  onChange={(e) => handleFieldMappingChange(mapping.sourceField, { required: e.target.checked })}
                  disabled={readOnly}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700">
                  Required mapping
                </label>
              </div>

              {/* Validation Status */}
              {!validation.isValid && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h5 className="text-sm font-medium text-red-800">Validation Errors</h5>
                  <ul className="mt-1 text-sm text-red-700">
                    {validation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <h5 className="text-sm font-medium text-yellow-800">Warnings</h5>
                  <ul className="mt-1 text-sm text-yellow-700">
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTransformationsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Data Transformations</h3>
        <button
          onClick={addTransformation}
          disabled={readOnly}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Add Transformation
        </button>
      </div>

      <div className="space-y-3">
        {(localDataFlow.transformations || []).map((transformation, index) => {
          const validation = validateTransformation(transformation);

          return (
            <div key={transformation.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-700">Transformation {index + 1}</h4>
                <button
                  onClick={() => removeTransformation(transformation.id)}
                  disabled={readOnly}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={transformation.type}
                    onChange={(e) => updateTransformation(transformation.id, { type: e.target.value as TransformationType })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(TransformationType).map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={transformation.order}
                    onChange={(e) => updateTransformation(transformation.id, { order: parseInt(e.target.value) })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={transformation.description || ''}
                  onChange={(e) => updateTransformation(transformation.id, { description: e.target.value })}
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description of this transformation"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`enabled-${transformation.id}`}
                  checked={transformation.enabled}
                  onChange={(e) => updateTransformation(transformation.id, { enabled: e.target.checked })}
                  disabled={readOnly}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`enabled-${transformation.id}`} className="ml-2 text-sm text-gray-700">
                  Enabled
                </label>
              </div>

              {/* Transformation-specific configuration */}
              {transformation.type === TransformationType.RENAME && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Field Name
                  </label>
                  <input
                    type="text"
                    value={transformation.config.newName || ''}
                    onChange={(e) => updateTransformation(transformation.id, { 
                      config: { ...transformation.config, newName: e.target.value }
                    })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new field name"
                  />
                </div>
              )}

              {transformation.type === TransformationType.FILTER && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter Condition
                  </label>
                  <textarea
                    value={transformation.config.condition || ''}
                    onChange={(e) => updateTransformation(transformation.id, { 
                      config: { ...transformation.config, condition: e.target.value }
                    })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter filter condition (e.g., value > 10)"
                    rows={3}
                  />
                </div>
              )}

              {transformation.type === TransformationType.TRANSFORM && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transform Expression
                  </label>
                  <textarea
                    value={transformation.config.expression || ''}
                    onChange={(e) => updateTransformation(transformation.id, { 
                      config: { ...transformation.config, expression: e.target.value }
                    })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter transform expression (e.g., value.toUpperCase())"
                    rows={3}
                  />
                </div>
              )}

              {/* Validation Status */}
              {!validation.isValid && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h5 className="text-sm font-medium text-red-800">Validation Errors</h5>
                  <ul className="mt-1 text-sm text-red-700">
                    {validation.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <h5 className="text-sm font-medium text-yellow-800">Warnings</h5>
                  <ul className="mt-1 text-sm text-yellow-700">
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderValidationTab = () => {
    const allMappingsValid = localDataFlow.fieldMappings.every(mapping => 
      validateFieldMapping(mapping).isValid
    );
    
    const allTransformationsValid = (localDataFlow.transformations || []).every(transformation =>
      validateTransformation(transformation).isValid
    );

    const overallValidation: FlowValidation = {
      isValid: allMappingsValid && allTransformationsValid,
      errors: [],
      warnings: [],
      portsCompatible: true,
      requiredFieldsMapped: true,
      typeCompatible: true,
    };

    // Collect all errors and warnings
    localDataFlow.fieldMappings.forEach(mapping => {
      const validation = validateFieldMapping(mapping);
      overallValidation.errors.push(...validation.errors);
      overallValidation.warnings.push(...validation.warnings);
    });

    (localDataFlow.transformations || []).forEach(transformation => {
      const validation = validateTransformation(transformation);
      overallValidation.errors.push(...validation.errors);
      overallValidation.warnings.push(...validation.warnings);
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Validation Summary</h3>

        {/* Overall Status */}
        <div className={`border rounded-lg p-4 ${
          overallValidation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              overallValidation.isValid ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <h4 className={`font-medium ${
              overallValidation.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {overallValidation.isValid ? 'Configuration is Valid' : 'Configuration has Errors'}
            </h4>
          </div>
        </div>

        {/* Field Mappings Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Field Mappings</h4>
          <div className="space-y-2">
            {localDataFlow.fieldMappings.map((mapping, index) => {
              const validation = validateFieldMapping(mapping);
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {mapping.sourceField || 'Unmapped'} → {mapping.targetField || 'Unmapped'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transformations Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Transformations</h4>
          <div className="space-y-2">
            {(localDataFlow.transformations || []).map((transformation) => {
              const validation = validateTransformation(transformation);
              return (
                <div key={transformation.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {transformation.type} (Order: {transformation.order})
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Errors and Warnings */}
        {overallValidation.errors.length > 0 && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Errors</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {overallValidation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {overallValidation.warnings.length > 0 && (
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {overallValidation.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Data Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure how data flows between nodes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'mapping', label: 'Field Mapping', icon: '🔗' },
            { id: 'transformations', label: 'Transformations', icon: '⚙️' },
            { id: 'validation', label: 'Validation', icon: '✅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'mapping' && renderFieldMappingTab()}
        {activeTab === 'transformations' && renderTransformationsTab()}
        {activeTab === 'validation' && renderValidationTab()}
      </div>
    </div>
  );
};

export default DataConfigPanel; 