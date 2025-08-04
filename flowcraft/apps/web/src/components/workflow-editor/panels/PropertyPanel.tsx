import React, { useState, useEffect } from 'react';
import { EditorNode, NodeType, EditorEdge, DataFlow, DataType, DataField, getNodeInputSchema, getNodeOutputSchema } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';
import { validateNode } from '../../../services/workflowValidation.service';
import ConditionEditor from './ConditionEditor';
import DataConfigPanel from './DataConfigPanel';

interface PropertyPanelProps {
  selectedNode: EditorNode | null;
  selectedEdge: EditorEdge | null;
  nodes: EditorNode[];
  edges: EditorEdge[];
  onNodeUpdate: (node: EditorNode) => void;
  onEdgeUpdate: (edge: EditorEdge) => void;
  readOnly?: boolean;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onNodeUpdate,
  onEdgeUpdate,
  readOnly = false,
}) => {
  const [localNode, setLocalNode] = useState<EditorNode | null>(selectedNode);
  const [localEdge, setLocalEdge] = useState<EditorEdge | null>(selectedEdge);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Update local state when selected node or edge changes
  useEffect(() => {
    setLocalNode(selectedNode);
    setLocalEdge(selectedEdge);
    setHasUnsavedChanges(false);
    setSaveStatus('idle');
  }, [selectedNode, selectedEdge]);

  // If an edge is selected, show the data configuration panel
  if (selectedEdge && localEdge) {
    // Get source and target nodes
    const sourceNode = nodes.find(node => node.id === localEdge.source);
    const targetNode = nodes.find(node => node.id === localEdge.target);
    
    // Get dynamic schemas from nodes
    const sourceSchema = sourceNode ? getNodeOutputSchema(sourceNode.id, nodes, edges) : {};
    const targetSchema = targetNode ? getNodeInputSchema(targetNode.id, nodes, edges) : {};
    
    // Create a default data flow if none exists
          const dataFlow: DataFlow = localEdge.dataFlow || {
        id: `flow_${localEdge.id}`,
        sourcePortId: localEdge.source || '',
        targetPortId: localEdge.target || '',
      fieldMappings: [],
      transformations: [],
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        portsCompatible: true,
        requiredFieldsMapped: true,
        typeCompatible: true,
      },
      enabled: true,
    };

    const handleDataFlowChange = (updatedDataFlow: DataFlow) => {
      const updatedEdge: EditorEdge = {
        ...localEdge,
        dataFlow: updatedDataFlow,
      };
      setLocalEdge(updatedEdge);
      onEdgeUpdate(updatedEdge);
    };

    return (
      <DataConfigPanel
        sourceSchema={sourceSchema}
        targetSchema={targetSchema}
        dataFlow={dataFlow}
        onDataFlowChange={handleDataFlowChange}
        readOnly={readOnly}
      />
    );
  }

  // If no node is selected, show the default message
  if (!selectedNode || !localNode) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <div>Select a node or connection to view properties</div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    if (readOnly || !localNode) return;

    const updatedNodeData = {
      ...localNode.data,
      [field]: value,
    };

    const updatedNode: EditorNode = {
      ...localNode,
      data: updatedNodeData,
    };

    // Run validation on the updated node data
    const validation = validateNode(updatedNode);
    updatedNode.data.validation = validation;

    setLocalNode(updatedNode);
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
    
    // Auto-save after a short delay
    setTimeout(() => {
      onNodeUpdate(updatedNode);
      setHasUnsavedChanges(false);
    }, 500);
  };

  const handleSave = async () => {
    if (readOnly || !localNode) return;
    
    try {
      setSaveStatus('saving');
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onNodeUpdate(localNode);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving node:', error);
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  // Función para generar campos anidados para objetos JSON
  const generateNestedFields = (fields: Record<string, DataField>): Record<string, DataField> => {
    const nestedFields: Record<string, DataField> = { ...fields };
    
    // Buscar campos de tipo JSON y generar campos anidados
    Object.entries(fields).forEach(([fieldName, field]) => {
      if (field.type === DataType.JSON || field.type === DataType.OBJECT) {
        // Generar campos anidados comunes para el objeto data
        if (fieldName === 'data') {
          nestedFields['data.status'] = {
            id: 'data.status',
            name: 'Status',
            type: DataType.STRING,
            required: false,
            description: 'Status field within data object',
            example: 'active'
          };
          nestedFields['data.count'] = {
            id: 'data.count',
            name: 'Count',
            type: DataType.NUMBER,
            required: false,
            description: 'Count field within data object',
            example: 42
          };
          nestedFields['data.name'] = {
            id: 'data.name',
            name: 'Name',
            type: DataType.STRING,
            required: false,
            description: 'Name field within data object',
            example: 'John Doe'
          };
          nestedFields['data.email'] = {
            id: 'data.email',
            name: 'Email',
            type: DataType.EMAIL,
            required: false,
            description: 'Email field within data object',
            example: 'john@example.com'
          };
          nestedFields['data.success'] = {
            id: 'data.success',
            name: 'Success',
            type: DataType.BOOLEAN,
            required: false,
            description: 'Success flag within data object',
            example: true
          };
        }
      }
    });
    
    return nestedFields;
  };

  const getNodeSchemaInfo = () => {
    if (!localNode) return null;

    try {
      // Get dynamic schemas based on actual connections
      const inputSchema = getNodeInputSchema(localNode.id, nodes, edges);
      const outputSchema = getNodeOutputSchema(localNode.id, nodes, edges);
      const inputFields = Object.values(inputSchema);
      const outputFields = Object.values(outputSchema);

      return (
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              📥 Input Fields ({inputFields.length})
            </h3>
            <div className="space-y-2">
              {inputFields.length > 0 ? (
                inputFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
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
                ))
              ) : (
                <div className="text-gray-500 text-xs italic">No input fields</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              📤 Output Fields ({outputFields.length})
            </h3>
            <div className="space-y-2">
              {outputFields.length > 0 ? (
                outputFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                    <span className="text-gray-700">{field.name}</span>
                    <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                      {field.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-xs italic">No output fields</div>
              )}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            ⚠️ Schema information not available for this node type
          </div>
        </div>
      );
    }
  };

  const getNodeSpecificFields = () => {
    if (!localNode) return null;

    switch (localNode.type) {
      case NodeType.START:
        const startData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <Tooltip
                content="How this workflow will be triggered"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Type
                </label>
              </Tooltip>
              <select
                value={startData.triggerType || 'manual'}
                onChange={e => handleInputChange('triggerType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>

            {startData.triggerType === 'scheduled' && (
              <div>
                <Tooltip
                  content="Cron expression for scheduling workflow execution (e.g., 0 0 * * * for daily at midnight)"
                  position="right"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule (Cron)
                  </label>
                </Tooltip>
                <input
                  type="text"
                  value={startData.schedule || ''}
                  onChange={e => handleInputChange('schedule', e.target.value)}
                  placeholder="0 0 * * *"
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}

            {startData.triggerType === 'webhook' && (
              <div>
                <Tooltip
                  content="URL endpoint that will trigger this workflow when called"
                  position="right"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                </Tooltip>
                <input
                  type="text"
                  value={startData.webhookUrl || ''}
                  onChange={e =>
                    handleInputChange('webhookUrl', e.target.value)
                  }
                  placeholder="https://..."
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}
          </div>
        );

      case NodeType.ACTION:
        const actionData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <Tooltip
                content="Type of action this node will perform"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
              </Tooltip>
              <select
                value={actionData.actionType || 'custom'}
                onChange={e => handleInputChange('actionType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="http">HTTP Request</option>
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="transform">Data Transform</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <Tooltip
                content="Maximum number of retry attempts if this action fails"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Retries
                </label>
              </Tooltip>
              <input
                type="number"
                value={actionData.maxRetries || 3}
                onChange={e => handleInputChange('maxRetries', parseInt(e.target.value))}
                min="0"
                max="10"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        );

      case NodeType.CONDITION:
        const conditionData = localNode.data as any; // Cast to any for now
        const conditionInputSchema = getNodeInputSchema(localNode.id, nodes, edges);
        const availableFields = generateNestedFields(conditionInputSchema);
        
        return (
          <div className="space-y-3">
            <ConditionEditor
              conditions={conditionData.dataConditions || []}
              availableFields={availableFields}
              onConditionsChange={(newConditions) => 
                handleInputChange('dataConditions', newConditions)
              }
              className=""
            />
          </div>
        );

      case NodeType.END:
        const endData = localNode.data as any; // Cast to any for now
        return (
          <div className="space-y-3">
            <div>
              <Tooltip
                content="Type of result this end node will produce"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result Type
                </label>
              </Tooltip>
              <select
                value={endData.resultType || 'success'}
                onChange={e => handleInputChange('resultType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="partial">Partial Success</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
          {!readOnly && (
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <Tooltip content="Save changes to this node" position="left">
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    saveStatus === 'saving'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : saveStatus === 'saved'
                      ? 'bg-green-500 text-white'
                      : saveStatus === 'error'
                      ? 'bg-red-500 text-white'
                      : hasUnsavedChanges
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && 'Saved!'}
                  {saveStatus === 'error' && 'Error'}
                  {saveStatus === 'idle' && (hasUnsavedChanges ? 'Save' : 'Saved')}
                </button>
              </Tooltip>
            </div>
          )}
        </div>
        {selectedNode && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedNode.type} Node
          </div>
        )}
      </div>

      {/* Properties Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Basic Properties */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
              Basic Properties
            </h3>

            <div>
              <Tooltip
                content="Display name for this node in the workflow"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
              </Tooltip>
              <input
                type="text"
                value={localNode.data.label || ''}
                onChange={e => handleInputChange('label', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <Tooltip
                content="Optional description of what this node does"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
              </Tooltip>
              <textarea
                value={localNode.data.description || ''}
                onChange={e => handleInputChange('description', e.target.value)}
                disabled={readOnly}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Data Schema Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
              Data Schema
            </h3>
            {getNodeSchemaInfo()}
          </div>

          {/* Node-Specific Properties */}
          {getNodeSpecificFields() && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                Node Configuration
              </h3>
              {getNodeSpecificFields()}
            </div>
          )}

          {/* Validation Status */}
          {localNode.data.validation && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                Validation
              </h3>

              <div
                className={`p-3 rounded-md ${
                  localNode.data.validation.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      localNode.data.validation.isValid
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-sm font-medium">
                    {localNode.data.validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>

                {localNode.data.validation.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-red-700 mb-1">
                      Errors:
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {localNode.data.validation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {localNode.data.validation.warnings.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-yellow-700 mb-1">
                      Warnings:
                    </div>
                    <ul className="text-sm text-yellow-600 space-y-1">
                      {localNode.data.validation.warnings.map(
                        (warning, index) => (
                          <li key={index}>• {warning}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
