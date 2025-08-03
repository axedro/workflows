import React, { useState } from 'react';
import { EditorNode, NodeType } from '@flowcraft/shared-types';
import { Tooltip } from '@flowcraft/ui';

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

  // Update local state when selected node changes
  React.useEffect(() => {
    setLocalNode(selectedNode);
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
    if (readOnly) return;

    const updatedNode = {
      ...localNode,
      data: {
        ...localNode.data,
        [field]: value,
      },
    };
    setLocalNode(updatedNode);
  };

  const handleSave = () => {
    if (readOnly || !localNode) return;
    onNodeUpdate(localNode);
  };

  const getNodeSpecificFields = () => {
    switch (localNode.type) {
      case NodeType.START:
        return (
          <div className="space-y-3">
            <div>
              <Tooltip
                content="How this workflow will be triggered to start"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Type
                </label>
              </Tooltip>
              <select
                value={localNode.data.triggerType || 'manual'}
                onChange={e => handleInputChange('triggerType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="manual">Manual</option>
                <option value="scheduled">Scheduled</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>

            {localNode.data.triggerType === 'scheduled' && (
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
                  value={localNode.data.schedule || ''}
                  onChange={e => handleInputChange('schedule', e.target.value)}
                  placeholder="0 0 * * *"
                  disabled={readOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            )}

            {localNode.data.triggerType === 'webhook' && (
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
                  value={localNode.data.webhookUrl || ''}
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
                value={localNode.data.actionType || 'custom'}
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
                value={localNode.data.maxRetries || 3}
                onChange={e =>
                  handleInputChange('maxRetries', parseInt(e.target.value))
                }
                min="0"
                max="10"
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        );
      
      case NodeType.CONDITION:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variable</label>
              <input
                type="text"
                value={localNode.data.condition?.variable || ''}
                onChange={e => handleInputChange('condition', { ...localNode.data.condition, variable: e.target.value })}
                placeholder="e.g., {{data.temperature}}"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
              <select
                value={localNode.data.condition?.operator || 'equals'}
                onChange={e => handleInputChange('condition', { ...localNode.data.condition, operator: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                value={localNode.data.condition?.value || ''}
                onChange={e => handleInputChange('condition', { ...localNode.data.condition, value: e.target.value })}
                placeholder="e.g., 25"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        );

      case NodeType.END:
        return (
          <div className="space-y-3">
            <div>
              <Tooltip
                content="Expected result type when this workflow completes"
                position="right"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result Type
                </label>
              </Tooltip>
              <select
                value={localNode.data.resultType || 'success'}
                onChange={e => handleInputChange('resultType', e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="partial">Partial</option>
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
