import React, { useState, useEffect } from 'react';
import { LoopType, LoopNodeData } from '@flowcraft/shared-types';
import { Repeat, Play, Pause, Settings, Copy, Trash2, Plus, FolderOpen, Eye, EyeOff } from 'lucide-react';

interface LoopNodeEditorProps {
  loopData: LoopNodeData;
  onLoopDataChange: (data: LoopNodeData) => void;
  className?: string;
  availableWorkflows?: Array<{
    id: string;
    name: string;
    description?: string;
    version: string;
  }>;
  onSubWorkflowSelect?: (workflowId: string) => void;
}

// Loop Type Configuration Component
const LoopTypeConfig: React.FC<{
  loopType: LoopType;
  onTypeChange: (type: LoopType) => void;
}> = ({ loopType, onTypeChange }) => {
  const loopTypes = [
    {
      type: LoopType.FOR_EACH,
      name: 'For Each',
      description: 'Iterate over each item in an array',
      icon: '🔄',
      color: 'from-blue-400 to-blue-600'
    },
    {
      type: LoopType.WHILE,
      name: 'While',
      description: 'Repeat while condition is true',
      icon: '⏳',
      color: 'from-orange-400 to-orange-600'
    },
    {
      type: LoopType.COUNT,
      name: 'Count',
      description: 'Repeat a specific number of times',
      icon: '🔢',
      color: 'from-green-400 to-green-600'
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Loop Type</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {loopTypes.map((type) => (
          <button
            key={type.type}
            onClick={() => onTypeChange(type.type)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              loopType === type.type
                ? `border-blue-500 bg-gradient-to-br ${type.color} text-white`
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium">{type.name}</div>
              <div className="text-xs opacity-75 mt-1">{type.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ForEach Loop Configuration
const ForEachConfig: React.FC<{
  config: any;
  onConfigChange: (config: any) => void;
  availableFields?: Record<string, any>;
}> = ({ config, onConfigChange, availableFields }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">For Each Configuration</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Input Array Field
          </label>
          <select
            value={config.inputArray || ''}
            onChange={(e) => onConfigChange({ ...config, inputArray: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select array field</option>
            {availableFields && Object.keys(availableFields).map(fieldName => (
              <option key={fieldName} value={fieldName}>
                {fieldName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Output Array Field
          </label>
          <input
            type="text"
            value={config.outputArray || ''}
            onChange={(e) => onConfigChange({ ...config, outputArray: e.target.value })}
            placeholder="e.g., processedItems"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Item Variable Name
          </label>
          <input
            type="text"
            value={config.itemVariable || 'item'}
            onChange={(e) => onConfigChange({ ...config, itemVariable: e.target.value })}
            placeholder="e.g., item"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Index Variable Name
          </label>
          <input
            type="text"
            value={config.indexVariable || 'index'}
            onChange={(e) => onConfigChange({ ...config, indexVariable: e.target.value })}
            placeholder="e.g., index"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">For Each Loop Behavior</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Iterates over each item in the specified array</li>
              <li>• Current item is available as <code className="bg-blue-100 px-1 rounded">{config.itemVariable || 'item'}</code></li>
              <li>• Current index is available as <code className="bg-blue-100 px-1 rounded">{config.indexVariable || 'index'}</code></li>
              <li>• Results are collected in the output array</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// While Loop Configuration
const WhileConfig: React.FC<{
  config: any;
  onConfigChange: (config: any) => void;
}> = ({ config, onConfigChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">While Loop Configuration</h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Condition Expression
          </label>
          <textarea
            value={config.condition || ''}
            onChange={(e) => onConfigChange({ ...config, condition: e.target.value })}
            placeholder="e.g., counter < 10 && !isComplete"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Max Iterations
            </label>
            <input
              type="number"
              value={config.maxIterations || 100}
              onChange={(e) => onConfigChange({ ...config, maxIterations: parseInt(e.target.value) || 100 })}
              min="1"
              max="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Timeout (seconds)
            </label>
            <input
              type="number"
              value={config.timeout || 300}
              onChange={(e) => onConfigChange({ ...config, timeout: parseInt(e.target.value) || 300 })}
              min="1"
              max="3600"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <div className="text-orange-600 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-orange-800">
            <p className="font-medium mb-1">While Loop Safety</p>
            <ul className="space-y-1 text-orange-700">
              <li>• Loop will stop when condition becomes false</li>
              <li>• Maximum iterations prevent infinite loops</li>
              <li>• Timeout ensures loop doesn't run indefinitely</li>
              <li>• Use JavaScript expressions for conditions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Count Loop Configuration
const CountConfig: React.FC<{
  config: any;
  onConfigChange: (config: any) => void;
}> = ({ config, onConfigChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">Count Loop Configuration</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Number of Iterations
          </label>
          <input
            type="number"
            value={config.count || 1}
            onChange={(e) => onConfigChange({ ...config, count: parseInt(e.target.value) || 1 })}
            min="1"
            max="10000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Counter Variable Name
          </label>
          <input
            type="text"
            value={config.counterVariable || 'i'}
            onChange={(e) => onConfigChange({ ...config, counterVariable: e.target.value })}
            placeholder="e.g., i"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <div className="text-green-600 mt-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-green-800">
            <p className="font-medium mb-1">Count Loop Behavior</p>
            <ul className="space-y-1 text-green-700">
              <li>• Executes exactly the specified number of times</li>
              <li>• Counter variable starts at 0 and increments each iteration</li>
              <li>• Predictable execution time and behavior</li>
              <li>• Useful for batch processing or retry logic</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Workflow Selection Component
const SubWorkflowSelector: React.FC<{
  selectedWorkflowId?: string;
  availableWorkflows?: Array<{
    id: string;
    name: string;
    description?: string;
    version: string;
  }>;
  onWorkflowSelect: (workflowId: string) => void;
  onWorkflowCreate?: () => void;
}> = ({ selectedWorkflowId, availableWorkflows, onWorkflowSelect, onWorkflowCreate }) => {
  const [showDetails, setShowDetails] = useState(false);

  const selectedWorkflow = availableWorkflows?.find(w => w.id === selectedWorkflowId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Sub-Workflow</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Toggle details"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {onWorkflowCreate && (
            <button
              onClick={onWorkflowCreate}
              className="p-1 text-blue-500 hover:text-blue-700"
              title="Create new workflow"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {selectedWorkflow ? (
        <div className="border border-gray-200 rounded-lg p-3 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900">{selectedWorkflow.name}</h5>
                <p className="text-xs text-gray-600">v{selectedWorkflow.version}</p>
              </div>
            </div>
            <button
              onClick={() => onWorkflowSelect('')}
              className="text-red-500 hover:text-red-700"
              title="Remove workflow"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {showDetails && selectedWorkflow.description && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-gray-600">{selectedWorkflow.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="text-gray-400 mb-2">
            <FolderOpen className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mb-3">No sub-workflow selected</p>
          <div className="space-y-2">
            {availableWorkflows && availableWorkflows.length > 0 ? (
              <select
                onChange={(e) => onWorkflowSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a workflow</option>
                {availableWorkflows.map(workflow => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} (v{workflow.version})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-gray-500">No workflows available</p>
            )}
            {onWorkflowCreate && (
              <button
                onClick={onWorkflowCreate}
                className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create New Workflow
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Loop Node Editor Component
export const LoopNodeEditor: React.FC<LoopNodeEditorProps> = ({
  loopData,
  onLoopDataChange,
  className = '',
  availableWorkflows,
  onSubWorkflowSelect
}) => {
  const [localData, setLocalData] = useState<LoopNodeData>(loopData);

  useEffect(() => {
    setLocalData(loopData);
  }, [loopData]);

  const handleDataChange = (updates: Partial<LoopNodeData>) => {
    const updatedData = { ...localData, ...updates };
    setLocalData(updatedData);
    onLoopDataChange(updatedData);
  };

  const handleLoopConfigChange = (config: any) => {
    handleDataChange({ loopDataConfig: config });
  };

  const renderLoopConfig = () => {
    switch (localData.loopType) {
      case LoopType.FOR_EACH:
        return (
          <ForEachConfig
            config={localData.loopDataConfig || {}}
            onConfigChange={handleLoopConfigChange}
            availableFields={localData.availableFields}
          />
        );
      case LoopType.WHILE:
        return (
          <WhileConfig
            config={localData.loopDataConfig || {}}
            onConfigChange={handleLoopConfigChange}
          />
        );
      case LoopType.COUNT:
        return (
          <CountConfig
            config={localData.loopDataConfig || {}}
            onConfigChange={handleLoopConfigChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Loop Node Editor</h3>
            <p className="text-sm text-gray-600">Configure loop behavior and sub-workflow</p>
          </div>
        </div>
      </div>

      {/* Loop Type Selection */}
      <LoopTypeConfig
        loopType={localData.loopType || LoopType.FOR_EACH}
        onTypeChange={(type) => handleDataChange({ loopType: type })}
      />

      {/* Loop Configuration */}
      {localData.loopType && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          {renderLoopConfig()}
        </div>
      )}

      {/* Sub-Workflow Selection */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <SubWorkflowSelector
          selectedWorkflowId={localData.subWorkflowId}
          availableWorkflows={availableWorkflows}
          onWorkflowSelect={(workflowId) => {
            handleDataChange({ subWorkflowId: workflowId });
            onSubWorkflowSelect?.(workflowId);
          }}
          onWorkflowCreate={() => {
            // TODO: Implement workflow creation modal
            console.log('Create new workflow');
          }}
        />
      </div>

      {/* Loop Execution Settings */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Execution Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Parallel Execution
            </label>
            <select
              value={localData.parallelExecution ? 'true' : 'false'}
              onChange={(e) => handleDataChange({ parallelExecution: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">Sequential</option>
              <option value="true">Parallel</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Max Parallel Workers
            </label>
            <input
              type="number"
              value={localData.maxParallelWorkers || 5}
              onChange={(e) => handleDataChange({ maxParallelWorkers: parseInt(e.target.value) || 5 })}
              min="1"
              max="50"
              disabled={!localData.parallelExecution}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Continue on Error
            </label>
            <select
              value={localData.continueOnError ? 'true' : 'false'}
              onChange={(e) => handleDataChange({ continueOnError: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="false">Stop on Error</option>
              <option value="true">Continue on Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Retry Failed Iterations
            </label>
            <input
              type="number"
              value={localData.retryAttempts || 0}
              onChange={(e) => handleDataChange({ retryAttempts: parseInt(e.target.value) || 0 })}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loop Preview */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Loop Preview</h4>
        
        <div className="bg-white border border-gray-200 rounded p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Repeat className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {localData.loopType === LoopType.FOR_EACH && 'For Each Loop'}
              {localData.loopType === LoopType.WHILE && 'While Loop'}
              {localData.loopType === LoopType.COUNT && 'Count Loop'}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            {localData.loopType === LoopType.FOR_EACH && (
              <>
                <p>• Iterate over: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.inputArray || 'array'}</code></p>
                <p>• Output to: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.outputArray || 'output'}</code></p>
                <p>• Variables: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.itemVariable || 'item'}</code>, <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.indexVariable || 'index'}</code></p>
              </>
            )}
            {localData.loopType === LoopType.WHILE && (
              <>
                <p>• Condition: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.condition || 'true'}</code></p>
                <p>• Max iterations: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.maxIterations || 100}</code></p>
                <p>• Timeout: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.timeout || 300}s</code></p>
              </>
            )}
            {localData.loopType === LoopType.COUNT && (
              <>
                <p>• Iterations: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.count || 1}</code></p>
                <p>• Counter: <code className="bg-gray-100 px-1 rounded">{localData.loopDataConfig?.counterVariable || 'i'}</code></p>
              </>
            )}
            <p>• Execution: <code className="bg-gray-100 px-1 rounded">{localData.parallelExecution ? 'Parallel' : 'Sequential'}</code></p>
            <p>• Sub-workflow: <code className="bg-gray-100 px-1 rounded">{localData.subWorkflowId ? 'Selected' : 'None'}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoopNodeEditor;
