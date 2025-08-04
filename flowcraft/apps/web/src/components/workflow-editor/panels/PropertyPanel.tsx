import React, { useState, useEffect } from 'react';
import { EditorNode, NodeType, getNodeSchema } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';
import { validateNode } from '../../../services/workflowValidation.service';
import ConditionEditor from './ConditionEditor';

interface PropertyPanelProps {
  selectedNode: EditorNode | null;
  onNodeUpdate: (node: EditorNode) => void;
  readOnly?: boolean;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onNodeUpdate,
  readOnly = false,
}) => {
  const [localNode, setLocalNode] = useState<EditorNode | null>(selectedNode);

  // Update local state and run validation when selected node changes
  useEffect(() => {
    setLocalNode(selectedNode);
    if (selectedNode) {
      // The validation state is now managed directly within handleInputChange
      // and stored on the node data. This effect just syncs the localNode.
    }
  }, [selectedNode]);

  if (!selectedNode || !localNode) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Properties</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📋</div>
            <div>Select a node to view properties</div>
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
    onNodeUpdate(updatedNode); // Update parent state immediately
  };

  const handleSave = () => {
    if (readOnly || !localNode) return;
    onNodeUpdate(localNode);
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
        const conditionSchema = getNodeSchema(NodeType.CONDITION);
        const availableFields = conditionSchema.input;
        
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
            <Tooltip content="Save changes to this node" position="left">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>
            </Tooltip>
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
