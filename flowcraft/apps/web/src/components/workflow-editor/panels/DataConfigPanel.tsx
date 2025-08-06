import React, { useState, useEffect } from 'react';
import { 
  DataField, 
  FieldMapping, 
  DataTransformation, 
  TransformationType,
  DataFlow,
  FlowValidation,
  FieldMappingValidation,
  TransformationValidation,
  DataType,
  NodeType,
  getNodeSchema
} from '@flowcraft/shared-types';
import ConnectorValidationService from '../../../services/connectorValidation.service';

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
  const [activeTab, setActiveTab] = useState<'mapping' | 'transformations' | 'validation' | 'preview' | 'connectors'>('mapping');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [suggestions, setSuggestions] = useState<Array<{sourceField: string, targetField: string, confidence: number}>>([]);

  // Update local state when props change
  useEffect(() => {
    setLocalDataFlow(dataFlow);
  }, [dataFlow]);

  // Auto-generate mappings when dataFlow is empty and sourceSchema has fields
  useEffect(() => {
    if (dataFlow.fieldMappings.length === 0 && Object.keys(sourceSchema).length > 0) {
      // Only auto-generate if we don't already have mappings for these fields
      const existingSourceFields = new Set(dataFlow.fieldMappings.map(m => m.sourceField));
      const newSourceFields = Object.keys(sourceSchema).filter(field => !existingSourceFields.has(field));
      
      if (newSourceFields.length > 0) {
        const autoMappings: FieldMapping[] = newSourceFields.map(sourceField => ({
          sourceField: sourceField,
          targetField: sourceField, // Auto-map to same name
          required: false,
          description: `Auto-mapped from ${sourceField}`
        }));
        
        const updatedDataFlow: DataFlow = {
          ...dataFlow,
          fieldMappings: [...dataFlow.fieldMappings, ...autoMappings],
        };
        
        setLocalDataFlow(updatedDataFlow);
        onDataFlowChange(updatedDataFlow);
      }
    }
  }, [dataFlow, sourceSchema, onDataFlowChange]);

  // Debug: Log schemas to console
  useEffect(() => {
    console.log('DataConfigPanel - sourceSchema:', sourceSchema);
    console.log('DataConfigPanel - targetSchema:', targetSchema);
    console.log('DataConfigPanel - sourceSchema keys:', Object.keys(sourceSchema));
    console.log('DataConfigPanel - targetSchema keys:', Object.keys(targetSchema));
  }, [sourceSchema, targetSchema]);

  // Generate sample data for preview
  useEffect(() => {
    const sampleData: Record<string, any> = {};
    Object.entries(sourceSchema).forEach(([fieldId, field]) => {
      sampleData[fieldId] = generateSampleValue(field);
    });
    setPreviewData(sampleData);
  }, [sourceSchema]);

  // Generate field mapping suggestions
  useEffect(() => {
    const newSuggestions = generateFieldSuggestions(sourceSchema, targetSchema);
    setSuggestions(newSuggestions);
  }, [sourceSchema, targetSchema]);




  const generateSampleValue = (field: DataField): any => {
    switch (field.type) {
      case DataType.STRING:
        return field.example || `Sample ${field.name}`;
      case DataType.NUMBER:
        return field.example || 42;
      case DataType.BOOLEAN:
        return field.example || true;
      case DataType.ARRAY:
        return field.example || ['item1', 'item2'];
      case DataType.OBJECT:
        return field.example || { key: 'value' };
      case DataType.DATE:
        return field.example || new Date().toISOString();
      case DataType.EMAIL:
        return field.example || 'user@example.com';
      case DataType.URL:
        return field.example || 'https://example.com';
      default:
        return field.example || null;
    }
  };

  // Helper function to get available fields for dropdowns
  const getAvailableFields = (schema: Record<string, DataField>): Array<{value: string, label: string, type: string}> => {
    return Object.entries(schema).map(([fieldId, field]) => ({
      value: fieldId,
      label: `${field.name} (${field.type})`,
      type: field.type
    }));
  };

  const generateFieldSuggestions = (sourceSchema: Record<string, DataField>, targetSchema: Record<string, DataField>) => {
    const suggestions: Array<{sourceField: string, targetField: string, confidence: number}> = [];
    
    Object.entries(sourceSchema).forEach(([sourceFieldId, sourceField]) => {
      Object.entries(targetSchema).forEach(([targetFieldId, targetField]) => {
        let confidence = 0;
        
        // Exact name match
        if (sourceField.name.toLowerCase() === targetField.name.toLowerCase()) {
          confidence += 0.8;
        }
        
        // Similar name match
        if (sourceField.name.toLowerCase().includes(targetField.name.toLowerCase()) || 
            targetField.name.toLowerCase().includes(sourceField.name.toLowerCase())) {
          confidence += 0.4;
        }
        
        // Type compatibility
        if (sourceField.type === targetField.type) {
          confidence += 0.3;
        }
        
        // Description similarity
        if (sourceField.description && targetField.description) {
          const sourceWords = sourceField.description.toLowerCase().split(' ');
          const targetWords = targetField.description.toLowerCase().split(' ');
          const commonWords = sourceWords.filter(word => targetWords.includes(word));
          if (commonWords.length > 0) {
            confidence += 0.2 * (commonWords.length / Math.max(sourceWords.length, targetWords.length));
          }
        }
        
        if (confidence > 0.3) {
          suggestions.push({
            sourceField: sourceFieldId,
            targetField: targetFieldId,
            confidence: Math.min(confidence, 1)
          });
        }
      });
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const applySuggestion = (suggestion: {sourceField: string, targetField: string, confidence: number}) => {
    const newMapping: FieldMapping = {
      sourceField: suggestion.sourceField,
      targetField: suggestion.targetField,
      required: false,
      description: `Auto-mapped (${Math.round(suggestion.confidence * 100)}% confidence)`,
    };

    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      fieldMappings: [...localDataFlow.fieldMappings, newMapping],
    };

    setLocalDataFlow(updatedDataFlow);
    onDataFlowChange(updatedDataFlow);
  };

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
    // Auto-generate mappings for all source fields
    const newMappings: FieldMapping[] = Object.keys(sourceSchema).map(sourceField => ({
      sourceField: sourceField,
      targetField: sourceField, // Auto-map to same name
      required: false,
      description: `Auto-mapped from ${sourceField}`
    }));
    
    const updatedDataFlow: DataFlow = {
      ...localDataFlow,
      fieldMappings: [...localDataFlow.fieldMappings, ...newMappings],
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

    // Check if target field name is provided
    if (!mapping.targetField || mapping.targetField.trim() === '') {
      errors.push(`Target field name is required`);
    }

    // Check if target field name is valid (no spaces, special chars)
    if (mapping.targetField && !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(mapping.targetField)) {
      errors.push(`Target field name must be a valid identifier (letters, numbers, dots, underscores)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      typeCompatible: true, // Since we don't validate against target schema anymore
      sourceExists: !!sourceSchema[mapping.sourceField],
      targetExists: true, // Since target fields are free text
    };
  };

  const validateTransformation = (transformation: DataTransformation): TransformationValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation based on transformation type
    switch (transformation.type) {
      case TransformationType.RENAME:
        if (!transformation.config.oldName) {
          errors.push('Old field name is required for rename transformation');
        }
        if (!transformation.config.newName) {
          errors.push('New field name is required for rename transformation');
        }
        break;
      case TransformationType.FILTER:
        if (!transformation.config.field) {
          errors.push('Filter field is required');
        }
        if (!transformation.config.operator) {
          errors.push('Filter operator is required');
        }
        if (transformation.config.value === undefined || transformation.config.value === '') {
          errors.push('Filter value is required');
        }
        break;
      case TransformationType.TRANSFORM:
        if (!transformation.config.field) {
          errors.push('Target field is required for transform');
        }
        if (!transformation.config.expression) {
          errors.push('Transform expression is required');
        }
        break;
      case TransformationType.FORMAT:
        if (!transformation.config.field) {
          errors.push('Target field is required for format');
        }
        if (!transformation.config.formatType) {
          errors.push('Format type is required');
        }
        break;
      case TransformationType.CONCATENATE:
        if (!transformation.config.fields || transformation.config.fields.length === 0) {
          errors.push('Source fields are required for concatenate');
        }
        if (!transformation.config.targetField) {
          errors.push('Target field is required for concatenate');
        }
        break;
      case TransformationType.AGGREGATE:
        if (!transformation.config.fields || transformation.config.fields.length === 0) {
          errors.push('Source fields are required for aggregate');
        }
        if (!transformation.config.targetField) {
          errors.push('Target field is required for aggregate');
        }
        if (!transformation.config.function) {
          errors.push('Aggregation function is required');
        }
        break;
      case TransformationType.SPLIT:
        if (!transformation.config.sourceField) {
          errors.push('Source field is required for split');
        }
        if (!transformation.config.targetFields) {
          errors.push('Target fields are required for split');
        }
        break;
      case TransformationType.VALIDATE:
        if (!transformation.config.field) {
          errors.push('Target field is required for validation');
        }
        if (!transformation.config.rule) {
          errors.push('Validation rule is required');
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
        <div className="flex space-x-2">
          <button
            onClick={addFieldMapping}
            disabled={readOnly}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Add Mapping
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={readOnly}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            Preview Data
          </button>
        </div>
      </div>

      {/* Auto-suggestions */}
      {suggestions.length > 0 && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h4 className="text-sm font-medium text-blue-800 mb-3">💡 Field Mapping Suggestions</h4>
          <div className="space-y-2">
            {suggestions.slice(0, 5).map((suggestion, index) => {
              const sourceField = sourceSchema[suggestion.sourceField];
              const targetField = targetSchema[suggestion.targetField];
              const isAlreadyMapped = localDataFlow.fieldMappings.some(
                mapping => mapping.sourceField === suggestion.sourceField || mapping.targetField === suggestion.targetField
              );
              
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      {sourceField?.name} → {targetField?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Confidence: {Math.round(suggestion.confidence * 100)}% | 
                      Types: {sourceField?.type} → {targetField?.type}
                    </div>
                  </div>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    disabled={readOnly || isAlreadyMapped}
                    className={`px-2 py-1 text-xs rounded ${
                      isAlreadyMapped 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isAlreadyMapped ? 'Already Mapped' : 'Apply'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {localDataFlow.fieldMappings.map((mapping, index) => {
          const validation = validateFieldMapping(mapping);
          const sourceField = sourceSchema[mapping.sourceField];

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
                  <input
                    type="text"
                    value={mapping.targetField}
                    onChange={(e) => handleFieldMappingChange(mapping.sourceField, { targetField: e.target.value })}
                    disabled={readOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter target field name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Free text field - you can rename the target field
                  </p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Old Field Name
                    </label>
                    <select
                      value={transformation.config.oldName || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, oldName: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select source field</option>
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                </div>
              )}

              {transformation.type === TransformationType.FILTER && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter Field
                    </label>
                    <select
                      value={transformation.config.field || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, field: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field to filter</option>
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter Operator
                    </label>
                    <select
                      value={transformation.config.operator || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, operator: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select operator</option>
                      <option value="equals">Equals</option>
                      <option value="not_equals">Not Equals</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                      <option value="contains">Contains</option>
                      <option value="starts_with">Starts With</option>
                      <option value="ends_with">Ends With</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter Value
                    </label>
                    <input
                      type="text"
                      value={transformation.config.value || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, value: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter filter value"
                    />
                  </div>
                </div>
              )}

              {transformation.type === TransformationType.FORMAT && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Field
                    </label>
                    <select
                      value={transformation.config.field || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, field: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field to format</option>
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Format Type
                    </label>
                    <select
                      value={transformation.config.formatType || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, formatType: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select format</option>
                      <option value="date">Date Format</option>
                      <option value="currency">Currency Format</option>
                      <option value="phone">Phone Number Format</option>
                      <option value="email">Email Format</option>
                      <option value="url">URL Format</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Format Pattern
                    </label>
                    <input
                      type="text"
                      value={transformation.config.pattern || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, pattern: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter format pattern (e.g., YYYY-MM-DD)"
                    />
                  </div>
                </div>
              )}

              {transformation.type === TransformationType.TRANSFORM && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Field
                    </label>
                    <select
                      value={transformation.config.field || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, field: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field to transform</option>
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transform Operation
                    </label>
                    <select
                      value={transformation.config.expression || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, expression: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select operation</option>
                      <option value="toUpperCase">Convert to Uppercase</option>
                      <option value="toLowerCase">Convert to Lowercase</option>
                      <option value="toString">Convert to String</option>
                      <option value="toNumber">Convert to Number</option>
                      <option value="trim">Trim Whitespace</option>
                      <option value="capitalize">Capitalize First Letter</option>
                    </select>
                  </div>
                </div>
              )}

              {transformation.type === TransformationType.CONCATENATE && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Fields
                    </label>
                    <select
                      multiple
                      value={transformation.config.fields || []}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        updateTransformation(transformation.id, { 
                          config: { ...transformation.config, fields: selectedOptions }
                        });
                      }}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      size={4}
                    >
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple fields</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Field
                    </label>
                    <input
                      type="text"
                      value={transformation.config.targetField || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, targetField: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter target field name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Separator
                    </label>
                    <input
                      type="text"
                      value={transformation.config.separator || ' '}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, separator: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Separator between fields (default: space)"
                    />
                  </div>
                </div>
              )}

              {transformation.type === TransformationType.AGGREGATE && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Fields
                    </label>
                    <select
                      multiple
                      value={transformation.config.fields || []}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        updateTransformation(transformation.id, { 
                          config: { ...transformation.config, fields: selectedOptions }
                        });
                      }}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      size={4}
                    >
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple fields</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Field
                    </label>
                    <input
                      type="text"
                      value={transformation.config.targetField || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, targetField: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter target field name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aggregation Function
                    </label>
                    <select
                      value={transformation.config.function || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, function: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select function</option>
                      <option value="sum">Sum</option>
                      <option value="average">Average</option>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                      <option value="count">Count</option>
                      <option value="concat">Concatenate</option>
                    </select>
                  </div>
                </div>
              )}

              {transformation.type === TransformationType.SPLIT && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Field
                    </label>
                    <select
                      value={transformation.config.sourceField || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, sourceField: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field to split</option>
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Fields
                    </label>
                    <input
                      type="text"
                      value={transformation.config.targetFields || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, targetFields: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comma-separated field names (e.g., field1,field2,field3)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Separator
                    </label>
                    <input
                      type="text"
                      value={transformation.config.separator || ','}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, separator: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Separator to split by (default: comma)"
                    />
                  </div>
                </div>
              )}

              {transformation.type === TransformationType.VALIDATE && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Field
                    </label>
                    <select
                      value={transformation.config.field || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, field: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field to validate</option>
                      {getAvailableFields(sourceSchema).map(field => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Validation Rule
                    </label>
                    <select
                      value={transformation.config.rule || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, rule: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select validation rule</option>
                      <option value="required">Required</option>
                      <option value="email">Email Format</option>
                      <option value="url">URL Format</option>
                      <option value="number">Number</option>
                      <option value="minLength">Minimum Length</option>
                      <option value="maxLength">Maximum Length</option>
                      <option value="pattern">Regular Expression</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Validation Value
                    </label>
                    <input
                      type="text"
                      value={transformation.config.value || ''}
                      onChange={(e) => updateTransformation(transformation.id, { 
                        config: { ...transformation.config, value: e.target.value }
                      })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Validation value (e.g., min length, pattern)"
                    />
                  </div>
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

  const renderPreviewTab = () => {
    const transformedData = applyTransformations(previewData, localDataFlow.fieldMappings, localDataFlow.transformations || []);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
          <button
            onClick={() => setActiveTab('mapping')}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Mapping
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Input Data */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">📥 Input Data</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(previewData).map(([fieldId, value]) => {
                const field = sourceSchema[fieldId];
                return (
                  <div key={fieldId} className="text-sm">
                    <span className="font-medium text-gray-600">{field?.name || fieldId}:</span>
                    <span className="ml-2 text-gray-800">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Output Data */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">📤 Output Data</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(transformedData).map(([fieldId, value]) => {
                const field = targetSchema[fieldId];
                return (
                  <div key={fieldId} className="text-sm">
                    <span className="font-medium text-gray-600">{field?.name || fieldId}:</span>
                    <span className="ml-2 text-gray-800">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mapping Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">🔗 Mapping Summary</h4>
          <div className="space-y-2">
            {localDataFlow.fieldMappings.map((mapping, index) => {
              const sourceField = sourceSchema[mapping.sourceField];
              const targetField = targetSchema[mapping.targetField];
              const sourceValue = previewData[mapping.sourceField];
              const targetValue = transformedData[mapping.targetField];
              
              return (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      {sourceField?.name} → {targetField?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeof sourceValue === 'object' ? JSON.stringify(sourceValue) : String(sourceValue)} → {typeof targetValue === 'object' ? JSON.stringify(targetValue) : String(targetValue)}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    mapping.required ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {mapping.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const applyTransformations = (inputData: Record<string, any>, fieldMappings: FieldMapping[], transformations: DataTransformation[]) => {
    let outputData: Record<string, any> = {};
    
    // Apply field mappings
    fieldMappings.forEach(mapping => {
      if (mapping.sourceField && mapping.targetField) {
        outputData[mapping.targetField] = inputData[mapping.sourceField];
      }
    });
    
    // Apply transformations in order
    transformations
      .filter(t => t.enabled)
      .sort((a, b) => a.order - b.order)
      .forEach(transformation => {
        switch (transformation.type) {
          case TransformationType.RENAME:
            if (transformation.config.newName && transformation.config.oldName) {
              const value = outputData[transformation.config.oldName];
              if (value !== undefined) {
                outputData[transformation.config.newName] = value;
                delete outputData[transformation.config.oldName];
              }
            }
            break;
          case TransformationType.TRANSFORM:
            if (transformation.config.expression && transformation.config.field) {
              try {
                const value = outputData[transformation.config.field];
                if (value !== undefined) {
                  switch (transformation.config.expression) {
                    case 'toUpperCase':
                      outputData[transformation.config.field] = String(value).toUpperCase();
                      break;
                    case 'toLowerCase':
                      outputData[transformation.config.field] = String(value).toLowerCase();
                      break;
                    case 'toString':
                      outputData[transformation.config.field] = String(value);
                      break;
                    case 'toNumber':
                      outputData[transformation.config.field] = Number(value);
                      break;
                    case 'trim':
                      outputData[transformation.config.field] = String(value).trim();
                      break;
                    case 'capitalize':
                      const str = String(value);
                      outputData[transformation.config.field] = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
                      break;
                  }
                }
              } catch (error) {
                console.error('Transformation error:', error);
              }
            }
            break;
          case TransformationType.FILTER:
            if (transformation.config.field && transformation.config.operator && transformation.config.value !== undefined) {
              const value = outputData[transformation.config.field];
              const filterValue = transformation.config.value;
              
              let shouldKeep = true;
              switch (transformation.config.operator) {
                case 'equals':
                  shouldKeep = value == filterValue;
                  break;
                case 'not_equals':
                  shouldKeep = value != filterValue;
                  break;
                case 'greater_than':
                  shouldKeep = Number(value) > Number(filterValue);
                  break;
                case 'less_than':
                  shouldKeep = Number(value) < Number(filterValue);
                  break;
                case 'contains':
                  shouldKeep = String(value).includes(String(filterValue));
                  break;
                case 'starts_with':
                  shouldKeep = String(value).startsWith(String(filterValue));
                  break;
                case 'ends_with':
                  shouldKeep = String(value).endsWith(String(filterValue));
                  break;
              }
              
              if (!shouldKeep) {
                // Remove the entire record if filter condition is not met
                return {};
              }
            }
            break;
          case TransformationType.FORMAT:
            if (transformation.config.field && transformation.config.formatType) {
              const value = outputData[transformation.config.field];
              if (value !== undefined) {
                switch (transformation.config.formatType) {
                  case 'date':
                    if (transformation.config.pattern) {
                      // Simple date formatting (in a real app, use a proper date library)
                      const date = new Date(value);
                      outputData[transformation.config.field] = date.toISOString().split('T')[0];
                    }
                    break;
                  case 'currency':
                    outputData[transformation.config.field] = `$${Number(value).toFixed(2)}`;
                    break;
                  case 'phone':
                    // Simple phone formatting
                    const phone = String(value).replace(/\D/g, '');
                    if (phone.length === 10) {
                      outputData[transformation.config.field] = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
                    }
                    break;
                }
              }
            }
            break;
          case TransformationType.CONCATENATE:
            if (transformation.config.fields && transformation.config.targetField) {
              const fields: string[] = transformation.config.fields;
              const separator = transformation.config.separator || ' ';
              const values = fields.map((field: string) => outputData[field]).filter((v: any) => v !== undefined);
              outputData[transformation.config.targetField] = values.join(separator);
            }
            break;
          case TransformationType.AGGREGATE:
            if (transformation.config.fields && transformation.config.targetField && transformation.config.function) {
              const fields: string[] = transformation.config.fields;
              const values = fields.map((field: string) => outputData[field]).filter((v: any) => v !== undefined);
              
              switch (transformation.config.function) {
                case 'sum':
                  outputData[transformation.config.targetField] = values.reduce((sum: number, val: any) => sum + Number(val), 0);
                  break;
                case 'average':
                  const sum = values.reduce((acc: number, val: any) => acc + Number(val), 0);
                  outputData[transformation.config.targetField] = values.length > 0 ? sum / values.length : 0;
                  break;
                case 'min':
                  outputData[transformation.config.targetField] = Math.min(...values.map((v: any) => Number(v)));
                  break;
                case 'max':
                  outputData[transformation.config.targetField] = Math.max(...values.map((v: any) => Number(v)));
                  break;
                case 'count':
                  outputData[transformation.config.targetField] = values.length;
                  break;
                case 'concat':
                  outputData[transformation.config.targetField] = values.join('');
                  break;
              }
            }
            break;
          case TransformationType.SPLIT:
            if (transformation.config.sourceField && transformation.config.targetFields) {
              const sourceValue = outputData[transformation.config.sourceField];
              if (sourceValue !== undefined) {
                const separator = transformation.config.separator || ',';
                const parts = String(sourceValue).split(separator);
                const targetFields = transformation.config.targetFields.split(',').map((f: string) => f.trim());
                
                targetFields.forEach((targetField: string, index: number) => {
                  if (parts[index] !== undefined) {
                    outputData[targetField] = parts[index];
                  }
                });
              }
            }
            break;
          case TransformationType.VALIDATE:
            if (transformation.config.field && transformation.config.rule) {
              const value = outputData[transformation.config.field];
              let isValid = true;
              
              switch (transformation.config.rule) {
                case 'required':
                  isValid = value !== undefined && value !== null && value !== '';
                  break;
                case 'email':
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  isValid = emailRegex.test(String(value));
                  break;
                case 'url':
                  try {
                    new URL(String(value));
                    isValid = true;
                  } catch {
                    isValid = false;
                  }
                  break;
                case 'number':
                  isValid = !isNaN(Number(value));
                  break;
                case 'minLength':
                  isValid = String(value).length >= Number(transformation.config.value);
                  break;
                case 'maxLength':
                  isValid = String(value).length <= Number(transformation.config.value);
                  break;
                case 'pattern':
                  const regex = new RegExp(transformation.config.value);
                  isValid = regex.test(String(value));
                  break;
              }
              
              if (!isValid) {
                // Add validation error to the field
                outputData[`${transformation.config.field}_valid`] = false;
                outputData[`${transformation.config.field}_error`] = `Validation failed for rule: ${transformation.config.rule}`;
              } else {
                outputData[`${transformation.config.field}_valid`] = true;
              }
            }
            break;
        }
      });
    
    return outputData;
  };

  const renderConnectorsTab = () => {
    const connectorTypes = [
      { type: NodeType.HTTP_REQUEST, name: 'HTTP Request', icon: '🌐' },
      { type: NodeType.EMAIL, name: 'Email', icon: '📧' },
      { type: NodeType.SLACK, name: 'Slack', icon: '💬' },
      { type: NodeType.TIMER, name: 'Timer', icon: '⏰' },
      { type: NodeType.WEBHOOK, name: 'Webhook', icon: '🔗' },
      { type: NodeType.DATA_TRANSFORM, name: 'Data Transform', icon: '🔄' },
    ];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Connector Schemas</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const config = {
                  connectorType: 'HTTP_REQUEST',
                  fields: {},
                  schema: getNodeSchema(NodeType.HTTP_REQUEST).input
                };
                const exported = ConnectorValidationService.exportConnectorConfig(config);
                navigator.clipboard.writeText(exported);
                alert('Configuration exported to clipboard!');
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export Schema
            </button>
            <button
              onClick={() => {
                const input = prompt('Paste configuration JSON:');
                if (input) {
                  try {
                    ConnectorValidationService.importConnectorConfig(input);
                    alert('Configuration imported successfully!');
                  } catch (error) {
                    alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Import Schema
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectorTypes.map((connector) => {
            const schema = getNodeSchema(connector.type);
            const inputFields = Object.values(schema.input);
            const outputFields = Object.values(schema.output);

            return (
              <div key={connector.type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{connector.icon}</span>
                  <h4 className="font-medium text-gray-700">{connector.name}</h4>
                </div>

                <div className="space-y-3">
                  {/* Input Fields */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">📥 Input Fields ({inputFields.length})</h5>
                    <div className="space-y-1">
                      {inputFields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{field.name}</span>
                          <div className="flex items-center space-x-1">
                            <span className={`px-1 py-0.5 rounded text-xs ${
                              field.required 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {field.required ? 'Required' : 'Optional'}
                            </span>
                            <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {field.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output Fields */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">📤 Output Fields ({outputFields.length})</h5>
                    <div className="space-y-1">
                      {outputFields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{field.name}</span>
                          <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                            {field.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validation Test */}
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        // Create sample data for validation test
                        const sampleData: Record<string, any> = {};
                        inputFields.forEach(field => {
                          sampleData[field.id] = field.example || generateSampleValue(field);
                        });

                        const validationResult = ConnectorValidationService.validateConnector({
                          connectorType: connector.type,
                          fields: sampleData,
                          schema: schema.input
                        });

                        if (validationResult.isValid) {
                          alert(`✅ ${connector.name} validation passed!`);
                        } else {
                          alert(`❌ ${connector.name} validation failed:\n${validationResult.errors.join('\n')}`);
                        }
                      }}
                      className="w-full px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Test Validation
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
            { id: 'preview', label: 'Preview', icon: '👁️' },
            { id: 'connectors', label: 'Connectors', icon: '🔌' },
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
        {activeTab === 'preview' && renderPreviewTab()}
        {activeTab === 'connectors' && renderConnectorsTab()}
      </div>
    </div>
  );
};

export default DataConfigPanel; 