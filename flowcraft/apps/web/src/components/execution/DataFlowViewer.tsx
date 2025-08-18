import React, { useState } from 'react';

interface DataFlowItem {
  sourceId: string;
  targetId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  edgeId: string;
}

interface DataFlowViewerProps {
  dataFlow: Record<string, any>;
}

export const DataFlowViewer: React.FC<DataFlowViewerProps> = ({
  dataFlow
}) => {
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');

  // Convert dataFlow object to array of flow items
  const flowItems: DataFlowItem[] = Object.entries(dataFlow)
    .filter(([key]) => key.includes('_to_'))
    .map(([key, value]) => ({
      sourceId: value.sourceId,
      targetId: value.targetId,
      input: value.input || {},
      output: value.output || {},
      edgeId: value.edgeId || key
    }));

  const getNodeName = (nodeId: string) => {
    // Try to get node name from dataFlow if available
    const nodeData = dataFlow[nodeId];
    return nodeData?.nodeName || nodeData?.metadata?.nodeName || nodeId;
  };

  const renderJsonData = (data: Record<string, any>, title: string) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="text-gray-500 text-sm italic">
          No {title.toLowerCase()} data available
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
            className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Copy JSON
          </button>
        </div>
        <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto max-h-48 overflow-y-auto">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    );
  };

  const renderFlowDetails = (flow: DataFlowItem) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Data Flow Details</h3>
          <button
            onClick={() => setSelectedFlow(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="font-medium">{getNodeName(flow.sourceId)}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="font-medium">{getNodeName(flow.targetId)}</span>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['input', 'output'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Data
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === 'input' && renderJsonData(flow.input, 'Input Data')}
          {activeTab === 'output' && renderJsonData(flow.output, 'Output Data')}
        </div>
      </div>
    );
  };

  if (flowItems.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Data Flow</h3>
        <p className="text-sm text-gray-500">
          No data flow information available for this execution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Data Flow</h3>
        <span className="text-sm text-gray-500">
          {flowItems.length} data transfer{flowItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {selectedFlow ? (
        renderFlowDetails(flowItems.find(f => `${f.sourceId}_to_${f.targetId}` === selectedFlow)!)
      ) : (
        <div className="space-y-3">
          {flowItems.map((flow, index) => (
            <div
              key={flow.edgeId}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => setSelectedFlow(`${flow.sourceId}_to_${flow.targetId}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm">{getNodeName(flow.sourceId)}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-medium text-sm">{getNodeName(flow.targetId)}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>
                    {Object.keys(flow.input).length} input field{Object.keys(flow.input).length !== 1 ? 's' : ''}
                  </span>
                  <span>•</span>
                  <span>
                    {Object.keys(flow.output).length} output field{Object.keys(flow.output).length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {/* Preview of data */}
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-500 mb-1">Input Preview</div>
                  <div className="bg-gray-50 rounded p-2 max-h-16 overflow-hidden">
                    <code className="text-gray-700">
                      {Object.keys(flow.input).length > 0 
                        ? JSON.stringify(flow.input).substring(0, 100) + (JSON.stringify(flow.input).length > 100 ? '...' : '')
                        : 'No data'
                      }
                    </code>
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Output Preview</div>
                  <div className="bg-gray-50 rounded p-2 max-h-16 overflow-hidden">
                    <code className="text-gray-700">
                      {Object.keys(flow.output).length > 0 
                        ? JSON.stringify(flow.output).substring(0, 100) + (JSON.stringify(flow.output).length > 100 ? '...' : '')
                        : 'No data'
                      }
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
